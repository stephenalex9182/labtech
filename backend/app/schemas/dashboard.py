from pydantic import BaseModel


class DashboardCounts(BaseModel):
    critical: int
    high: int
    medium: int
    normal: int
    pending_review: int
    reviewed_today: int


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    is_read: bool
    report_id: int | None

    class Config:
        from_attributes = True


class ActivityOut(BaseModel):
    id: int
    action: str
    description: str
    created_at: str
