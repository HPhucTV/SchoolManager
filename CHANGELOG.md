# Changelog

All notable changes to **SchoolManager** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Security

- Bắt buộc JWT secret mạnh, loại certificate/private key và mật khẩu database mặc định khỏi source.
- Thêm policy role, class scope và resource ownership cho các luồng quản trị, lớp học, bài tập, quiz, lịch học và wellness.
- Không còn đăng ký role công khai, plaintext password fallback, answer key cho học sinh hoặc mật khẩu reset cố định.
- Nâng dependency backend/frontend; `pip-audit` và `npm audit` hiện không còn vulnerability đã biết.
- Chuyển browser session sang cookie HttpOnly/SameSite, bật Secure trong production và giữ Bearer compatibility cho API client.

### Added

- Thêm request correlation qua `X-Request-ID`, structured HTTP/error events và health endpoints `/health/live`, `/health/ready`.
- Thêm explicit schema bootstrap và first-admin provisioning không có default password, kèm operational readiness/provisioning tests.
- Thêm issue template riêng cho database migration, Campus Blue design system và security hardening; PR template yêu cầu test evidence, screenshot và migration note.
- Thêm Alembic adoption baseline, 10 test authorization, CI quality gates và browser smoke test.
- Thêm Campus Blue semantic tokens, UI primitives và shared `RoleShell`.
- Thêm ảnh trường học gốc cho landing và login.
- Thêm DataTable, filter, pagination, form field, accessible dialog và confirmation flow dùng chung cho workflow nghiệp vụ.
- Thêm 4 API integration test cho provisioning Admin, assignment submission, quiz lifecycle và schedule CRUD; tổng backend suite hiện có 14 test.
- Thêm browser smoke Phase 2 cho cả Admin, Teacher và Student trên desktop/mobile.
- Thêm `Coursework` và `Assessment` application interface, policy thuần và 6 interface/policy/OpenAPI test; tổng backend suite hiện có 20 test.
- Thêm audit trail bền vững cho assignment/quiz bằng migration `20260805_0002`, ghi trong cùng transaction với thay đổi nghiệp vụ.
- Thêm ADR-001 ghi lại quyết định modular-monolith vertical slice và lý do không tạo generic repository.
- Thêm Wellbeing application/policy/schema, mood journal và SOS privacy-first với 14 workflow/authorization tests.
- Thêm typed API seam cho wellbeing và notifications.

### Changed

- Đồng bộ README, API, architecture, contributing và deployment guide với code hiện tại; bỏ parent API/live-production claim và các trạng thái hoàn thành không có evidence.
- Tách production provisioning khỏi demo seed: backend image không chứa demo seed, seed tự chặn production, Docker chờ database/readiness và dùng Python 3.12 như CI.
- Retire `scripts/migrate_new_features.py` để không còn chạy ALTER/create-all/seed ad hoc; entry point cũ chỉ hướng người vận hành sang schema bootstrap và Alembic.
- CI chạy typecheck explicit và compileall cho backend operational scripts.
- Thiết kế lại landing, login và Admin Overview cho bối cảnh trường học, responsive và system dark mode.
- Seed development dùng mật khẩu ngẫu nhiên hoặc `SCHOOLMANAGER_SEED_PASSWORD`, không dùng credential chung trong repo.
- Migrate các workflow Phase 2 sang Campus Blue: Admin giáo viên/học sinh/lớp; Teacher dashboard/lớp/bài tập/kiểm tra/thời khóa biểu; Student dashboard/lớp/môn/bài tập/quiz/thời khóa biểu.
- Tách module API hơn 600 dòng thành client/error model và các feature `admin`, `academic`, `coursework`, `school`, `extensions`, đồng thời giữ compatibility facade cho route cũ.
- Teacher và Student dùng chung `RoleShell`; thời khóa biểu dùng một component responsive và accessible cho cả hai vai trò.
- Làm mỏng router assignment/quiz thành HTTP adapter; tách request schema khỏi response schema theo vai trò và chuẩn hóa application error sang HTTP status.
- Gộp create/update/submit/grade/delete của assessment/coursework thành một transaction cho mỗi use case thay vì commit nhiều lần trong router.
- Hợp nhất ba trang Cài đặt vào `AccountSettings`; hợp nhất class/coursework vào `/teacher/bai-tap` và `/teacher/kiem-tra`.
- Chuyển import danh sách học sinh từ XLSX sang CSV UTF-8 và notification sang in-app only.
- Dashboard chỉ hiển thị aggregate có nguồn thật; wellbeing summary được tính từ MoodEntry gần đây thay vì cột điểm tổng hợp.

