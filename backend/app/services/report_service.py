"""
Orchestrates the full upload -> extraction -> AI -> triage -> assignment ->
notification pipeline described in the product spec. Kept separate from the
API layer so the workflow is easy to read end-to-end in one place.
"""
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.patient import Patient
from app.models.report import Report, ReportStatus
from app.models.lab_result import LabResult
from app.models.triage_result import TriageResult

from app.services.ocr_service import extract_text
from app.services.ai_service import analyze_report_text
from app.services.triage_service import (
    extract_values_regex,
    extract_patient_demographics_regex,
    normalize_gender,
    build_lab_results,
    run_triage,
)
from app.schemas.triage import OllamaExtraction
from app.services.notification_service import notify_doctor


import os
import secrets
import string
from pathlib import Path

UPLOAD_DIR = Path(__file__).parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def generate_unique_patient_id(db: Session) -> str:
    chars = string.ascii_uppercase + string.digits
    while True:
        code = "P" + "".join(secrets.choice(chars) for _ in range(5))
        if not db.query(Patient).filter(Patient.unique_id == code).first():
            return code


def pick_doctor(db: Session) -> User | None:
    """
    Simple least-loaded assignment: pick the doctor with the fewest currently
    unreviewed reports. Good enough for a hackathon demo; swap for a real
    rota/on-call system later.
    """
    doctors = db.query(User).filter(User.role == "DOCTOR").all()
    if not doctors:
        return None

    def open_load(doctor: User) -> int:
        return sum(1 for r in doctor.assigned_reports if r.status != ReportStatus.REVIEWED)

    return min(doctors, key=open_load)


def build_dynamic_pdf_summary(patient_name: str, values: dict[str, float], triage: dict) -> str:
    """
    Generates a dynamic, PDF-content-driven summary analyzing the specific lab findings
    and patient details extracted from the uploaded document.
    """
    lab_entries = build_lab_results(values)
    abnormal = [item for item in lab_entries if item.get("severity") in ("CRITICAL", "HIGH", "MEDIUM")]

    if abnormal:
        findings_str = ", ".join(
            f"{item['test_name']} ({item['value']} {item.get('unit') or ''} - {item['severity']})"
            for item in abnormal
        )
        return (
            f"PDF Analysis for {patient_name}: Identified {len(abnormal)} abnormal lab finding(s) in uploaded report: "
            f"{findings_str}. Priority level: {triage['priority']} (Risk Score: {triage['score']}/100). "
            f"Requires prompt physician review."
        )
    elif values:
        normal_str = ", ".join(f"{k}: {v}" for k, v in values.items())
        return (
            f"PDF Analysis for {patient_name}: Extracted parameters ({normal_str}) are within reference limits. "
            f"Priority level: NORMAL. Standard review recommended."
        )
    else:
        return (
            f"PDF Analysis for {patient_name}: Document processed successfully. "
            f"Priority level: {triage['priority']} (Risk Score: {triage['score']}/100). "
            f"Requires clinical verification."
        )


def resolve_patient_demographics(raw_text: str, ai_result: OllamaExtraction | None) -> tuple[str, int, str]:
    """Extract patient name, age, and gender from PDF/OCR text (AI first, regex fallback)."""
    regex_demo = extract_patient_demographics_regex(raw_text)

    name = None
    age = None
    gender = None

    if ai_result:
        if ai_result.patient_name and ai_result.patient_name.strip():
            name = ai_result.patient_name.strip().title()
        if ai_result.patient_age is not None and 0 < ai_result.patient_age <= 120:
            age = ai_result.patient_age
        if ai_result.patient_gender:
            gender = normalize_gender(ai_result.patient_gender)

    name = name or regex_demo.get("name") or "Unknown Patient"
    age = age if age is not None else (regex_demo.get("age") or 0)
    gender = gender or regex_demo.get("gender") or "Unknown"

    return name, age, gender


async def process_uploaded_report(
    db: Session,
    file_bytes: bytes,
    content_type: str,
    filename: str,
    uploaded_by: int,
) -> Report:
    # 1-4: extract text (PDF / OCR / text)
    raw_text, file_type = extract_text(file_bytes, content_type, filename)

    # 5-6: AI analysis for lab values + patient demographics from the document
    ai_result = await analyze_report_text(raw_text)
    patient_name, patient_age, patient_gender = resolve_patient_demographics(raw_text, ai_result)

    patient_uid = generate_unique_patient_id(db)
    patient = Patient(name=patient_name, unique_id=patient_uid, age=patient_age, gender=patient_gender)
    db.add(patient)
    db.flush()

    report = Report(
        patient_id=patient.id,
        uploaded_by=uploaded_by,
        file_name=filename,
        file_type=file_type,
        raw_text=raw_text,
        status=ReportStatus.AI_ANALYZING,
    )
    db.add(report)
    db.flush()

    # Save file on disk for doctor inspection
    file_ext = Path(filename).suffix or ".pdf"
    saved_filename = f"report_{report.id}_{secrets.token_hex(4)}{file_ext}"
    saved_path = UPLOAD_DIR / saved_filename
    with open(saved_path, "wb") as f:
        f.write(file_bytes)
    report.file_path = str(saved_path)

    # 7-8: lab values from AI, with regex fallback if unavailable
    if ai_result and ai_result.tests:
        values = {t.name: t.value for t in ai_result.tests if t.name}
        ai_summary = ai_result.summary
    else:
        values = extract_values_regex(raw_text)
        ai_summary = None

    # 9-11: deterministic risk engine has final say on score/priority
    triage = run_triage(values)

    for lr in build_lab_results(values):
        db.add(LabResult(report_id=report.id, **lr))

    if not ai_summary or len(ai_summary.strip()) < 10:
        ai_summary = build_dynamic_pdf_summary(patient_name, values, triage)

    db.add(TriageResult(
        report_id=report.id,
        risk_score=triage["score"],
        priority=triage["priority"],
        ai_summary=ai_summary,
    ))

    # 13: assign to a doctor
    doctor = pick_doctor(db)
    report.assigned_doctor = doctor.id if doctor else None
    report.status = ReportStatus.PENDING_REVIEW
    db.commit()
    db.refresh(report)

    # 15: notify the assigned doctor
    if doctor:
        notify_doctor(db, doctor.id, report.id, patient_name, triage["priority"], triage["score"])

    return report

