# TLS certificates

Không commit chứng chỉ hoặc private key vào thư mục này.

Khi chạy cấu hình Nginx hiện tại, hãy provision hai file sau bằng secret manager hoặc quy trình triển khai của môi trường:

- `certs/server.crt`
- `certs/server.key`

Nếu các file này từng được push lên remote, hãy coi private key đã bị lộ và cấp lại chứng chỉ. Xóa file khỏi commit mới không làm key cũ an toàn trở lại.
