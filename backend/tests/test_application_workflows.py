import pytest
from sqlalchemy.orm import Session

from app import models
from app.application.assessment import Assessment
from app.application.coursework import Coursework
from app.application.errors import ApplicationError, ErrorCode
from app.schemas.assessment import (
    QuizCreateRequest,
    QuizQuestionCreateRequest,
    QuizSubmitRequest,
    QuizUpdateRequest,
)
from app.schemas.coursework import (
    AnswerSubmitRequest,
    AssignmentCreateRequest,
    GradeItemRequest,
    GradeRequest,
    QuestionCreateRequest,
    SubmissionCreateRequest,
)


def create_class(db: Session, *, name: str, teacher_id: int) -> models.Class:
    school_class = models.Class(name=name, grade="10", teacher_id=teacher_id, student_count=0)
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    return school_class


def audit_actions(db: Session) -> list[str]:
    return [event.action for event in db.query(models.AuditEvent).order_by(models.AuditEvent.id).all()]


def test_actor_specific_openapi_contract_builds(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200
    paths = response.json()["paths"]
    assert "/api/assignments/{assignment_id}" in paths
    assert "/api/quizzes/{quiz_id}" in paths


def test_coursework_interface_hides_answers_and_rolls_back_invalid_grade(
    db_session: Session,
    make_user,
):
    teacher = make_user(email="application-coursework-teacher@example.edu", role="teacher")
    school_class = create_class(db_session, name="10 Application", teacher_id=teacher.id)
    student = make_user(
        email="application-coursework-student@example.edu",
        role="student",
        class_id=school_class.id,
    )
    coursework = Coursework(db_session)
    created = coursework.create_assignment(
        teacher,
        AssignmentCreateRequest(
            title="Đại số qua interface",
            subject="Toán",
            class_id=school_class.id,
            total_points=5,
            questions=[QuestionCreateRequest(
                question_type="multiple_choice",
                question_text="2 + 2?",
                points=5,
                option_a="3",
                option_b="4",
                option_c="5",
                option_d="6",
                correct_answer="B",
            )],
        ),
    )
    assignment_id = created.response.id
    question_id = created.response.questions[0].id
    assert created.response.questions[0].correct_answer == "B"
    assert coursework.get_assignment(student, assignment_id).questions[0].correct_answer is None

    submission = coursework.submit_assignment(
        student,
        assignment_id,
        SubmissionCreateRequest(
            answers=[AnswerSubmitRequest(question_id=question_id, answer_text="B")],
        ),
    )
    assert submission.total_score == 5

    with pytest.raises(ApplicationError) as error:
        coursework.grade_submission(
            teacher,
            submission.id,
            GradeRequest(grades=[GradeItemRequest(
                answer_id=submission.answers[0].id,
                score=6,
            )]),
        )
    assert error.value.code is ErrorCode.UNPROCESSABLE
    db_session.refresh(db_session.get(models.Submission, submission.id))
    assert db_session.get(models.Submission, submission.id).total_score == 5
    assert audit_actions(db_session) == ["assignment.created", "assignment.submitted"]


def test_assessment_interface_records_lifecycle_and_rejects_second_attempt(
    db_session: Session,
    make_user,
):
    teacher = make_user(email="application-quiz-teacher@example.edu", role="teacher")
    school_class = create_class(db_session, name="11 Application", teacher_id=teacher.id)
    student = make_user(
        email="application-quiz-student@example.edu",
        role="student",
        class_id=school_class.id,
    )
    assessment = Assessment(db_session)
    created = assessment.create_quiz(
        teacher,
        QuizCreateRequest(
            title="Quiz qua interface",
            subject="Toán",
            topic="Số học",
            class_id=school_class.id,
            easy_count=0,
            medium_count=0,
            hard_count=0,
            questions=[QuizQuestionCreateRequest(
                question_text="3 + 3?",
                difficulty="easy",
                option_a="5",
                option_b="6",
                option_c="7",
                option_d="8",
                correct_answer="B",
            )],
        ),
    )
    quiz_id = created.id
    question_id = created.questions[0].id
    assessment.update_quiz(teacher, quiz_id, QuizUpdateRequest(status="active"))
    assert assessment.get_quiz(student, quiz_id).questions[0].correct_answer is None

    result = assessment.submit_quiz(
        student,
        quiz_id,
        QuizSubmitRequest(answers={question_id: "B"}),
    )
    assert result.percentage == 100

    with pytest.raises(ApplicationError) as error:
        assessment.submit_quiz(
            student,
            quiz_id,
            QuizSubmitRequest(answers={question_id: "B"}),
        )
    assert error.value.code is ErrorCode.INVALID_REQUEST
    assert audit_actions(db_session) == [
        "quiz.created",
        "quiz.status_updated",
        "quiz.submitted",
    ]
