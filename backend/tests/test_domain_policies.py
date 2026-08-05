from app.domain import assessment, coursework


def test_coursework_access_and_answer_visibility_are_role_scoped():
    assert coursework.can_view_assignment(
        role="student",
        actor_id=20,
        actor_class_id=7,
        teacher_id=10,
        class_id=7,
    )
    assert not coursework.can_view_assignment(
        role="student",
        actor_id=20,
        actor_class_id=8,
        teacher_id=10,
        class_id=7,
    )
    assert not coursework.reveals_answer_key(role="student")
    assert coursework.reveals_answer_key(role="teacher")


def test_coursework_grading_rules_are_deterministic():
    is_correct, score = coursework.score_objective_answer(
        question_type="multiple_choice",
        submitted_answer=" b ",
        correct_answer="B",
        points=5,
    )
    assert is_correct is True
    assert score == 5
    assert coursework.is_valid_manual_grade(score=4.5, maximum=5)
    assert not coursework.is_valid_manual_grade(score=5.1, maximum=5)

    short_essay = coursework.suggest_essay_grade(answer_text="quá ngắn", maximum=10)
    assert short_essay.score == 3
    assert "quá ngắn" in short_essay.feedback


def test_assessment_access_retake_and_scoring_policies():
    assert not assessment.can_view_quiz(
        role="student",
        actor_id=20,
        actor_class_id=7,
        teacher_id=10,
        class_id=7,
        status="draft",
    )
    assert assessment.can_view_quiz(
        role="teacher",
        actor_id=10,
        actor_class_id=None,
        teacher_id=10,
        class_id=7,
        status="draft",
    )
    assert not assessment.allows_attempt(has_existing_result=True, allow_retake=False)
    assert assessment.allows_attempt(has_existing_result=True, allow_retake=True)
    assert not assessment.reveals_answer_key(role="student")

    result = assessment.score_quiz(
        [
            assessment.ScorableQuestion(id=1, correct_answer="A"),
            assessment.ScorableQuestion(id=2, correct_answer="B"),
        ],
        {1: "A", 2: "C"},
    )
    assert result.correct == 1
    assert result.total == 2
    assert result.percentage == 50
