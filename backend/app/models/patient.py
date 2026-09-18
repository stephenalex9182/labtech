from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    unique_id = Column(String(6), nullable=True, unique=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reports = relationship("Report", back_populates="patient")

    @property
    def patient_code(self) -> str:
        if self.unique_id and len(self.unique_id) == 6:
            return self.unique_id.upper()
        return f"PT{self.id:04d}"

