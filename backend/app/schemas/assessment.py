"""Assessment requests and role-specific responses."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app import models
from app.domain import assessment as policy


Difficulty = Literal["easy", "medium", "hard"]
AnswerChoice = Literal["A", "B", "C", "D"]
QuizStatus = Literal["draft", "active", "closed"]


# Requests
class QuizQuestionCreateRequest(BaseModel):
    question_text: str
    difficulty: Difficulty
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_answer: AnswerChoice


class QuizCreateRequest(BaseModel):
    title: str
    subject: str | None = None
    topic: str | None = None
    class_id: int
    easy_count: int = 3
    medium_count: int = 4
    hard_count: int = 3
    deadline: str | None = None
    allow_retake: bool = False
    show_answers: bool = True
    questions: list[QuizQuestionCreateRequest] | None = None


class QuizUpdateRequest(BaseModel):
    status: QuizStatus | None = None


class QuizSubmitRequest(BaseModel):
    answers: dict[int, AnswerChoice]


# Responses
class QuizQuestionResponseFields(BaseModel):
    id: int
    question_text: str
    difficulty: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str

    model_config = ConfigDict(from_attributes=True)


class TeacherQuizQuestionResponse(QuizQuestionResponseFields):
    correct_answer: str | None = None


class StudentQuizQuestionResponse(QuizQuestionResponseFields):
    correct_answer: Literal[None] = None


class QuizResponseFields(BaseModel):
    id: int
    title: str
    subject: str | None = None
    topic: str | None = None
    class_id: int
    easy_count: int = 3
    medium_count: int = 4
    hard_count: int = 3
    deadline: str | None = None
    allow_retake: bool = False
    show_answers: bool = True
    status: str | None = None
    total_questions: int
    created_at: str | None = None

    model_config = ConfigDict(from_attributes=True)


class TeacherQuizResponse(QuizResponseFields):
    questions: list[TeacherQuizQuestionResponse] = Field(default_factory=list)


class StudentQuizResponse(QuizResponseFields):
    questions: list[StudentQuizQuestionResponse] = Field(default_factory=list)


QuizResponse = TeacherQuizResponse | StudentQuizResponse


class QuizResultResponse(BaseModel):
    attempted: bool
    score: int | None = None
    total_questions: int | None = None
    percentage: float | None = None
    completed_at: str | None = None


class QuizSubmissionResponse(BaseModel):
    score: int
    total_questions: int
    percentage: float
    completed_at: str
    show_answers: bool


class MessageResponse(BaseModel):
    message: str


def quiz_response(quiz: models.Quiz, *, role: str) -> QuizResponse:
    fields = QuizResponseFields.model_validate(quiz).model_dump()
    if not policy.reveals_answer_key(role=role):
        questions = [
            StudentQuizQuestionResponse(
                **QuizQuestionResponseFields.model_validate(question).model_dump(),
                correct_answer=None,
            )
            for question in quiz.questions
        ]
        return StudentQuizResponse(**fields, questions=questions)
    return TeacherQuizResponse(
        **fields,
        questions=[TeacherQuizQuestionResponse.model_validate(question) for question in quiz.questions],
    )
