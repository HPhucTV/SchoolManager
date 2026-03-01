# Contributing to SchoolManager

Cảm ơn bạn đã quan tâm đến SchoolManager! 🎉 Mọi đóng góp đều được trân trọng — từ sửa lỗi nhỏ, cải thiện tài liệu đến tính năng mới.

Vui lòng đọc kỹ hướng dẫn này trước khi gửi pull request.

---

## 📋 Mục lục

- [Quy tắc ứng xử](#-quy-tắc-ứng-xử)
- [Bắt đầu](#-bắt-đầu)
- [Cách đóng góp](#-cách-đóng-góp)
- [Quy trình phát triển](#-quy-trình-phát-triển)
- [Quy chuẩn code](#-quy-chuẩn-code)
- [Quy ước commit](#-quy-ước-commit)
- [Quy trình Pull Request](#-quy-trình-pull-request)
- [Kiến trúc dự án](#-kiến-trúc-dự-án)
- [Cộng đồng](#-cộng-đồng)

---

## 📜 Quy tắc ứng xử

Dự án tuân thủ [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). Khi tham gia, bạn đồng ý tuân thủ các điều khoản này.

---

## 🚀 Bắt đầu

### Yêu cầu hệ thống

| Công cụ | Phiên bản | Mục đích |
|---------|-----------|----------|
| Node.js | 18+ | Frontend runtime |
| Python | 3.10+ | Backend runtime |
| Docker | Latest | Container (optional) |
| Git | Latest | Version control |

### Cài đặt môi trường phát triển

```bash
# 1. Fork repository trên GitHub và clone về máy
git clone https://github.com/<YOUR_USERNAME>/SchoolManager.git
cd SchoolManager/happy-schools

# 2. Cài đặt Backend
cd backend
python -m venv venv
venv\Scripts\activate                    # Linux/Mac: source venv/bin/activate
pip install -r requirements.txt

# 3. Cài đặt Frontend
cd ..
npm install

# 4. Cấu hình môi trường
cp .env.example backend/.env
# Chỉnh sửa backend/.env: DATABASE_URL, OPENAI_API_KEY (nếu cần)

# 5. Khởi chạy development servers
# Terminal 1 - Backend:
cd backend && uvicorn app.main:app --reload --port 8001

# Terminal 2 - Frontend:
npm run dev
```

### Kiểm tra cài đặt thành công

- Frontend: http://localhost:3000
- Backend API Docs: http://localhost:8001/docs
- Đăng nhập bằng tài khoản demo (xem README.md)

---

## 💡 Cách đóng góp

### 🐛 Báo cáo lỗi

Trước khi tạo issue mới:

1. **Tìm kiếm** issues hiện có để tránh trùng lặp
2. Tạo issue mới với thông tin đầy đủ:
   - Tiêu đề rõ ràng, mô tả ngắn gọn
   - Các bước tái hiện lỗi (step-by-step)
   - Kết quả mong đợi vs kết quả thực tế
   - Screenshots hoặc logs (nếu có)
   - Môi trường: OS, browser, Node version

### ✨ Đề xuất tính năng

- Mô tả rõ tính năng mong muốn và lý do cần thiết
- Cung cấp use case cụ thể
- Đề xuất giải pháp kỹ thuật (nếu có)
- Thảo luận trước khi implement để đảm bảo phù hợp

### 🔧 Đóng góp code

Các lĩnh vực cần đóng góp:

| Lĩnh vực | Ngôn ngữ | Ví dụ |
|----------|----------|-------|
| Backend API | Python / FastAPI | Thêm endpoints, sửa logic |
| Frontend UI | TypeScript / React | Components, pages, styling |
| AI Features | Python | Chatbot, quiz generation, grading |
| Testing | Python / TS | Unit tests, integration tests |
| Documentation | Markdown | README, guides, API docs |
| DevOps | Docker / YAML | CI/CD, deployment configs |

---

## 🔄 Quy trình phát triển

### 1. Branching Strategy

Chúng tôi sử dụng **Git Flow** đơn giản:

```
main          ← production-ready code
├── develop   ← integration branch (optional)
├── feature/* ← new features
├── fix/*     ← bug fixes
├── docs/*    ← documentation updates
└── hotfix/*  ← urgent production fixes
```

### 2. Workflow

```bash
# Tạo branch mới từ main
git checkout main
git pull origin main
git checkout -b feature/ten-tinh-nang

# Viết code, commit thường xuyên
git add .
git commit -m "feat: mô tả thay đổi"

# Push và tạo Pull Request
git push origin feature/ten-tinh-nang
```

### 3. Testing

```bash
# Frontend - Build check
npm run build

# Frontend - Linting
npm run lint

# Backend - Syntax check
python -m py_compile backend/app/main.py

# Backend - Run tests (nếu có)
cd backend && python -m pytest
```

### 4. Review

- Tự review code trước khi tạo PR
- Đảm bảo build pass, không có lỗi TypeScript
- Viết mô tả PR rõ ràng

---

## 🎨 Quy chuẩn code

### Python (Backend)

- **Style**: PEP 8, max line length 88 (Black formatter)
- **Type hints**: Bắt buộc cho function parameters và return types
- **Docstrings**: Google style cho các function public
- **Imports**: Sắp xếp theo isort (stdlib → third-party → local)

```python
# ✅ Good
async def get_student(student_id: int, db: Session = Depends(get_db)) -> Student:
    """Lấy thông tin học sinh theo ID."""
    student = db.query(StudentModel).filter_by(id=student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# ❌ Bad
async def get_student(id, db):
    s = db.query(StudentModel).filter_by(id=id).first()
    return s
```

### TypeScript / React (Frontend)

- **Components**: Functional components với hooks
- **Styling**: Tailwind CSS + inline styles (dark theme preferred)
- **Naming**: PascalCase cho components, camelCase cho functions/variables
- **Types**: Định nghĩa interfaces trong `lib/api.ts`

```tsx
// ✅ Good
const StudentCard = ({ student }: { student: Student }) => {
  const [loading, setLoading] = useState(false);
  // ...
};

// ❌ Bad
function studentCard(props: any) {
  var loading = false;
  // ...
}
```

### Git

- Không commit files nhạy cảm (`.env`, API keys, certificates)
- Không commit `node_modules/`, `__pycache__/`, `.next/`
- Đảm bảo `.gitignore` được cập nhật

---

## 📝 Quy ước Commit

Sử dụng [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type | Emoji | Mô tả | Ví dụ |
|------|-------|--------|-------|
| `feat` | ✨ | Tính năng mới | `feat: add quiz battle mode` |
| `fix` | 🐛 | Sửa lỗi | `fix: resolve login 500 error` |
| `docs` | 📚 | Tài liệu | `docs: update README setup guide` |
| `style` | 🎨 | Formatting, không thay đổi logic | `style: fix button alignment` |
| `refactor` | ♻️ | Refactoring code | `refactor: extract auth middleware` |
| `perf` | ⚡ | Cải thiện hiệu suất | `perf: optimize DB queries` |
| `test` | ✅ | Thêm/sửa tests | `test: add quiz API tests` |
| `chore` | 🔧 | Build, CI, dependencies | `chore: update Docker config` |
| `ci` | 👷 | CI/CD changes | `ci: add GitHub Actions workflow` |

### Ví dụ commit message

```
feat(quiz): add manual question creation

- Add UI form for manually creating quiz questions
- Support 4 answer options (A, B, C, D) with correct answer selection
- Integrate with existing quiz creation API

Closes #42
```

---

## 🔀 Quy trình Pull Request

### Trước khi tạo PR

- [ ] Code build thành công (`npm run build`)
- [ ] Không có lỗi TypeScript hoặc ESLint
- [ ] Backend syntax check pass
- [ ] Đã test thủ công các tính năng liên quan
- [ ] Đã cập nhật documentation (nếu cần)

### Tạo Pull Request

1. **Target branch**: `main`
2. **Title**: Sử dụng conventional commit format
3. **Description**: Mô tả rõ ràng thay đổi
4. **Reference**: Liên kết issues liên quan (`fixes #123`)
5. **Screenshots**: Bắt buộc cho UI changes
6. **Testing**: Mô tả cách đã test

### PR Template

```markdown
## Mô tả
[Mô tả ngắn gọn thay đổi]

## Loại thay đổi
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation
- [ ] Refactoring

## Đã test
- [ ] Build pass
- [ ] Manual testing
- [ ] Unit tests (nếu có)

## Screenshots (nếu có UI changes)
[Đính kèm ảnh]

## Issues liên quan
Fixes #...
```

---

## 🏗️ Kiến trúc dự án

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Next.js 16    │────▶│    FastAPI       │────▶│  PostgreSQL  │
│   (Frontend)    │     │    (Backend)     │     │  (Database)  │
│   Port: 3000    │     │   Port: 8001    │     │  Port: 5432  │
└─────────────────┘     └─────────────────┘     └──────────────┘
        │                       │
        │                       ├── OpenAI API (AI features)
        │                       ├── JWT Auth (security)
        │                       └── SQLAlchemy (ORM)
        │
        ├── React Components
        ├── Tailwind CSS (styling)
        └── Recharts (data viz)
```

### Backend Routers (22 modules)

| Router | Chức năng |
|--------|----------|
| `auth.py` | Login, register, user CRUD, password change |
| `ai.py` | AI Chatbot (teacher & student) |
| `ai_tutor.py` | AI Tutor, học tập cá nhân, lộ trình |
| `quizzes.py` | Quiz CRUD, AI & manual generation |
| `quiz_battle.py` | PvP quiz battles thời gian thực |
| `assignments.py` | Bài tập, nộp bài, chấm điểm (AI) |
| `gamification.py` | Points, badges, leaderboard, shop |
| `wellness.py` | Mood tracking, SOS alerts, class wellness |
| `analytics.py` | Early warning, trends, class reports |
| `classes.py` | Quản lý lớp học |
| `students.py` | Quản lý danh sách học sinh |
| `student_api.py` | API dành cho học sinh |
| `parent.py` | Cổng phụ huynh (child monitoring, messaging) |
| `activities.py` | Quản lý hoạt động & sự kiện |
| `admin.py` | Quản trị hệ thống |
| `dashboard.py` | Dashboard metrics |
| `games.py` | Mini-games (Riddles, Word Chain) |
| `invitations.py` | Lời mời tham gia |
| `notifications.py` | Thông báo hệ thống |
| `schedule_api.py` | Thời khóa biểu |
| `statistics.py` | Thống kê tổng quan |
| `teacher_reports.py` | Báo cáo giáo viên |

### Backend Services (4 modules)

| Service | Chức năng |
|---------|----------|
| `cache_service.py` | Caching layer |
| `email_service.py` | Email notification |
| `riddle_service.py` | Riddle game logic |
| `word_service.py` | Word chain game logic |

---

## 🌐 Cộng đồng

- **GitHub Issues**: Báo lỗi và thảo luận tính năng
- **Pull Requests**: Đóng góp code
- **Discussions**: Hỏi đáp và chia sẻ ý tưởng

---

<div align="center">

Cảm ơn bạn đã đóng góp! Mọi contribution đều có giá trị ❤️

</div>
