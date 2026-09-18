from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class TriageResult(Base):
    __tablename__ = "triage_results"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), unique=True, nullable=False)

    risk_score = Column(Integer, nullable=False)
    priority = Column(String, nullable=False)  # NORMAL | MEDIUM | HIGH | CRITICAL
    ai_summary = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("Report", back_populates="triage_result")
