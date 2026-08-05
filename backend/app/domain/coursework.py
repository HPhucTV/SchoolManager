"""Pure policy and grading rules for assignments."""

from dataclasses import dataclass


def can_list_assignments(*, role: str) -> bool:
    return role in {"admin", "teacher", "student"}


def can_manage_assignment(*, role: str, actor_id: int, teacher_id: int) -> bool:
    return role == "teacher" and actor_id == teacher_id


def can_view_assignment(
    *,
    role: str,
    actor_id: int,
    actor_class_id: int | None,
    teacher_id: int,
    class_id: int,
) -> bool:
    if role == "admin":
        return True
    if role == "teacher":
        return actor_id == teacher_id
    if role == "student":
        return actor_class_id == class_id
    return False


def can_submit_assignment(*, role: str, actor_class_id: int | None, class_id: int) -> bool:
    return role == "student" and actor_class_id == class_id


def reveals_answer_key(*, role: str) -> bool:
    return role in {"admin", "teacher"}


def accepts_submissions(*, status: str) -> bool:
    return status == "active"


def score_objective_answer(
    *,
    question_type: str,
    submitted_answer: str,
    correct_answer: str | None,
    points: float,
) -> tuple[bool | None, float]:
    if question_type != "multiple_choice":
        return None, 0
    is_correct = submitted_answer.strip().upper() == (correct_answer or "").strip().upper()
    return is_correct, points if is_correct else 0


def is_valid_manual_grade(*, score: float, maximum: float) -> bool:
    return 0 <= score <= maximum


@dataclass(frozen=True)
class EssayGradeSuggestion:
    score: float
    feedback: str


def suggest_essay_grade(*, answer_text: str, maximum: float) -> EssayGradeSuggestion:
    word_count = len(answer_text.split())
    if word_count > 100:
        rate = 0.7
        feedback = f"Bài viết {word_count} từ. Cần giáo viên đánh giá chi tiết nội dung."
    elif word_count > 30:
        rate = 0.5
        feedback = f"Bài viết {word_count} từ, khá ngắn. Cần bổ sung thêm nội dung."
    else:
        rate = 0.3
        feedback = f"Bài viết quá ngắn ({word_count} từ). Cần viết chi tiết hơn."
    return EssayGradeSuggestion(score=round(maximum * rate, 1), feedback=feedback)
