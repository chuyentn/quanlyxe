## 🎯 HƯỚNG DẪN THÊM DATA MỚI VÀ KIỂM TRA CỤ THỂ

**Status:** Database đã sạch hoàn toàn ✅ - Tất cả 12 bảng dữ liệu trống

---

## 📋 Thứ Tự Thêm Data (Tuân Thủ Foreign Keys)

### **Phase 1: Dữ Liệu Cơ Sở (Master Data)**
Thêm những dữ liệu này **trước tiên** vì chúng không phụ thuộc vào bất kỳ bảng nào

1. **👤 Khách Hàng (Customers)** - Tab: "Khách hàng"
   - Thêm ít nhất 3-5 khách hàng
   - Các trường bắt buộc: Mã KH, Tên KH, MST, Điện thoại, Email
   - Ví dụ: KH-001, KH-002, KH-003

2. **🚗 Xe (Vehicles)** - Tab: "Đội xe"
   - Thêm ít nhất 3-5 xe
   - Các trường bắt buộc: Mã xe, Biển số, Loại xe, Trạng thái (active)
   - Trạng thái PHẢI là "active" để dùng trong chuyến hàng
   - Ví dụ: XE-001 (29A-123.45), XE-002 (29A-456.78)

3. **👨 Tài Xế (Drivers)** - Tab: "Tài xế"
   - Thêm ít nhất 3-5 tài xế
   - Các trường bắt buộc: Mã TX, Tên TX, CMND, Điện thoại, Trạng thái (active)
   - Trạng thái PHẢI là "active" để gán vào chuyến hàng
   - Ví dụ: TX-001, TX-002, TX-003

4. **🛣️ Tuyến Đường (Routes)** - Tab: "Tuyến đường"
   - Thêm ít nhất 3-5 tuyến
   - Các trường bắt buộc: Mã tuyến, Điểm đi, Điểm đến, Quãng đường (km), Chi phí cơ sở
   - Ví dụ: T-001 (Hà Nội → HCM, 1600km)

### **Phase 2: Dữ Liệu Giao Dịch (Transactional Data)**
Thêm sau khi hoàn thành Phase 1 vì chúng tham chiếu đến master data

5. **📦 Chuyến Hàng (Trips)** - Tab: "Chuyến hàng"
   - Thêm ít nhất 5-10 chuyến hàng
   - Chọn từ: Khách hàng (bạn vừa thêm), Xe (active), Tài xế (active), Tuyến (bạn vừa thêm)
   - Status: "completed" (để hiển thị trong báo cáo)
   - **🔴 CHÚ Ý:** Chỉ có thể chọn xe và tài xế với status = "active"
   - Mã chuyến tự động: CH-202601-XXXXX (UUID)

6. **💰 Chi Phí (Expenses)** - Tab: "Chi phí"
   - Thêm chi phí cho các chuyến hàng (xăng, cầu phí, sửa chữa, etc.)
   - Chọn chuyến hàng từ danh sách
   - Status: "confirmed" (để được tính vào báo cáo)
   - Các loại chi phí: xăng, cầu phí, sửa chữa, khác, etc.

7. **🔧 Bảo Trì (Maintenance)** - Tab: "Bảo trì"
   - Thêm các bản ghi bảo trì cho xe
   - Chọn xe từ danh sách
   - Loại dịch vụ, chi phí

---

## ✅ KIỂM TRA CHI TIẾT TỪng TAB

### **Tab 1: Dashboard** 📊
- [ ] Xem tổng số xe, tài xế, chuyến hàng
- [ ] Xem doanh thu tháng này (từ chuyến completed)
- [ ] Xem biểu đồ chi phí theo loại
- [ ] Xem top 5 tài xế, xe có lợi nhuận cao

**FIX cần kiểm tra:** Dữ liệu phải từ database, không phải hardcoded ✅ (đã xóa hết demo data)

---

### **Tab 2: Đội xe (Vehicles)** 🚗
- [ ] Thêm mới: Các trường hiển thị đúng
- [ ] Kiểm tra trạng thái: "active", "maintenance", "inactive"
- [ ] Chỉnh sửa: Thay đổi trạng thái thành "maintenance"
- [ ] Xóa: Soft delete (is_deleted = true, không xóa vật lý)
- [ ] Tìm kiếm: Lọc theo mã xe, biển số

**FIX cần kiểm tra:**
- ✅ Chỉ xe "active" được chọn trong Trips
- Số nhận dạng, biển số unique (không trùng)
- Lệnh RLS: Chỉ user login được xem xe của công ty

