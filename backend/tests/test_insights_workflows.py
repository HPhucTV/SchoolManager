from datetime import datetime, timedelta, timezone

from app import models
from app.application.insights import DAY_ALIASES


LOCAL_TIMEZONE = timezone(timedelta(hours=7), name="Asia/Ho_Chi_Minh")


def _time_from_now(days: int) -> str:
    return (datetime.now(LOCAL_TIMEZONE) + timedelta(days=days)).isoformat()


def _school_class(db_session, *, name: str, teacher_id: int) -> models.Class:
    school_class = models.Class(
        name=name,
        grade="10",
        teacher_id=teacher_id,
        class_code=f"CODE-{name}",
        created_at=datetime.now(LOCAL_TIMEZONE).isoformat(),
    )
    db_session.add(school_class)
    db_session.commit()
    db_session.refresh(school_class)
    return school_class


def test_student_today_center_returns_scoped_schedule_and_unfinished_work(
    client,
    db_session,
    make_user,
    auth_headers,
) -> None:
    teacher = make_user(email="today-teacher@example.edu", role="teacher", name="Cô Minh")
    school_class = _school_class(db_session, name="10A-Today", teacher_id=teacher.id)
    student = make_user(
        email="today-student@example.edu",
        role="student",
        name="Nguyễn An",
        class_id=school_class.id,
    )
    schedule = models.Schedule(
        class_id=school_class.id,
        teacher_id=teacher.id,
        subject="Toán",
        day_of_week=DAY_ALIASES[datetime.now(LOCAL_TIMEZONE).weekday()][0],
        start_time="07:00",
        end_time="07:45",
        room="A101",
    )
    pending_assignment = models.Assignment(
        title="Bài tập đang chờ",
        subject="Toán",
        class_id=school_class.id,
        teacher_id=teacher.id,
        deadline=_time_from_now(1),
        status="active",
        total_points=10,
        created_at=_time_from_now(-2),
    )
    completed_assignment = models.Assignment(
        title="Bài tập đã nộp",
        subject="Toán",
        class_id=school_class.id,
        teacher_id=teacher.id,
        deadline=_time_from_now(2),
        status="active",
        total_points=10,
        created_at=_time_from_now(-2),
    )
    quiz = models.Quiz(
        title="Kiểm tra sắp tới",
        subject="Toán",
        topic="Đại số",
        class_id=school_class.id,
        teacher_id=teacher.id,
        deadline=_time_from_now(3),
        status="active",
        total_questions=10,
    )
    db_session.add_all([schedule, pending_assignment, completed_assignment, quiz])
    db_session.commit()
    db_session.add_all([
        models.Submission(
            assignment_id=completed_assignment.id,
            student_id=student.id,
            status="submitted",
            total_score=0,
            submitted_at=_time_from_now(-1),
        ),
        models.Notification(
            user_id=student.id,
            title="Nhắc lịch",
            message="Có việc mới",
            is_read=False,
            created_at=_time_from_now(0),
        ),
    ])
    db_session.commit()

    response = client.get("/api/dashboard/today", headers=auth_headers(student))

    assert response.status_code == 200
    payload = response.json()
    assert [item["subject"] for item in payload["schedule"]] == ["Toán"]
    work_ids = {(item["kind"], item["id"]) for item in payload["work_items"]}
    assert ("assignment", pending_assignment.id) in work_ids
    assert ("assignment", completed_assignment.id) not in work_ids
    assert ("quiz", quiz.id) in work_ids
    assert payload["unread_notifications"] == 1
    assert payload["attention"] == []


def test_teacher_attention_is_factual_and_class_scoped(
    client,
    db_session,
    make_user,
    auth_headers,
) -> None:
    teacher = make_user(email="attention-teacher@example.edu", role="teacher", name="Cô Thảo")
    other_teacher = make_user(email="attention-other@example.edu", role="teacher", name="Thầy Khác")
    school_class = _school_class(db_session, name="10A-Attention", teacher_id=teacher.id)
    other_class = _school_class(db_session, name="10B-Attention", teacher_id=other_teacher.id)
    student = make_user(
        email="attention-student@example.edu",
        role="student",
        name="Trần Bình",
        class_id=school_class.id,
    )
    outsider = make_user(
        email="attention-outsider@example.edu",
        role="student",
        name="Ngoài Lớp",
        class_id=other_class.id,
    )
    overdue = models.Assignment(
        title="Bài tập quá hạn",
        subject="Ngữ văn",
        class_id=school_class.id,
        teacher_id=teacher.id,
        deadline=_time_from_now(-2),
        status="active",
        total_points=10,
        created_at=_time_from_now(-5),
    )
    outsider_overdue = models.Assignment(
        title="Không thuộc phạm vi",
        subject="Toán",
        class_id=other_class.id,
        teacher_id=other_teacher.id,
        deadline=_time_from_now(-2),
        status="active",
        total_points=10,
        created_at=_time_from_now(-5),
    )
    quiz = models.Quiz(
        title="Kiểm tra cần ôn lại",
        subject="Ngữ văn",
        topic="Đọc hiểu",
        class_id=school_class.id,
        teacher_id=teacher.id,
        status="closed",
        total_questions=10,
    )
    db_session.add_all([overdue, outsider_overdue, quiz])
    db_session.commit()
    db_session.add_all([
        models.QuizResult(
            quiz_id=quiz.id,
            student_id=student.id,
            score=4,
            total_questions=10,
            percentage=40,
            answers="{}",
            completed_at=_time_from_now(-1),
        ),
        models.SOSAlert(
            student_id=student.id,
            message="Em cần hỗ trợ",
            is_anonymous=False,
            status="pending",
            created_at=_time_from_now(0),
        ),
        models.SOSAlert(
            student_id=outsider.id,
            message="Ngoài phạm vi",
            is_anonymous=False,
            status="pending",
            created_at=_time_from_now(0),
        ),
    ])
    db_session.commit()

    response = client.get("/api/dashboard/today", headers=auth_headers(teacher))

    assert response.status_code == 200
    attention = response.json()["attention"]
    assert {item["kind"] for item in attention} == {"sos", "missing_assignment", "low_quiz_score"}
    assert all(item["class_id"] == school_class.id for item in attention)
    assert all("Không thuộc phạm vi" not in item["description"] for item in attention)

    admin = make_user(email="today-admin@example.edu", role="admin")
    assert client.get("/api/dashboard/today", headers=auth_headers(admin)).status_code == 403


