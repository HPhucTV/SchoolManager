"""Small, dependency-free observability primitives for the HTTP boundary."""

from __future__ import annotations

import json
import logging
import re
import time
import uuid
from typing import Any

from starlette.types import ASGIApp, Message, Receive, Scope, Send


REQUEST_ID_HEADER = "X-Request-ID"
_REQUEST_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:-]{1,128}$")
logger = logging.getLogger("schoolmanager.http")
logger.setLevel(logging.INFO)
logger.propagate = False
if not any(handler.get_name() == "schoolmanager-json" for handler in logger.handlers):
    handler = logging.StreamHandler()
    handler.set_name("schoolmanager-json")
    handler.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(handler)


def log_event(event: str, level: int = logging.INFO, **fields: Any) -> None:
    """Emit one JSON event without serialising request bodies or secrets."""

    payload = {"event": event, **fields}
    logger.log(level, json.dumps(payload, ensure_ascii=False, sort_keys=True, default=str))


def _request_id_from_scope(scope: Scope) -> str:
    headers = dict(scope.get("headers", []))
    candidate = headers.get(REQUEST_ID_HEADER.lower().encode("ascii"), b"").decode(
        "ascii", errors="ignore"
    )
    if _REQUEST_ID_PATTERN.fullmatch(candidate):
        return candidate
    return uuid.uuid4().hex


def request_id_for_scope(scope: Scope) -> str:
    """Return the request ID assigned by :class:`RequestContextMiddleware`."""

    state = scope.get("state") or {}
    return str(state.get("request_id") or "")


class RequestContextMiddleware:
    """Attach a bounded correlation ID and log one structured event per request."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        request_id = _request_id_from_scope(scope)
        scope.setdefault("state", {})["request_id"] = request_id
        started = time.perf_counter()
        response_status = 500

        async def send_with_request_id(message: Message) -> None:
            nonlocal response_status
            if message.get("type") == "http.response.start":
                response_status = int(message.get("status", 500))
                headers = list(message.get("headers", []))
                headers = [
                    (name, value)
                    for name, value in headers
                    if name.lower() != REQUEST_ID_HEADER.lower().encode("ascii")
                ]
                headers.append(
                    (REQUEST_ID_HEADER.lower().encode("ascii"), request_id.encode("ascii"))
                )
                message = {**message, "headers": headers}
            await send(message)

        try:
            await self.app(scope, receive, send_with_request_id)
        finally:
            log_event(
                "http_request_completed",
                method=scope.get("method", ""),
                path=scope.get("path", ""),
                status=response_status,
                duration_ms=round((time.perf_counter() - started) * 1000, 2),
                request_id=request_id,
            )
