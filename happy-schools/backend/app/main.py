
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import ai, auth, activities, invitations, dashboard, students, statistics, assignments, student_api, classes, quizzes, games
from app.database import engine, Base




# Create tables
Base.metadata.create_all(bind=engine)

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
# Remove the duplicate /upload prefix one, OR keep it if needed but point to student_api
# Since we fixed routes to be /avatar and /profile, we only need /student prefix to get /api/student/avatar.
# If frontend uses /api/student/avatar (which I updated it to do), then we don't need /upload prefix anymore.

app.include_router(classes.router, prefix=f"{settings.API_V1_STR}/classes", tags=["classes"])
app.include_router(quizzes.router, prefix=f"{settings.API_V1_STR}/quizzes", tags=["quizzes"])


@app.get("/")
def read_root():
    return {"message": "Happy Schools Backend API is running with SQLite DB"}
# Force reload
