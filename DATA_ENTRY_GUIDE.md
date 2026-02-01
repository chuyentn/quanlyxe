# 📋 HƯỚNG DẪN NHẬP LIỆU CHUẨN - FLEET MANAGEMENT SYSTEM

**Status:** Database trống sạch, sẵn sàng nhập data mới  
**Ngày:** 27-01-2026  
**Mục tiêu:** Data chuẩn từ người dùng nhập liệu + tính toán theo công thức tùy chỉnh

---

## 🎯 TRIẾT LÝ NHẬP LIỆU

```
┌─────────────────────────────────────────────────────────┐
│ MASTER DATA (Nhập 1 lần)                                │
│ ├─ Khách hàng                                           │
│ ├─ Xe (vehicles)                                        │
│ ├─ Tài xế (drivers)                                     │
│ └─ Tuyến đường (routes)                                 │
└─────────────────────────────────────────────────────────┘
            ↓ (Liên kết qua Foreign Key)
┌─────────────────────────────────────────────────────────┐
│ TRANSACTION DATA (Nhập từng ngày/chuyến)               │
│ ├─ Chuyến hàng (trips) - tự động sinh mã               │
│ ├─ Chi phí (expenses) - phân bổ tự động                │
│ └─ Bảo trì (maintenance) - tự động cập nhật status     │
└─────────────────────────────────────────────────────────┘
            ↓ (Tự động tính toán)
┌─────────────────────────────────────────────────────────┐
│ CALCULATED METRICS (Tính theo công thức người dùng)    │
│ ├─ Doanh thu/chuyến = Giá nhập + Commission tùy chỉnh  │
│ ├─ Lợi nhuận = Doanh thu - Chi phí (theo công thức)   │
│ ├─ Biên lợi nhuận = Lợi nhuận/Doanh thu (%)           │
│ └─ KPI Tài xế/Xe = Aggregate theo thông số tùy chỉnh   │
└─────────────────────────────────────────────────────────┘
            ↓
┌─────────────────────────────────────────────────────────┐
│ REPORTS (Tự động từ dữ liệu nhập)                      │
│ ├─ Báo cáo tài chính                                    │
│ ├─ Phân tích hiệu suất                                  │
│ └─ Xu hướng vs tháng trước (tự động)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 HƯỚNG DẪN NHẬP LIỆU BƯỚC TỪ BƯỚC

### **BƯỚC 1: CẤU HÌNH CÔNG TY & THAM SỐ** (Cấu hình 1 lần)

**Vào Tab: Settings → Company Settings**

Định nghĩa:
- ✅ **Tên công ty**
- ✅ **Mã số thuế (MST)**
- ✅ **Địa chỉ trụ sở**
- ✅ **Người liên hệ**
- ✅ **Số điện thoại**

**CẤU HÌNH CÔNG THỨC TÍNH TOÁN** (QUAN TRỌNG):

Tạo các tham số tùy chỉnh:

```
📊 CÔNG THỨC DOANH THU:
  □ Base Price (Giá cơ sở/km): VD: 50,000₫/km
  □ Commission Rate: VD: 10% doanh thu
  □ Surcharge Factor: VD: 1.2x khi quá 1000km
  □ Premium Service: VD: +500,000₫ nếu chọn

📊 CÔNG THỨC CHI PHÍ:
  □ Fuel Cost/km: VD: 15,000₫/km
  □ Maintenance % of Revenue: VD: 5% doanh thu
  □ Insurance % of Revenue: VD: 2% doanh thu
  □ Toll/Fixed Cost per Trip: VD: 200,000₫

📊 KPI TÀI XẾ:
  □ Bonus per Trip: VD: 100,000₫
  □ Bonus if Profit > 1M: VD: +500,000₫
  □ Penalty if Late: VD: -50,000₫

📊 KPI XE:
  □ Maintenance Interval: VD: 5,000km
  □ Depreciation Rate: VD: 2%/tháng
  □ Utilization Target: VD: 80% ngày/tháng
