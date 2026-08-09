# Kiến trúc SchoolManager

SchoolManager là modular monolith gồm Next.js 16, FastAPI/SQLAlchemy và PostgreSQL (SQLite cho local/test). Phạm vi sản phẩm được khóa ở quản lý trường học cốt lõi cộng wellbeing tối thiểu.

```text
Browser
  -> Next.js RoleShell + feature pages
  -> typed HTTP client (src/lib/api)
  -> FastAPI router
  -> application use case + domain policy
  -> SQLAlchemy transaction
  -> PostgreSQL / SQLite
```

Reverse proxy, TLS, backup, log aggregation và alerting là hạ tầng bên ngoài Compose mặc định.

## Product boundary

Giữ lại:

- authentication, RBAC và quản trị tài khoản;
- lớp học, danh sách học sinh và mã tham gia;
- bài tập, nộp/chấm bài, quiz thường;
- thời khóa biểu và thông báo trong ứng dụng;
- `MoodEntry` và `SOSAlert` với privacy policy.

Đã nghỉ hưu:

- mini-games, Quiz Battle, AI Tutor/chatbot và AI grading heuristic;
- gamification economy, shop, badge, leaderboard và global search;
- Activities, invitation email, teacher reports và các trang analytics/statistics trùng lặp;
- Jitsi/online-class state, SMTP delivery, DOCX/XLSX import và Redis cache;
- API/resource workflow trùng lặp.

## Frontend

`src/app` là route adapter. Shared `RoleShell`, semantic Campus Blue tokens và UI primitives cung cấp navigation, form, table, dialog, loading/empty/error state cho cả ba role.

```text
src/app/                 route theo admin/teacher/student
src/components/ui/       primitive và workflow dùng chung
src/components/settings/ AccountSettings dùng chung ba role
src/lib/api/client.ts    cookie credentials, parse response, error mapping
src/lib/api/*.ts         contract theo academic/coursework/wellbeing/insights
```

Quy tắc:

- `/teacher/bai-tap` và `/teacher/kiem-tra` là hai workflow canonical; class detail chỉ link có `classId`.
- `/api/classes` là class contract duy nhất.
- Ba route Cài đặt chỉ bọc `AccountSettings`.
- Email đăng nhập hiển thị read-only vì JWT hiện định danh bằng email; thay đổi email cần auth contract mới.

### Browser session

```text
POST /api/auth/login
  -> trả Bearer token cho client tương thích
  -> đặt cookie HttpOnly/SameSite=Lax cho browser
GET /api/auth/users/me
  -> hydrate AuthProvider từ cookie, không đọc localStorage
POST /api/auth/logout
  -> xóa cookie, luôn idempotent
```

Cookie chỉ bật `Secure` trong production. Local development phải dùng cùng hostname cho frontend và backend. Bearer header có độ ưu tiên cao hơn cookie để explicit API credential không âm thầm fallback sang phiên browser khác.

## Backend vertical slices

Assessment, coursework và wellbeing dùng luồng:

```text
router -> validated schema -> application interface
       -> pure policy + SQLAlchemy -> one transaction + audit event
       -> actor-specific response
```

Router còn lại được giữ nhỏ và factual. Không tạo generic repository khi SQLAlchemy là database adapter duy nhất. Chi tiết trade-off ở [ADR-001](decisions/ADR-001-backend-vertical-slices.md).

### Factual projections

`SchoolInsights` là read-only application interface cho ba projection nhỏ, không tạo bảng hoặc analytics pipeline mới:

```text
Schedule + Assignment + Submission + QuizResult + Notification + SOSAlert
  -> /api/dashboard/today
  -> /api/classes/{class_id}/gradebook
  -> /api/student/gradebook
```

Điểm bài tập được quy đổi từ `Submission.total_score / Assignment.total_points`; điểm quiz dùng `QuizResult.percentage`. Giá trị trung bình chỉ tính mục đã có điểm. Attention queue chỉ chứa SOS đang mở, bài quá hạn chưa nộp và quiz dưới 50%, tối đa tám mục trên dashboard để giữ trọng tâm.

### Privacy boundary

- Answer key không xuất hiện trong student response trước policy cho phép.
- Mood history chỉ chủ tài khoản đọc được.
- SOS ẩn danh trả `student_id: null`; message không nằm trong audit event.
- Today projection không làm lộ danh tính của SOS ẩn danh và luôn giới hạn theo lớp giáo viên phụ trách.
- Teacher chỉ xử lý SOS của học sinh thuộc lớp mình.
- Class wellbeing tính từ mood check-in gần đây; không duy trì điểm sức khỏe tổng hợp trên `users`.

## Models đang hoạt động

- `User`, `Class`, `Schedule`
- `Assignment`, `Question`, `Submission`, `Answer`
- `Quiz`, `QuizQuestion`, `QuizResult`
- `Notification`
- `MoodEntry`, `SOSAlert`
- `AuditEvent`

Các bảng feature đã nghỉ hưu được drop bởi migration `20260806_0003`.

## Bootstrap và migration

```text
python -m scripts.provision_schema
  -> create current metadata baseline, không seed
alembic upgrade head
  -> adopt/apply versioned deltas
python -m scripts.create_admin
  -> tạo admin đầu tiên qua prompt
```

Alembic vẫn là adoption history, chưa phải lịch sử tạo schema từ revision đầu. Migration `0003` là destructive de-scope; đọc [migration note](MIGRATION_20260806_0003.md), backup và restore-test trước production.

## Operational boundary

`RequestContextMiddleware` gắn `X-Request-ID` và ghi structured HTTP event không chứa body/token/SOS message. `/health/live` kiểm tra process; `/health/ready` kiểm tra database. Repository chưa cung cấp metrics, tracing, centralized logging hoặc alert delivery.

Compose mặc định chỉ gồm:

| Service | Port | Mục đích |
|---|---:|---|
| `db` | 5432 | PostgreSQL |
| `backend` | 8001 | FastAPI |
| `frontend` | 3000 | Next.js |

TLS/reverse proxy phải được operator cấu hình ngoài Compose.
