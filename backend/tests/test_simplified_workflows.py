from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app import models


def create_class(db: Session, *, name: str, teacher_id: int | None = None) -> models.Class:
    school_class = models.Class(name=name, grade="10", teacher_id=teacher_id, class_code="ABC123")
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    return school_class


def test_shared_account_settings_update_profile_and_password(
    client: TestClient,
    make_user,
    auth_headers,
):
    teacher = make_user(email="settings@example.edu", role="teacher", name="Tên cũ")
    updated = client.put(
        "/api/auth/users/me",
        headers=auth_headers(teacher),
        json={"name": "Tên mới", "phone": "0901234567"},
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Tên mới"
    assert updated.json()["phone_number"] == "0901234567"

    changed = client.post(
        "/api/auth/change-password",
        headers=auth_headers(teacher),
        json={"current_password": "password123", "new_password": "new-password-123"},
    )
    assert changed.status_code == 200
    login = client.post(
        "/api/auth/login",
        json={"email": teacher.email, "password": "new-password-123"},
    )
    assert login.status_code == 200


def test_admin_imports_students_from_utf8_csv(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    admin = make_user(email="csv-admin@example.edu", role="admin")
    school_class = create_class(db_session, name="10 CSV")
    template = client.get("/api/admin/student-template", headers=auth_headers(admin))
    assert template.status_code == 200
    assert "Họ tên,Email,Mật khẩu" in template.text

    csv_data = "\ufeffHọ tên,Email,Mật khẩu\nNguyễn An,csv-student@example.edu,MatKhau123\n"
    imported = client.post(
        f"/api/admin/import-students?class_id={school_class.id}",
        headers=auth_headers(admin),
        files={"file": ("students.csv", csv_data.encode("utf-8"), "text/csv")},
    )
    assert imported.status_code == 200
    assert imported.json()["success_count"] == 1
    assert db_session.query(models.User).filter(models.User.email == "csv-student@example.edu").count() == 1


def test_teacher_sends_in_app_notification_to_owned_class(
    client: TestClient,
    db_session: Session,
    make_user,
    auth_headers,
):
    teacher = make_user(email="notify-teacher@example.edu", role="teacher")
    school_class = create_class(db_session, name="10 Notify", teacher_id=teacher.id)
    student = make_user(email="notify-student@example.edu", role="student", class_id=school_class.id)

    sent = client.post(
        "/api/notifications",
        headers=auth_headers(teacher),
        json={"title": "Nhắc lịch", "message": "Ngày mai học tiết đầu.", "class_id": school_class.id},
    )
    assert sent.status_code == 201
    assert sent.json()["count"] == 1
    inbox = client.get("/api/notifications", headers=auth_headers(student))
    assert inbox.status_code == 200
    assert inbox.json()[0]["title"] == "Nhắc lịch"