```

---

### **BƯỚC 2: NHẬP MASTER DATA** (Nhập 1 lần, có thể sửa sau)

#### **A. Tab "Khách hàng" (Customers)**

**Bấm:** Add New → Nhập thông tin

```
✅ Mã khách hàng (Customer Code):  [KH-001]
✅ Tên khách hàng:                  [Công ty ABC]
✅ Mã số thuế (Tax ID):             [0123456789]
✅ Địa chỉ:                         [123 Đường X, Quận Y]
✅ Điện thoại liên hệ:              [0912-345-678]
✅ Email:                           [contact@abc.com]
✅ Tên người đại diện:              [Nguyễn Văn A]
✅ Số điện thoại người đại diện:    [0912-111-222]
✅ Tín dụng tối đa:                 [100,000,000₫]
✅ Kỳ thanh toán:                   [30 ngày]
```

**Nhập ít nhất:** 3-5 khách hàng (để có dữ liệu test)

---

#### **B. Tab "Đội xe" (Vehicles)**

**Bấm:** Add New → Nhập thông tin

```
✅ Mã xe:                   [XE-001]
✅ Loại xe:                 [Tải 5 tấn / Tải 10 tấn / etc]
✅ Biển số:                 [29A-123.45]
✅ Năm sản xuất:            [2022]
✅ Hãng sản xuất:           [Hino / Hyundai / etc]
✅ Số ghế:                  [2]
✅ Tải trọng (Tấn):         [5]
✅ Giá mua (₫):             [500,000,000]
✅ Trạng thái:              [active] ← PHẢI là "active" để dùng!
✅ Ghi chú:                 [Xe mới, tình trạng tốt]

⚠️  QUAN TRỌNG:
   - Chỉ xe "active" mới có thể dùng trong chuyến hàng
   - Status "maintenance" → xe không khả dụng tạm thời
   - Status "inactive" → xe bị loại khỏi dịch vụ
```

**Nhập ít nhất:** 3-5 xe (status=active)

---

#### **C. Tab "Tài xế" (Drivers)**

**Bấm:** Add New → Nhập thông tin

```
✅ Mã tài xế:               [TX-001]
✅ Tên tài xế:              [Trần Văn B]
✅ Ngày sinh:               [01/05/1980]
✅ CMND:                     [012345678]
✅ Số điện thoại:           [0987-654-321]
✅ Email:                   [driver@email.com]
✅ Địa chỉ thường trú:      [456 Đường Z, Quận X]
✅ Bằng lái xe:             [Hạng B]
✅ Ngày cấp:                [01/01/2020]
✅ Ngày hết hạn:            [01/01/2030]
✅ Trạng thái:              [active] ← PHẢI là "active"!
✅ Ghi chú:                 [Kinh nghiệm 10 năm, lái an toàn]

⚠️  QUAN TRỌNG:
   - Chỉ tài xế "active" mới xuất hiện trong dropdown Trips
   - Status "on_leave" → tạm thời không thể gán chuyến
   - Status "inactive" → bị loại khỏi hệ thống
```

**Nhập ít nhất:** 3-5 tài xế (status=active)

---

#### **D. Tab "Tuyến đường" (Routes)**

**Bấm:** Add New → Nhập thông tin

```
✅ Mã tuyến:                [T-001]
✅ Điểm đi:                 [Hà Nội]
✅ Điểm đến:                [HCM]
✅ Quãng đường (km):        [1600] ← Số dương
✅ Thời gian dự kiến (h):   [24]
✅ Chi phí cơ sở (₫):       [2,000,000] ← Giá cầu phí, lệ phí
✅ Mô tả:                   [Tuyến chính, thường xuyên]

⚠️  CÔNG THỨC:
   - Doanh thu/km = Quãng đường × Base Price (từ Company Settings)
   - Chi phí = Chi phí cơ sở + (Quãng đường × Fuel Cost/km)
   - Lợi nhuận = Doanh thu - Chi phí
