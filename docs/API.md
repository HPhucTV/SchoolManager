# SchoolManager API

FastAPI sinh OpenAPI trực tiếp từ code. Khi tài liệu này và schema khác nhau, dùng schema tại `GET /api/openapi.json` làm nguồn cuối cùng.

## Base URL và công cụ

| Môi trường | URL |
|---|---|
| Local | `http://127.0.0.1:8001` |
| Swagger UI | `{BASE_URL}/docs` |
| ReDoc | `{BASE_URL}/redoc` |
| OpenAPI JSON | `{BASE_URL}/api/openapi.json` |

Không mặc định một production hostname trong client hoặc tài liệu. Operator cấu hình `NEXT_PUBLIC_API_URL` cho từng môi trường.

## Authentication

Các endpoint chứa dữ liệu trường học yêu cầu JWT Bearer token và tiếp tục kiểm tra role/class scope ở application layer.

```http
Authorization: Bearer <access_token>
```

Đăng nhập dùng email, không dùng username:

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "teacher@school.example",
  "password": "<local-or-user-password>"
}
```

Response trả `access_token`, `token_type` và user hiện tại. Repository không cung cấp shared demo password; xem `README.md` nếu cần seed local.

## Request ID và error contract

Mọi HTTP response có header `X-Request-ID`. Client có thể gửi một ID gồm tối đa 128 ký tự an toàn (`A-Z`, `a-z`, `0-9`, `.`, `_`, `:`, `-`); server sẽ thay ID không hợp lệ.

HTTP error do application trả về có dạng:

```json
{
  "detail": "Thông báo an toàn cho client",
  "request_id": "a1b2c3..."
}
```

Validation error giữ `detail` dạng danh sách FastAPI. Lỗi 500 không trả exception, SQL hoặc credential; dùng `request_id` để đối chiếu structured log.

## Health checks (không cần authentication)

| Method | Endpoint | Ý nghĩa |
|---|---|---|
| GET | `/health/live` | Process đang nhận request |
| GET | `/health/ready` | Database trả lời `SELECT 1`; lỗi trả 503 |
| GET | `/health` | Alias của readiness, không xuất hiện trong OpenAPI |

Không dùng liveness để quyết định đưa instance vào traffic; load balancer nên dùng readiness.

## Core vertical slices

### Authentication và admin — `/api/auth`

| Method | Endpoint | Scope |
|---|---|---|
| POST | `/login` | Public |
| GET, PUT | `/users/me` | User hiện tại |
| POST | `/change-password` | User hiện tại |
| POST | `/users/me/avatar` | User hiện tại; JPEG/PNG/WebP, tối đa 5 MB |
| GET, POST | `/users` | Admin |
| PUT, DELETE | `/users/{user_id}` | Admin |
| POST | `/users/{user_id}/reset-password` | Admin |
| GET, POST | `/classes` | Admin operations dưới auth router |
| PUT | `/classes/{class_id}` | Admin |

### Classes và activities

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET, POST | `/api/classes` | List/create theo role |
| GET, PUT | `/api/classes/{class_id}` | Class scope bắt buộc |
| GET | `/api/classes/{class_id}/students` | Không cho student đọc lớp khác |
| GET | `/api/classes/{class_id}/timeline` | Timeline lớp |
| GET, POST | `/api/activities` | Authenticated |
| PUT, PATCH, DELETE | `/api/activities/{activity_id}` | Teacher/admin policy |

### Coursework — `/api/assignments`

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET, POST | `/api/assignments` | Danh sách/tạo assignment |
| GET, PUT, DELETE | `/api/assignments/{assignment_id}` | Role-specific response/policy |
| POST | `/api/assignments/{assignment_id}/submit` | Student submit |
| GET | `/api/assignments/{assignment_id}/my-submission` | Student |
| GET | `/api/assignments/{assignment_id}/submissions` | Teacher của lớp |
| PUT | `/api/assignments/submissions/{submission_id}/grade` | Teacher của lớp |
| PATCH | `/api/assignments/{assignment_id}/close` | Teacher của lớp |
| POST | `/api/assignments/upload-docx` | DOCX validation tại boundary |

### Assessment — `/api/quizzes`

| Method | Endpoint | Ghi chú |
|---|---|---|
| GET, POST | `/api/quizzes` | List/create quiz |
| GET, PUT, DELETE | `/api/quizzes/{quiz_id}` | Role/class policy |
| GET | `/api/quizzes/{quiz_id}/my-result` | Student result |
| POST | `/api/quizzes/{quiz_id}/submit` | Student submit |
| POST | `/api/quizzes/upload-docx` | Parse DOCX thành câu hỏi draft |

Student response không chứa đáp án trước khi policy `show_answers` cho phép.

### Wellbeing — `/api/wellness`

| Method | Endpoint | Ghi chú |
|---|---|---|
| POST | `/mood` | Student; emoji allow-list, note tối đa 500 ký tự |
| GET | `/mood/history` | Student; `days` từ 1-90 |
| GET | `/mood/analytics` | Student aggregate |
| POST | `/sos` | Student; hỗ trợ ẩn danh |
| GET | `/sos/alerts` | Teacher chỉ thấy lớp mình; admin theo policy |
| PATCH | `/sos/{alert_id}` | Teacher/admin transition policy |
| GET | `/class/{class_id}` | Summary riêng tư, không trả raw mood cá nhân |

SOS ẩn danh trả `student_id: null`; audit event không ghi nội dung message.

## Legacy/engagement route groups

Các group sau đang tồn tại và được frontend sử dụng, nhưng chưa phải tất cả đã migrate sang vertical slice. Kiểm tra Swagger và test evidence trước khi thay contract.

| Prefix | Chức năng |
|---|---|
| `/api/schedules` | Thời khóa biểu |
| `/api/battle` | Quiz Battle |
| `/api/gamification` | Check-in, badge, leaderboard, shop |
| `/api/notifications` | Thông báo |
| `/api/ai`, `/api/ai-tutor` | Chat/advice dựa trên dataset nội bộ |
| `/api/games` | Crossword |
| `/api/analytics` | Trends, early warning, class report |
| `/api/search` | Search và suggestions |
| `/api/dashboard`, `/api/statistics` | Dashboard aggregates |
| `/api/student`, `/api/teacher/reports` | Role-specific workflows |

Không có `/api/parent` router trong build hiện tại. Parent role vẫn tồn tại trong một phần model legacy nhưng chưa được công bố là public API.

## Thay đổi contract

- Cập nhật schema/type frontend trong `src/lib/api/` cùng PR.
- Thêm test OpenAPI hoặc application workflow cho endpoint thay đổi.
- Ghi migration/compatibility note trong PR template.
- Không đưa secret, token, mood note, SOS message hay dữ liệu học sinh thật vào example/log/screenshot.