def test_class_and_student_gradebooks_reuse_existing_scores(
    client,
    db_session,
    make_user,
    auth_headers,
) -> None:
    teacher = make_user(email="gradebook-teacher@example.edu", role="teacher", name="Cô Lan")
    other_teacher = make_user(email="gradebook-other@example.edu", role="teacher")
    school_class = _school_class(db_session, name="10A-Gradebook", teacher_id=teacher.id)
    student = make_user(
        email="gradebook-student@example.edu",
        role="student",
        name="Lê Mai",
        class_id=school_class.id,
    )
    missing_student = make_user(
        email="gradebook-missing@example.edu",
        role="student",
        name="Phạm Nam",
        class_id=school_class.id,
    )
    mixed_student = make_user(
        email="gradebook-mixed@example.edu",
        role="student",
        name="Đỗ Bình",
        class_id=school_class.id,
    )
    assignment = models.Assignment(
        title="Bài tập Toán",
        subject="Toán",
        class_id=school_class.id,
        teacher_id=teacher.id,
        deadline=_time_from_now(-2),
        status="closed",
        total_points=10,
        created_at=_time_from_now(-5),
    )
    quiz = models.Quiz(
        title="Kiểm tra Toán",
        subject="Toán",
        topic="Đại số",
        class_id=school_class.id,
        teacher_id=teacher.id,
        deadline=_time_from_now(-1),
        status="closed",
        total_questions=10,
    )
    db_session.add_all([assignment, quiz])
    db_session.commit()
    db_session.add_all([
        models.Submission(
            assignment_id=assignment.id,
            student_id=student.id,
            status="graded",
            total_score=8,
            submitted_at=_time_from_now(-3),
            graded_at=_time_from_now(-2),
        ),
        models.QuizResult(
            quiz_id=quiz.id,
            student_id=student.id,
            score=6,
            total_questions=10,
            percentage=60,
            answers="{}",
            completed_at=_time_from_now(-1),
        ),
        models.Submission(
            assignment_id=assignment.id,
            student_id=mixed_student.id,
            status="graded",
            total_score=8,
            submitted_at=_time_from_now(-3),
            graded_at=_time_from_now(-2),
        ),
        models.QuizResult(
            quiz_id=quiz.id,
            student_id=mixed_student.id,
            score=4,
            total_questions=10,
            percentage=40,
            answers="{}",
            completed_at=_time_from_now(-1),
        ),
    ])
    db_session.commit()

    response = client.get(
        f"/api/classes/{school_class.id}/gradebook?page=1&page_size=10",
        headers=auth_headers(teacher),
    )

    assert response.status_code == 200
    payload = response.json()
    rows = {row["student_id"]: row for row in payload["students"]}
    assert rows[student.id]["assignment_average"] == 80.0
    assert rows[student.id]["quiz_average"] == 60.0
    assert rows[student.id]["overall_average"] == 70.0
    assert rows[student.id]["needs_attention"] is False
    assert rows[missing_student.id]["missing_items"] == 2
    assert rows[missing_student.id]["needs_attention"] is True
    assert rows[mixed_student.id]["overall_average"] == 60.0
    assert rows[mixed_student.id]["missing_items"] == 0
    assert rows[mixed_student.id]["needs_attention"] is True
    assert payload["pagination"]["total_items"] == 3

    forbidden = client.get(
        f"/api/classes/{school_class.id}/gradebook",
        headers=auth_headers(other_teacher),
    )
    assert forbidden.status_code == 403

    student_response = client.get("/api/student/gradebook", headers=auth_headers(student))
    assert student_response.status_code == 200
    student_payload = student_response.json()
    assert student_payload["overall_average"] == 70.0
    assert student_payload["subjects"] == [{
        "subject": "Toán",
        "assignment_average": 80.0,
        "quiz_average": 60.0,
        "overall_average": 70.0,
        "completed_items": 2,
        "graded_items": 2,
        "total_items": 2,
        "needs_review": False,
    }]
