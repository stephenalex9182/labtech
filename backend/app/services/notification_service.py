from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.activity import Activity


def notify_doctor(db: Session, doctor_id: int, report_id: int, patient_name: str, priority: str, risk_score: int):
    title = f"New {priority.title()} Report"
    message = f"A new {priority.lower()} laboratory report for {patient_name} requires review. Risk score {risk_score}/100."
    notification = Notification(doctor_id=doctor_id, report_id=report_id, title=title, message=message)
    db.add(notification)

    activity = Activity(
        doctor_id=doctor_id,
        report_id=report_id,
        action="REPORT_ASSIGNED",
        description=f"New {priority.title()} report assigned — {patient_name}",
    )
    db.add(activity)
    db.commit()


def log_activity(db: Session, doctor_id: int, report_id: int | None, action: str, description: str):
    activity = Activity(doctor_id=doctor_id, report_id=report_id, action=action, description=description)
    db.add(activity)
    db.commit()
