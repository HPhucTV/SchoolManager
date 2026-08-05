"""Validated wellbeing requests and privacy-safe responses."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


MoodEmoji = Literal["😢", "😟", "😐", "🙂", "😄"]
SOSStatus = Literal["pending", "reviewing", "resolved"]


class MoodCreateRequest(BaseModel):
    mood_level: int = Field(ge=1, le=5)
    mood_emoji: MoodEmoji
    note: str | None = Field(default=None, max_length=500)


class MoodResponse(BaseModel):
    id: int
    mood_level: int
    mood_emoji: str
    note: str | None = None
    created_at: str

    model_config = ConfigDict(from_attributes=True)


class MoodPointResponse(BaseModel):
    mood_level: int
    mood_emoji: str
    created_at: str


class MoodAnalyticsResponse(BaseModel):
    avg_week: float
    avg_month: float
    trend: Literal["improving", "stable", "declining"]
    total_entries: int
    distribution: dict[int, int]
    recent_entries: list[MoodPointResponse]


class SOSCreateRequest(BaseModel):
    message: str = Field(min_length=1, max_length=1000)
    is_anonymous: bool = True


class SOSCreatedResponse(BaseModel):
    message: str
    id: int


class SOSAlertResponse(BaseModel):
    id: int
    student_id: int | None
    student_name: str
    message: str
    is_anonymous: bool
    status: SOSStatus
    reviewer_note: str | None = None
    created_at: str
    resolved_at: str | None = None


class SOSUpdateRequest(BaseModel):
    status: Literal["reviewing", "resolved"]
    reviewer_note: str | None = Field(default=None, max_length=1000)


class MessageResponse(BaseModel):
    message: str


class StudentWellnessSummary(BaseModel):
    id: int
    name: str
    status: str
    avg_mood: float
    has_recent_checkin: bool


class ClassWellnessResponse(BaseModel):
    total_students: int
    avg_mood: float
    status_counts: dict[str, int]
    active_sos_count: int
    students: list[StudentWellnessSummary]
