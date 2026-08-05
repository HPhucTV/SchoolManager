# ADR-001: Làm sâu backend theo vertical slice

## Trạng thái

Accepted

## Ngày

2026-08-05

## Bối cảnh

Các router FastAPI ban đầu đồng thời xử lý HTTP, phân quyền, truy vấn SQLAlchemy, transaction, response visibility, notification và chấm điểm. Cấu trúc này làm contract khó kiểm thử, dễ commit nửa chừng và khiến answer key có nguy cơ đi nhầm sang response của học sinh.

SchoolManager vẫn là modular monolith. SQLAlchemy hiện chỉ có một implementation thực tế, còn URL và JSON contract của các luồng đang được frontend sử dụng phải được giữ ổn định.

## Quyết định

Migrate backend theo từng vertical slice, bắt đầu với `coursework` và `assessment`:

- `app/routers` là HTTP adapter: nhận request, dependency, upload boundary và map application error sang HTTP.
- `app/application` cung cấp hai interface chính là `Coursework` và `Assessment`; use case, query SQLAlchemy, transaction, notification và audit nằm sau interface này.
- `app/domain` chỉ chứa policy và phép tính thuần, không phụ thuộc FastAPI hoặc SQLAlchemy.
- `app/schemas` tách request khỏi response và có response type riêng cho giáo viên/học sinh. Student response vẫn giữ trường `correct_answer: null` để tương thích contract cũ nhưng không mang answer key.
- Mỗi use case ghi dữ liệu bằng một transaction. Audit event được ghi vào bảng `audit_events` trong cùng transaction với thay đổi nghiệp vụ.
- SQLAlchemy được dùng trực tiếp trong application module. Không tạo generic repository khi chưa có database adapter thứ hai.
- Interface test gọi trực tiếp `Coursework`/`Assessment`; HTTP integration test tiếp tục bảo vệ URL, status code và JSON contract.

## Các phương án đã cân nhắc

### Generic repository cho mọi model

Từ chối vì chỉ bọc lại SQLAlchemy, tăng interface phải học nhưng không che giấu thêm nghiệp vụ và chưa có adapter thứ hai.

### Tách assessment/coursework thành microservice

Từ chối vì làm tăng deployment, transaction và observability cost trong khi domain hiện chưa cần scale độc lập.

### Giữ business logic trong router và chỉ extract helper

Từ chối vì helper rời rạc không tạo được một interface test ổn định và vẫn để transaction/error policy phân tán.

## Hệ quả

- Hai router ưu tiên không còn query hoặc commit trực tiếp; lỗi được map nhất quán qua một HTTP adapter.
- Các thay đổi create/update/submit/grade/delete của hai slice có audit trail bền vững.
- Cần chạy migration `20260805_0002` trước khi deploy code mới.
- Các domain backend chưa migrate vẫn giữ cấu trúc cũ cho đến vertical slice tương ứng; không được thêm abstraction dùng trước nhu cầu.
- Audit event cố ý không có foreign key đến user/resource để lịch sử vẫn tồn tại sau khi tài nguyên bị xóa.
