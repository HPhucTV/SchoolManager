# Security Policy

Tài liệu này mô tả chính sách bảo mật và quy trình báo cáo lỗ hổng của dự án **SchoolManager**. Bảo mật hệ thống và bảo vệ dữ liệu người dùng là ưu tiên hàng đầu của chúng tôi.

---

## Supported Versions

Chúng tôi cung cấp bản vá bảo mật cho các phiên bản sau:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Full support    |
| 0.1.x   | ⚠️ Limited support |
| < 0.1   | ❌ Not supported   |

---

## Reporting a Vulnerability

Đội ngũ SchoolManager coi trọng mọi báo cáo bảo mật. Chúng tôi đánh giá cao nỗ lực phát hiện và báo cáo có trách nhiệm của bạn.

### 🚨 Cách báo cáo lỗ hổng bảo mật

**Vui lòng KHÔNG báo cáo lỗ hổng bảo mật qua GitHub Issues công khai.**

Thay vào đó, gửi báo cáo qua email: **security@schoolmanager.id.vn**

Bạn sẽ nhận được phản hồi trong vòng **48 giờ**. Nếu không nhận được phản hồi, vui lòng gửi lại email để đảm bảo chúng tôi đã nhận được.

### 📋 Thông tin cần cung cấp trong báo cáo

Vui lòng bao gồm các thông tin sau:

- **Loại lỗ hổng** (ví dụ: SQL Injection, XSS, CSRF, Authentication Bypass, v.v.)
- **Đường dẫn file nguồn** liên quan đến lỗ hổng
- **Vị trí code bị ảnh hưởng** (branch/commit hoặc URL trực tiếp)
- **Hướng dẫn từng bước** để tái hiện lỗ hổng
- **Proof-of-concept** hoặc exploit code (nếu có thể)
- **Mức độ ảnh hưởng** và cách kẻ tấn công có thể khai thác

### 🛡️ Safe Harbor

Chúng tôi cam kết bảo vệ các nhà nghiên cứu bảo mật khi:

- Nỗ lực thiện chí tránh vi phạm quyền riêng tư, phá hủy dữ liệu hoặc gián đoạn dịch vụ
- Chỉ tương tác với tài khoản bạn sở hữu hoặc có sự đồng ý rõ ràng
- Không truy cập hệ thống vượt quá mức cần thiết để chứng minh lỗ hổng
- Không cố ý gây hại cho người dùng hoặc giảm trải nghiệm người dùng
- Không truy cập, sửa đổi hoặc xóa dữ liệu người dùng
- Không tiết lộ công khai lỗ hổng trước khi chúng tôi có cơ hội khắc phục

---

## Security Measures

### Current Security Implementations

**🔐 Authentication & Authorization:**

- JWT-based authentication cho API access
- Role-Based Access Control (RBAC) — 4 vai trò: Admin, Teacher, Student, Parent
- Password hashing bằng bcrypt với salt
- Token expiration & refresh mechanism
- Protected routes trên cả frontend và backend

**🌐 API Security:**

- CORS configuration giới hạn origins
- Input validation trên tất cả endpoints (Pydantic models)
- SQL Injection prevention qua SQLAlchemy ORM (parameterized queries)
- Request size limiting
- Error handling không lộ thông tin hệ thống

**🗄️ Data Protection:**

- Environment variables cho tất cả credentials (`.env` files)
- API keys được bảo vệ, không commit vào source code
- Dữ liệu nhạy cảm không ghi vào logs
- Database connections qua authenticated access

**🏗️ Infrastructure:**

- Docker containerization (isolation)
- Nginx reverse proxy với SSL termination
- HTTPS enforcement qua Let's Encrypt certificates
- Separate production & development configurations
- PostgreSQL với authenticated connections

### 📋 Planned Security Enhancements

- [ ] Rate limiting cho API endpoints
- [ ] API request logging & monitoring
- [ ] Enhanced input sanitization (XSS prevention)
- [ ] Security headers (CSP, HSTS, X-Frame-Options)
- [ ] Automated dependency vulnerability scanning
- [ ] Security audit logging
- [ ] Two-factor authentication (2FA)
- [ ] Session management improvements

---

## Security Best Practices for Contributors

### 🔑 Environment Variables

