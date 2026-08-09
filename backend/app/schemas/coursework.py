"""Coursework requests and role-specific responses."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app import models
from app.domain import coursework as policy


# Requests: validated once at the HTTP boundary.
class QuestionCreateRequest(BaseModel):
    question_type: str
    question_text: str
    points: int = 1
    option_a: str | None = None
    option_b: str | None = None
    option_c: str | None = None
    option_d: str | None = None
    correct_answer: str | None = None


class AssignmentRequestFields(BaseModel):
    title: str
    description: str | None = None
    subject: str | None = None
    class_id: int
    deadline: str | None = None
    total_points: int = 10


class AssignmentCreateRequest(AssignmentRequestFields):
    questions: list[QuestionCreateRequest]


class AssignmentUpdateRequest(AssignmentRequestFields):
    questions: list[QuestionCreateRequest]


class AnswerSubmitRequest(BaseModel):
    question_id: int
    answer_text: str


class SubmissionCreateRequest(BaseModel):
    answers: list[AnswerSubmitRequest]


class GradeItemRequest(BaseModel):
    answer_id: int
    score: float = Field(ge=0)
    feedback: str | None = None


class GradeRequest(BaseModel):
    grades: list[GradeItemRequest]


# Responses: distinct actor types preserve the old JSON shape while making
# answer-key visibility explicit in the type contract.
class QuestionResponseFields(BaseModel):
    id: int
    question_type: str
    question_text: str
    points: int = 1
    option_a: str | None = None
    option_b: str | None = None
    option_c: str | None = None
    option_d: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TeacherQuestionResponse(QuestionResponseFields):
    correct_answer: str | None = None


class StudentQuestionResponse(QuestionResponseFields):
    correct_answer: Literal[None] = None


class AssignmentResponseFields(BaseModel):
    id: int
    title: str
    description: str | None = None
    subject: str | None = None
    class_id: int
    deadline: str | None = None
    total_points: int = 10
    status: str
    created_at: str
    submission_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class TeacherAssignmentResponse(AssignmentResponseFields):
    questions: list[TeacherQuestionResponse]


class StudentAssignmentResponse(AssignmentResponseFields):
    questions: list[StudentQuestionResponse]


AssignmentResponse = TeacherAssignmentResponse | StudentAssignmentResponse


class AnswerResponse(BaseModel):
    id: int
    question_id: int
    answer_text: str
    is_correct: bool | None = None
    score: float
    feedback: str | None = None

    model_config = ConfigDict(from_attributes=True)


class SubmissionResponse(BaseModel):
    id: int
    student_id: int
    student_name: str
    status: str
    total_score: float
    submitted_at: str
    graded_at: str | None = None
    answers: list[AnswerResponse]


class GradeResponse(BaseModel):
    message: str
    total_score: float


class MessageResponse(BaseModel):
    message: str


def assignment_response(
    assignment: models.Assignment,
    *,
    role: str,
    submission_count: int = 0,
) -> AssignmentResponse:
    fields = AssignmentResponseFields.model_validate(assignment).model_dump()
    if not policy.reveals_answer_key(role=role):
        questions = [
            StudentQuestionResponse(
                **QuestionResponseFields.model_validate(question).model_dump(),
                correct_answer=None,
            )
            for question in assignment.questions
        ]
        response: AssignmentResponse = StudentAssignmentResponse(**fields, questions=questions)
    else:
        questions = [TeacherQuestionResponse.model_validate(question) for question in assignment.questions]
        response = TeacherAssignmentResponse(**fields, questions=questions)
    response.submission_count = submission_count
    return response


def submission_response(
    submission: models.Submission,
    *,
    student_name: str,
) -> SubmissionResponse:
    return SubmissionResponse(
        id=submission.id,
        student_id=submission.student_id,
        student_name=student_name,
        status=submission.status,
        total_score=submission.total_score,
        submitted_at=submission.submitted_at,
        graded_at=submission.graded_at,
        answers=[AnswerResponse.model_validate(answer) for answer in submission.answers],
    )
