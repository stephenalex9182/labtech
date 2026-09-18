from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import User, Patient

router = APIRouter(prefix="/api/clinical", tags=["clinical"])

@router.get("/patients/{patient_id}/trends")
def trends(patient_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(404, "Patient not found")
    points = [{"date": r.created_at.strftime("%d %b") if r.created_at else "Visit", "report_id": r.id, "values": {x.test_name: x.value for x in r.lab_results}} for r in sorted(patient.reports, key=lambda x: x.created_at)]
    return {"patient_id": patient.id, "patient": patient.name if user.role == "DOCTOR" else patient.patient_code, "points": points}