# ��� Happy‑Schools

> **License:** This project is released under the GNU GPL v3.0 (see LICENSE).

> ��� **Giải pháp quản lý và hỗ trợ học tập toàn diện cho trường học thông minh**  
> Chatbot trợ lý AI dành cho giáo viên và học sinh, phân tích năng lực, báo cáo, trò chơi tương tác và nhiều tiện ích khác.

![Happy Schools banner](./README-assets/banner.png)

---

## ��� Tính năng nổi bật

- **Chatbot tâm lý & giáo dục**

  - Học sinh trò chuyện với bạn bè/cha mẹ/giáo viên AI.
  - Giáo viên có thể “xem báo cáo” hoặc tạo báo cáo nhanh qua chatbot.

- **AI Tutor**

  - Phân tích điểm số, nhận diện điểm mạnh/yếu.
  - Đề xuất lộ trình học và nhắc nhở cá nhân hóa.

- **Báo cáo & thống kê**

  - Giáo viên gửi báo cáo, xem lịch sử.
  - Dashboard hiển thị chỉ số lớp, học sinh.

- **Giải trí & học tập**

  - Trò **riddles** (đố chữ) có gợi ý từ AI.
  - **Word‑chain** (xâu chữ) với suy luận tự động.

- **Cơ sở dữ liệu mẫu**

  - Chatbot: câu trả lời dự phòng với nhiều persona (`student`, `teacher`, …`), lưu trong `backend/data/chatbot_responses.json`.
  - AI tutor: tập hợp lời khuyên học tập được đặt trong `backend/data/ai_tutor_advice.json`; server tự động tải dữ liệu này khi khởi động. Chỉ cần thêm dòng mới vào file để mở rộng.
  - Các tệp JSON đều dễ mở rộng bằng tay hoặc qua script Python (`scripts/update_chatbot*.py` hoặc tương tự).

- **Khả năng tùy biến & mở rộng**
  - Thêm persona mới, topics, category bằng file JSON.
  - API reload dataset không cần khởi động lại server.

---

## ��� Cấu trúc dự án

```text
happy-schools/
├─ backend/          # FastAPI + SQLAlchemy
│   ├─ app/
│   │   ├─ routers/  # ai.py, ai_tutor.py, teacher_reports.py, ...
│   │   └─ models.py
│   ├─ data/         # chatbot_responses.json, seed scripts
│   └─ requirements.txt
├─ src/              # Next.js (React + TS) frontend
│   ├─ components/   # ChatBot, TeacherChatBot, BaseChatBot, ...
│   ├─ app/          # pages/route handlers
│   └─ lib/api.ts    # client-side API helpers
├─ scripts/          # utilities (update_chatbot.py, ...)
└─ README.md         # <-- bạn đang xem
```

---

## ���️ Thiết lập & chạy

1. **Backend**

   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate    # Windows: .venv\\Scripts\\activate
   pip install -r requirements.txt
   export DATABASE_URL=sqlite:///db.sqlite3  # hoặc PostgreSQL
   uvicorn app.main:app --reload
   ```

2. **Frontend**

   ```bash
   cd ../happy-schools
   npm install
   npm run dev
   ```

3. Mở trình duyệt tới `http://localhost:3000` và đăng nhập bằng tài khoản mẫu (được seed sẵn).

---

## ��� Cập nhật dataset AI

- Thêm mục mới/chỉnh keyword trong `backend/data/chatbot_responses.json`.
- Hoặc dùng script:

  ```bash
  python scripts/update_chatbot.py --category report --new-keywords "báo cáo, thống kê" --responses-file my_responses.json
  ```

- Reload trên server:

  ```bash
  curl -X POST http://localhost:8000/admin/reload-fallback \
       -H "Authorization: Bearer <token>"
  ```

---

## ��� Deploy

Phù hợp với Docker & docker‑compose (đã có `Dockerfile` & `docker-compose.yml` trong repo).

```bash
docker-compose up --build
```

bao gồm cả backend, frontend và nginx.

---

## ��� Mở rộng

- Thêm router mới (ví dụ API gamification, notifications…).
- (Deprecated) ban đầu có thể tích hợp OpenAI/GPT, nhưng hiện nay hệ thống chỉ dùng dataset nội bộ.
- Đồng bộ với hệ thống SIS, thêm authentication SSO.
- Chuyển tất cả sang async hoặc GraphQL.

---

## ���‍��� Đội ngũ & cống hiến

- **Minh Hệ** – kiến trúc & backend
- **Bạn** – frontend, UI/UX, dữ liệu AI ���
- …(có thể thêm tên khác nếu có)

---

## ��� Tham gia cuộc thi

Chúc bạn may mắn tại cuộc thi web! README này được tối ưu để:

- Dễ đọc, nhiều mục lục rõ ràng
- Có hướng dẫn cài đặt chạy nhanh
- Giải thích các tính năng AI nổi bật

Mẫu README kiểu “UrbanReflex” rất trực quan, có thể thêm hình chụp màn hình, icon và link demo khi cần.
