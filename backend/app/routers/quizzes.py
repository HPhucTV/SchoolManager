"""HTTP adapter for assessment use cases."""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app import models
from app.api.errors import map_application_errors
from app.application.assessment import Assessment
from app.application.errors import ApplicationError, ErrorCode
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.assessment import (
    MessageResponse,
    QuizCreateRequest,
    QuizQuestionCreateRequest,
    QuizResponse,
    QuizResultResponse,
    QuizSubmissionResponse,
    QuizSubmitRequest,
    QuizUpdateRequest,
)


router = APIRouter()
MAX_DOCX_BYTES = 5 * 1024 * 1024


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


@router.post("/upload-docx", response_model=list[QuizQuestionCreateRequest])
async def upload_docx(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        if not file.filename or not file.filename.lower().endswith(".docx"):
            raise ApplicationError(ErrorCode.INVALID_REQUEST, "Only .docx files are supported")
        contents = await file.read(MAX_DOCX_BYTES + 1)
        if len(contents) > MAX_DOCX_BYTES:
            raise ApplicationError(ErrorCode.PAYLOAD_TOO_LARGE, "File không được vượt quá 5 MB")
        return Assessment(db).import_questions(current_user, contents)


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