### Removed

- Mini-games/dataset, Quiz Battle, AI Tutor/chatbot, AI grading heuristic và import DOCX.
- Gamification economy, badge/shop/leaderboard, global search, Activities, teacher reports, invitation email và analytics/statistics trùng lặp.
- Jitsi/online-class state, SMTP delivery, Redis cache, Recharts, `class-variance-authority`, `python-docx` và `openpyxl`.
- API legacy `/api/auth/classes`, duplicate student profile/coursework endpoints và các route frontend teacher trùng lặp.
- Route kết quả quiz teacher cũ không còn backend consumer; dashboard dùng danh sách quiz canonical.
- Migration `20260806_0003` drop bảng/cột legacy; xem `docs/MIGRATION_20260806_0003.md` vì downgrade không phục hồi data row.

### Fixed

- Sửa response mapping của bài nộp trên Pydantic v2 để luồng nộp bài, xem bài nộp và chấm điểm không lỗi thiếu `student_name`.
- Trang lớp của học sinh không còn gọi endpoint danh sách học sinh dành riêng cho Admin/Teacher, tránh lỗi 403 và không phơi dữ liệu wellbeing của bạn cùng lớp.
- Student response của assignment/quiz giữ contract `correct_answer: null` nhưng answer key không còn được tạo từ cùng response schema với giáo viên.

---

## [1.1.1] - 2026-03-07

### Fixed

- **Quiz Creation (500 Error)**: Fix thiếu cột `allow_retake` ở database PostgreSQL/SQLite làm crash app khi tạo bài kiểm tra. Thêm lightweight migration tự động vào `main.py`
- **Infinite Loading on Student Pages**: Fix lỗi load vĩnh viễn ở trang thông báo và các trang học sinh do thiếu dependency array ở `useEffect` hooks
- **Closed Quiz UI**: Fix ẩn nút "Làm bài" với học sinh khi bài kiểm tra đã đóng hạn (giáo viên vẫn xem được chi tiết)
- **Option Text Color**: Cải thiện độ rõ nét của text các đáp án chữ xám trên nền trắng trong giao diện làm bài kiểm tra và bài tập

---

## [1.1.0] - 2026-03-04

### Added

#### 🔍 Smart Global Search

- **Ctrl+K Modal**: Tìm kiếm toàn cục mở bằng phím tắt Ctrl+K / Cmd+K
- **Hybrid Scoring Algorithm**: Kết hợp BM25 text relevance, recency, personalization, popularity
- **6 loại kết quả**: Học sinh, lớp học, bài tập, bài kiểm tra, hoạt động, thông báo
- **Search History & Suggestions**: Lưu lịch sử tìm kiếm, gợi ý autocomplete
- **Vietnamese Support**: Hỗ trợ tìm kiếm không dấu cho tiếng Việt
- **Keyboard Navigation**: Điều hướng bằng phím ↑↓, Enter, Esc
- **Backend**: `search.py` router — `GET /api/search`, `GET /api/search/suggestions`, `POST /api/search/log-click`
- **Frontend**: `GlobalSearch.tsx` component tích hợp vào `Header.tsx`
- **Model**: `SearchHistory` lưu trữ lịch sử tìm kiếm cho cá nhân hoá

#### 🌱 Improved Seed Data

- **Comprehensive `seed_db.py`**: Script seed mới phủ toàn bộ 15+ models
- Dữ liệu demo gồm: 4 lớp, 4 giáo viên, 32 học sinh, thời khoá biểu, bài tập, kiểm tra, hoạt động, thông báo, nhật ký cảm xúc, SOS, huy hiệu, báo cáo giáo viên

### Fixed

- Fix `get_current_user` import path (security → auth router)
- Fix Pydantic v2 deprecation: `regex` → `pattern` trong Query parameter
- Fix TypeScript `useRef()` cần initial value
- Remove unused import `X` from `GlobalSearch.tsx`

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

[v1.1.0](#110---2026-03-04) • [v1.0.0](#100---2026-02-24) • [v0.1.0](#010---2026-02-04)

</div>
