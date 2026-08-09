# SchoolManager API

FastAPI sinh OpenAPI từ code tại `GET /api/openapi.json`; schema đó là nguồn chi tiết cuối cùng. Local API mặc định ở `http://127.0.0.1:8001` và Swagger ở `/docs`.

## Authentication và error contract

Web frontend xác thực bằng cookie `schoolmanager_session` có `HttpOnly`, `SameSite=Lax` và `Secure` trong production. API client/CLI vẫn có thể gửi `Authorization: Bearer <access_token>`; Bearer được ưu tiên nếu cả header và cookie cùng tồn tại. Server luôn kiểm tra role và class/resource scope; frontend không phải security boundary.

`POST /api/auth/login` tiếp tục trả `access_token` để giữ tương thích và đồng thời đặt cookie cho browser. `POST /api/auth/logout` xóa cookie theo cách idempotent. Frontend không lưu token hoặc user profile trong `localStorage`.

Mọi response có `X-Request-ID`. Error do application trả về có dạng:

```json
{
  "detail": "Thông báo an toàn cho client",
  "request_id": "a1b2c3..."
}
```

## Endpoint đang hỗ trợ

### Identity — `/api/auth`

| Method | Endpoint | Scope |
|---|---|---|
| POST | `/login` | Public |
| POST | `/logout` | Public; xóa browser session cookie |
| GET, PUT | `/users/me` | User hiện tại; email đăng nhập không đổi qua UI |
| POST | `/change-password` | User hiện tại |
| POST | `/users/me/avatar` | JPEG/PNG/WebP, tối đa 5 MB |
| GET, POST | `/users` | Admin |
| PUT, DELETE | `/users/{user_id}` | Admin |
| POST | `/users/{user_id}/reset-password` | Admin |

### Classes — `/api/classes`

| Method | Endpoint | Scope |
|---|---|---|
| GET, POST | `/api/classes` | List theo role; create cho admin/teacher |
| GET, PUT | `/api/classes/{class_id}` | Class scope |
| GET | `/api/classes/{class_id}/students` | Admin hoặc teacher sở hữu lớp |
| GET | `/api/classes/{class_id}/gradebook?page=&page_size=` | Admin hoặc teacher sở hữu lớp; điểm factual có phân trang |

Đây là contract lớp duy nhất; `/api/auth/classes` đã nghỉ hưu.

### Admin — `/api/admin`

| Method | Endpoint | Scope |
|---|---|---|
| GET | `/stats` | Aggregate số user/lớp/quiz |
| GET | `/student-template` | Tải CSV UTF-8 mẫu |
| POST | `/import-students?class_id=...` | Import CSV UTF-8, tối đa 2 MB |

CSV có đúng ba cột `Họ tên, Email, Mật khẩu`; mật khẩu từ 8 đến 72 byte.

### Coursework — `/api/assignments`

| Method | Endpoint | Scope |
|---|---|---|
| GET, POST | `/api/assignments` | List/tạo bài tập |
| GET, PUT, DELETE | `/api/assignments/{assignment_id}` | Resource policy |
| POST | `/api/assignments/{assignment_id}/submit` | Student của lớp |
| GET | `/api/assignments/{assignment_id}/my-submission` | Student hiện tại |
| GET | `/api/assignments/{assignment_id}/submissions` | Teacher sở hữu lớp |
| PUT | `/api/assignments/submissions/{submission_id}/grade` | Chấm thủ công |
| PATCH | `/api/assignments/{assignment_id}/close` | Teacher sở hữu lớp |

Import DOCX và heuristic “AI grade” đã bị loại bỏ. Giáo viên tạo câu hỏi trong form và chấm tự luận thủ công.

### Assessment — `/api/quizzes`

| Method | Endpoint | Scope |
|---|---|---|
| GET, POST | `/api/quizzes` | List/tạo quiz thường |
| GET, PUT, DELETE | `/api/quizzes/{quiz_id}` | Resource policy |
| GET | `/api/quizzes/{quiz_id}/my-result` | Student result |
| POST | `/api/quizzes/{quiz_id}/submit` | Student của lớp |

Student response không chứa answer key trước khi policy cho phép. Import DOCX, AI Tutor và Quiz Battle không còn trong contract.

### Student workspace — `/api/student`

| Method | Endpoint | Scope |
|---|---|---|
| GET | `/dashboard` | Tên lớp và tiến độ bài tập factual |
| GET | `/gradebook` | Điểm đã chấm theo môn từ submission và quiz result |
| POST | `/join-class` | Tham gia bằng `class_code` |
| GET | `/subjects` | Môn học rút ra từ assignment/quiz |
| GET | `/subjects/{subject_name}` | Nội dung môn và liên hệ giáo viên |

Profile/avatar/assignment/quiz duplicate dưới prefix này đã nghỉ hưu; dùng resource API chuẩn ở trên.

### Schedules và notifications

| Prefix | Chức năng |
|---|---|
| `/api/schedules` | CRUD thời khóa biểu và lịch của user hiện tại |
| `/api/dashboard/metrics` | Số lớp, học sinh, bài tập/quiz đang mở |
| `/api/dashboard/today` | Lịch hôm nay, việc gần hạn, thông báo chưa đọc và tín hiệu cần chú ý theo role |
| `/api/notifications` | Thông báo trong ứng dụng, không gửi email/đính kèm file |

`/api/dashboard/today` chỉ dùng dữ liệu hiện có. Teacher nhận SOS đang mở, bài quá hạn chưa nộp và quiz dưới 50% trong phạm vi lớp phụ trách; student không nhận attention queue và không thấy bài đã hoàn thành trong danh sách việc cần làm. SOS ẩn danh luôn trả `student_id: null`.

### Wellbeing — `/api/wellness`

| Method | Endpoint | Scope |
|---|---|---|
| POST | `/mood` | Student; emoji allow-list, note tối đa 500 ký tự |
| GET | `/mood/history` | Student; `days` từ 1–90 |
| GET | `/mood/analytics` | Aggregate từ MoodEntry thật |
| POST | `/sos` | Student; hỗ trợ ẩn danh |
| GET | `/sos/alerts` | Teacher theo class scope; admin |
| PATCH | `/sos/{alert_id}` | Luồng xử lý SOS |
| GET | `/class/{class_id}` | Summary riêng tư từ check-in gần đây |

Không còn các cột điểm wellbeing tổng hợp trên `users`; response không trả raw mood cá nhân cho giáo viên.

## Route đã nghỉ hưu

Các prefix sau không xuất hiện trong OpenAPI: `/api/activities`, `/api/analytics`, `/api/statistics`, `/api/students`, `/api/invitations`, `/api/teacher/reports`, `/api/games`, `/api/gamification`, `/api/battle`, `/api/search`, cùng toàn bộ AI Tutor/chatbot API.

Xem [migration 20260806_0003](MIGRATION_20260806_0003.md) trước khi nâng cấp database có dữ liệu cũ.