```

**Nhập ít nhất:** 3-5 tuyến (ở Việt Nam hoặc test data)

---

### **BƯỚC 3: NHẬP TRANSACTION DATA** (Hàng ngày/tuần)

#### **A. Tab "Chuyến hàng" (Trips)**

**Bấm:** Add New → Nhập thông tin

```
✅ Mã chuyến:               [Tự động: CH-202601-XXXXX]
✅ Khách hàng:              [Chọn từ dropdown: Công ty ABC]
✅ Xe:                      [Chọn xe ACTIVE từ dropdown: XE-001]
✅ Tài xế:                  [Chọn tài xế ACTIVE từ dropdown: TX-001]
✅ Tuyến:                   [Chọn từ dropdown: Hà Nội → HCM]
✅ Ngày khởi hành:          [27/01/2026]
✅ Thời gian dự kiến (h):   [24]
✅ Mô tả hàng:              [200 tấn gạo]
✅ Trạng thái:              [Chọn: draft → confirmed → dispatched → in_progress → completed]

⚠️  WORKFLOW:
   1. Nhập → Status = "draft"
   2. Xác nhận → Status = "confirmed"
   3. Phân công xe/tài xế → Status = "dispatched"
   4. Chạy chuyến → Status = "in_progress"
   5. Hoàn tất → Status = "completed" ← Mới được tính vào báo cáo!

🔴 CHÚ Ý:
   - Chỉ xe/tài xế "active" được chọn
   - Mã chuyến tự động sinh, KHÔNG sửa thủ công
   - PHẢI đổi status thành "completed" để tính vào doanh thu
```

**Nhập ít nhất:** 5-10 chuyến (ít nhất 1-2 có status=completed)

---

#### **B. Tab "Chi phí" (Expenses)**

**Bấm:** Add New → Nhập thông tin

```
✅ Chuyến hàng:             [Chọn: CH-202601-XXXXX]
✅ Loại chi phí:            [Chọn: Xăng dầu / Cầu phí / Sửa chữa / Khác]
✅ Mô tả:                   [Chi tiết: Xăng 200L @ 15,000/L]
✅ Số tiền (₫):             [3,000,000]
✅ Trạng thái:              [Chọn: draft / confirmed / cancelled]
✅ Ghi chú:                 [Hóa đơn: HĐ-2026-001]

⚠️  CÔNG THỨC:
   - Chi phí chỉ tính vào báo cáo nếu status = "confirmed"
   - Nếu 1 chi phí dùng cho 2 chuyến → Phân bổ 50/50
   - Total chi phí = Tổng tất cả chi phí confirmed

📊 TỰ ĐỘNG TÍNH TOÁN:
   - Lợi nhuận/chuyến = Doanh thu - Chia sẻ chi phí
   - Biên lợi nhuận = Lợi nhuận / Doanh thu (%)
```

**Nhập ít nhất:** 5-10 chi phí (cho 5-10 chuyến)

---

#### **C. Tab "Bảo trì" (Maintenance)**

**Bấm:** Add New → Nhập thông tin

```
✅ Xe:                      [Chọn: XE-001]
✅ Ngày bảo trì:            [27/01/2026]
✅ Loại dịch vụ:            [Chọn: Bảo dưỡng / Sửa chữa / Nâng cấp]
✅ Mô tả:                   [Thay dầu, kiểm tra phanh]
✅ Chi phí (₫):             [500,000]
✅ Kỹ thuật viên:           [Tên người bảo trì]
✅ Ghi chú:                 [Xe sẽ bảo trì 2-3 ngày]

⚠️  TỰ ĐỘNG:
   - Khi tạo bảo trì → Xe status tự động → "maintenance"
   - Xe không thể dùng cho chuyến mới
   - Admin phải đổi status → "active" khi xong bảo trì
```

**Nhập ít nhất:** 2-3 bản ghi (để test workflow)

---

### **BƯỚC 4: KIỂM TRA KẾT QUẢ** (Sau khi nhập data)

#### **Dashboard (Tab đầu tiên)**

```
Kiểm tra có hiển thị:
✅ Tổng số xe
✅ Tổng số tài xế
✅ Tổng chuyến hàng (trong tháng)
✅ Doanh thu (tháng này) = Tính từ chuyến completed
✅ Biểu đồ chi phí theo loại
✅ Top 5 tài xế có lợi nhuận cao

❌ Nếu hiển thị 0 → Kiểm tra:
   - Chuyến có status = "completed" chưa?
   - Chi phí có status = "confirmed" chưa?
   - Dữ liệu có liên kết đúng (FK) chưa?
