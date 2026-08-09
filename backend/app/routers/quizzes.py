"""HTTP adapter for assessment use cases."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.api.errors import map_application_errors
from app.application.assessment import Assessment
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.assessment import (
    MessageResponse,
    QuizCreateRequest,
    QuizResponse,
    QuizResultResponse,
    QuizSubmissionResponse,
    QuizSubmitRequest,
    QuizUpdateRequest,
)


router = APIRouter()


@router.get("", response_model=list[QuizResponse])
async def get_quizzes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Assessment(db).list_quizzes(current_user)


@router.post("", response_model=QuizResponse)
async def create_quiz(
    quiz_data: QuizCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Assessment(db).create_quiz(current_user, quiz_data)


@router.put("/{quiz_id}", response_model=QuizResponse)
async def update_quiz(
    quiz_id: int,
    quiz_data: QuizUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Assessment(db).update_quiz(current_user, quiz_id, quiz_data)


@router.delete("/{quiz_id}", response_model=MessageResponse)
async def delete_quiz(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Assessment(db).delete_quiz(current_user, quiz_id)


@router.get("/{quiz_id}", response_model=QuizResponse)
async def get_quiz_details(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Assessment(db).get_quiz(current_user, quiz_id)


@router.get(
    "/{quiz_id}/my-result",
    response_model=QuizResultResponse,
    response_model_exclude_none=True,
)
async def get_my_result(
    quiz_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Assessment(db).get_my_result(current_user, quiz_id)


@router.post("/{quiz_id}/submit", response_model=QuizSubmissionResponse)
async def submit_quiz(
    quiz_id: int,
    submit_data: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Assessment(db).submit_quiz(current_user, quiz_id, submit_data)
