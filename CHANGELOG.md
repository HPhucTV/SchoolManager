# Changelog

All notable changes to **SchoolManager** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-02-24

### 🚀 Initial Release

First production release of SchoolManager with full-featured school management platform.

---

### Added

#### 🤖 AI & Chatbot

- **AI Chatbot**: Trợ lý AI cho giáo viên (tạo báo cáo, tư vấn) và học sinh (hỗ trợ học tập)
- **AI Tutor**: Phân tích năng lực, nhận diện điểm mạnh/yếu, đề xuất lộ trình học cá nhân
- **AI Quiz Generator**: Tạo đề thi tự động từ chủ đề và mức độ khó
- **AI Grading**: Chấm điểm bài tập tự động bằng AI
- **Fallback Responses**: Hệ thống câu trả lời dự phòng đa persona (`student`, `teacher`, `parent`)

#### 📝 Kiểm tra & Đánh giá

- **Quiz Management**: CRUD bài kiểm tra với phân loại độ khó (dễ/trung bình/khó)
- **Quiz Battle**: Chế độ thi đấu PvP thời gian thực giữa học sinh
- **Manual Quiz**: Hỗ trợ tạo đề thủ công với 4 phương án trắc nghiệm
- **Word Import**: Import đề thi từ file `.docx`
- **Assignment Management**: Giao bài tập, nộp bài, chấm điểm

#### 🎮 Gamification

- **Daily Check-in**: Điểm danh hàng ngày nhận XP
- **Badge System**: Hệ thống huy hiệu thành tích đa dạng
- **Leaderboard**: Bảng xếp hạng theo lớp và toàn trường
- **Shop**: Cửa hàng phần thưởng đổi bằng điểm tích lũy
- **Games**: Mini-games Riddles và Word Chain tích hợp AI

#### 💚 Wellness & Sức khỏe

- **Mood Tracking**: Theo dõi cảm xúc hàng ngày qua emoji & ghi chú
- **SOS Alert**: Hệ thống gửi cảnh báo khẩn cấp (hỗ trợ ẩn danh)
- **Class Wellness**: Báo cáo sức khỏe tinh thần toàn lớp
- **Mood Analytics**: Phân tích xu hướng cảm xúc 30 ngày

#### 📊 Analytics & Reporting

- **Dashboard Metrics**: Thống kê hạnh phúc, tham gia, sức khỏe tinh thần
- **Early Warning System**: Cảnh báo sớm học sinh cần hỗ trợ
- **Class Reports**: Báo cáo chi tiết theo lớp
- **Student Trends**: Theo dõi xu hướng phát triển cá nhân
- **Teacher Reports**: Tạo & quản lý báo cáo giáo viên

#### 🔐 Authentication & Authorization

- **JWT Authentication**: Đăng nhập bảo mật với JSON Web Token
- **Role-Based Access Control**: 4 vai trò (Admin, Teacher, Student, Parent)
- **Password Hashing**: Mã hóa mật khẩu bằng bcrypt
- **Change Password**: Hỗ trợ đổi mật khẩu

#### 👨‍👩‍👧 Cổng phụ huynh

- **Child Monitoring**: Theo dõi điểm số, cảm xúc, hoạt động con
- **Teacher Messaging**: Nhắn tin trực tiếp với giáo viên
- **Reports**: Xem báo cáo học tập chi tiết

#### 🏛️ Admin Management

- **User Management**: CRUD người dùng, phân quyền
- **Class Management**: Tạo lớp, phân công giáo viên
- **Student Import**: Import danh sách từ file Excel
- **Statistics**: Thống kê tổng quan toàn trường

#### 🌐 Frontend

- **Landing Page**: Trang chủ hiện đại với hiệu ứng gradient & animation
- **Teacher Interface**: 17+ trang quản lý toàn diện
- **Student Interface**: 16+ trang trải nghiệm đa dạng
- **Parent Portal**: Cổng theo dõi cho phụ huynh
- **Admin Dashboard**: Bảng điều khiển quản trị
- **Dark Theme**: Giao diện tối mặc định, hiện đại
- **Responsive Design**: Hỗ trợ desktop (mobile đang cải thiện)

#### 🏗️ Infrastructure

- **Docker Compose**: Triển khai one-command gồm Backend, Frontend, DB, Nginx
- **PostgreSQL**: Database production với volume persistent
- **Nginx**: Reverse proxy với SSL/HTTPS termination
- **Certbot**: Tự động renewal chứng chỉ Let's Encrypt
- **GitHub Actions**: CI/CD pipeline tự động

---

### Technical Specifications

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | Next.js | 16.1.6 |
| UI Library | React | 19.2.3 |
| Type System | TypeScript | 5.x |
| Styling | Tailwind CSS | 4.x |
| Charts | Recharts | 3.7 |
| Icons | Lucide React | 0.563 |
| Backend | FastAPI | 0.100+ |
| ORM | SQLAlchemy | 2.x |
| Database | PostgreSQL | 15 |
| AI | OpenAI API | Latest |
| Auth | JWT + bcrypt | — |
| Container | Docker | Latest |
| Proxy | Nginx | Alpine |

---

### Known Issues

- 📱 Mobile UI chưa hoàn toàn responsive
- 📧 Email notifications chưa được triển khai
- ⚡ Performance optimization đang tiến hành
- 🗺️ Bản đồ/vị trí chưa tích hợp

---

## [0.1.0] - 2026-02-04

### Initial Beta Release

#### Added

- Cấu trúc dự án ban đầu với backend FastAPI và frontend Next.js
- Teacher report chatbot và AI dataset cơ bản
- Hệ thống authentication JWT
- Seed database script
- Docker & Docker Compose configuration

#### Known Issues

- Mobile UI chưa responsive
- Cần tối ưu hiệu suất

---

<div align="center">

**SchoolManager Changelog**

[v1.0.0](#100---2026-02-24) • [v0.1.0](#010---2026-02-04)

</div>
