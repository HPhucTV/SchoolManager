"""Visual smoke checks for the public pages and role-based dashboard shell."""

import os
from pathlib import Path

from playwright.sync_api import Page, sync_playwright


BASE_URL = os.environ.get("SCHOOLMANAGER_UI_BASE_URL", "http://127.0.0.1:3000")
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "artifacts" / "ui"


def assert_no_horizontal_overflow(page: Page) -> None:
    overflow = page.evaluate("document.documentElement.scrollWidth > window.innerWidth")
    assert not overflow, f"Horizontal overflow detected on {page.url}"


def assert_no_em_dash(page: Page) -> None:
    text = page.locator("body").inner_text()
    assert "—" not in text and "–" not in text, f"Forbidden dash character found on {page.url}"


def check_landing(page: Page) -> None:
    page.set_viewport_size({"width": 1440, "height": 1000})
    page.goto(BASE_URL, wait_until="networkidle")
    assert page.get_by_role("heading", name="Mỗi ngày ở trường, gọn gàng hơn.").is_visible()
    assert page.get_by_role("link", name="Đăng nhập", exact=True).first.is_visible()
    assert page.locator("img[alt]").count() >= 3
    assert_no_horizontal_overflow(page)
    assert_no_em_dash(page)
    page.screenshot(path=OUTPUT_DIR / "landing-desktop.png", full_page=True)

    page.emulate_media(color_scheme="dark", reduced_motion="reduce")
    page.reload(wait_until="networkidle")
    assert_no_horizontal_overflow(page)
    page.screenshot(path=OUTPUT_DIR / "landing-dark.png", full_page=False)

    page.emulate_media(color_scheme="light", reduced_motion="reduce")
    page.set_viewport_size({"width": 390, "height": 844})
    page.reload(wait_until="networkidle")
    assert page.get_by_role("heading", name="Mỗi ngày ở trường, gọn gàng hơn.").is_visible()
    assert_no_horizontal_overflow(page)
    page.screenshot(path=OUTPUT_DIR / "landing-mobile.png", full_page=True)


def check_login(page: Page) -> None:
    page.emulate_media(color_scheme="light", reduced_motion="reduce")
    page.set_viewport_size({"width": 390, "height": 844})
    page.goto(f"{BASE_URL}/login", wait_until="networkidle")
    assert page.get_by_label("Email").is_visible()
    password = page.get_by_label("Mật khẩu", exact=True)
    assert password.is_visible()
    assert page.get_by_text("Tài khoản Demo").count() == 0
    page.get_by_role("button", name="Hiện mật khẩu").click()
    assert password.get_attribute("type") == "text"
    assert_no_horizontal_overflow(page)
    assert_no_em_dash(page)
    page.screenshot(path=OUTPUT_DIR / "login-mobile.png", full_page=True)

    page.emulate_media(color_scheme="dark", reduced_motion="reduce")
    page.reload(wait_until="networkidle")
    assert page.get_by_label("Email").is_visible()
    assert_no_horizontal_overflow(page)
    page.screenshot(path=OUTPUT_DIR / "login-dark.png", full_page=True)


def check_admin(page: Page) -> None:
    page.emulate_media(color_scheme="light", reduced_motion="reduce")
    page.route(
        "**/api/admin/stats",
        lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=(
                '{"total_teachers":18,"total_students":426,"total_classes":12,'
                '"total_quizzes":37,"recent_users":['
                '{"id":1,"name":"Nguyễn Minh Anh","email":"minhanh@example.edu","role":"student"},'
                '{"id":2,"name":"Trần Hoàng Nam","email":"hoangnam@example.edu","role":"teacher"}]}'
            ),
        ),
    )
    page.add_init_script(
        """
        localStorage.setItem('token', 'ui-smoke-token');
        localStorage.setItem('user', JSON.stringify({
          id: 99, email: 'admin@example.edu', name: 'Lê Thu Hà', role: 'admin'
        }));
        """
    )
    page.set_viewport_size({"width": 1366, "height": 900})
    page.goto(f"{BASE_URL}/admin", wait_until="networkidle")
    assert page.get_by_role("heading", name="Chào Lê Thu Hà").is_visible()
    assert page.get_by_text("426", exact=True).is_visible()
    assert_no_horizontal_overflow(page)
    assert_no_em_dash(page)
    page.screenshot(path=OUTPUT_DIR / "admin-desktop.png", full_page=True)

    page.set_viewport_size({"width": 390, "height": 844})
    page.reload(wait_until="networkidle")
    assert_no_horizontal_overflow(page)
    page.get_by_role("button", name="Mở menu").click()
    assert page.get_by_role("navigation", name="Điều hướng Quản trị viên").is_visible()
    page.screenshot(path=OUTPUT_DIR / "admin-mobile-menu.png", full_page=False)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    console_errors: list[str] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        page = browser.new_page()
        page.on("console", lambda message: console_errors.append(message.text) if message.type == "error" else None)
        page.on("pageerror", lambda error: console_errors.append(str(error)))

        check_landing(page)
        check_login(page)
        check_admin(page)
        browser.close()

    assert not console_errors, "Browser console errors:\n" + "\n".join(console_errors)
    print(f"UI smoke checks passed. Screenshots: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
