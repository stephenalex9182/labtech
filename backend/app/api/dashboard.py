from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.report import Report, ReportStatus
from app.schemas.dashboard import DashboardCounts

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/doctor", response_model=DashboardCounts)
def doctor_dashboard(db: Session = Depends(get_db), user: User = Depends(require_role("DOCTOR"))):
    reports = db.query(Report).filter(Report.assigned_doctor == user.id).all()
    return _counts(reports, is_lab_tech=False)


@router.get("/lab", response_model=DashboardCounts)
def lab_dashboard(db: Session = Depends(get_db), user: User = Depends(require_role("LAB_TECHNICIAN"))):
    reports = db.query(Report).filter(Report.uploaded_by == user.id).all()
    return _counts(reports, is_lab_tech=True)


def _counts(reports: list[Report], is_lab_tech: bool = False) -> DashboardCounts:
    today = datetime.now(timezone.utc).date()
    c = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "NORMAL": 0}
    pending = 0
    reviewed_today = 0
    for r in reports:
        if r.triage_result and not is_lab_tech:
            c[r.triage_result.priority] = c.get(r.triage_result.priority, 0) + 1
        if r.status in (ReportStatus.PENDING_REVIEW, ReportStatus.IN_REVIEW):
            pending += 1
        if r.status == ReportStatus.REVIEWED and r.updated_at and r.updated_at.date() == today:
            reviewed_today += 1
    return DashboardCounts(
        critical=c["CRITICAL"], high=c["HIGH"], medium=c["MEDIUM"], normal=c["NORMAL"],
        pending_review=pending, reviewed_today=reviewed_today,
    )
