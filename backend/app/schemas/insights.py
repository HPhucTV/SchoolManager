"""Typed contracts for small, factual school-workflow aggregates."""

from typing import Literal

from pydantic import BaseModel, Field


class TodayScheduleItem(BaseModel):
    id: int
    subject: str
    start_time: str
    end_time: str
    room: str | None = None
    class_id: int
    class_name: str
    teacher_name: str | None = None


class TodayWorkItem(BaseModel):
    kind: Literal["assignment", "quiz"]
    id: int
    title: str
    subject: str | None = None
    deadline: str
    is_overdue: bool
    class_id: int
    class_name: str
    action_url: str


class AttentionItem(BaseModel):
    id: str
    kind: Literal["sos", "missing_assignment", "low_quiz_score"]
    priority: Literal["high", "medium"]
    title: str
    description: str
    class_id: int
    class_name: str
    student_id: int | None = None
    action_url: str
    occurred_at: str | None = None


class TodayDashboardResponse(BaseModel):
    date: str
    schedule: list[TodayScheduleItem]
    work_items: list[TodayWorkItem]
    attention: list[AttentionItem]
    unread_notifications: int = 0


class GradebookStudentRow(BaseModel):
    student_id: int
    student_name: str
    student_email: str
    assignment_average: float | None = None
    quiz_average: float | None = None
    overall_average: float | None = None
    graded_items: int = 0
    total_items: int = 0
    missing_items: int = 0
    needs_attention: bool = False


class Pagination(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)
    total_items: int = Field(ge=0)
    total_pages: int = Field(ge=1)


class ClassGradebookResponse(BaseModel):
    class_id: int
    class_name: str
    assignment_count: int
    quiz_count: int
    students: list[GradebookStudentRow]
    pagination: Pagination


class StudentSubjectGrade(BaseModel):
    subject: str
    assignment_average: float | None = None
    quiz_average: float | None = None
    overall_average: float | None = None
    completed_items: int = 0
    graded_items: int = 0
    total_items: int = 0
    needs_review: bool = False


class StudentGradebookResponse(BaseModel):
    class_id: int | None = None
    class_name: str | None = None
    overall_average: float | None = None
    subjects: list[StudentSubjectGrade]
