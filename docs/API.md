# API Documentation

## Base URL

- **Development:** `http://localhost:8001`
- **Production:** `https://api.schoolmanager.id.vn`
- **Swagger UI:** `{BASE_URL}/docs`
- **ReDoc:** `{BASE_URL}/redoc`

---

## Authentication

Tất cả API endpoints (trừ login) yêu cầu JWT token trong header:

```
Authorization: Bearer <your_token>
```

### POST `/api/auth/login`

```json
{
  "username": "teacher1",
  "password": "teacher123"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "teacher1",
    "role": "teacher"
  }
}
```

---

## API Endpoints Overview

### 🔐 Authentication (`/api/auth/`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/users` | Tạo tài khoản mới |
| GET | `/api/auth/users` | Danh sách người dùng |
| PUT | `/api/auth/users/{id}` | Cập nhật người dùng |
| DELETE | `/api/auth/users/{id}` | Xóa người dùng |
| POST | `/api/auth/change-password` | Đổi mật khẩu |
| GET | `/api/auth/classes` | Danh sách lớp học |
| POST | `/api/auth/classes` | Tạo lớp học |

### 🤖 AI (`/api/ai/`, `/api/ai-tutor/`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/ai/chat` | Chat với AI chatbot |
| GET | `/api/ai-tutor/analysis` | Phân tích năng lực |
| GET | `/api/ai-tutor/recommendations` | Đề xuất học tập |
| GET | `/api/ai-tutor/learning-path` | Lộ trình cá nhân |

### 📝 Quizzes (`/api/quizzes/`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/quizzes` | Danh sách bài kiểm tra |
| POST | `/api/quizzes` | Tạo bài kiểm tra |
| PUT | `/api/quizzes/{id}` | Cập nhật bài kiểm tra |
| DELETE | `/api/quizzes/{id}` | Xóa bài kiểm tra |

### ⚔️ Quiz Battle (`/api/battle/`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/battle/create` | Tạo trận đấu |
| POST | `/api/battle/join` | Tham gia trận đấu |
| POST | `/api/battle/{id}/start` | Bắt đầu |
| POST | `/api/battle/{id}/answer` | Gửi câu trả lời |
| GET | `/api/battle/{id}/leaderboard` | Bảng xếp hạng |

### 🎮 Gamification (`/api/gamification/`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/gamification/check-in` | Điểm danh hàng ngày |
| GET | `/api/gamification/badges` | Danh sách huy hiệu |
| GET | `/api/gamification/my-stats` | Thống kê cá nhân |
| GET | `/api/gamification/leaderboard` | Bảng xếp hạng |
| GET | `/api/gamification/shop` | Cửa hàng |
| POST | `/api/gamification/shop/buy/{id}` | Mua vật phẩm |

### 💚 Wellness (`/api/wellness/`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/wellness/mood` | Ghi nhận cảm xúc |
| GET | `/api/wellness/mood/history` | Lịch sử cảm xúc |
| GET | `/api/wellness/mood/analytics` | Phân tích cảm xúc |
| POST | `/api/wellness/sos` | Gửi cảnh báo SOS |
| GET | `/api/wellness/sos/alerts` | Danh sách SOS |
| GET | `/api/wellness/class/{id}` | Wellness theo lớp |

### 📊 Analytics (`/api/analytics/`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/analytics/trends/{studentId}` | Xu hướng học sinh |
| GET | `/api/analytics/early-warning` | Cảnh báo sớm |
| GET | `/api/analytics/class-report/{classId}` | Báo cáo lớp |

### 👨‍👩‍👧 Parent (`/api/parent/`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/api/parent/children` | Danh sách con |
| GET | `/api/parent/child/{id}/report` | Báo cáo con |
| GET | `/api/parent/child/{id}/mood` | Cảm xúc con |
| POST | `/api/parent/message` | Gửi tin nhắn |
| GET | `/api/parent/messages` | Lịch sử tin nhắn |

---

> **Ghi chú:** Tài liệu API đầy đủ với request/response examples có thể xem tại Swagger UI: `{BASE_URL}/docs`
