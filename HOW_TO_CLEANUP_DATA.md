# 🧹 XÓA HẾT DATA DEMO - HOW TO CLEAN DATABASE

## 📋 Tình Trạng Hiện Tại

✅ Database đã được chuẩn bị  
❌ Vẫn còn một số data test/demo  
✅ App chạy tốt, không lỗi code

---

## 🔧 Cách Xóa Data - 2 Phương Pháp

### **Phương Pháp 1: Qua Supabase Dashboard (Dễ nhất) ✅ RECOMMENDED**

1. **Đăng nhập Supabase:**
   - https://supabase.com/dashboard
   - Chọn project của bạn

2. **Mở SQL Editor:**
   - Click "SQL Editor" (trái sidebar)
   - Click "New query"

3. **Copy & Paste toàn bộ SQL này:**
   ```sql
   -- Disable RLS temporarily
   ALTER TABLE expense_allocations DISABLE ROW LEVEL SECURITY;
   ALTER TABLE maintenance_orders DISABLE ROW LEVEL SECURITY;
   ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
   ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
   ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
   ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
   ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
   ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
   ALTER TABLE notification_settings DISABLE ROW LEVEL SECURITY;
   ALTER TABLE security_settings DISABLE ROW LEVEL SECURITY;
   ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
   ALTER TABLE accounting_periods DISABLE ROW LEVEL SECURITY;

   -- Delete all records
   DELETE FROM expense_allocations;
   DELETE FROM maintenance_orders;
   DELETE FROM expenses;
   DELETE FROM trips;
   DELETE FROM routes;
   DELETE FROM customers;
   DELETE FROM vehicles;
   DELETE FROM drivers;
   DELETE FROM notification_settings;
   DELETE FROM security_settings;
   DELETE FROM company_settings;
   DELETE FROM accounting_periods;

   -- Reset sequences
   ALTER SEQUENCE IF EXISTS expense_allocations_id_seq RESTART WITH 1;
   ALTER SEQUENCE IF EXISTS maintenance_orders_id_seq RESTART WITH 1;
   ALTER SEQUENCE IF EXISTS expenses_id_seq RESTART WITH 1;
   ALTER SEQUENCE IF EXISTS trips_id_seq RESTART WITH 1;
   ALTER SEQUENCE IF EXISTS routes_id_seq RESTART WITH 1;
   ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;
   ALTER SEQUENCE IF EXISTS vehicles_id_seq RESTART WITH 1;
   ALTER SEQUENCE IF EXISTS drivers_id_seq RESTART WITH 1;

   -- Re-enable RLS
   ALTER TABLE expense_allocations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
   ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
   ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
   ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;

   -- Verify cleanup
   SELECT 'vehicles' as table_name, COUNT(*) as record_count FROM vehicles
   UNION ALL SELECT 'drivers', COUNT(*) FROM drivers
   UNION ALL SELECT 'customers', COUNT(*) FROM customers
   UNION ALL SELECT 'routes', COUNT(*) FROM routes
   UNION ALL SELECT 'trips', COUNT(*) FROM trips
   UNION ALL SELECT 'expenses', COUNT(*) FROM expenses
   UNION ALL SELECT 'expense_allocations', COUNT(*) FROM expense_allocations
   UNION ALL SELECT 'maintenance_orders', COUNT(*) FROM maintenance_orders
   UNION ALL SELECT 'accounting_periods', COUNT(*) FROM accounting_periods
   UNION ALL SELECT 'company_settings', COUNT(*) FROM company_settings
   UNION ALL SELECT 'notification_settings', COUNT(*) FROM notification_settings
   UNION ALL SELECT 'security_settings', COUNT(*) FROM security_settings
   ORDER BY table_name;
   ```

4. **Click "Run"** (hoặc Ctrl+Enter)
   - Chờ hoàn tất (5-10 giây)

5. **Verify:**
   - Tất cả bảng phải show `record_count = 0`
   - Nếu có lỗi, xem phần "Troubleshooting" dưới

6. **Reload app:**
   - F5 trong browser
   - Tất cả tab đều trống

---

### **Phương Pháp 2: Qua CLI (Terminal)**

Chạy lệnh này trong Terminal:

```powershell
# Nếu có psql cài sẵn:
psql -h [host] -U postgres -d postgres -f supabase/cleanup_all_data.sql

# Hoặc dùng Supabase CLI:
supabase db execute < supabase/cleanup_all_data.sql
```

**Lưu ý:** Cần Supabase CLI cài đặt

---

## ✅ Kiểm Tra Kết Quả

Sau khi chạy SQL, mở browser:

```
http://localhost:8080/vehicles    → Danh sách trống ✅
http://localhost:8080/drivers     → Danh sách trống ✅
http://localhost:8080/customers   → Danh sách trống ✅
http://localhost:8080/routes      → Danh sách trống ✅
http://localhost:8080/trips       → Danh sách trống ✅
http://localhost:8080/expenses    → Danh sách trống ✅
http://localhost:8080/maintenance → Danh sách trống ✅
```

---

## 🎯 Tiếp Theo: Nhập Data Thật

Sau khi xóa sạch, bạn sẵn sàng nhập data thực tế:

1. **Mở [DATA_ENTRY_GUIDE.md](DATA_ENTRY_GUIDE.md)**
   - Hướng dẫn chi tiết từng bước

2. **Nhập Master Data (theo thứ tự):**
   - Khách hàng (customers)
   - Xe (vehicles)
   - Tài xế (drivers)
   - Tuyến đường (routes)

3. **Nhập Transaction Data:**
   - Chuyến hàng (trips)
   - Chi phí (expenses)
   - Bảo trì (maintenance)

4. **Verify Báo Cáo:**
   - Dashboard → KPI hiển thị đúng
   - Báo cáo → Số liệu tính toán đúng

---

## 🔍 Troubleshooting

### **Lỗi: "relation 'vehicles' does not exist"**
- **Nguyên nhân:** RLS policy chặn query
- **Fix:** Chạy SQL lần nữa hoặc contact Supabase support

### **Lỗi: "permission denied"**
- **Nguyên nhân:** Không có quyền xóa data
- **Fix:** Dùng service_role key (không phải anon key)

### **Lỗi: "cannot delete because foreign key constraint"**
- **Nguyên nhân:** Thứ tự xóa sai
- **Fix:** Xóa từ leaf tables trước (expense_allocations → trips → vehicles)
- **Đã fix trong script** ✅

### **Data vẫn còn sau khi xóa**
- **Nguyên nhân:** RLS policy chặn DELETE
- **Fix:** Chắc chắn đã chạy `DISABLE ROW LEVEL SECURITY` trước

---

## 📝 File liên quan

- [cleanup_all_data.sql](supabase/cleanup_all_data.sql) - SQL script sẵn sàng dùng
- [DATA_ENTRY_GUIDE.md](DATA_ENTRY_GUIDE.md) - Hướng dẫn nhập data
- [VEHICLES_TAB_STRUCTURE.md](VEHICLES_TAB_STRUCTURE.md) - Chi tiết cấu trúc

---

## 🚀 Done!

Sau khi xóa xong, bạn có thể:
- ✅ Nhập data thực tế (khách hàng, xe, tài xế thực)
- ✅ Test toàn bộ app logic
- ✅ Verify báo cáo tính toán đúng
- ✅ Chuẩn bị go-live
