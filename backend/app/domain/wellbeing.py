"""Pure privacy and wellbeing policies."""

from dataclasses import dataclass


def mood_checkin_status(*, average: float, has_recent_checkin: bool) -> str:
    if not has_recent_checkin:
        return "no_data"
    if average <= 2:
        return "warning"
    if average < 3.5:
        return "attention"
    return "stable"


def can_review_student(*, role: str, actor_id: int, class_teacher_id: int | None) -> bool:
    return role == "admin" or (role == "teacher" and actor_id == class_teacher_id)


def can_transition_sos(*, current_status: str, next_status: str) -> bool:
    transitions = {
        "pending": {"reviewing", "resolved"},
        "reviewing": {"reviewing", "resolved"},
        "resolved": {"resolved"},
    }
    return next_status in transitions.get(current_status, set())


@dataclass(frozen=True)
class VisibleIdentity:
    student_id: int | None
    student_name: str


def visible_sos_identity(*, is_anonymous: bool, student_id: int, student_name: str) -> VisibleIdentity:
    if is_anonymous:
        return VisibleIdentity(student_id=None, student_name="Ẩn danh")
    return VisibleIdentity(student_id=student_id, student_name=student_name)
