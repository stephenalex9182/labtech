from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.activity import Activity

router = APIRouter(prefix="/api/activity", tags=["activity"])


@router.get("/my")
def my_activity(db: Session = Depends(get_db), user: User = Depends(require_role("DOCTOR"))):
    activities = (
        db.query(Activity)
        .filter(Activity.doctor_id == user.id)
        .order_by(Activity.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {"id": a.id, "action": a.action, "description": a.description, "created_at": a.created_at.isoformat()}
        for a in activities
    ]
