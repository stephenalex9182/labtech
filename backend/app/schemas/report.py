from datetime import datetime
from pydantic import BaseModel


class LabResultOut(BaseModel):
    test_name: str
    value: float
    unit: str | None
    reference_min: float | None
    reference_max: float | None
    severity: str

    class Config:
        from_attributes = True


class TriageResultOut(BaseModel):
    risk_score: int
    priority: str
    ai_summary: str | None

    class Config:
        from_attributes = True


class ReportListItem(BaseModel):
    id: int
    patient_name: str
    patient_unique_id: str
    patient_age: int
    patient_gender: str
    priority: str | None
    risk_score: int | None
    status: str
    assigned_doctor_name: str | None
    created_at: datetime
    has_file: bool = False
    file_name: str | None = None

    class Config:
        from_attributes = True


class ReportDetail(BaseModel):
    id: int
    patient_name: str
    patient_unique_id: str
    patient_age: int
    patient_gender: str
    uploaded_by_name: str
    assigned_doctor_name: str | None
    status: str
    created_at: datetime
    lab_results: list[LabResultOut]
    triage_result: TriageResultOut | None
    recommendations: list[str]
    has_file: bool = False
    file_name: str | None = None

    class Config:
        from_attributes = True


class PatientHistoryReport(BaseModel):
    id: int
    file_name: str | None
    status: str
    priority: str | None
    risk_score: int | None
    ai_summary: str | None
    created_at: datetime
    lab_results: list[LabResultOut]


class PatientHistoryItem(BaseModel):
    patient_id: int
    unique_id: str
    name: str
    age: int
    gender: str
    reports: list[PatientHistoryReport]


class ReviewAction(BaseModel):
    action: str  # "start_review" | "mark_reviewed" | "return_to_queue"

