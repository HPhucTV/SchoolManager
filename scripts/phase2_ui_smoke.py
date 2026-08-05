"""Browser smoke checks for Phase 2 school workflows."""

import json
import os
from pathlib import Path
from urllib.parse import urlparse

from playwright.sync_api import Page, Route, sync_playwright


BASE_URL = os.environ.get("PHASE2_BASE_URL", "http://127.0.0.1:3000")
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "artifacts" / "ui" / "phase2"
CONSOLE_ERRORS: list[str] = []


def fulfill(route: Route, payload: object, status: int = 200) -> None:
    route.fulfill(status=status, content_type="application/json", body=json.dumps(payload, ensure_ascii=False))


def api_handler(route: Route) -> None:
    path = urlparse(route.request.url).path
    method = route.request.method
    payloads = {
        "/api/dashboard/metrics": {
            "happiness": {"value": "82%", "change": "+3%", "change_type": "positive"},
            "engagement": {"value": "76%", "change": "+2%", "change_type": "positive"},
            "mental_health": {"value": "79%", "change": "Ổn định", "change_type": "neutral"},
            "activities": {"value": "6", "subtitle": "hoạt động trong tuần"},
        },
        "/api/classes": [{"id": 7, "name": "10A1", "grade": "10", "teacher_id": 2, "teacher_name": "Nguyễn Minh", "student_count": 32, "happiness_score": 82, "engagement_score": 76, "mental_health_score": 79, "online_enabled": True, "meeting_link": "https://meet.jit.si/10A1", "class_code": "10A1-X7K9"}],
        "/api/assignments": [{"id": 21, "title": "Ôn tập phương trình", "description": "Hoàn thành các câu hỏi", "subject": "Toán", "class_id": 7, "deadline": "2027-01-10T10:00:00", "total_points": 10, "status": "active", "created_at": "2026-08-05T08:00:00", "submission_count": 12, "questions": [{"id": 201, "question_type": "multiple_choice", "question_text": "2 + 2 bằng bao nhiêu?", "points": 10, "option_a": "3", "option_b": "4", "option_c": "5", "option_d": "6"}]}],
        "/api/quizzes": [{"id": 31, "title": "Kiểm tra Toán 15 phút", "subject": "Toán", "topic": "Phương trình", "class_id": 7, "easy_count": 3, "medium_count": 4, "hard_count": 3, "total_questions": 10, "deadline": "2027-01-10T10:00:00", "allow_retake": False, "show_answers": True, "status": "active", "created_at": "2026-08-05T08:00:00"}],
        "/api/schedules/my-schedule": [{"id": 1, "subject": "Toán", "day_of_week": "Monday", "start_time": "07:00", "end_time": "07:45", "room": "P201", "teacher_id": 2, "class_id": 7, "semester": "HK1", "year": "2025-2026"}],
        "/api/student/dashboard": {"student": {"name": "Trần Mai", "class_name": "10A1", "happiness_score": 86, "engagement_score": 81, "mental_health_score": 78, "status": "good"}, "online_session": {"active": True, "room_url": "10A1"}, "assignments_status": {"total": 4, "completed": 3, "pending": 1}, "recent_activities": [], "pending_surveys": []},
        "/api/student/subjects": [{"id": "Toán", "name": "Toán", "teacher": "Nguyễn Minh", "task_count": 1}, {"id": "Ngữ văn", "name": "Ngữ văn", "teacher": "Lê Hà", "task_count": 0}],
        "/api/gamification/my-stats": {"level": 5, "xp": 430, "coins": 120, "streak": 7, "badges_earned": 4, "total_badges": 10, "xp_progress": 30},
        "/api/student/subjects/To%C3%A1n": {"subject": "Toán", "class_info": {"meeting_link": "https://meet.jit.si/10A1", "online_enabled": True, "teacher_name": "Nguyễn Minh", "teacher_email": "minh@example.edu", "teacher_phone": "0901000000"}, "assignments": [{"id": 21, "title": "Ôn tập phương trình", "deadline": "2027-01-10T10:00:00", "status": "active", "score": None}], "quizzes": [{"id": 31, "title": "Kiểm tra Toán 15 phút", "total_questions": 10, "has_attempted": False, "score": None}], "notifications": [], "surveys": []},
    }

    if path == "/api/auth/users" and "role=teacher" in route.request.url:
        return fulfill(route, [{"id": 2, "name": "Nguyễn Minh", "email": "minh@example.edu", "phone_number": "0901000000", "role": "teacher", "created_at": "2026-08-01"}])
    if path == "/api/auth/classes":
        return fulfill(route, [{"id": 7, "name": "10A1", "grade": "10", "teacher_id": 2, "teacher_name": "Nguyễn Minh", "student_count": 32}])
    if path == "/api/classes/7":
        return fulfill(route, payloads["/api/classes"][0])
    if path == "/api/gamification/check-in" and method == "POST":
        return fulfill(route, {"message": "Điểm danh thành công", "xp_earned": 10, "coins_earned": 2})
    if path in payloads:
        return fulfill(route, payloads[path])
    if path == "/api/student/join-class" and method == "POST":
        return fulfill(route, {"message": "Tham gia lớp thành công", "class_id": 7, "class_name": "10A1"})
    return fulfill(route, {})