```

#### **Reports (Tab cuối cùng)**

```
Kiểm tra có hiển thị:
✅ KPI Cards: Tổng doanh thu, Chi phí, Lợi nhuận, Biên lợi nhuận
✅ Trend: So sánh vs tháng trước (% thay đổi)
✅ Chart doanh thu 6 tháng
✅ Profit by Vehicle (top 5)
✅ Profit by Driver (top 5)

❌ Nếu hiển thị 0 → Nguyên nhân:
   - Không có trip nào với status = "completed"
   - Không có expense nào với status = "confirmed"
   - Dữ liệu chưa được lưu đúng
```

---

## 🔧 CẤU HÌNH TÙYCHỈNH CÔNG THỨC

### **Hiện tại có thể tùy chỉnh:**

**1. Company Settings (Toàn công ty)**
```sql
Lưu trữ ở bảng: company_settings
Các trường:
- base_price_per_km: Giá doanh thu mặc định
- fuel_cost_per_km: Chi phí xăng
- commission_rate: Tỷ lệ hoa hồng
- insurance_percentage: % bảo hiểm
- maintenance_percentage: % bảo dưỡng
```

**2. Tính toán trong Materialized Views**
```sql
View: trip_financials
Công thức:
  - revenue = distance × base_price + surcharges
  - expense = fuel_cost + toll_cost + allocated_expenses
  - profit = revenue - expense
  - profit_margin = (profit / revenue) × 100
```

**3. KPI theo tài xế/xe**
```sql
View: driver_performance
View: vehicle_performance
Tính: total_profit, trip_count, profit_margin
```

---

## ✅ CHECKLIST NHẬP LIỆU HOÀN CHỈNH

### **Data Entry Completion**

- [ ] **Company Settings** - Cấu hình tham số
  - [ ] Tên công ty
  - [ ] Base price, Fuel cost, Commission rate
  - [ ] Các công thức tính toán

- [ ] **Master Data - Khách hàng** 
  - [ ] ≥ 3 khách hàng
  - [ ] Tất cả thông tin đầy đủ

- [ ] **Master Data - Xe**
  - [ ] ≥ 3 xe
  - [ ] Tất cả có status = "active"
  - [ ] Thông tin kỹ thuật đầy đủ

- [ ] **Master Data - Tài xế**
  - [ ] ≥ 3 tài xế
  - [ ] Tất cả có status = "active"
  - [ ] Bằng lái còn hạn

- [ ] **Master Data - Tuyến đường**
  - [ ] ≥ 3 tuyến
  - [ ] Quãng đường và chi phí hợp lý

- [ ] **Transaction Data - Chuyến hàng**
  - [ ] ≥ 5 chuyến
  - [ ] ≥ 1-2 chuyến có status = "completed"
  - [ ] Mã chuyến tự động sinh đúng format

- [ ] **Transaction Data - Chi phí**
  - [ ] ≥ 5 chi phí
  - [ ] Status = "confirmed" để tính doanh thu
  - [ ] Phân bổ đúng nếu chia sẻ

- [ ] **Transaction Data - Bảo trì**
  - [ ] ≥ 1-2 bản ghi
  - [ ] Xe status tự động → "maintenance"

- [ ] **Kiểm tra Dashboard**
  - [ ] Hiển thị dữ liệu (không phải 0)
  - [ ] KPI tính đúng
  - [ ] Biểu đồ vẽ đúng

- [ ] **Kiểm tra Reports**
  - [ ] Tổng doanh thu > 0
  - [ ] Tổng chi phí > 0
  - [ ] Lợi nhuận > 0
  - [ ] Xu hướng so sánh tháng trước

---

## 🚀 READY FOR PRODUCTION

Sau khi hoàn tất checklist:
```
✅ Database có dữ liệu thực tế
✅ Công thức tính toán kiểm chứng
✅ Reports hiển thị chính xác
✅ Tất cả tabs hoạt động đúng
✅ Sẵn sàng go-live
```

**Next Step:** Bắt đầu nhập dữ liệu theo hướng dẫn trên! 📝
