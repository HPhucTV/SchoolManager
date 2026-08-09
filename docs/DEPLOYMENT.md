# Deployment guide

`docker-compose.yml` là reference deployment cho một instance SchoolManager. Nó không tự cung cấp managed database, off-site backup, centralized logging, alerting hay secret manager; operator phải bổ sung các control này trước khi dùng với dữ liệu trường thật.

## 1. Chuẩn bị

Yêu cầu tối thiểu: Docker Engine/Compose v2, 4 GB RAM, domain/reverse-proxy policy và nơi lưu secret ngoài Git.

```bash
git clone https://github.com/HPhucTV/SchoolManager.git
cd SchoolManager
cp .env.example .env
```

Thay mọi giá trị `CHANGE-THIS-*` trong `.env`. Sinh secret riêng:

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Các biến bắt buộc cho Compose:

- `POSTGRES_PASSWORD`: password riêng của instance database.
- `SECRET_KEY`: chuỗi ngẫu nhiên tối thiểu 32 ký tự; đổi key sẽ vô hiệu JWT cũ.
- `CORS_ORIGINS`: danh sách origin frontend chính xác, không dùng `*` với credential.
- `TRUSTED_PROXY_HOSTS`: CIDR/host của reverse proxy thật.
- `NEXT_PUBLIC_API_URL`: public API URL được inline lúc build frontend.

Email delivery không nằm trong application hiện tại; notification chỉ ở trong ứng dụng. Không commit `.env`, certificate/private key, dump database hoặc screenshot chứa dữ liệu thật.

Kiểm tra interpolation trước khi deploy (output có thể chứa secret, không đính kèm công khai):

```bash
docker compose config --quiet
```

## 2. Build và bootstrap

```bash
docker compose up --build -d
docker compose ps
```

Backend image chạy explicit:

1. `python -m scripts.provision_schema` để tạo current schema baseline, không seed data.
2. `alembic upgrade head` để apply/adopt migration delta.
3. `uvicorn app.main:app`.

Database healthcheck phải pass trước khi backend bootstrap; frontend chờ backend readiness.

Tạo admin đầu tiên qua prompt ẩn password:

```bash
docker compose exec backend python -m scripts.create_admin
```

Script không có default password, không in password và không promote một non-admin account đã tồn tại. `scripts/seed_db.py` là dữ liệu demo local, bị chặn ở `ENVIRONMENT=production` và không được copy vào backend image.

## 3. Health và smoke check

```bash
curl -fsS https://api.example.edu/health/live
curl -fsS https://api.example.edu/health/ready
curl -I https://app.example.edu/
curl -I https://api.example.edu/docs
```

Expected:

- Liveness trả `200 {"status":"ok"}`.
- Readiness trả 200 khi database sẵn sàng, 503 với payload an toàn khi unavailable.
- Mọi response có `X-Request-ID`.

Không đưa instance vào traffic chỉ dựa trên liveness.

## 4. TLS và reverse proxy bên ngoài Compose

Compose mặc định chỉ chạy PostgreSQL, FastAPI và Next.js. Provision reverse proxy/TLS ngoài repository (managed load balancer, Caddy/Nginx do operator quản lý hoặc ingress của platform). Certificate từng tồn tại trong Git history cũ phải được coi là compromised và thu hồi.

Reverse proxy phải:

- terminate TLS và redirect HTTP sang HTTPS;
- forward `X-Forwarded-For`, `X-Forwarded-Proto` và `X-Request-ID`;
- chỉ cho phép trusted proxy range đã cấu hình;
- giới hạn upload/body phù hợp với API (avatar 5 MB; CSV học sinh 2 MB).

## 5. Logs và incident correlation

```bash
docker compose logs -f backend
```

Backend emit JSON event `http_request_completed` với method, path, status, duration và `request_id`. Error event không chứa body, token, database URL, SOS message hoặc exception text. Thu thập stdout/stderr vào log platform và giữ retention theo privacy policy.

Khi điều tra lỗi, ghi lại thời điểm, route, status và `X-Request-ID`; không yêu cầu người dùng gửi access token.

Baseline alert đề xuất ở hạ tầng:

- readiness fail liên tục;
- tỷ lệ 5xx vượt ngưỡng theo SLO;
- p95/p99 latency tăng bất thường;
- disk/backup failure cho PostgreSQL.

Repository chưa cấu hình metrics/tracing/alert delivery; không tuyên bố chúng đã hoàn thành.

## 6. Upgrade và rollback

Trước upgrade:

1. Đọc `CHANGELOG.md` và migration note của release/PR.
2. Backup database và kiểm tra restore trên môi trường tách biệt.
3. Ghi image/git revision hiện tại để rollback.
4. Chạy quality gates và smoke test staging.

Riêng migration `20260806_0003`, đọc [migration note](MIGRATION_20260806_0003.md): downgrade không phục hồi row của bảng legacy đã bị drop.

```bash
git pull --ff-only origin main
docker compose build
docker compose up -d
docker compose ps
curl -fsS https://api.example.edu/health/ready
```

Rollback application bằng image/revision trước đó. Nếu migration không backward-compatible, dùng downgrade/backfill plan đã review; không tự chạy `alembic downgrade` trên production khi chưa xác nhận data-loss risk.

## 7. Backup/restore

Ví dụ thủ công (thay bằng scheduled encrypted off-site backup trong production):

```bash
docker compose exec -T db pg_dump -U admin -d happy_schools > schoolmanager-backup.sql
docker compose exec -T db psql -U admin -d happy_schools < schoolmanager-backup.sql
```

Dump chứa dữ liệu nhạy cảm: mã hóa, giới hạn access, đặt retention và không lưu trong repository. Một backup chỉ được coi là hợp lệ sau restore drill thành công.

## Release checklist

- [ ] Không còn placeholder/shared credential; secret nằm ngoài Git.
- [ ] Frontend audit/lint/typecheck/build pass.
- [ ] Backend pytest, compileall và `pip-audit` pass.
- [ ] Migration upgrade + rollback/data plan được review.
- [ ] Admin đầu tiên được tạo riêng, demo seed không chạy.
- [ ] Liveness/readiness và request ID được smoke test qua reverse proxy.
- [ ] Backup + restore drill pass.
- [ ] Screenshot/manual test không chứa dữ liệu thật.
- [ ] Known limitations trong README/blueprint vẫn chính xác.
