# Hướng dẫn Triển khai Ứng dụng AI Image Suite lên Vercel

Tài liệu này sẽ hướng dẫn bạn từng bước để triển khai ứng dụng chỉnh sửa ảnh AI này lên nền tảng Vercel một cách dễ dàng.

## Yêu cầu Chuẩn bị

Trước khi bắt đầu, hãy đảm bảo bạn đã có:

1.  **Tài khoản Vercel:** Nếu chưa có, hãy đăng ký miễn phí tại [vercel.com](https://vercel.com).
2.  **Tài khoản GitHub:** (Hoặc GitLab/Bitbucket) Vercel hoạt động tốt nhất khi được kết nối với một kho chứa Git.
3.  **API Key của Google Gemini:** Bạn có thể lấy key này từ [Google AI Studio](https://aistudio.google.com/app/apikey). Đây là yếu tố **bắt buộc** để ứng dụng có thể hoạt động.

---

## Các bước Triển khai

### Bước 1: Đưa mã nguồn lên GitHub

1.  Tạo một kho chứa (repository) mới trên GitHub.
2.  Tải toàn bộ mã nguồn của ứng dụng (bao gồm thư mục `api`, và tất cả các file `.tsx`, `.html`, `.json`...) lên kho chứa này.

### Bước 2: Kết nối Vercel với GitHub

1.  Đăng nhập vào tài khoản Vercel của bạn.
2.  Trên trang Dashboard, nhấn vào nút **"Add New..."** và chọn **"Project"**.
3.  Tìm và chọn kho chứa GitHub bạn vừa tạo ở Bước 1 và nhấn **"Import"**.

### Bước 3: Cấu hình Dự án trên Vercel

Sau khi import, Vercel sẽ hiển thị trang cấu hình. Đây là bước quan trọng nhất.

1.  **Project Name:** Vercel sẽ tự động điền tên kho chứa, bạn có thể giữ nguyên hoặc đổi tên nếu muốn.

2.  **Framework Preset:** Vercel rất thông minh và có thể sẽ tự động nhận diện đây là một dự án **Vite**. Nếu không, hãy chọn **Vite** từ danh sách.

3.  **Build and Output Settings:** Giữ nguyên các cài đặt mặc định mà Vercel đề xuất cho Vite.

4.  **Environment Variables (Biến Môi trường):**
    *   Đây là phần **quan trọng nhất** để ứng dụng của bạn hoạt động.
    *   Tìm đến mục **Environment Variables** và mở nó ra.
    *   Thêm một biến mới với thông tin sau:
        *   **Name:** `API_KEY`
        *   **Value:** Dán API Key của Google Gemini bạn đã lấy ở phần chuẩn bị vào đây.
    *   Nhấn **"Add"** để lưu lại.

    > **Lưu ý:** Vì chúng ta đang sử dụng một API route phía server để xử lý key, chúng ta **không cần** tiền tố `VITE_` nữa. Tên biến chỉ đơn giản là `API_KEY`.

### Bước 4: Triển khai

1.  Sau khi đã cấu hình xong, nhấn nút **"Deploy"**.
2.  Vercel sẽ bắt đầu quá trình build và triển khai ứng dụng của bạn. Quá trình này có thể mất vài phút.
3.  Khi hoàn tất, Vercel sẽ cung cấp cho bạn một đường dẫn (URL) để truy cập vào ứng dụng.

Chúc mừng! Ứng dụng của bạn đã được triển khai thành công và an toàn lên Vercel.

---

## Xử lý Lỗi thường gặp

*   **Lỗi `Application Error` hoặc các chức năng AI không hoạt động:**
    *   **Nguyên nhân phổ biến nhất:** Bạn đã quên thêm biến môi trường `API_KEY` hoặc dán sai key.
    *   **Cách khắc phục:** Vào dự án của bạn trên Vercel -> **Settings** -> **Environment Variables** và kiểm tra lại biến `API_KEY` đã được thêm chính xác chưa. Sau khi sửa, bạn cần triển khai lại (re-deploy) để áp dụng thay đổi.