---

### **Tab 3: Tài Xế (Drivers)** 👨
- [ ] Thêm mới: Các trường hiển thị đúng
- [ ] Kiểm tra trạng thái: "active", "on_leave", "inactive"
- [ ] Chỉnh sửa: Thay đổi trạng thái thành "on_leave"
- [ ] Xóa: Soft delete
- [ ] Tìm kiếm: Lọc theo mã, tên, CMND

**FIX cần kiểm tra:**
- ✅ Chỉ tài xế "active" xuất hiện trong dropdown Trips (useActiveDrivers hook)
- CMND, điện thoại validation
- Gán xe (assigned_vehicle)

---

### **Tab 4: Tuyến Đường (Routes)** 🛣️
- [ ] Thêm mới: Nhập quãng đường (km), chi phí cơ sở
- [ ] Kiểm tra: Các trường số (distance, cost) tính đúng
- [ ] Chỉnh sửa: Cập nhật quãng đường, chi phí
- [ ] Xóa: Soft delete
- [ ] Tìm kiếm: Lọc theo tên tuyến

**FIX cần kiểm tra:**
- Validation: Quãng đường > 0
- Chi phí >= 0
- Điểm đi/đến required

---

### **Tab 5: Khách Hàng (Customers)** 👥
- [ ] Thêm mới: Toàn bộ thông tin
- [ ] Kiểm tra: MST (Mã số thuế) định dạng đúng
- [ ] Chỉnh sửa: Cập nhật tên, MST, điện thoại
- [ ] Xóa: Soft delete
- [ ] Tìm kiếm: Lọc theo mã, tên, MST

**FIX cần kiểm tra:**
- MST unique (không trùng)
- Email format validation
- Điện thoại format validation

---

### **Tab 6: Chuyến Hàng (Trips)** 📦
- [ ] Thêm mới: Chọn Khách, Xe (active), Tài xế (active), Tuyến
- [ ] Kiểm tra: Mã chuyến tự động format CH-YYYYMM-XXXXX ✅

**FIX cần kiểm tra:**
- ✅ Mã chuyến sinh theo UUID (CH-202601-XXXXX) không trùng
- ✅ Chỉ cho chọn xe "active" (vehicle status check)
- ✅ Chỉ tài xế "active" xuất hiện trong dropdown
- ✅ Mã chuyến sinh tự động, không thêm thủ công
- Status workflow: draft → confirmed → dispatched → in_progress → completed
- Ngày khởi hành, dự kiến thời gian hợp lý

---

### **Tab 7: Điều Phối (Dispatch)** 📅
- [ ] Xem lịch các chuyến hàng theo ngày
- [ ] Kiểm tra: Hiển thị đúng ngày khởi hành

**FIX cần kiểm tra:**
- ✅ Trường departure_date (đã sửa từ planned_departure)
- Hiển thị múi giờ đúng
- Kéo thả chuyến (nếu có)

---

### **Tab 8: Chi Phí (Expenses)** 💰
- [ ] Thêm mới: Chọn chuyến hàng, nhập chi phí
- [ ] Status: "confirmed" (để tính vào báo cáo), "draft", "cancelled"
- [ ] Kiểm tra: Phân bổ chi phí (nếu chia sẻ với chuyến khác)

**FIX cần kiểm tra:**
- Chi phí chỉ tính vào báo cáo nếu status = "confirmed"
- Phân bổ (allocation) đúng khi có nhiều chuyến
- Tổng phân bổ = tổng chi phí

---

### **Tab 9: Bảo Trì (Maintenance)** 🔧
- [ ] Thêm mới: Chọn xe, loại dịch vụ, chi phí
- [ ] Kiểm tra: Ngày bảo trì hợp lý
- [ ] Khi bảo trì: Xe status tự động → "maintenance"

**FIX cần kiểm tra:**
- Chỉ chọn xe "active" được
- Status xe tự động cập nhật

---

### **Tab 10: Báo Cáo (Reports)** 📊
**QUAN TRỌNG NHẤT** - Kiểm tra tất cả số liệu từ database thực tế

- [ ] **KPI Cards:**
  - Tổng doanh thu: Từ sum(trip_financials.total_revenue)
  - Tổng chi phí: Từ sum(trip_financials.total_expense)
  - Lợi nhuận ròng: revenue - expense
  - Biên lợi nhuận: (profit / revenue) * 100%
  
