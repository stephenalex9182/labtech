from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)

    action = Column(String, nullable=False)       # e.g. "REPORT_ASSIGNED", "MARKED_REVIEWED"
    description = Column(String, nullable=False)  # human-readable line for "My Activity"

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("User", back_populates="activities")
    report = relationship("Report", back_populates="activities")
