"""Shared transaction policy for application use cases."""

from contextlib import contextmanager
from collections.abc import Iterator

from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.application.errors import ApplicationError, ErrorCode


@contextmanager
def transaction(db: Session) -> Iterator[None]:
    """Commit a complete use case once, rolling back every failure path."""

    try:
        yield
        db.commit()
    except ApplicationError:
        db.rollback()
        raise
    except IntegrityError as exc:
        db.rollback()
        raise ApplicationError(
            ErrorCode.CONFLICT,
            "Dữ liệu bị trùng hoặc xung đột với trạng thái hiện tại",
        ) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise ApplicationError(
            ErrorCode.INTERNAL,
            "Không thể lưu thay đổi vào cơ sở dữ liệu",
        ) from exc
    except Exception:
        db.rollback()
        raise
