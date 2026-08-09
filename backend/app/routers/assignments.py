"""HTTP adapter for coursework use cases."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models
from app.api.errors import map_application_errors
from app.application.coursework import Coursework
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.coursework import (
    AssignmentCreateRequest,
    AssignmentResponse,
    AssignmentUpdateRequest,
    GradeRequest,
    GradeResponse,
    MessageResponse,
    SubmissionCreateRequest,
    SubmissionResponse,
)
router = APIRouter()


@router.get("", response_model=list[AssignmentResponse])
async def get_assignments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Coursework(db).list_assignments(current_user)


@router.post("", response_model=AssignmentResponse)
async def create_assignment(
    assignment_data: AssignmentCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Coursework(db).create_assignment(current_user, assignment_data)


@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: int,
    assignment_data: AssignmentUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Coursework(db).update_assignment(current_user, assignment_id, assignment_data)


@router.get("/{assignment_id}/submissions", response_model=list[SubmissionResponse])
async def get_submissions(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Coursework(db).list_submissions(current_user, assignment_id)


@router.put("/submissions/{submission_id}/grade", response_model=GradeResponse)
async def grade_submission(
    submission_id: int,
    grade_data: GradeRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Coursework(db).grade_submission(current_user, submission_id, grade_data)


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Coursework(db).get_assignment(current_user, assignment_id)


@router.get("/{assignment_id}/my-submission", response_model=SubmissionResponse | None)
async def get_my_submission(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Coursework(db).get_my_submission(current_user, assignment_id)


@router.post("/{assignment_id}/submit", response_model=SubmissionResponse)
async def submit_assignment(
    assignment_id: int,
    submission_data: SubmissionCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Coursework(db).submit_assignment(current_user, assignment_id, submission_data)


@router.delete("/{assignment_id}", response_model=MessageResponse)
async def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Coursework(db).delete_assignment(current_user, assignment_id)


@router.patch("/{assignment_id}/close", response_model=MessageResponse)
async def close_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Coursework(db).close_assignment(current_user, assignment_id)
