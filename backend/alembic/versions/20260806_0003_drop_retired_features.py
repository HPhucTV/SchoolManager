"""Drop retired product surfaces and synthetic profile fields.

Revision ID: 20260806_0003
Revises: 20260805_0002
Create Date: 2026-08-06

This migration is intentionally destructive. Back up production data before
upgrading. Downgrade restores columns for schema compatibility, but cannot
restore rows from dropped tables.
"""

from alembic import op
import sqlalchemy as sa


revision = "20260806_0003"
down_revision = "20260805_0002"
branch_labels = None
depends_on = None


RETIRED_TABLES = (
    "battle_answers",
    "battle_participants",
    "quiz_battles",
    "user_badges",
    "purchases",
    "badges",
    "shop_items",
    "search_history",
    "teacher_reports",
    "activities",
)

RETIRED_COLUMNS = {
    "users": (
        "xp_points",
        "level",
        "coins",
        "streak_days",
        "last_active_date",
        "equipped_title",
        "happiness_score",
        "engagement_score",
        "mental_health_score",
        "status",
        "email_enabled",
        "notify_assignments",
        "notify_activities",
        "notify_surveys",
    ),
    "classes": ("meeting_link", "online_enabled"),
    "notifications": ("file_url", "file_name"),
}


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    existing_tables = set(inspector.get_table_names())

    for table in RETIRED_TABLES:
        if table in existing_tables:
            op.drop_table(table)

    for table, retired_columns in RETIRED_COLUMNS.items():
        if table not in existing_tables:
            continue
        existing_columns = {column["name"] for column in inspector.get_columns(table)}
        with op.batch_alter_table(table) as batch_op:
            for column in retired_columns:
                if column in existing_columns:
                    batch_op.drop_column(column)


def downgrade() -> None:
    """Restore removed columns, but not data or dropped feature tables."""
    inspector = sa.inspect(op.get_bind())
    existing_tables = set(inspector.get_table_names())

    if "users" in existing_tables:
        existing = {column["name"] for column in inspector.get_columns("users")}
        with op.batch_alter_table("users") as batch_op:
            definitions = (
                sa.Column("xp_points", sa.Integer(), server_default="0"),
                sa.Column("level", sa.Integer(), server_default="1"),
                sa.Column("coins", sa.Integer(), server_default="50"),
                sa.Column("streak_days", sa.Integer(), server_default="0"),
                sa.Column("last_active_date", sa.String(), nullable=True),
                sa.Column("equipped_title", sa.String(), nullable=True),
                sa.Column("happiness_score", sa.Float(), server_default="100"),
                sa.Column("engagement_score", sa.Float(), server_default="100"),
                sa.Column("mental_health_score", sa.Float(), server_default="100"),
                sa.Column("status", sa.String(), server_default="excellent"),
                sa.Column("email_enabled", sa.Boolean(), server_default=sa.true()),
                sa.Column("notify_assignments", sa.Boolean(), server_default=sa.true()),
                sa.Column("notify_activities", sa.Boolean(), server_default=sa.true()),
                sa.Column("notify_surveys", sa.Boolean(), server_default=sa.true()),
            )
            for column in definitions:
                if column.name not in existing:
                    batch_op.add_column(column)

    if "classes" in existing_tables:
        existing = {column["name"] for column in inspector.get_columns("classes")}
        with op.batch_alter_table("classes") as batch_op:
            if "meeting_link" not in existing:
                batch_op.add_column(sa.Column("meeting_link", sa.String(), nullable=True))
            if "online_enabled" not in existing:
                batch_op.add_column(sa.Column("online_enabled", sa.Boolean(), server_default=sa.false()))

    if "notifications" in existing_tables:
        existing = {column["name"] for column in inspector.get_columns("notifications")}
        with op.batch_alter_table("notifications") as batch_op:
            if "file_url" not in existing:
                batch_op.add_column(sa.Column("file_url", sa.String(), nullable=True))
            if "file_name" not in existing:
                batch_op.add_column(sa.Column("file_name", sa.String(), nullable=True))
