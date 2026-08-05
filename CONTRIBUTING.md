# Contributing to SchoolManager

Cảm ơn bạn muốn cải thiện SchoolManager. Repository đang được trùng tu theo [RENOVATION_BLUEPRINT.md](docs/RENOVATION_BLUEPRINT.md); hãy giữ thay đổi nhỏ, có evidence và không mở rộng contract ngoài issue đã thống nhất.

Mọi người tham gia phải tuân thủ [Code of Conduct](CODE_OF_CONDUCT.md) và [Security Policy](SECURITY.md).

## Trước khi bắt đầu

- Tìm issue trùng lặp. Dùng template chuyên biệt cho bug, feature, database migration, design system hoặc security hardening.
- Không đăng vulnerability chưa được vá, credential, token, certificate, mood/SOS content hay dữ liệu học sinh thật vào issue/PR.
- Với thay đổi API/schema/auth, mô tả compatibility và migration/rollback trước khi code.
- Với UI, nêu route, role, viewport và state cần kiểm tra.

## Local setup

Yêu cầu giống CI: Node.js 22 và Python 3.12.

```powershell
git clone https://github.com/<YOUR_USERNAME>/SchoolManager.git
cd SchoolManager

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

Mở terminal khác ở repository root:

```powershell
"NEXT_PUBLIC_API_URL=http://127.0.0.1:8001" | Set-Content -Encoding utf8 .env.local
npm ci
npm run dev
```

Kiểm tra `/health/live`, `/health/ready`, `/docs` và `http://localhost:3000`. Không có shared demo credential. Nếu cần data giả, chạy `scripts/seed_db.py` chỉ trên SQLite local như README hướng dẫn.

## Quy tắc kiến trúc

### Backend

- Slice mới đi theo `router -> schemas -> application -> domain/SQLAlchemy`.
- Router chỉ xử lý HTTP, validation và error mapping; use case/application sở hữu policy, transaction và audit.
- Domain policy phải thuần, test không cần FastAPI/database khi có thể.
- Dùng direct SQLAlchemy trong application; không thêm generic repository chưa có nhu cầu thật.
- Luôn áp role/class ownership policy trước khi đọc hoặc mutate resource.
- Response schema theo actor không được lộ answer key, PII, anonymous SOS identity hay internal notes.
- Public error không chứa exception/SQL/secret. Log event có request ID và allow-list field; không log body/token/PII.

### Frontend

- Dùng Campus Blue tokens trong `src/app/globals.css` và primitives ở `src/components/ui`.
- Dùng Lucide cho icon chức năng; không thêm emoji tùy ý vào navigation/control.
- Không dùng raw inline style nếu Tailwind/token hiện có thể biểu đạt.
- Reuse `RoleShell`; không thêm `ProtectedRoute` lặp ở từng page đã nằm trong shell.
- API contract/type đặt trong `src/lib/api/`; page điều phối state thay vì tự parse response ad hoc.
- Mỗi screen cần loading, empty, error và success state; kiểm tra keyboard focus, reduced motion, mobile và dark mode.

Chi tiết quyết định backend ở [ADR-001](docs/decisions/ADR-001-backend-vertical-slices.md).

## Quality gates

Chạy từ repository root:

```powershell
npm audit --audit-level=high
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build

cd backend
python -m compileall -q app scripts
python -m pytest -q
python -m pip_audit -r requirements.txt
```

CI chạy `npm ci` và `pip install -r requirements-dev.txt`; không sửa dependency mà bỏ qua lockfile/audit. Test thủ công không thay thế gate tự động.

## Git và pull request

Tạo branch ngắn từ `main`, dùng Conventional Commits khi phù hợp và mở PR về `main`. Một PR nên có một mục tiêu review được.

PR phải ghi:

- Vấn đề và phạm vi thay đổi.
- Command + kết quả test có thể tái lập; không chỉ ghi “works on my machine”.
- Screenshot desktop/mobile/dark mode khi thay UI, không chứa dữ liệu thật.
- Migration note: `none` hoặc upgrade/downgrade/backfill/rollback rõ ràng.
- API compatibility/security/privacy impact.
- Health/observability impact với endpoint hoặc job chạy production.

CI xanh là điều kiện cần, không phải bằng chứng production-ready. Reviewer vẫn kiểm tra authorization, privacy boundary, migration safety và UI states.

## Database và seed policy

- `backend/scripts/provision_schema.py`: bootstrap schema current baseline, không chèn data.
- `alembic upgrade head`: versioned migration/adoption delta.
- `backend/scripts/create_admin.py`: tạo admin đầu tiên bằng prompt hoặc env riêng, không có default password và không in password.
- `scripts/seed_db.py`: dữ liệu demo local; tự chặn production.

Không sửa database production bằng `Base.metadata.create_all()` ad hoc, script ALTER legacy hoặc demo seed. Mọi thay đổi schema mới cần Alembic revision, test upgrade và migration issue/PR note.

## Báo lỗi và bảo mật

Bug thông thường dùng GitHub issue với request ID, route, thời điểm, phiên bản và bước tái hiện. Loại bỏ token/PII khỏi log trước khi đính kèm.

Vulnerability hoặc incident có thể làm lộ dữ liệu không được đăng công khai; làm theo kênh trong [SECURITY.md](SECURITY.md).
