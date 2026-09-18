from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class ReportStatus:
    UPLOADED = "UPLOADED"
    AI_ANALYZING = "AI_ANALYZING"
    PENDING_REVIEW = "PENDING_REVIEW"
    IN_REVIEW = "IN_REVIEW"
    REVIEWED = "REVIEWED"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_doctor = Column(Integer, ForeignKey("users.id"), nullable=True)

    file_name = Column(String, nullable=True)
    file_type = Column(String, nullable=True)  # "pdf" | "image" | "text"
    file_path = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)

    status = Column(String, nullable=False, default=ReportStatus.UPLOADED)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    patient = relationship("Patient", back_populates="reports")
    uploader = relationship("User", foreign_keys=[uploaded_by], back_populates="uploaded_reports")
    doctor = relationship("User", foreign_keys=[assigned_doctor], back_populates="assigned_reports")

    lab_results = relationship("LabResult", back_populates="report", cascade="all, delete-orphan")
    triage_result = relationship("TriageResult", back_populates="report", uselist=False, cascade="all, delete-orphan")
    activities = relationship("Activity", back_populates="report")
    notifications = relationship("Notification", back_populates="report")
