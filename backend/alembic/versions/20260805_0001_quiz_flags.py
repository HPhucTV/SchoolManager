"""Manage quiz answer and retake policy columns.

Revision ID: 20260805_0001
Revises:
Create Date: 2026-08-05
"""

from alembic import op
import sqlalchemy as sa


revision = "20260805_0001"
down_revision = None
branch_labels = None
depends_on = None


def _column_names(table_name: str) -> set[str] | None:
    inspector = sa.inspect(op.get_bind())
    if table_name not in inspector.get_table_names():
        return None
    return {column["name"] for column in inspector.get_columns(table_name)}


def upgrade() -> None:
    columns = _column_names("quizzes")
    if columns is None:
        return
    with op.batch_alter_table("quizzes") as batch_op:
        if "show_answers" not in columns:
            batch_op.add_column(sa.Column("show_answers", sa.Boolean(), nullable=False, server_default=sa.true()))
        if "allow_retake" not in columns:
            batch_op.add_column(sa.Column("allow_retake", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    columns = _column_names("quizzes")
    if columns is None:
        return
    with op.batch_alter_table("quizzes") as batch_op:
        if "allow_retake" in columns:
            batch_op.drop_column("allow_retake")
        if "show_answers" in columns:
            batch_op.drop_column("show_answers")
