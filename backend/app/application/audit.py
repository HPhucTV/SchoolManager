"""Durable audit events written in the same transaction as each use case."""

import json
from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from app import models


def record_audit_event(
    db: Session,
    *,
    actor: models.User,
    action: str,
    resource_type: str,
    resource_id: int,
    details: dict[str, Any] | None = None,
) -> models.AuditEvent:
    event = models.AuditEvent(
        actor_id=actor.id,
        actor_role=actor.role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=json.dumps(details or {}, ensure_ascii=False, sort_keys=True),
        created_at=datetime.now().isoformat(),
    )
    db.add(event)
    return event