def set_identity(page: Page, role: str, name: str, user_id: int, class_id: int | None = None) -> None:
    user = {"id": user_id, "email": f"{role}@example.edu", "name": name, "role": role}
    if class_id:
        user.update({"class_id": class_id, "class_name": "10A1"})
    page.add_init_script(f"localStorage.setItem('token', 'phase2-token'); localStorage.setItem('user', {json.dumps(json.dumps(user, ensure_ascii=False))});")


def assert_page_health(page: Page) -> None:
    text = page.locator("body").inner_text()
    assert "—" not in text and "–" not in text, f"Forbidden dash on {page.url}"
    assert not page.evaluate("document.documentElement.scrollWidth > window.innerWidth"), f"Horizontal overflow on {page.url}"


def watch_errors(page: Page) -> None:
    page.on("console", lambda message: CONSOLE_ERRORS.append(message.text) if message.type == "error" else None)
    page.on("pageerror", lambda error: CONSOLE_ERRORS.append(str(error)))


def check_admin(browser) -> None:
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    watch_errors(page)
    page.route("**/api/**", api_handler)
    set_identity(page, "admin", "Lê Thu Hà", 1)
    page.goto(f"{BASE_URL}/admin/giao-vien", wait_until="networkidle")
    assert page.get_by_role("heading", name="Quản lý giáo viên").is_visible()
    assert page.get_by_text("Nguyễn Minh", exact=True).is_visible()
    page.get_by_role("button", name="Thêm giáo viên").click()
    assert page.get_by_role("dialog", name="Thêm giáo viên").is_visible()
    assert_page_health(page)
    page.screenshot(path=OUTPUT_DIR / "admin-teachers-dialog.png", full_page=True)
    page.close()


def check_teacher(browser) -> None:
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    watch_errors(page)
    page.route("**/api/**", api_handler)
    set_identity(page, "teacher", "Nguyễn Minh", 2)
    page.goto(f"{BASE_URL}/teacher", wait_until="networkidle")
    assert page.get_by_role("heading", name="Chào Nguyễn Minh").is_visible()
    assert page.get_by_role("navigation", name="Điều hướng Giáo viên").is_visible()
    assert_page_health(page)
    page.goto(f"{BASE_URL}/teacher/bai-tap", wait_until="networkidle")
    assert page.get_by_role("heading", name="Bài tập", exact=True).is_visible()
    page.get_by_role("button", name="Tạo bài tập").click()
    assert page.get_by_role("dialog", name="Tạo bài tập").is_visible()
    page.screenshot(path=OUTPUT_DIR / "teacher-assignment-dialog.png", full_page=True)

    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{BASE_URL}/teacher/thoi-khoa-bieu", wait_until="networkidle")
    assert page.get_by_role("heading", name="Thời khóa biểu").is_visible()
    page.get_by_role("button", name="Mở menu").click()
    assert page.get_by_role("navigation", name="Điều hướng Giáo viên").is_visible()
    assert_page_health(page)
    page.screenshot(path=OUTPUT_DIR / "teacher-schedule-mobile.png", full_page=False)
    page.close()


def check_student(browser) -> None:
    page = browser.new_page(viewport={"width": 1366, "height": 900})
    watch_errors(page)
    page.route("**/api/**", api_handler)
    set_identity(page, "student", "Trần Mai", 3, 7)
    page.goto(f"{BASE_URL}/student", wait_until="networkidle")
    assert page.get_by_role("heading", name="Chào Trần Mai").is_visible()
    assert page.get_by_text("Toán", exact=True).first.is_visible()
    page.get_by_role("button", name="Tham gia lớp").click()
    assert page.get_by_role("dialog", name="Tham gia lớp học").is_visible()
    assert_page_health(page)
    page.screenshot(path=OUTPUT_DIR / "student-dashboard-dialog.png", full_page=True)
    page.get_by_role("button", name="Đóng hộp thoại").click()

    page.goto(f"{BASE_URL}/student/subject/To%C3%A1n", wait_until="networkidle")
    assert page.get_by_role("heading", name="Toán", exact=True).is_visible()
    page.get_by_role("tab", name="Bài tập (1)").click()
    assert page.get_by_text("Ôn tập phương trình", exact=True).is_visible()
    assert_page_health(page)

    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{BASE_URL}/student", wait_until="networkidle")
    page.get_by_role("button", name="Mở menu").click()
    assert page.get_by_role("navigation", name="Điều hướng Học sinh").is_visible()
    assert_page_health(page)
    page.screenshot(path=OUTPUT_DIR / "student-mobile-menu.png", full_page=False)
    page.close()


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        browser.on("disconnected", lambda: None)
        for checker in (check_admin, check_teacher, check_student):
            checker(browser)
        browser.close()
    assert not CONSOLE_ERRORS, "Browser console errors:\n" + "\n".join(CONSOLE_ERRORS)
    print(f"Phase 2 UI smoke checks passed. Screenshots: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
