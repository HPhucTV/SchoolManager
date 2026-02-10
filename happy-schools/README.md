# Happy Schools Project

Ứng dụng quản lý trường học hạnh phúc, tích hợp AI và quản lý học tập.

## 🚀 Hướng dẫn khởi chạy (Dành cho Giám khảo)

Dự án sử dụng **Docker** để đơn giản hóa việc thiết lập môi trường. Vui lòng đảm bảo máy tính đã cài đặt Docker Desktop.

### 1. Cấu hình môi trường
Sao chép file cấu hình mẫu:
```bash
cp .env.example .env
```
*(Mở file `.env` và điền khóa API (Gemini/OpenAI) nếu cần sử dụng các tính năng AI).*

### 2. Khởi động hệ thống
Chạy lệnh sau để xây dựng và khởi chạy các dịch vụ (Database, Backend, Frontend):
```bash
docker-compose up -d --build
```

### 3. Khởi tạo dữ liệu mẫu (Seeding)
Sau khi các container đã chạy (trạng thái "Running"), thực hiện lệnh sau để tạo 3 tài khoản demo:
```bash
docker exec -it happy-schools-backend python -m app.seed
```

### 4. Truy cập ứng dụng
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API Backend**: [http://localhost:8001](http://localhost:8001)

## 🔑 Tài khoản dùng thử
| Vai trò | Email | Mật khẩu |
| :--- | :--- | :--- |
| **Quản trị (Admin)** | `admin@happyschools.vn` | `test123` |
| **Giáo viên** | `gv.10a@happyschools.vn` | `test123` |
| **Học sinh** | `hs.an@happyschools.vn` | `test123` |

---
*Chúc bạn có trải nghiệm tốt với Happy Schools!*
