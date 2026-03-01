# Hướng dẫn triển khai (Deployment Guide)

## Yêu cầu hệ thống

| Thành phần | Yêu cầu tối thiểu |
|------------|-------------------|
| OS | Ubuntu 20.04+ / Windows Server |
| RAM | 4GB (khuyến nghị 8GB) |
| Disk | 20GB |
| Docker | 20.10+ |
| Docker Compose | 2.0+ |

---

## 1. Chuẩn bị Server

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 2. Clone & Cấu hình

```bash
git clone https://github.com/HPhucTV/SchoolManager.git
cd SchoolManager/happy-schools

# Cấu hình backend
cp .env.example backend/.env
nano backend/.env
```

### Biến môi trường quan trọng

```env
# Database
DATABASE_URL=postgresql://admin:your_password@db:5432/happy_schools

# AI (optional)
OPENAI_API_KEY=sk-...

# Security
SECRET_KEY=your-random-secret-key
```

## 3. SSL Certificate

```bash
# Tạo self-signed cert (development)
mkdir -p certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout certs/server.key -out certs/server.crt

# Hoặc Let's Encrypt (production)
docker-compose run certbot certonly --webroot -w /var/www/certbot \
  -d yourdomain.com -d api.yourdomain.com
```

## 4. Deploy

```bash
# Build & khởi chạy
docker-compose up --build -d

# Xem logs
docker-compose logs -f

# Seed database
docker exec -it happy-schools-backend python scripts/seed_db.py
```

## 5. Kiểm tra

- Frontend: `https://yourdomain.com`
- Backend API: `https://api.yourdomain.com/docs`
- Health check: `curl https://api.yourdomain.com/health`

## 6. Bảo trì

```bash
# Restart services
docker-compose restart

# Update code
git pull origin main
docker-compose up --build -d

# Backup database
docker exec happy-schools-db pg_dump -U admin happy_schools > backup.sql

# Restore database
cat backup.sql | docker exec -i happy-schools-db psql -U admin happy_schools
```
