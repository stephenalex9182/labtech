from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "LAB_TECHNICIAN" | "DOCTOR"
    specialty = Column(String, nullable=True)  # doctors only, e.g. "Internal Medicine"
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    uploaded_reports = relationship("Report", foreign_keys="Report.uploaded_by", back_populates="uploader")
    assigned_reports = relationship("Report", foreign_keys="Report.assigned_doctor", back_populates="doctor")
    activities = relationship("Activity", back_populates="doctor")
    notifications = relationship("Notification", back_populates="doctor")
