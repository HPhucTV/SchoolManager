
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import ai, auth, activities, invitations, dashboard, students, statistics, assignments, student_api, classes, quizzes, games, notifications, admin, schedule_api, wellness, ai_tutor, gamification, analytics, quiz_battle
from app.database import engine, Base



# Create tables with retry logic
import time
from sqlalchemy.exc import OperationalError

max_retries = 5
retry_delay = 5

for i in range(max_retries):
    try:
        print(f"DEBUG: Attempting to connect to database (attempt {i+1}/{max_retries})...")
        Base.metadata.create_all(bind=engine)
        print("DEBUG: Database connection and table creation successful.")
        break
    except OperationalError as e:
        if i < max_retries - 1:
            print(f"DEBUG: Database not ready yet ({e}). Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
        else:
            print("DEBUG: Could not connect to database after several attempts. Crashing...")
            raise e

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Set all CORS enabled for development
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Trust proxy headers for HTTPS redirection (Critical for Nginx)
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

# Include routers
app.include_router(ai.router, prefix=f"{settings.API_V1_STR}/ai", tags=["ai"])
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(activities.router, prefix=f"{settings.API_V1_STR}/activities", tags=["activities"])
app.include_router(invitations.router, prefix=f"{settings.API_V1_STR}/invitations", tags=["invitations"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])
app.include_router(games.router, prefix=f"{settings.API_V1_STR}/games", tags=["games"])
app.include_router(students.router, prefix=f"{settings.API_V1_STR}/students", tags=["students"])

app.include_router(statistics.router, prefix=f"{settings.API_V1_STR}/statistics", tags=["statistics"])
app.include_router(assignments.router, prefix=f"{settings.API_V1_STR}/assignments", tags=["assignments"])
app.include_router(student_api.router, prefix=f"{settings.API_V1_STR}/student", tags=["student"])
app.include_router(notifications.router, prefix=f"{settings.API_V1_STR}/notifications", tags=["notifications"])

app.include_router(classes.router, prefix=f"{settings.API_V1_STR}/classes", tags=["classes"])
app.include_router(quizzes.router, prefix=f"{settings.API_V1_STR}/quizzes", tags=["quizzes"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(schedule_api.router, prefix=f"{settings.API_V1_STR}/schedules", tags=["schedules"])

# New feature routers
app.include_router(wellness.router, prefix=f"{settings.API_V1_STR}/wellness", tags=["wellness"])
app.include_router(ai_tutor.router, prefix=f"{settings.API_V1_STR}/ai-tutor", tags=["ai-tutor"])
app.include_router(gamification.router, prefix=f"{settings.API_V1_STR}/gamification", tags=["gamification"])
app.include_router(analytics.router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])


# teacher reports for generating and viewing class reports from the chatbot
from app.routers import teacher_reports
app.include_router(teacher_reports.router, prefix=f"{settings.API_V1_STR}/teacher/reports", tags=["teacher-reports"])

app.include_router(quiz_battle.router, prefix=f"{settings.API_V1_STR}/battle", tags=["quiz-battle"])


@app.get("/")
def read_root():
    return {"message": "Happy Schools Backend API is running"}
# Force reload
