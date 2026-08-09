from datetime import timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import models, security
from app.config import get_settings


def test_browser_cookie_session_and_bearer_compatibility(
    client: TestClient,
    make_user,
):
    user = make_user(
        email="cookie-session@example.edu",
        role="teacher",
        name="Cô Cookie",
    )

    login = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "password123"},
    )

    assert login.status_code == 200
    assert login.json()["access_token"]
    cookie_name = get_settings().AUTH_COOKIE_NAME
    assert login.cookies.get(cookie_name)
    set_cookie = login.headers["set-cookie"].lower()
    assert "httponly" in set_cookie
    assert "samesite=lax" in set_cookie
    assert "path=/" in set_cookie

    current_user = client.get("/api/auth/users/me")
    assert current_user.status_code == 200
    assert current_user.json()["email"] == user.email

    updated = client.put(
        "/api/auth/users/me",
        json={"name": "Cô Cookie Mới"},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Cô Cookie Mới"

    invalid_bearer = client.get(
        "/api/auth/users/me",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert invalid_bearer.status_code == 401

    logout = client.post("/api/auth/logout")
    assert logout.status_code == 204
    assert "max-age=0" in logout.headers["set-cookie"].lower()
    assert client.get("/api/auth/users/me").status_code == 401


def test_production_cookie_is_secure(
    client: TestClient,
    make_user,
    monkeypatch,
):
    user = make_user(email="secure-cookie@example.edu", role="student")
    monkeypatch.setattr(get_settings(), "ENVIRONMENT", "production")

    login = client.post(
        "/api/auth/login",
        json={"email": user.email, "password": "password123"},
    )

    assert login.status_code == 200
    assert "secure" in login.headers["set-cookie"].lower()


def test_invite_token_cannot_be_used_as_access_token(
    client: TestClient,
    make_user,
):
    """Token mời có hạn 48h, gửi qua email, không được phép dùng để đăng nhập."""
    student = make_user(email="invited@example.edu", role="student")
    invite_token = security.create_access_token(
        data={"sub": student.email, "type": "invite", "class_id": 1},
        expires_delta=timedelta(hours=48),
    )

    response = client.get(
        "/api/auth/users/me",
        headers={"Authorization": f"Bearer {invite_token}"},
    )

    assert response.status_code == 401


def create_class(db: Session, *, name: str, teacher_id: int | None = None) -> models.Class:
    school_class = models.Class(name=name, grade="10", teacher_id=teacher_id, student_count=0)
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    return school_class


def test_non_admin_cannot_list_or_create_users(
    client: TestClient,
    make_user,
    auth_headers,
):
    teacher = make_user(email="teacher@example.edu", role="teacher")

    list_response = client.get("/api/auth/users", headers=auth_headers(teacher))
    create_response = client.post(
        "/api/auth/users",
        headers=auth_headers(teacher),
        json={
            "name": "Escalated user",
            "email": "escalated@example.edu",
            "password": "password123",
            "role": "admin",
        },
    )

    assert list_response.status_code == 403
    assert create_response.status_code == 403


def test_student_only_sees_their_class(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    own_class = create_class(db_session, name="10A1")
    other_class = create_class(db_session, name="10A2")
    student = make_user(
        email="student@example.edu",
        role="student",
        class_id=own_class.id,
    )

    list_response = client.get("/api/classes", headers=auth_headers(student))
    other_response = client.get(
        f"/api/classes/{other_class.id}",
        headers=auth_headers(student),
    )

    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [own_class.id]
    assert other_response.status_code == 403


def test_student_cannot_read_answer_key(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    teacher = make_user(email="quiz-teacher@example.edu", role="teacher")
    school_class = create_class(db_session, name="11B1", teacher_id=teacher.id)
    student = make_user(
        email="quiz-student@example.edu",
        role="student",
        class_id=school_class.id,
    )
    quiz = models.Quiz(
        title="Kiểm tra Toán",
        subject="Toán",
        topic="Đại số",
        class_id=school_class.id,
        teacher_id=teacher.id,
        total_questions=1,
        status="active",
        created_at="2026-08-05T00:00:00",
    )
    db_session.add(quiz)
    db_session.commit()
    db_session.refresh(quiz)
    db_session.add(models.QuizQuestion(
        quiz_id=quiz.id,
        question_text="1 + 1 bằng bao nhiêu?",
        difficulty="easy",
        option_a="1",
        option_b="2",
        option_c="3",
        option_d="4",
        correct_answer="B",
        order_num=0,
    ))
    db_session.commit()

    response = client.get(f"/api/quizzes/{quiz.id}", headers=auth_headers(student))

    assert response.status_code == 200
    assert response.json()["questions"][0]["correct_answer"] is None


def test_teacher_cannot_create_quiz_for_another_teachers_class(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    owner = make_user(email="owner@example.edu", role="teacher")
    attacker = make_user(email="attacker@example.edu", role="teacher")
    school_class = create_class(db_session, name="12C1", teacher_id=owner.id)

    response = client.post(
        "/api/quizzes",
        headers=auth_headers(attacker),
        json={
            "title": "Unauthorized quiz",
            "subject": "Toán",
            "topic": "Hình học",
            "class_id": school_class.id,
            "easy_count": 1,
            "medium_count": 0,
            "hard_count": 0,
        },
    )

    assert response.status_code == 403

def test_retired_product_routes_are_not_exposed(client: TestClient):
    paths = client.get("/api/openapi.json").json()["paths"]
    retired_prefixes = (
        "/api/activities",
        "/api/analytics",
        "/api/invitations",
        "/api/statistics",
        "/api/students",
        "/api/teacher/reports",
    )
    assert not any(path.startswith(retired_prefixes) for path in paths)


def test_teacher_cannot_create_schedule_for_another_teachers_class(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    owner = make_user(email="schedule-owner@example.edu", role="teacher")
    attacker = make_user(email="schedule-attacker@example.edu", role="teacher")
    school_class = create_class(db_session, name="9S1", teacher_id=owner.id)

    response = client.post(
        "/api/schedules/",
        headers=auth_headers(attacker),
        json={
            "class_id": school_class.id,
            "subject": "Toán",
            "day_of_week": "Thứ Hai",
            "start_time": "07:00",
            "end_time": "07:45",
            "semester": "HK1",
            "year": "2026-2027",
        },
    )

    assert response.status_code == 403
