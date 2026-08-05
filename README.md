<p align="center"><img src="./public/logo.png" alt="SchoolManager" width="96" /></p>

<h1 align="center">SchoolManager</h1>

<p align="center">Nền tảng quản lý trường học mã nguồn mở cho quản trị viên, giáo viên và học sinh.</p>

<p align="center"><a href="CONTRIBUTING.md">Đóng góp</a> · <a href="docs/API.md">API</a> · <a href="docs/DEPLOYMENT.md">Triển khai</a> · <a href="SECURITY.md">Bảo mật</a></p>

SchoolManager kết hợp quản lý lớp, coursework, quiz, gamification và wellbeing trong một giao diện Campus Blue. Đây là dự án đang được trùng tu: các vertical slice đã có test và contract rõ ràng được ưu tiên, còn các router legacy được giữ tương thích và sẽ migrate dần.

## Tính năng hiện có

- Authentication và RBAC cho admin, teacher, student.
- Lớp học, bài tập, quiz, nộp bài/chấm điểm và thời khóa biểu.
- Mood journal, SOS alert và class wellness với policy riêng tư.
- Quiz Battle, gamification, thông báo, AI Tutor/chatbot dựa trên dataset nội bộ và mini-games.
- Frontend Next.js responsive với Campus Blue, dark mode, keyboard focus và trạng thái loading/empty/error.

Các mục trên là phạm vi code hiện tại, không phải cam kết rằng mọi router đã sẵn sàng cho production. Xem [trạng thái release](#trạng-thái-release) và [blueprint](docs/RENOVATION_BLUEPRINT.md) trước khi triển khai trường thật.

## Bắt đầu nhanh (local)

Yêu cầu: Node.js 22, Python 3.12, npm và PowerShell hoặc shell tương đương. SQLite được dùng cho local nên không cần PostgreSQL/Redis để chạy các slice chính.

### Backend

```powershell
cd backend
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
$env:ENVIRONMENT = "development"
$env:SECRET_KEY = (python -c "import secrets; print(secrets.token_urlsafe(48))")
$env:DATABASE_URL_SYNC = "sqlite:///./sql_app.db"
python -m scripts.provision_schema
alembic -c alembic.ini upgrade head
uvicorn app.main:app --host 127.0.0.1 --port 8001 --reload
```

Backend docs: `http://127.0.0.1:8001/docs` · liveness: `http://127.0.0.1:8001/health/live` · readiness: `http://127.0.0.1:8001/health/ready`.

### Frontend

```powershell
cd ..
"NEXT_PUBLIC_API_URL=http://127.0.0.1:8001" | Set-Content -Encoding utf8 .env.local
npm ci
npm run dev
```

Frontend: `http://localhost:3000`.

### Dữ liệu demo (chỉ local)

Từ thư mục gốc, sau khi backend đã được cấu hình với SQLite:

```powershell
.\backend\.venv\Scripts\python.exe .\scripts\seed_db.py
```

Script tạo password ngẫu nhiên và chỉ in password một lần. Có thể đặt `SCHOOLMANAGER_SEED_PASSWORD` cho database local riêng. Script tự từ chối khi `ENVIRONMENT=production`; không dùng tài khoản demo trong trường thật.

## Kiểm tra chất lượng

```powershell
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
npm audit --audit-level=high
cd backend
python -m pytest -q
python -m pip_audit -r requirements.txt
```

CI chạy các gate frontend và backend tương ứng tại `.github/workflows/quality.yml`.

## Trạng thái release

| Khu vực | Trạng thái | Evidence |
|---|---|---|
| Backend policy/workflow slice | Sẵn sàng review | Pytest và OpenAPI contract tests trong `backend/tests/` |
| Frontend Campus Blue pilot | Sẵn sàng review | Lint, typecheck, production build và browser smoke đã chạy local |
| Auth token storage | Cần hardening | Frontend hiện dùng `localStorage`; chưa phải cookie HttpOnly |
| Database migration history | Baseline đang adoption | Alembic hiện chứa các migration quiz/audit; schema nền được bootstrap explicit |
| Production operations | Cần kiểm chứng theo hạ tầng | Dùng health probes, request ID và checklist trong `docs/DEPLOYMENT.md` |

## Cấu trúc

```text
backend/app/domain/          # Pure policies
backend/app/application/     # Use cases và transaction boundary
backend/app/routers/         # HTTP adapters
backend/app/schemas/         # Request/response contracts
backend/scripts/             # Schema/admin provisioning (không seed demo)
scripts/seed_db.py           # Local demo seed only
src/app/                     # Next.js routes
src/components/              # UI primitives và shared shell
src/lib/api/                 # Typed API client/contracts
docs/                        # API, architecture, deployment, renovation blueprint
```

## Tài liệu

- [API contract](docs/API.md) — endpoint nhóm chính; Swagger là nguồn chi tiết cuối cùng.
- [Kiến trúc](docs/ARCHITECTURE.md) — vertical slices, privacy boundary và operational flow.
- [Triển khai](docs/DEPLOYMENT.md) — Docker, provisioning, health checks và rollback.
- [Đóng góp](CONTRIBUTING.md) — setup, quality gates và PR evidence.
- [Security policy](SECURITY.md) · [Code of Conduct](CODE_OF_CONDUCT.md) · [Changelog](CHANGELOG.md).
- [Renovation blueprint](docs/RENOVATION_BLUEPRINT.md) — phases và các giới hạn đã biết.

## Đóng góp

Hãy mở issue trước với thay đổi lớn, không commit `.env`, token, certificate hay dữ liệu học sinh thật. Đọc [CONTRIBUTING.md](CONTRIBUTING.md), dùng PR template và đính kèm test evidence/migration note/screenshot khi phù hợp.

## License

Apache License 2.0 — xem [LICENSE](LICENSE).
