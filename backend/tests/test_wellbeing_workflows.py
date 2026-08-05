import json

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import models
from app.domain import wellbeing


def create_class(db: Session, *, name: str, teacher_id: int) -> models.Class:
    school_class = models.Class(name=name, grade="10", teacher_id=teacher_id, student_count=0)
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    return school_class


def test_wellbeing_domain_policies_are_privacy_first():
    hidden = wellbeing.visible_sos_identity(
        is_anonymous=True,
        student_id=42,
        student_name="Nguyễn An",
    )
    assert hidden.student_id is None
    assert hidden.student_name == "Ẩn danh"
    assert wellbeing.can_review_student(role="teacher", actor_id=7, class_teacher_id=7)
    assert not wellbeing.can_review_student(role="teacher", actor_id=8, class_teacher_id=7)
    assert not wellbeing.can_transition_sos(current_status="resolved", next_status="reviewing")


def test_student_mood_history_is_private_and_input_is_bounded(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    teacher = make_user(email="wellbeing-teacher@example.edu", role="teacher")
    school_class = create_class(db_session, name="10 Wellbeing", teacher_id=teacher.id)
    student = make_user(email="wellbeing-student@example.edu", role="student", class_id=school_class.id)
    other = make_user(email="wellbeing-other@example.edu", role="student", class_id=school_class.id)

    response = client.post(
        "/api/wellness/mood",
        headers=auth_headers(student),
        json={"mood_level": 4, "mood_emoji": "🙂", "note": "Hôm nay em thấy ổn."},
    )
    assert response.status_code == 200
    assert client.get("/api/wellness/mood/history", headers=auth_headers(other)).json() == []

    invalid_emoji = client.post(
        "/api/wellness/mood",
        headers=auth_headers(student),
        json={"mood_level": 4, "mood_emoji": "X"},
    )
    oversized_note = client.post(
        "/api/wellness/mood",
        headers=auth_headers(student),
        json={"mood_level": 4, "mood_emoji": "🙂", "note": "a" * 501},
    )
    assert invalid_emoji.status_code == 422
    assert oversized_note.status_code == 422


def test_anonymous_sos_hides_identity_and_enforces_teacher_scope(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    teacher = make_user(email="sos-teacher@example.edu", role="teacher")
    other_teacher = make_user(email="sos-other-teacher@example.edu", role="teacher")
    school_class = create_class(db_session, name="11 SOS", teacher_id=teacher.id)
    student = make_user(email="sos-student@example.edu", role="student", class_id=school_class.id)

    created = client.post(
        "/api/wellness/sos",
        headers=auth_headers(student),
        json={"message": "Em cần được nói chuyện riêng.", "is_anonymous": True},
    )
    assert created.status_code == 200
    alert_id = created.json()["id"]

    visible = client.get("/api/wellness/sos/alerts", headers=auth_headers(teacher))
    assert visible.status_code == 200
    assert visible.json()[0]["student_id"] is None
    assert visible.json()[0]["student_name"] == "Ẩn danh"
    assert client.get("/api/wellness/sos/alerts", headers=auth_headers(other_teacher)).json() == []

    forbidden = client.patch(
        f"/api/wellness/sos/{alert_id}",
        headers=auth_headers(other_teacher),
        json={"status": "reviewing"},
    )
    assert forbidden.status_code == 403
    updated = client.patch(
        f"/api/wellness/sos/{alert_id}",
        headers=auth_headers(teacher),
        json={"status": "resolved", "reviewer_note": "Đã liên hệ riêng."},
    )
    assert updated.status_code == 200

    audit_events = db_session.query(models.AuditEvent).filter(
        models.AuditEvent.resource_type == "sos_alert",
    ).all()
    assert [event.action for event in audit_events] == [
        "wellbeing.sos_created",
        "wellbeing.sos_updated",
    ]
    assert all("message" not in json.loads(event.details) for event in audit_events)


def test_class_wellness_response_minimizes_sensitive_fields(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    teacher = make_user(email="summary-teacher@example.edu", role="teacher")
    school_class = create_class(db_session, name="12 Summary", teacher_id=teacher.id)
    make_user(email="summary-student@example.edu", role="student", class_id=school_class.id)

    response = client.get(
        f"/api/wellness/class/{school_class.id}",
        headers=auth_headers(teacher),
    )
    assert response.status_code == 200
    student = response.json()["students"][0]
    assert set(student) == {"id", "name", "status", "avg_mood", "has_recent_checkin"}
    assert "mental_health_score" not in student
    assert "last_mood" not in student
