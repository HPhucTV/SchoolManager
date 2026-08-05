import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.api import health
from app.config import get_settings
from app.observability import RequestContextMiddleware, log_event, request_id_for_scope
from app.routers import (
    activities,
    admin,
    ai,
    ai_tutor,
    analytics,
    assignments,
    auth,
    classes,
    dashboard,
    games,
    gamification,
    invitations,
    notifications,
    quiz_battle,
    quizzes,
    schedule_api,
    search,
    statistics,
    student_api,
    students,
    teacher_reports,
    wellness,
)

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
)
app.add_middleware(RequestContextMiddleware)


def _error_payload(request: Request, detail: object) -> dict[str, object]:
    request_id = request_id_for_scope(request.scope)
    return {"detail": jsonable_encoder(detail), "request_id": request_id}


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    request_id = request_id_for_scope(request.scope)
    log_event(
        "http_error",
        level=logging.WARNING,
        method=request.method,
        path=request.url.path,
        status=exc.status_code,
        request_id=request_id,
    )
    headers = dict(exc.headers or {})
    headers["X-Request-ID"] = request_id
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_payload(request, exc.detail),
        headers=headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    request_id = request_id_for_scope(request.scope)
    log_event(
        "request_validation_error",
        level=logging.WARNING,
        method=request.method,
        path=request.url.path,
        status=422,
        request_id=request_id,
    )
    return JSONResponse(
        status_code=422,
        content=_error_payload(request, exc.errors()),
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = request_id_for_scope(request.scope)
    log_event(
        "unhandled_exception",
        level=logging.ERROR,
        method=request.method,
        path=request.url.path,
        status=500,
        exception_type=type(exc).__name__,
        request_id=request_id,
    )
    return JSONResponse(
        status_code=500,
        content=_error_payload(request, "Internal server error"),
        headers={"X-Request-ID": request_id},
    )

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS remains explicit in every environment; wildcard credentials are unsupported.
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=settings.TRUSTED_PROXY_HOSTS)

# Include routers
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["ai"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(
    activities.router,
    prefix=f"{settings.API_V1_STR}/activities",
    tags=["activities"],
)
app.include_router(
    invitations.router,
    prefix=f"{settings.API_V1_STR}/invitations",
    tags=["invitations"],
)
app.include_router(
    dashboard.router,
    prefix=f"{settings.API_V1_STR}/dashboard",
    tags=["dashboard"],
)
app.include_router(games.router, prefix=f"{settings.API_V1_STR}/games", tags=["games"])
app.include_router(students.router, prefix=f"{settings.API_V1_STR}/students", tags=["students"])

app.include_router(
    statistics.router,
    prefix=f"{settings.API_V1_STR}/statistics",
    tags=["statistics"],
)
app.include_router(
    assignments.router,
    prefix=f"{settings.API_V1_STR}/assignments",
    tags=["assignments"],
)
app.include_router(
    student_api.router,
    prefix=f"{settings.API_V1_STR}/student",
    tags=["student"],
)
app.include_router(
    notifications.router,
    prefix=f"{settings.API_V1_STR}/notifications",
    tags=["notifications"],
)

app.include_router(classes.router, prefix=f"{settings.API_V1_STR}/classes", tags=["classes"])
app.include_router(quizzes.router, prefix=f"{settings.API_V1_STR}/quizzes", tags=["quizzes"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(
    schedule_api.router,
    prefix=f"{settings.API_V1_STR}/schedules",
    tags=["schedules"],
)

app.include_router(
    wellness.router,
    prefix=f"{settings.API_V1_STR}/wellness",
    tags=["wellness"],
)
app.include_router(
    ai_tutor.router,
    prefix=f"{settings.API_V1_STR}/ai-tutor",
    tags=["ai-tutor"],
)
app.include_router(
    gamification.router,
    prefix=f"{settings.API_V1_STR}/gamification",
    tags=["gamification"],
)
app.include_router(
    analytics.router,
    prefix=f"{settings.API_V1_STR}/analytics",
    tags=["analytics"],
)


app.include_router(
    teacher_reports.router,
    prefix=f"{settings.API_V1_STR}/teacher/reports",
    tags=["teacher-reports"],
)

app.include_router(
    quiz_battle.router,
    prefix=f"{settings.API_V1_STR}/battle",
    tags=["quiz-battle"],
)

app.include_router(search.router, prefix=f"{settings.API_V1_STR}/search", tags=["search"])
app.include_router(health.router, prefix="/health", tags=["health"])


@app.get("/")
def read_root():
    return {"name": "SchoolManager API", "status": "ok", "docs": "/docs"}
