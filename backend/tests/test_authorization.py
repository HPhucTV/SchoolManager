from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import models


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


def test_activity_endpoints_require_authentication(client: TestClient):
    response = client.get("/api/activities")
    assert response.status_code == 401


def test_active_battle_route_is_not_shadowed(
    client: TestClient,
    make_user,
    auth_headers,
):
    admin = make_user(email="admin@example.edu", role="admin")
    response = client.get("/api/battle/active", headers=auth_headers(admin))

    assert response.status_code == 200
    assert response.json() == []


def test_teacher_cannot_read_another_teachers_class_report(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    owner = make_user(email="report-owner@example.edu", role="teacher")
    attacker = make_user(email="report-attacker@example.edu", role="teacher")
    school_class = create_class(db_session, name="9R1", teacher_id=owner.id)

    response = client.get(
        f"/api/analytics/class-report/{school_class.id}",
        headers=auth_headers(attacker),
    )

    assert response.status_code == 403


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


def test_student_cannot_list_student_wellbeing_scores(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    school_class = create_class(db_session, name="9P1")
    student = make_user(
        email="privacy-student@example.edu",
        role="student",
        class_id=school_class.id,
    )

    response = client.get("/api/students", headers=auth_headers(student))

    assert response.status_code == 403


def test_student_search_is_scoped_to_their_class(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    own_class = create_class(db_session, name="9A Search")
    other_class = create_class(db_session, name="9B Secret")
    student = make_user(
        email="search-student@example.edu",
        role="student",
        class_id=own_class.id,
    )
    db_session.add(models.Assignment(
        title="Tài liệu bí mật lớp khác",
        subject="Toán",
        class_id=other_class.id,
        teacher_id=None,
        status="active",
        total_points=10,
        created_at="2026-08-05T00:00:00",
    ))
    db_session.commit()

    response = client.get(
        "/api/search",
        params={"q": "bí mật", "type": "assignments"},
        headers=auth_headers(student),
    )

    assert response.status_code == 200
    assert response.json()["results"]["assignments"] == []
