"""
Seed script for the hackathon demo.
Run with: python -m app.seed  (inside the backend container)

Creates:
- 3 doctors, 2 lab technicians (all fictional, password: demo1234)
- 5 fictional patients
- 5 reports (2 Critical, 1 High, 1 Medium, 1 Normal) already triaged,
  assigned, and notified — so the doctor dashboard has data on first login.
"""
from sqlalchemy import text
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.user import User
from app.models.patient import Patient
from app.models.report import Report, ReportStatus
from app.models.lab_result import LabResult
from app.models.triage_result import TriageResult
from app.utils.risk_rules import calculate_risk
from app.services.triage_service import build_lab_results as build_results
from app.services.notification_service import notify_doctor

DEMO_PASSWORD = "demo1234"

DOCTORS = [
    {"name": "Dr. Anjali Menon", "email": "anjali.menon@labtriage.demo", "specialty": "Internal Medicine"},
    {"name": "Dr. Sameer Iyer", "email": "sameer.iyer@labtriage.demo", "specialty": "Nephrology"},
    {"name": "Dr. Karthik Rao", "email": "karthik.rao@labtriage.demo", "specialty": "Hematology"},
    {"name": "Dr. Neha Sharma", "email": "neha.sharma@labtriage.demo", "specialty": "Cardiology"},
    {"name": "Dr. Amit Patel", "email": "amit.patel@labtriage.demo", "specialty": "Pulmonology"},
]

TECHNICIANS = [
    {"name": "Meera Nair", "email": "meera.nair@labtriage.demo"},
    {"name": "Vikram Das", "email": "vikram.das@labtriage.demo"},
    {"name": "Rohan Verma", "email": "rohan.verma@labtriage.demo"},
    {"name": "Sneha Gupta", "email": "sneha.gupta@labtriage.demo"},
]

REPORTS = [
    {"name": "Rahul Sharma", "unique_id": "P8X92A", "age": 54, "gender": "Male",
     "values": {"Hemoglobin": 6.4, "WBC": 23000, "Platelets": 45000, "Creatinine": 4.8, "Blood Glucose": 326}},
    {"name": "Arvind Pillai", "unique_id": "P10293", "age": 70, "gender": "Male",
     "values": {"Hemoglobin": 6.9, "WBC": 21500, "Platelets": 48000, "Creatinine": 3.1, "Blood Glucose": 210}},
    {"name": "Faisal Khan", "unique_id": "P38472", "age": 61, "gender": "Male",
     "values": {"Hemoglobin": 8.2, "WBC": 12500, "Platelets": 130000, "Creatinine": 1.6, "Blood Glucose": 150}},
    {"name": "Lakshmi Narayan", "unique_id": "P49102", "age": 45, "gender": "Female",
     "values": {"Hemoglobin": 11.2, "WBC": 9800, "Platelets": 180000, "Creatinine": 1.1, "Blood Glucose": 130}},
    {"name": "Priya Reddy", "unique_id": "P58291", "age": 28, "gender": "Female",
     "values": {"Hemoglobin": 13.5, "WBC": 7200, "Platelets": 240000, "Creatinine": 0.9, "Blood Glucose": 98}},
]


def run():
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE patients ADD COLUMN unique_id VARCHAR(6)"))
        except Exception:
            pass  # column already exists or table freshly created
        try:
            conn.execute(text("ALTER TABLE reports ADD COLUMN file_path VARCHAR"))
        except Exception:
            pass
    db = SessionLocal()
    try:
        doctors = []
        for d in DOCTORS:
            user = db.query(User).filter(User.email == d["email"]).first()
            if not user:
                user = User(name=d["name"], email=d["email"], password_hash=hash_password(DEMO_PASSWORD),
                            role="DOCTOR", specialty=d["specialty"])
                db.add(user)
                db.flush()
            doctors.append(user)

        technicians = []
        for t in TECHNICIANS:
            user = db.query(User).filter(User.email == t["email"]).first()
            if not user:
                user = User(name=t["name"], email=t["email"], password_hash=hash_password(DEMO_PASSWORD), role="LAB_TECHNICIAN")
                db.add(user)
                db.flush()
            technicians.append(user)

        db.commit()

        if not db.query(Report).first():
            for i, r in enumerate(REPORTS):
                patient = Patient(name=r["name"], unique_id=r["unique_id"], age=r["age"], gender=r["gender"])
                db.add(patient)
                db.flush()

                report = Report(
                    patient_id=patient.id,
                    uploaded_by=technicians[i % len(technicians)].id,
                    file_name=f"{r['name'].replace(' ', '_').lower()}_report.pdf",
                    file_type="pdf",
                    raw_text=f"Demo seeded report for {r['name']}.",
                    status=ReportStatus.PENDING_REVIEW,
                )
                db.add(report)
                db.flush()

                for lr in build_results(r["values"]):
                    db.add(LabResult(report_id=report.id, **lr))

                triage = calculate_risk(r["values"])
                summary = (
                    "Multiple significant laboratory abnormalities were identified and the report "
                    "requires prompt professional review."
                    if triage["priority"] in ("CRITICAL", "HIGH")
                    else "Measured values are largely within the configured reference ranges."
                )
                db.add(TriageResult(report_id=report.id, risk_score=triage["score"], priority=triage["priority"], ai_summary=summary))

                doctor = doctors[i % len(doctors)]
                report.assigned_doctor = doctor.id
                db.commit()
                db.refresh(report)

                notify_doctor(db, doctor.id, report.id, r["name"], triage["priority"], triage["score"])

        else:
            # Update existing patients if missing unique_id
            patients = db.query(Patient).all()
            for p in patients:
                if not p.unique_id:
                    p.unique_id = f"PT{p.id:04d}"
            db.commit()

        print(f"Seeded {len(doctors)} doctors, {len(technicians)} technicians.")
        print(f"Demo password for all accounts: {DEMO_PASSWORD}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
