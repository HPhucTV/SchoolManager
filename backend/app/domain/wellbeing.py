"""Pure privacy and wellbeing policies."""

from dataclasses import dataclass


def adjusted_mental_health_score(*, current_score: float, mood_level: int) -> float:
    if mood_level <= 2:
        return max(0, current_score - 2)
    if mood_level >= 4:
        return min(100, current_score + 1)
    return current_score


def student_status(*, happiness: float, engagement: float, mental_health: float) -> str:
    average = (happiness + engagement + mental_health) / 3
    if average >= 80:
        return "excellent"
    if average >= 60:
        return "good"
    if average >= 40:
        return "attention"
    return "warning"


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
