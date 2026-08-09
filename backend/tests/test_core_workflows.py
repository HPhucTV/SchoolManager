from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import models


def create_class(db: Session, *, name: str, teacher_id: int | None = None) -> models.Class:
    school_class = models.Class(name=name, grade="10", teacher_id=teacher_id, student_count=0)
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    return school_class


def test_admin_can_provision_teacher_class_and_student(
    client: TestClient,
    make_user,
    auth_headers,
):
    admin = make_user(email="workflow-admin@example.edu", role="admin")
    headers = auth_headers(admin)

    teacher_response = client.post(
        "/api/auth/users",
        headers=headers,
        json={"name": "Nguyễn Minh", "email": "workflow-teacher@example.edu", "password": "password123", "role": "teacher"},
    )
    assert teacher_response.status_code == 200
    teacher_id = teacher_response.json()["id"]

    class_response = client.post(
        "/api/classes",
        headers=headers,
        json={"name": "10A Workflow", "grade": "10", "teacher_id": teacher_id},
    )
    assert class_response.status_code == 200
    class_id = class_response.json()["id"]

    student_response = client.post(
        "/api/auth/users",
        headers=headers,
        json={"name": "Trần Mai", "email": "workflow-student@example.edu", "password": "password123", "role": "student", "class_id": class_id},
    )
    assert student_response.status_code == 200
    student_id = student_response.json()["id"]
    assert student_response.json()["class_name"] == "10A Workflow"

    update_response = client.put(
        f"/api/auth/users/{student_id}",
        headers=headers,
        json={"name": "Trần Mai Anh", "email": "workflow-student@example.edu", "class_id": class_id},
    )
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "Trần Mai Anh"

    delete_response = client.delete(f"/api/auth/users/{student_id}", headers=headers)
    assert delete_response.status_code == 200
    assert client.get("/api/auth/users?role=student", headers=headers).json() == []


def test_assignment_create_submit_grade_and_delete_workflow(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    teacher = make_user(email="coursework-teacher@example.edu", role="teacher")
    school_class = create_class(db_session, name="10B Workflow", teacher_id=teacher.id)
    student = make_user(email="coursework-student@example.edu", role="student", class_id=school_class.id)

    create_response = client.post(
        "/api/assignments",
        headers=auth_headers(teacher),
        json={
            "title": "Ôn tập đại số",
            "description": "Một câu trắc nghiệm",
            "subject": "Toán",
            "class_id": school_class.id,
            "deadline": "2027-01-10T10:00:00",
            "total_points": 5,
            "questions": [{"question_type": "multiple_choice", "question_text": "2 + 2 bằng bao nhiêu?", "points": 5, "option_a": "3", "option_b": "4", "option_c": "5", "option_d": "6", "correct_answer": "B"}],
        },
    )
    assert create_response.status_code == 200
    assignment_id = create_response.json()["id"]
    question_id = create_response.json()["questions"][0]["id"]

    student_view = client.get(f"/api/assignments/{assignment_id}", headers=auth_headers(student))
    assert student_view.status_code == 200
    assert student_view.json()["questions"][0]["correct_answer"] is None

    submit_response = client.post(
        f"/api/assignments/{assignment_id}/submit",
        headers=auth_headers(student),
        json={"answers": [{"question_id": question_id, "answer_text": "B"}]},
    )
    assert submit_response.status_code == 200
    assert submit_response.json()["total_score"] == 5

    submissions_response = client.get(f"/api/assignments/{assignment_id}/submissions", headers=auth_headers(teacher))
    assert submissions_response.status_code == 200
    assert submissions_response.json()[0]["student_name"] == student.name

    close_response = client.patch(f"/api/assignments/{assignment_id}/close", headers=auth_headers(teacher))
    assert close_response.status_code == 200
    delete_response = client.delete(f"/api/assignments/{assignment_id}", headers=auth_headers(teacher))
    assert delete_response.status_code == 200


def test_quiz_lifecycle_and_student_submission(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    teacher = make_user(email="quiz-workflow-teacher@example.edu", role="teacher")
    school_class = create_class(db_session, name="11A Workflow", teacher_id=teacher.id)
    student = make_user(email="quiz-workflow-student@example.edu", role="student", class_id=school_class.id)

    create_response = client.post(
        "/api/quizzes",
        headers=auth_headers(teacher),
        json={
            "title": "Kiểm tra nhanh",
            "subject": "Toán",
            "topic": "Số học",
            "class_id": school_class.id,
            "easy_count": 0,
            "medium_count": 0,
            "hard_count": 0,
            "allow_retake": False,
            "show_answers": True,
            "questions": [{"question_text": "3 + 3 bằng bao nhiêu?", "difficulty": "easy", "option_a": "5", "option_b": "6", "option_c": "7", "option_d": "8", "correct_answer": "B"}],
        },
    )
    assert create_response.status_code == 200
    quiz_id = create_response.json()["id"]
    question_id = create_response.json()["questions"][0]["id"]
    assert create_response.json()["status"] == "draft"

    publish_response = client.put(f"/api/quizzes/{quiz_id}", headers=auth_headers(teacher), json={"status": "active"})
    assert publish_response.status_code == 200

    student_view = client.get(f"/api/quizzes/{quiz_id}", headers=auth_headers(student))
    assert student_view.status_code == 200
    assert student_view.json()["questions"][0]["correct_answer"] is None

    submit_response = client.post(
        f"/api/quizzes/{quiz_id}/submit",
        headers=auth_headers(student),
        json={"answers": {str(question_id): "B"}},
    )
    assert submit_response.status_code == 200
    assert submit_response.json()["percentage"] == 100

    delete_response = client.delete(f"/api/quizzes/{quiz_id}", headers=auth_headers(teacher))
    assert delete_response.status_code == 200


def test_teacher_schedule_create_update_and_delete(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    teacher = make_user(email="schedule-workflow@example.edu", role="teacher")
    school_class = create_class(db_session, name="12A Workflow", teacher_id=teacher.id)
    headers = auth_headers(teacher)

    create_response = client.post(
        "/api/schedules/",
        headers=headers,
        json={"class_id": school_class.id, "subject": "Toán", "day_of_week": "Monday", "start_time": "07:00", "end_time": "07:45", "room": "P201", "semester": "HK1", "year": "2026-2027"},
    )
    assert create_response.status_code == 200
    schedule_id = create_response.json()["id"]
    assert create_response.json()["teacher_id"] == teacher.id

    update_response = client.put(
        f"/api/schedules/{schedule_id}",
        headers=headers,
        json={"subject": "Vật lý", "day_of_week": "Tuesday", "start_time": "07:50", "end_time": "08:35", "room": "P202", "semester": "HK1", "year": "2026-2027"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["subject"] == "Vật lý"

    list_response = client.get("/api/schedules/my-schedule", headers=headers)
    assert list_response.status_code == 200
    assert [item["id"] for item in list_response.json()] == [schedule_id]

    delete_response = client.delete(f"/api/schedules/{schedule_id}", headers=headers)
    assert delete_response.status_code == 200
    assert client.get("/api/schedules/my-schedule", headers=headers).json() == []
