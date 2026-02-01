# ROADMAP: OPTIMIZATION & STABILITY (LỘ TRÌNH TỐI ƯU HÓA)

Để hệ thống vận hành **Ổn định (Stable)** và **Hiệu năng cao (High Performance)** về lâu dài, dưới đây là các đề xuất kỹ thuật chi tiết:

## P1. Hardening (Củng Cố Codebase) - *Ưu tiên Cao*
Hiện tại Codebase còn nhiều điểm yếu tiềm ẩn có thể gây lỗi trong tương lai.

1.  **Loại bỏ `any` (Type Safety)**
    *   **Vấn đề:** Có hơn 100 lỗi `no-explicit-any`. Điều này làm mất tác dụng của TypeScript, dễ gây crash khi data từ API thay đổi đột ngột.
    *   **Hành động:** Định nghĩa lại Interface chính xác cho `Vehicle`, `Driver` trong `types.ts`.
    *   **Lợi ích:** Code không bao giờ crash vì lỗi "undefined is not an object".

2.  **Toàn vẹn Dữ liệu (Soft Delete Logic)**
    *   **Vấn đề:** Logic xóa mềm (`is_deleted`) chưa đồng bộ ở tất cả các bảng (User, Route...).
    *   **Hành động:** Review lại tất cả Hook `useDelete...` đảm bảo append suffix (ví dụ `_del_timestamp`) vào các trường Unique (như Biển số, CCCD) để user có thể tạo lại data mới trùng mã cũ.

## P2. Performance (Tăng Tốc Độ) - *Ưu tiên Trung bình*
App hiện tại tải file `index.js` nặng **2.16MB**. Điều này khiến lần mở đầu tiên rất chậm trên mạng 3G/4G.

1.  **Code Splitting (Lazy Loading)**
    *   **Giải pháp:** Dùng `React.lazy()` cho các trang ít dùng (Reports, Settings, Dispatch).
    *   **Hiệu quả:** Giảm Initial Bundle xuống < 500KB. App tải nhanh gấp 4 lần.

2.  **Caching Strategy (TanStack Query)**
    *   **Giải pháp:** Tăng `staleTime` lên 5 phút cho các dữ liệu ít thay đổi (Danh sách xe, Loại xe).
    *   **Hiệu quả:** "F5" siêu tốc, chuyển tab mượt mà không hiện Spinner.

## P3. Monitoring (Giám Sát Tự Động) - *Dài Hạn*
Để không cần User báo mới biết lỗi.

1.  **Error Tracking (Sentry)**
    *   Tích hợp Sentry để tự động bắt lỗi JS/API ở phía người dùng và gửi thông báo về Email dev.
2.  **Graceful Error Handling**
    *   Thay màn hình "Trắng Xóa" (Crash) bằng "Error Boundary" thân thiện có nút "Thử lại".

## Tóm tắt Kế hoạch Hành động (Action Plan)
1.  **Tuần này:** Fix hết 100 lỗi Lint `any` (Clean Code).
2.  **Tuần sau:** Cấu hình `React.lazy` để chia nhỏ file build.
3.  **Tháng tới:** Viết thêm Test cho luồng "Tạo Chuyến" (Luồng phức tạp nhất).
