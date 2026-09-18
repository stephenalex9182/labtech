from pydantic import BaseModel, Field


class ExtractedTest(BaseModel):
    name: str
    value: float
    unit: str | None = None


class AbnormalFinding(BaseModel):
    test: str
    severity: str
    explanation: str


class OllamaExtraction(BaseModel):
    """Strict schema the LLM's JSON output must validate against."""
    patient_name: str | None = None
    patient_age: int | None = None
    patient_gender: str | None = None
    tests: list[ExtractedTest] = Field(default_factory=list)
    abnormal_findings: list[AbnormalFinding] = Field(default_factory=list)
    summary: str | None = None