- [ ] **Trends:**
  - So sánh vs tháng trước: Động từ getExpenseTrend()
  - Mũi tên up/down theo xu hướng ✅ (đã xóa hardcoded 12.5%, 18.3%)

- [ ] **Charts:**
  - Xu hướng doanh thu 6 tháng
  - Lợi nhuận theo xe (top 5)
  - Chi phí theo loại
  - Lợi nhuận theo tài xế
  - Lợi nhuận theo tuyến
  - Lợi nhuận theo khách hàng

**🔴 QUAN TRỌNG:** Nếu không có trip với status="completed" → tất cả số liệu = 0 ₫
```
Tổng doanh thu: 0 ₫ (vì trip_financials trống)
Tổng chi phí: 0 ₫
Lợi nhuận: 0 ₫
Biên lợi nhuận: 0%
```

---

## 📝 Quy Trình Kiểm Tra Chi Tiết

### **Bước 1: Thêm Master Data (15-20 phút)**
```
1. Mở Tab "Khách hàng" → Thêm 3-5 khách hàng
2. Mở Tab "Đội xe" → Thêm 3-5 xe (status=active)
3. Mở Tab "Tài xế" → Thêm 3-5 tài xế (status=active)
4. Mở Tab "Tuyến đường" → Thêm 3-5 tuyến đường
```

### **Bước 2: Thêm Transaction Data (20-30 phút)**
```
5. Mở Tab "Chuyến hàng" → Thêm 5-10 chuyến (status=completed)
   - Kiểm tra: Mã chuyến là CH-202601-XXXXX ✅
   - Kiểm tra: Chỉ còn xe/tài xế active được chọn ✅
6. Mở Tab "Chi phí" → Thêm 10-15 chi phí (status=confirmed)
7. Mở Tab "Bảo trì" → Thêm 2-3 bản ghi bảo trì
```

### **Bước 3: Kiểm Tra Từng Tab (30-40 phút)**
```
8. Tab "Dashboard" → Xem dữ liệu hiển thị đúng
9. Tab "Đội xe" → Kiểm tra CRUD, soft delete, status
10. Tab "Tài xế" → Kiểm tra CRUD, filter active
11. Tab "Tuyến đường" → Kiểm tra CRUD
12. Tab "Khách hàng" → Kiểm tra CRUD
13. Tab "Chuyến hàng" → Kiểm tra mã sinh, constraints
14. Tab "Điều phối" → Kiểm tra lịch hiển thị đúng
15. Tab "Chi phí" → Kiểm tra phân bổ
16. Tab "Bảo trì" → Kiểm tra status xe tự động
17. Tab "Báo cáo" → KIỂM TRA TOÀN BỘ SỐ LIỆU
```

---

## 🎯 Các Lỗi Cần Tìm & FIX

| Lỗi | Cách Kiểm Tra | Status |
|-----|---------------|--------|
| Mã chuyến không tự động sinh | Thêm chuyến, xem mã field | ✅ Fixed |
| Mã chuyến bị trùng | Thêm 10 chuyến, xem có trùng | ✅ Fixed |
| Chỉnh sửa chuyến mà xe không active | Đổi xe status → maintenance, thử thêm chuyến | ✅ Fixed |
| Dropdown tài xế hiển thị on_leave | Xem danh sách tài xế | ✅ Fixed |
| Dispatch không hiển thị chuyến | Xem lịch dispatch | 🔄 Need Test |
| Báo cáo hiển thị 0 khi có data | Thêm trip → xem báo cáo | ✅ Demo Removed |
| Chi phí không tính vào báo cáo | Thêm expense status=draft → xem báo cáo | 🔄 Need Test |
| Phân bổ chi phí sai tổng | Thêm expense, phân bổ, kiểm tra tổng | 🔄 Need Test |

---

## 🎉 HOÀN THÀNH KHI:

- ✅ Tất cả 12 bảng dữ liệu trống
- ✅ Đã xóa hết demo data hardcoded (12.5%, 18.3%)
- ✅ Đã sửa 5 critical bugs:
  1. Trip code generation (UUID format)
  2. Dispatch field mismatch (departure_date)
  3. Driver filtering (useActiveDrivers)
  4. Vehicle validation (status check)
  5. Reports demo data (removed)
- ✅ App sẵn sàng cho real data testing
- ✅ Build compile clean (2619 modules, 12.68s)

**Next: Thêm fresh data và kiểm tra từng tab!** 🚀
