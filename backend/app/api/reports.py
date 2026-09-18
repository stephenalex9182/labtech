import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_role
from app.models.user import User
from app.models.patient import Patient
from app.models.report import Report, ReportStatus
from app.models.audit_log import AuditLog
from app.models.triage_result import TriageResult
from app.schemas.report import (
    ReportListItem, ReportDetail, ReviewAction,
    PatientHistoryItem, PatientHistoryReport, LabResultOut,
)
from app.services.report_service import process_uploaded_report
from app.services.triage_service import recommendations_for
from app.services.notification_service import log_activity

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _priority_rank(p: str | None) -> int:
    return {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "NORMAL": 3}.get(p, 4)


@router.post("/upload", response_model=ReportListItem)
async def upload_report(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    user: User = Depends(require_role("LAB_TECHNICIAN")),
):
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    report = await process_uploaded_report(
        db=db,
        file_bytes=file_bytes,
        content_type=file.content_type or "",
        filename=file.filename or "report",
        uploaded_by=user.id,
    )
    return _to_list_item(report)


@router.get("", response_model=list[ReportListItem])
def list_reports(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = db.query(Report)
    if user.role == "DOCTOR":
        q = q.filter(Report.assigned_doctor == user.id)
    elif user.role == "LAB_TECHNICIAN":
        q = q.filter(Report.uploaded_by == user.id)
    reports = q.order_by(Report.created_at.desc()).all()
    items = [_to_list_item(r, user_role=user.role) for r in reports]
    if user.role == "DOCTOR":
        items.sort(key=lambda r: (_priority_rank(r.priority), -r.created_at.timestamp()))
    return items


@router.get("/patient-search", response_model=list[PatientHistoryItem])
def search_patient_history(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Allows searching by Unique Patient ID (e.g. P8X92A, #P8X92A, PT0001), patient name, or patient code.
    Returns patient demographics and their history of lab reports & triage results.
    """
    clean_q = q.strip().lstrip("#").strip()
    if not clean_q:
        return []

    all_patients = db.query(Patient).all()
    norm_q = clean_q.upper()
    matched_patients = []

    for p in all_patients:
        p_code = (p.patient_code or "").upper()
        p_uid = (p.unique_id or "").upper()
        p_name = (p.name or "").upper()
        p_id_str = str(p.id)

        # Match unique_id, patient_code, name, ID, or variations with PT/P prefixes
        if (
            norm_q in p_code
            or norm_q in p_uid
            or norm_q in p_name
            or norm_q == p_id_str
            or (norm_q.startswith("PT") and norm_q.replace("PT", "").lstrip("0") == p_id_str)
            or (norm_q.startswith("P") and norm_q[1:] in p_uid)
        ):
            matched_patients.append(p)

    results = []
    for p in matched_patients:
        rep_items = []
        # Sort reports by newest first
        sorted_reports = sorted(p.reports, key=lambda r: r.created_at, reverse=True)
        for r in sorted_reports:
            triage = r.triage_result if user.role == "DOCTOR" else None
            rep_items.append(
                PatientHistoryReport(
                    id=r.id,
                    file_name=r.file_name,
                    status=r.status,
                    priority=triage.priority if triage else None,
                    risk_score=triage.risk_score if triage else None,
                    ai_summary=triage.ai_summary if triage else None,
                    created_at=r.created_at,
                    lab_results=[LabResultOut.from_orm(lr) for lr in r.lab_results],
                )
            )

        display_name = p.name if user.role == "DOCTOR" else f"Patient #{p.patient_code}"

        results.append(
            PatientHistoryItem(
                patient_id=p.id,
                unique_id=p.patient_code,
                name=display_name,
                age=p.age,
                gender=p.gender,
                reports=rep_items,
            )
        )

    return results



@router.get("/{report_id}/file")
def get_report_file(
    report_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Returns the uploaded PDF or image file for a report so doctors can inspect the original document.
    """
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.add(AuditLog(user_id=user.id, report_id=report.id, action="DOCUMENT_VIEWED", detail="Original document opened"))
    db.commit()

    if report.file_path and os.path.exists(report.file_path):
        media_type = "application/pdf" if report.file_type == "pdf" else "application/octet-stream"
        return FileResponse(
            path=report.file_path,
            filename=report.file_name or f"report_{report_id}.pdf",
            media_type=media_type,
        )
    
    # Fallback HTML document representation for pre-seeded reports
    patient = report.patient
    p_code = patient.patient_code if patient else str(report.patient_id)
    p_name = patient.name if (patient and user.role == "DOCTOR") else f"Patient #{p_code}"
    p_age = patient.age if patient else "Ã¢â‚¬â€"
    p_gender = patient.gender if patient else "Ã¢â‚¬â€"
    date_str = report.created_at.strftime('%Y-%m-%d %H:%M') if report.created_at else ''

    rows_html = "".join(
        f"<tr><td style='padding:8px;border-bottom:1px solid #e2e8f0;'><strong>{lr.test_name}</strong></td>"
        f"<td style='padding:8px;border-bottom:1px solid #e2e8f0;'>{lr.value} {lr.unit or ''}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #e2e8f0;'>{lr.reference_min or 'Ã¢â‚¬â€'} - {lr.reference_max or 'Ã¢â‚¬â€'} {lr.unit or ''}</td></tr>"
        for lr in report.lab_results
    )

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Lab Report - {report.file_name or 'Document'}</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; margin:0; padding:20px; background:#f8fafc; color:#0f172a;">
    <div style="background:white; border:1px solid #e2e8f0; border-radius:12px; padding:24px; max-width:720px; margin:0 auto; box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        <div style="border-bottom:2px solid #2563eb; padding-bottom:12px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <h2 style="margin:0; font-size:18px; color:#1e293b;">CLINICAL LABORATORY REPORT</h2>
                <div style="font-size:12px; color:#64748b; margin-top:4px;">File: {report.file_name or 'Uploaded Document'}</div>
            </div>
            <div style="text-align:right;">
                <span style="background:#eff6ff; color:#2563eb; font-weight:bold; font-size:12px; padding:4px 8px; border-radius:6px; border:1px solid #bfdbfe;">
                    #{p_code}
                </span>
                <div style="font-size:11px; color:#64748b; margin-top:6px;">{date_str}</div>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; background:#f1f5f9; padding:12px 16px; border-radius:8px; font-size:13px; margin-bottom:20px;">
            <div><span style="color:#64748b; font-size:11px; font-weight:bold; text-transform:uppercase;">Patient Name:</span><br/><strong>{p_name}</strong></div>
            <div><span style="color:#64748b; font-size:11px; font-weight:bold; text-transform:uppercase;">Age / Gender:</span><br/><strong>{p_age} yrs Ã‚Â· {p_gender}</strong></div>
        </div>
        <h4 style="margin:16px 0 8px 0; color:#1e293b;">Extracted Laboratory Values</h4>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
                <tr style="background:#f8fafc; text-align:left; color:#475569; font-size:11px; text-transform:uppercase;">
                    <th style="padding:8px; border-bottom:2px solid #e2e8f0;">Test Name</th>
                    <th style="padding:8px; border-bottom:2px solid #e2e8f0;">Measured Result</th>
                    <th style="padding:8px; border-bottom:2px solid #e2e8f0;">Reference Range</th>
                </tr>
            </thead>
            <tbody>
                {rows_html if rows_html else "<tr><td colspan='3' style='padding:12px; text-align:center; color:#64748b;'>No structured lab results extracted.</td></tr>"}
            </tbody>
        </table>
        {f'<div style="margin-top:20px; background:#0f172a; color:#f8fafc; padding:14px; border-radius:8px; font-family:monospace; font-size:12px; white-space:pre-wrap;">{report.raw_text}</div>' if report.raw_text else ''}
    </div>
</body>
</html>"""
    from fastapi.responses import HTMLResponse
    return HTMLResponse(content=html_content)


@router.get("/{report_id}", response_model=ReportDetail)
def get_report(report_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.add(AuditLog(user_id=user.id, report_id=report.id, action="RECORD_ACCESSED", detail="Clinical report details opened"))
    db.commit()
    priority = report.triage_result.priority if report.triage_result else "NORMAL"
    
    # Lab Technicians should NOT see patient risk scores or priority
    triage_res = report.triage_result if user.role == "DOCTOR" else None
    recommendations = recommendations_for(priority) if user.role == "DOCTOR" else []

    has_file = bool(report.file_path and os.path.exists(report.file_path)) or bool(report.raw_text)
    patient_name = report.patient.name if user.role == "DOCTOR" else f"Patient #{report.patient.patient_code}"

    return ReportDetail(
        id=report.id,
        patient_name=patient_name,
        patient_unique_id=report.patient.patient_code,
        patient_age=report.patient.age,
        patient_gender=report.patient.gender,
        uploaded_by_name=report.uploader.name if report.uploader else "Lab Tech",
        assigned_doctor_name=report.doctor.name if report.doctor else None,
        status=report.status,
        created_at=report.created_at,
        lab_results=report.lab_results,
        triage_result=triage_res,
        recommendations=recommendations,
        has_file=has_file,
        file_name=report.file_name,
    )


@router.post("/{report_id}/review", response_model=ReportDetail)
def start_review(report_id: int, db: Session = Depends(get_db), user: User = Depends(require_role("DOCTOR"))):
    report = _get_owned_report(db, report_id, user)
    if report.status == ReportStatus.PENDING_REVIEW:
        report.status = ReportStatus.IN_REVIEW
        db.commit()
        log_activity(db, user.id, report.id, "STARTED_REVIEW", f"Started reviewing Patient #{report.patient.patient_code}'s report")
    return get_report(report_id, db, user)


@router.post("/{report_id}/mark-reviewed", response_model=ReportDetail)
def mark_reviewed(report_id: int, db: Session = Depends(get_db), user: User = Depends(require_role("DOCTOR"))):
    report = _get_owned_report(db, report_id, user)
    report.status = ReportStatus.REVIEWED
    db.commit()
    log_activity(db, user.id, report.id, "MARKED_REVIEWED", f"Reviewed Patient #{report.patient.patient_code}'s report")
    return get_report(report_id, db, user)


@router.post("/{report_id}/return-to-queue", response_model=ReportDetail)
def return_to_queue(report_id: int, db: Session = Depends(get_db), user: User = Depends(require_role("DOCTOR"))):
    report = _get_owned_report(db, report_id, user)
    report.status = ReportStatus.PENDING_REVIEW
    db.commit()
    log_activity(db, user.id, report.id, "RETURNED_TO_QUEUE", f"Returned Patient #{report.patient.patient_code}'s report to the queue")
    return get_report(report_id, db, user)


@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Delete physical file from disk if it exists
    db.add(AuditLog(user_id=user.id, report_id=report.id, action="DOCUMENT_VIEWED", detail="Original document opened"))
    db.commit()

    if report.file_path and os.path.exists(report.file_path):
        try:
            os.remove(report.file_path)
        except Exception:
            pass

    # Delete related records in cascade
    from app.models.lab_result import LabResult
    from app.models.triage_result import TriageResult
    from app.models.notification import Notification
    from app.models.activity_log import ActivityLog

    db.query(LabResult).filter(LabResult.report_id == report_id).delete()
    db.query(TriageResult).filter(TriageResult.report_id == report_id).delete()
    db.query(Notification).filter(Notification.report_id == report_id).delete()
    db.query(ActivityLog).filter(ActivityLog.report_id == report_id).delete()

    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}


def _get_owned_report(db: Session, report_id: int, user: User) -> Report:
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.assigned_doctor != user.id:
        raise HTTPException(status_code=403, detail="This report is not assigned to you")
    return report


def _to_list_item(report: Report, user_role: str | None = None) -> ReportListItem:
    triage = report.triage_result
    is_lab_tech = user_role == "LAB_TECHNICIAN"
    is_doctor = user_role == "DOCTOR"
    has_file = bool(report.file_path and os.path.exists(report.file_path)) or bool(report.raw_text)
    patient_name = report.patient.name if is_doctor else f"Patient #{report.patient.patient_code}"
    return ReportListItem(
        id=report.id,
        patient_name=patient_name,
        patient_unique_id=report.patient.patient_code,
        patient_age=report.patient.age,
        patient_gender=report.patient.gender,
        priority=None if is_lab_tech else (triage.priority if triage else None),
        risk_score=None if is_lab_tech else (triage.risk_score if triage else None),
        status=report.status,
        assigned_doctor_name=report.doctor.name if report.doctor else None,
        created_at=report.created_at,
        has_file=has_file,
        file_name=report.file_name,
    )