```
✅ Sử dụng .env.example làm template
✅ Rotate API keys định kỳ
✅ Sử dụng strong passwords trong production

❌ KHÔNG commit .env files hoặc API keys
❌ KHÔNG hardcode credentials trong source code
❌ KHÔNG log sensitive data (passwords, tokens)
```

### 💻 Code Security

- **Validate** tất cả user inputs (frontend + backend)
- **Sử dụng** parameterized queries / ORM cho database operations
- **Implement** proper error handling không lộ system information
- **Follow** principle of least privilege
- **Review** code cho security issues trước khi merge
- **Escape** output để ngăn XSS attacks

### 📦 Dependencies

- Cập nhật dependencies thường xuyên
- Review security advisories cho các packages sử dụng
- Sử dụng tools kiểm tra:
  ```bash
  # Python
  pip-audit

  # Node.js
  npm audit
  ```

### 🔧 API Development

- Implement proper authentication cho tất cả sensitive endpoints
- Sử dụng HTTPS trong production (bắt buộc)
- Validate content types và request sizes
- Log API calls cho auditing (không log sensitive data)
- Handle errors gracefully, trả về generic error messages

---

## Incident Response

### 🚨 Quy trình xử lý sự cố bảo mật

**1. Đánh giá tức thì**
   - Xác định phạm vi và mức độ ảnh hưởng
   - Ghi nhận chi tiết sự cố với timestamps
   - Xác định liệu dữ liệu người dùng có bị ảnh hưởng

**2. Cách ly & Ngăn chặn**
   - Ngừng vector tấn công nếu đang hoạt động
   - Bảo toàn bằng chứng cho điều tra
   - Triển khai biện pháp tạm thời

**3. Thông báo**
   - Thông báo cho người dùng bị ảnh hưởng nếu dữ liệu cá nhân bị xâm phạm
   - Cung cấp thông tin rõ ràng về sự việc và biện pháp xử lý
   - Cập nhật trạng thái trên GitHub và các kênh liên quan

**4. Khắc phục**
   - Sửa lỗ hổng bảo mật
   - Deploy bản vá bảo mật
   - Giám sát để phát hiện tấn công tiếp theo

**5. Rút kinh nghiệm**
   - Tiến hành review sau sự cố
   - Cập nhật quy trình bảo mật
   - Triển khai giám sát bổ sung nếu cần

---

## Security-Related Configuration

### 🚀 Production Deployment Checklist

- [ ] Tất cả mật khẩu mặc định đã thay đổi
- [ ] Environment variables được cấu hình đúng
- [ ] HTTPS enabled với chứng chỉ hợp lệ
- [ ] Database connections được mã hóa
- [ ] Các ports không cần thiết đã đóng
- [ ] Security headers được cấu hình
- [ ] Error pages không lộ thông tin hệ thống
- [ ] Logging được cấu hình không chứa sensitive data
- [ ] Backup & recovery đã được test
- [ ] `.env` files không có trong source control

### 🔧 Development Security

- [ ] Sử dụng database riêng cho development và production
- [ ] Không sử dụng production API keys trong development
- [ ] Cập nhật development dependencies thường xuyên
- [ ] Review code cho security issues trước khi merge

---

## Third-Party Security

### External APIs

| Service | Dữ liệu | Authentication |
|---------|----------|----------------|
| OpenAI API | AI Chatbot & Quiz generation | API Key |
| PostgreSQL | Toàn bộ application data | Username/Password |

### 🔍 Security Monitoring

Chúng tôi giám sát security advisories cho tất cả third-party dependencies và sẽ cập nhật tài liệu này khi có thay đổi liên quan đến bảo mật.

```bash
# Kiểm tra vulnerabilities
npm audit                    # Frontend
pip-audit                    # Backend
docker scan <image>          # Container
```

---

## Contact Information

- **Security Email**: security@schoolmanager.id.vn
- **GitHub Issues**: Chỉ cho non-security bugs
- **Response Time**: Trong vòng 48 giờ

---

## Acknowledgments

Chúng tôi cảm ơn các nhà nghiên cứu bảo mật đã báo cáo có trách nhiệm và giúp cải thiện bảo mật SchoolManager.

---

## Security Resources

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [Next.js Security Best Practices](https://nextjs.org/docs/going-to-production#security-headers)
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)

---

_Last updated: 2026-02-24_
