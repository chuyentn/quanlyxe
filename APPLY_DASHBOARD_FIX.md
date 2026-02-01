# 🚨 CRITICAL FIX: Dashboard Showing 0đ

## Root Cause
Dashboard đang query từ các **database views** (`trip_financials`, `expense_summary_by_category`, `vehicle_performance`, `driver_performance`) nhưng các views này **chưa được tạo** trong Supabase.

## Fix Steps

### Option 1: Apply via Supabase Dashboard (Recommended)

1. Mở **Supabase Dashboard**: https://supabase.com/dashboard
2. Chọn project của bạn
3. Vào **SQL Editor** (menu bên trái)
4. Copy toàn bộ nội dung file: `supabase/migrations/20260130_create_dashboard_views.sql`
5. Paste vào SQL Editor
6. Click **Run** (hoặc Ctrl+Enter)
7. Kiểm tra kết quả: Phải thấy message "Success. No rows returned"

### Option 2: Apply via Supabase CLI

```bash
# Nếu đã cài Supabase CLI
supabase db push

# Hoặc apply migration cụ thể
supabase migration up --db-url "your-database-url"
```

## Verify Fix

Sau khi apply migration, làm theo các bước sau:

1. **Refresh browser** (Ctrl+R hoặc F5)
2. Vào tab **Bảng Điều Khiển**
3. Kiểm tra:
   - ✅ Tổng doanh thu phải hiển thị số tiền thực (không phải 0đ)
   - ✅ Lợi nhuận phải hiển thị số tiền thực
   - ✅ Chuyến hàng phải hiển thị số lượng
   - ✅ Biểu đồ doanh thu & lợi nhuận phải có dữ liệu
   - ✅ Cơ cấu chi phí (pie chart) phải hiển thị

## What This Migration Does

Tạo 4 database views:

1. **`trip_financials`**: View chính cho dashboard
   - Kết hợp trips với routes, vehicles, drivers, customers
   - Tính toán `total_expense` từ bảng expenses
   - Tính toán `profit` = revenue - expense
   - Tính toán `profit_margin_pct`

2. **`expense_summary_by_category`**: Phân tích chi phí theo loại
   - Dùng cho pie chart "Cơ cấu chi phí"
   - Group by category_name

3. **`vehicle_performance`**: Hiệu suất theo xe
   - Tổng doanh thu, chi phí, lợi nhuận theo xe
   - Dùng cho báo cáo "Theo Xe"

4. **`driver_performance`**: Hiệu suất theo tài xế
   - Tổng doanh thu, chi phí, lợi nhuận theo tài xế
   - Dùng cho báo cáo "Theo Tài xế" và widget "Hiệu suất tài xế"

## Troubleshooting

### Nếu vẫn thấy 0đ sau khi apply:

1. **Check data exists**:
   ```sql
   SELECT COUNT(*) FROM trips WHERE is_deleted = false;
   SELECT COUNT(*) FROM expenses WHERE is_deleted = false;
   ```

2. **Check view created**:
   ```sql
   SELECT * FROM trip_financials LIMIT 5;
   ```

3. **Clear React Query cache**:
   - Mở DevTools (F12)
   - Application tab → Storage → Clear site data
   - Refresh page

### Nếu gặp lỗi "relation does not exist":

Có thể bảng `trips` hoặc `expenses` chưa có cột cần thiết. Chạy:

```sql
-- Check trips schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'trips';

-- Check expenses schema
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'expenses';
```

## Next Steps After Fix

Sau khi dashboard hiển thị đúng, cần implement **Sprint 1 (P0)** từ audit report:

- [ ] P0-1: Auto-calculate freight_revenue
- [ ] P0-2: Auto-create fuel expense on trip complete
- [ ] P0-3: Show expense breakdown in trip detail
- [ ] P0-4: Enforce closed status lock

---

**Priority**: 🔴 P0 - CRITICAL
**Estimated Time**: 5 minutes
**Impact**: Dashboard sẽ hiển thị dữ liệu thực thay vì 0đ
