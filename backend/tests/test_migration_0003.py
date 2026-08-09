from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from app import models
from app.config import get_settings


def test_retired_feature_migration_drops_only_declared_legacy_data(tmp_path, monkeypatch):
    database_path = tmp_path / "legacy.sqlite"
    database_url = f"sqlite:///{database_path.as_posix()}"
    engine = create_engine(database_url)
    models.Base.metadata.create_all(engine)

    with engine.begin() as connection:
        legacy_columns = (
            "xp_points INTEGER DEFAULT 0",
            "level INTEGER DEFAULT 1",
            "coins INTEGER DEFAULT 50",
            "streak_days INTEGER DEFAULT 0",
            "last_active_date VARCHAR",
            "equipped_title VARCHAR",
            "happiness_score FLOAT DEFAULT 100",
            "engagement_score FLOAT DEFAULT 100",
            "mental_health_score FLOAT DEFAULT 100",
            "status VARCHAR DEFAULT 'excellent'",
            "email_enabled BOOLEAN DEFAULT 1",
            "notify_assignments BOOLEAN DEFAULT 1",
            "notify_activities BOOLEAN DEFAULT 1",
            "notify_surveys BOOLEAN DEFAULT 1",
        )
        for definition in legacy_columns:
            connection.execute(text(f"ALTER TABLE users ADD COLUMN {definition}"))
        connection.execute(text("ALTER TABLE classes ADD COLUMN meeting_link VARCHAR"))
        connection.execute(text("ALTER TABLE classes ADD COLUMN online_enabled BOOLEAN DEFAULT 0"))
        connection.execute(text("ALTER TABLE notifications ADD COLUMN file_url VARCHAR"))
        connection.execute(text("ALTER TABLE notifications ADD COLUMN file_name VARCHAR"))
        connection.execute(text("CREATE TABLE activities (id INTEGER PRIMARY KEY, title VARCHAR)"))
        connection.execute(text("CREATE TABLE teacher_reports (id INTEGER PRIMARY KEY, content VARCHAR)"))

    backend_root = Path(__file__).resolve().parents[1]
    config = Config(str(backend_root / "alembic.ini"))
    config.set_main_option("script_location", str(backend_root / "alembic"))
    monkeypatch.setenv("DATABASE_URL_SYNC", database_url)
    get_settings.cache_clear()
    try:
        command.stamp(config, "20260805_0002")
        command.upgrade(config, "head")
    finally:
        get_settings.cache_clear()

    inspector = inspect(engine)
    assert "activities" not in inspector.get_table_names()
    assert "teacher_reports" not in inspector.get_table_names()
    assert "happiness_score" not in {column["name"] for column in inspector.get_columns("users")}
    assert "meeting_link" not in {column["name"] for column in inspector.get_columns("classes")}
    assert "file_url" not in {column["name"] for column in inspector.get_columns("notifications")}
    assert "assignments" in inspector.get_table_names()
