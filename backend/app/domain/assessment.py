"""Pure policy and scoring rules for quizzes."""

from dataclasses import dataclass
from collections.abc import Iterable, Mapping


def can_list_quizzes(*, role: str) -> bool:
    return role in {"admin", "teacher", "student"}


def can_manage_quiz(*, role: str, actor_id: int, teacher_id: int, allow_admin: bool = False) -> bool:
    if allow_admin and role == "admin":
        return True
    return role == "teacher" and actor_id == teacher_id


def can_view_quiz(
    *,
    role: str,
    actor_id: int,
    actor_class_id: int | None,
    teacher_id: int,
    class_id: int,
    status: str,
) -> bool:
    if role == "admin":
        return True
    if role == "teacher":
        return actor_id == teacher_id
    if role == "student":
        return actor_class_id == class_id and status == "active"
    return False


def reveals_answer_key(*, role: str) -> bool:
    return role in {"admin", "teacher"}


def allows_attempt(*, has_existing_result: bool, allow_retake: bool) -> bool:
    return not has_existing_result or allow_retake


@dataclass(frozen=True)
class ScorableQuestion:
    id: int
    correct_answer: str


@dataclass(frozen=True)
class QuizScore:
    correct: int
    total: int
    percentage: float


def score_quiz(
    questions: Iterable[ScorableQuestion],
    answers: Mapping[int, str],
) -> QuizScore:
    question_list = list(questions)
    correct = sum(
        1
        for question in question_list
        if answers.get(question.id) == question.correct_answer
    )
    total = len(question_list)
    percentage = round((correct / total) * 100, 1) if total else 0
    return QuizScore(correct=correct, total=total, percentage=percentage)
