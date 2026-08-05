# Kiến trúc hệ thống SchoolManager

## Tổng quan

```
                        ┌──────────────────────┐
                        │    Nginx (SSL)       │
                        │    Port: 80/443      │
                        └──────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
          ┌─────────▼─────────┐        ┌──────────▼──────────┐
          │   Next.js 16      │        │    FastAPI           │
          │   (Frontend)      │        │    (Backend)         │
          │   Port: 3000      │        │    Port: 8001        │
          └───────────────────┘        └──────────┬───────────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                          ┌─────────▼──┐  ┌───────▼────┐  ┌────▼─────┐
                          │ PostgreSQL │  │ OpenAI API │  │ JSON     │
                          │ Port: 5432 │  │ (AI/Chat)  │  │ Datasets │
                          └────────────┘  └────────────┘  └──────────┘
```

## Luồng backend theo vertical slice

Các domain đã migrate đi theo luồng `router -> application -> domain/SQLAlchemy`:

```text
FastAPI router
  -> request schema + HTTP error mapping
  -> Coursework / Assessment application interface
  -> pure domain policy + direct SQLAlchemy access
  -> one transaction + durable audit event
  -> actor-specific response schema
```

Quy tắc đóng góp:

- Router chỉ xử lý transport và validation tại biên HTTP; không query hoặc commit trực tiếp.
- Application module sở hữu một use case hoàn chỉnh và là interface test chính.
- Domain policy phải thuần để test trực tiếp, không import FastAPI/SQLAlchemy.
- Không thêm generic repository khi SQLAlchemy vẫn là database adapter duy nhất.
- Request schema và response schema theo vai trò không dùng chung để tránh lộ dữ liệu chấm điểm.

Lý do và trade-off được ghi tại [ADR-001](decisions/ADR-001-backend-vertical-slices.md).

## Vai trò người dùng

| Vai trò | Mô tả | Trang chính |
|---------|-------|-------------|
| **Admin** | Quản trị hệ thống, CRUD users/classes | `/admin` |
| **Teacher** | Quản lý lớp, tạo quiz, xem analytics | `/teacher` |
| **Student** | Làm quiz, gamification, mood tracking | `/student` |
| **Parent** | Theo dõi con, nhắn tin giáo viên | `/parent` |

## Luồng Authentication

```
Client                    Backend                   Database
  │                         │                         │
  │── POST /auth/login ────▶│                         │
  │                         │── Verify credentials ──▶│
  │                         │◀── User data ──────────│
  │                         │── Generate JWT          │
  │◀── { token, user } ────│                         │
  │                         │                         │
  │── GET /api/* ──────────▶│                         │
  │   (Bearer token)        │── Validate JWT          │
  │                         │── Process request ─────▶│
  │◀── Response ───────────│                         │
```

## Docker Services

| Service | Image | Port | Mục đích |
|---------|-------|------|----------|
| `db` | postgres:15-alpine | 5432 | Database chính |
| `backend` | Custom (FastAPI) | 8001 | REST API |
| `frontend` | Custom (Next.js) | 3000 | Web UI |
| `nginx` | nginx:alpine | 80, 443 | Reverse proxy + SSL |
| `certbot` | certbot/certbot | — | SSL cert renewal |

## Database Models

Các bảng chính trong `backend/app/models.py`:

- **User** — Tài khoản người dùng (admin, teacher, student, parent)
- **Class** — Lớp học
- **Student** — Thông tin học sinh (liên kết User + Class)
- **Quiz / Question** — Bài kiểm tra & câu hỏi
- **QuizSubmission** — Bài làm của học sinh
- **Assignment / Submission** — Bài tập & nộp bài
- **Activity** — Hoạt động & sự kiện
- **Schedule** — Thời khóa biểu
- **MoodEntry** — Nhật ký cảm xúc
- **SOSAlert** — Cảnh báo khẩn cấp
- **Badge / UserBadge** — Huy hiệu
- **GameScore** — Điểm gamification
- **Notification** — Thông báo
- **QuizBattle** — Trận đấu quiz
