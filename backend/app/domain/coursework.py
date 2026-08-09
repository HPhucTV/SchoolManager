"""Pure policy and grading rules for assignments."""


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
