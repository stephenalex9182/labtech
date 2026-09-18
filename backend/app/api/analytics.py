from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.report import Report
from app.models.user import User

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("")
def analytics(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    reports = db.query(Report).all()
    dist = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "NORMAL": 0}
    scores = []
    for r in reports:
        if r.triage_result:
            dist[r.triage_result.priority] = dist.get(r.triage_result.priority, 0) + 1
            scores.append(r.triage_result.risk_score)
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0
    return {
        "total_reports": len(reports),
        "priority_distribution": dist,
        "average_risk_score": avg_score,
    }
