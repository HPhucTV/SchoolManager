"""HTTP adapter for privacy-first wellbeing use cases."""

from typing import Literal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models
from app.api.errors import map_application_errors
from app.application.wellbeing import Wellbeing
from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.wellbeing import (
    ClassWellnessResponse,
    MessageResponse,
    MoodAnalyticsResponse,
    MoodCreateRequest,
    MoodResponse,
    SOSAlertResponse,
    SOSCreateRequest,
    SOSCreatedResponse,
    SOSUpdateRequest,
)


router = APIRouter()


@router.post("/mood", response_model=MoodResponse)
async def create_mood_entry(
    mood: MoodCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Wellbeing(db).create_mood(current_user, mood)


@router.get("/mood/history", response_model=list[MoodResponse])
async def get_mood_history(
    days: int = Query(default=30, ge=1, le=90),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Wellbeing(db).mood_history(current_user, days=days)


@router.get("/mood/analytics", response_model=MoodAnalyticsResponse)
async def get_mood_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Wellbeing(db).mood_analytics(current_user)


@router.post("/sos", response_model=SOSCreatedResponse)
async def create_sos_alert(
    sos: SOSCreateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Wellbeing(db).create_sos(current_user, sos)


@router.get("/sos/alerts", response_model=list[SOSAlertResponse])
async def get_sos_alerts(
    status: Literal["pending", "reviewing", "resolved"] | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Wellbeing(db).list_sos(current_user, status=status)


@router.patch("/sos/{alert_id}", response_model=MessageResponse)
async def update_sos_alert(
    alert_id: int,
    update: SOSUpdateRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Wellbeing(db).update_sos(current_user, alert_id, update)


@router.get("/class/{class_id}", response_model=ClassWellnessResponse)
async def get_class_wellness(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    with map_application_errors():
        return Wellbeing(db).class_summary(current_user, class_id)
