# 🧪 COMPREHENSIVE APP QA CHECKLIST - FULL SYSTEM TEST

**Date:** 27-01-2026  
**Status:** Database Clean, Ready for Testing  
**Objective:** Verify all features work correctly with real user data

---

## 📋 PRE-TEST SETUP

```
✅ Database: Xóa sạch tất cả data
✅ Build: Production build clean (0 errors)
✅ Dev Server: Running on http://localhost:8080
✅ Dependencies: All configured
✅ Demo Data: Removed, using real data only
✅ Migrations: ULTIMATE_MIGRATION.sql applied
```

---

## 🎯 FULL SYSTEM QA TEST PLAN

### **PHASE 1: AUTHENTICATION & AUTHORIZATION (15 min)**

#### **Test 1.1: Login Flow**
- [ ] Navigate to http://localhost:8080/auth
- [ ] Login with valid Supabase user
  - Email: `test@example.com`
  - Password: `[password]`
- [ ] ✅ Redirect to Dashboard after login
- [ ] ✅ User info visible in header
- [ ] ✅ Sidebar shows all menu items

#### **Test 1.2: Session Persistence**
- [ ] Refresh page (F5)
- [ ] ✅ Still logged in, no need to re-login
- [ ] [ ] Check browser localStorage/sessionStorage

#### **Test 1.3: Logout**
- [ ] Click "Logout" button
- [ ] ✅ Redirect to /auth
- [ ] ✅ Session cleared

#### **Test 1.4: Authorization (Protected Routes)**
- [ ] Try accessing /dashboard without login (copy URL in incognito)
- [ ] ✅ Redirect to /auth page
- [ ] [ ] Cannot view any data without authentication

---

### **PHASE 2: MASTER DATA ENTRY (45 min)**

#### **Test 2.1: Company Settings Configuration**
- [ ] Go to Tab: **Settings**
- [ ] Click "Company Settings" section
- [ ] **Enter:**
  ```
  Company Name: Công ty ABC
  Tax ID: 0123456789
  Address: 123 Đường A, HCM
  Phone: 0123456789
  ```
- [ ] **Click Save**
- [ ] ✅ Toast notification: "Cập nhật thành công"
- [ ] [ ] Refresh page
- [ ] ✅ Data still there (persistence)

#### **Test 2.2: Add Customers**
- [ ] Go to Tab: **Khách hàng (Customers)**
- [ ] Click **Add New**
- [ ] **Fill form:**
  ```
  Mã KH: KH-001
  Tên KH: Công ty Hùng Phát
  MST: 0123456789
  Địa chỉ: 456 Đường B, HN
  Điện thoại: 0987654321
  Email: contact@hungphat.com
  ```
- [ ] **Click Save**
- [ ] ✅ Toast: "Thêm khách hàng thành công"
- [ ] ✅ New customer appears in table
- [ ] ✅ Can search by name, mã KH, MST
- [ ] [ ] **Repeat 3 more times** (KH-002, KH-003, KH-004)

#### **Test 2.3: Add Vehicles**
- [ ] Go to Tab: **Đội xe (Vehicles)**
- [ ] Click **Add New**
- [ ] **Fill form:**
  ```
  Mã xe: XE-001
  Loại: Tải 5 tấn
  Biển số: 29A-123.45
  Năm: 2022
  Trạng thái: active ← IMPORTANT!
  Ghi chú: Xe mới
  ```
- [ ] **Click Save**
- [ ] ✅ Toast: "Thêm xe thành công"
- [ ] ✅ New vehicle appears in table
- [ ] ✅ Status = "active" (not "maintenance" or "inactive")
- [ ] [ ] **Repeat 3 more times** (XE-002, XE-003, XE-004)

#### **Test 2.4: Add Drivers**
- [ ] Go to Tab: **Tài xế (Drivers)**
- [ ] Click **Add New**
- [ ] **Fill form:**
  ```
  Mã TX: TX-001
  Tên: Trần Văn A
  CMND: 012345678
  Điện thoại: 0912345678
  Trạng thái: active ← IMPORTANT!
  Ghi chú: Kinh nghiệm 10 năm
  ```
- [ ] **Click Save**
- [ ] ✅ Toast: "Thêm tài xế thành công"
- [ ] ✅ New driver appears in table
- [ ] ✅ Status = "active"
- [ ] [ ] **Repeat 3 more times** (TX-002, TX-003, TX-004)

#### **Test 2.5: Add Routes**
- [ ] Go to Tab: **Tuyến đường (Routes)**
- [ ] Click **Add New**
- [ ] **Fill form:**
  ```
  Mã tuyến: T-001
  Điểm đi: Hà Nội
  Điểm đến: HCM
  Quãng đường: 1600 km
  Chi phí cơ sở: 2000000 ₫
  ```
- [ ] **Click Save**
- [ ] ✅ Toast: "Thêm tuyến đường thành công"
- [ ] ✅ Route appears in table
- [ ] [ ] **Repeat 2 more times** (T-002, T-003)

---

### **PHASE 3: TRANSACTION DATA ENTRY (60 min)**

#### **Test 3.1: Create Trips**
- [ ] Go to Tab: **Chuyến hàng (Trips)**
- [ ] Click **Add New**
- [ ] **Fill form:**
  ```
  Mã chuyến: [AUTO - should show CH-202601-XXXXX]
  Khách hàng: Công ty Hùng Phát
  Xe: XE-001
  Tài xế: Trần Văn A
  Tuyến: Hà Nội → HCM
  Ngày khởi hành: 27/01/2026
  Mô tả: 200 tấn gạo
  Trạng thái: draft
  ```
- [ ] **Click Save**
- [ ] ✅ Toast: "Thêm chuyến hàng thành công"
- [ ] ✅ Mã chuyến sinh tự động (CH-202601-XXXXX)
- [ ] ✅ Chuyến hiển thị trong bảng với status=draft
- [ ] [ ] **Test Editing:**
  - [ ] Click chuyến vừa tạo → Edit
  - [ ] Change status: draft → confirmed
  - [ ] ✅ Status updated
  - [ ] Change lại: confirmed → dispatched
  - [ ] ✅ Status updated
  - [ ] Change cuối cùng: dispatched → in_progress
  - [ ] Change: in_progress → completed ← IMPORTANT for reports!
  - [ ] ✅ Status = "completed"
- [ ] [ ] **Create 5-10 trips total:**
  - [ ] Ít nhất 2-3 trip có status = "completed"
  - [ ] Còn lại có status = "confirmed" hoặc "dispatched"

#### **Test 3.2: Add Expenses**
- [ ] Go to Tab: **Chi phí (Expenses)**
- [ ] Click **Add New**
- [ ] **Fill form:**
  ```
  Chuyến: CH-202601-XXXXX (chọn trip vừa tạo)
  Loại: Xăng dầu
  Mô tả: Xăng 100L @ 15,000/L
  Số tiền: 1500000 ₫
  Trạng thái: draft
  ```
- [ ] **Click Save**
- [ ] ✅ Toast: "Thêm chi phí thành công"
- [ ] ✅ Expense appears in table
- [ ] [ ] **Edit expense:**
  - [ ] Click vào expense
  - [ ] Change status: draft → confirmed
  - [ ] ✅ Status updated (only "confirmed" counted in reports)
- [ ] [ ] **Create 5-10 expenses:**
  - [ ] Ít nhất 3-4 có status = "confirmed"
  - [ ] Phân bổ cho các trip khác nhau

#### **Test 3.3: Add Maintenance Records**
- [ ] Go to Tab: **Bảo trì (Maintenance)**
- [ ] Click **Add New**
- [ ] **Fill form:**
  ```
  Xe: XE-001
  Ngày: 27/01/2026
  Loại dịch vụ: Bảo dưỡng
  Mô tả: Thay dầu, kiểm tra
  Chi phí: 500000 ₫
  ```
- [ ] **Click Save**
- [ ] ✅ Toast: "Thêm bảo trì thành công"
- [ ] ✅ Record appears in table
- [ ] [ ] **Check xe status:**
  - [ ] Go to Tab: **Đội xe**
  - [ ] Find XE-001
  - [ ] ✅ Status should now be "maintenance" (auto-updated)
  - [ ] [ ] Cannot select this vehicle in new trip dropdown
- [ ] [ ] **Edit xe status back to active:**
  - [ ] Click XE-001 → Edit
  - [ ] Change status: maintenance → active
  - [ ] ✅ Can now select again in trips

---

### **PHASE 4: DASHBOARD & METRICS VERIFICATION (30 min)**

#### **Test 4.1: Dashboard KPI Cards**
- [ ] Go to Tab: **Dashboard**
- [ ] Verify displays (should NOT be 0):
  - [ ] **Tổng số xe:** ≥ 3 ✅
  - [ ] **Tổng số tài xế:** ≥ 3 ✅
  - [ ] **Tổng chuyến (tháng này):** ≥ 5 ✅
  - [ ] **Doanh thu (tháng này):** > 0 ✅
    - Should = (distance × base_price) × number_of_completed_trips
  - [ ] **Biểu đồ chi phí:** Shows data (not empty) ✅

#### **Test 4.2: Dashboard Calculations**
- [ ] **Manual Verification:**
  - [ ] Trip 1: 1600 km × 50,000 ₫/km = 80,000,000 ₫
  - [ ] Trip 2: 1600 km × 50,000 ₫/km = 80,000,000 ₫
  - [ ] If 2 completed trips → Total Revenue ≈ 160,000,000 ₫
  - [ ] ✅ Dashboard shows same value (or close)

#### **Test 4.3: Dashboard Charts**
- [ ] Revenue trend (if data spans 6 months)
  - [ ] Shows data points ✅
  - [ ] Y-axis labels correct ✅
  - [ ] No gaps or errors ✅
- [ ] Expense breakdown by type
  - [ ] Shows pie chart ✅
  - [ ] Includes all expense types ✅
- [ ] Top drivers & vehicles
  - [ ] Lists by profit ✅
  - [ ] Shows correct names ✅

---

### **PHASE 5: DISPATCH CALENDAR (20 min)**

#### **Test 5.1: Calendar View**
- [ ] Go to Tab: **Điều phối (Dispatch)**
- [ ] ✅ Calendar view loads
- [ ] ✅ Displays current month

#### **Test 5.2: Trip Display on Calendar**
- [ ] Check dates where trips exist (27/01/2026)
- [ ] ✅ Trip names appear on correct dates
- [ ] ✅ Click trip → shows details
- [ ] ✅ Status badge shows current status
- [ ] [ ] Filter by status (if available)
  - [ ] Show only "in_progress" trips
  - [ ] ✅ Calendar updates

#### **Test 5.3: Drag & Drop (if implemented)**
- [ ] Try dragging trip to different date
- [ ] ✅ Updates trip departure date
- [ ] ✅ Toast notification shows success

---

### **PHASE 6: REPORTS & ANALYTICS (30 min)**

#### **Test 6.1: Main KPI Cards**
- [ ] Go to Tab: **Báo cáo (Reports)**
- [ ] Verify 4 main cards display:

**Card 1: Tổng doanh thu**
- [ ] ✅ Shows > 0 ₫ (not 0)
- [ ] ✅ Format: Currency with ₫
- [ ] ✅ Trend shows % vs tháng trước
- [ ] [ ] Calculation verification:
  ```
  Expected = SUM(revenue where trip.status = 'completed')
  = (Trip1_distance × base_price) + (Trip2_distance × base_price)
  = (1600 × 50,000) + (1600 × 50,000) = 160M ₫
  ```

**Card 2: Tổng chi phí**
- [ ] ✅ Shows > 0 ₫
- [ ] ✅ Trend shows % change
- [ ] [ ] Calculation verification:
  ```
  Expected = SUM(expense where expense.status = 'confirmed')
  = 1,500,000 + 500,000 + ... = [your total]
  ```

**Card 3: Lợi nhuận ròng**
- [ ] ✅ Shows = Doanh thu - Chi phí
- [ ] ✅ Format: Currency with ₫
- [ ] [ ] Calculation verification:
  ```
  Expected = Total Revenue - Total Expense
  = 160,000,000 - [expense total]
  ```

**Card 4: Biên lợi nhuận**
- [ ] ✅ Shows % (e.g., 35.5%)
- [ ] ✅ Formula: (Profit / Revenue) × 100
- [ ] [ ] Verification:
  ```
  Expected = (Profit / Revenue) × 100
  = (80,000,000 / 160,000,000) × 100 = 50%
  ```

#### **Test 6.2: Trend Charts**
- [ ] **Revenue Trend Line Chart**
  - [ ] ✅ Shows data points
  - [ ] ✅ X-axis shows months (6 months)
  - [ ] ✅ Y-axis shows ₫ amounts
  - [ ] ✅ Tooltip shows exact values on hover

#### **Test 6.3: Performance Rankings**
- [ ] **Profit by Vehicle**
  - [ ] ✅ Lists vehicles (if any completed trips)
  - [ ] ✅ Shows profit values
  - [ ] ✅ Sorted by profit (descending)
  
- [ ] **Profit by Driver**
  - [ ] ✅ Lists drivers
  - [ ] ✅ Shows trip count
  - [ ] ✅ Shows profit values
  
- [ ] **Profit by Route**
  - [ ] ✅ Lists routes
  - [ ] ✅ Shows total profit
  - [ ] ✅ Shows average profit/trip
  
- [ ] **Profit by Customer**
  - [ ] ✅ Lists customers
  - [ ] ✅ Shows trip count
  - [ ] ✅ Shows profit margin %

---

### **PHASE 7: SEARCH & FILTER (20 min)**

#### **Test 7.1: Search Functionality**
- [ ] Tab: **Khách hàng**
  - [ ] Search by name: type "Hùng" → ✅ Filters results
  - [ ] Search by mã KH: type "KH-001" → ✅ Finds it
  - [ ] Search by MST → ✅ Works

- [ ] Tab: **Đội xe**
  - [ ] Search by mã xe: "XE-001" → ✅ Finds it
  - [ ] Search by biển số: "29A" → ✅ Works

- [ ] Tab: **Tài xế**
  - [ ] Search by name → ✅ Works
  - [ ] Search by CMND → ✅ Works

#### **Test 7.2: Status Filtering**
- [ ] Tab: **Đội xe**
  - [ ] Filter by status: "active" → ✅ Shows only active
  - [ ] Filter by status: "maintenance" → ✅ Shows only maintenance
  
- [ ] Tab: **Chuyến hàng**
  - [ ] Filter by status: "completed" → ✅ Shows completed only
  - [ ] Filter by status: "in_progress" → ✅ Shows correct ones

---

### **PHASE 8: DATA INTEGRITY & CONSTRAINTS (25 min)**

#### **Test 8.1: Foreign Key Relationships**
- [ ] Try adding trip with deleted customer
  - [ ] ✅ Cannot select deleted customer
  
- [ ] Try adding trip with inactive vehicle
  - [ ] ✅ Dropdown only shows active vehicles
  - [ ] ✅ Cannot force-select inactive
  
- [ ] Try adding trip with inactive driver
  - [ ] ✅ Dropdown only shows active drivers

#### **Test 8.2: Unique Constraints**
- [ ] Try adding customer with duplicate MST
  - [ ] ✅ Error message: "MST đã tồn tại"
  
- [ ] Try adding vehicle with duplicate biển số
  - [ ] ✅ Error message: "Biển số đã tồn tại"
  
- [ ] Try adding driver with duplicate CMND
  - [ ] ✅ Error message: "CMND đã tồn tại"

#### **Test 8.3: Required Fields**
- [ ] Try saving customer without tên KH
  - [ ] ✅ Error: "Tên khách hàng bắt buộc"
  
- [ ] Try saving vehicle without biển số
  - [ ] ✅ Error: "Biển số bắt buộc"
  
- [ ] Try saving trip without chọn khách hàng
  - [ ] ✅ Error: "Khách hàng bắt buộc"

#### **Test 8.4: Numeric Validations**
- [ ] Try adding route with quãng đường = 0
  - [ ] ✅ Error: "Quãng đường phải > 0"
  
- [ ] Try adding expense with số tiền = -100
  - [ ] ✅ Error: "Số tiền phải >= 0"
  
- [ ] Try adding vehicle with năm = 2030 (future)
  - [ ] ✅ Error: "Năm phải <= năm hiện tại"

---

### **PHASE 9: PERFORMANCE & RESPONSIVENESS (15 min)**

#### **Test 9.1: Data Loading Speed**
- [ ] Load customer list with 100 records
  - [ ] ✅ Loads in < 2 seconds
  - [ ] ✅ Smooth scrolling
  
- [ ] Open trip form (load dropdowns)
  - [ ] ✅ All dropdowns populate < 1 second
  
- [ ] Load Reports page
  - [ ] ✅ Charts render in < 2 seconds

#### **Test 9.2: Responsive Design**
- [ ] Open on desktop (1920x1080)
  - [ ] ✅ All elements visible
  - [ ] ✅ Tables not truncated
  
- [ ] Resize to tablet (768px)
  - [ ] ✅ Layout adapts
  - [ ] ✅ Menu becomes hamburger
  
- [ ] Resize to mobile (375px)
  - [ ] ✅ Mobile-friendly layout
  - [ ] ✅ Tap targets are large enough

---

### **PHASE 10: ERROR HANDLING & EDGE CASES (20 min)**

#### **Test 10.1: Network Error Handling**
- [ ] Disconnect internet while loading data
  - [ ] ✅ Error message appears
  - [ ] ✅ Retry button available
  
- [ ] Re-connect
  - [ ] ✅ Data loads automatically or on retry

#### **Test 10.2: Concurrent Updates**
- [ ] Open same trip in 2 browser windows
- [ ] Edit in window 1 → Save
- [ ] Try to save in window 2 with old data
  - [ ] ✅ Conflict detected or last-write-wins
  - [ ] [ ] Verify no data corruption

#### **Test 10.3: Session Timeout**
- [ ] Leave app idle for 30+ minutes
  - [ ] ✅ Logout or prompt to re-login
  - [ ] ✅ No data loss

#### **Test 10.4: Large Numbers**
- [ ] Create expense with amount = 999,999,999,999 ₫
  - [ ] ✅ Stored correctly
  - [ ] ✅ Displays without overflow
  
- [ ] Create trip with distance = 50,000 km
  - [ ] ✅ Revenue calculates correctly
  - [ ] ✅ No rounding errors

---

## ✅ FINAL VERIFICATION CHECKLIST

### **Data Quality**
- [ ] All trips linked to correct vehicle/driver/route
- [ ] All expenses linked to correct trip
- [ ] No orphaned records (deleted records leave no FK violations)
- [ ] All calculations match manual verification

### **Functionality**
- [ ] All 13 tabs accessible and working
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Search and filters work correctly
- [ ] Forms validate correctly
- [ ] Dropdowns show correct options

### **Calculations**
- [ ] Trip revenue = distance × base_price
- [ ] Trip expense = fuel_cost + toll_cost + allocated_expenses
- [ ] Trip profit = revenue - expense
- [ ] KPIs calculated correctly
- [ ] Trend comparisons accurate

### **Performance**
- [ ] App loads in < 3 seconds
- [ ] No console errors (F12)
- [ ] No memory leaks (open for 10+ minutes)
- [ ] Smooth interactions (no lag)

### **Security**
- [ ] RLS policies working (users can only see own company data)
- [ ] Authentication required for all protected routes
- [ ] Logout clears session properly
- [ ] Sensitive data not exposed in URLs/logs

---

## 🚀 GO-LIVE READINESS CRITERIA

**App is READY for production if:**
- [ ] All Phase 1-10 tests PASS
- [ ] Zero critical bugs found
- [ ] Data integrity verified
- [ ] Performance meets requirements
- [ ] User documentation complete
- [ ] Backup procedure documented
- [ ] Monitoring/alerting configured

**If any test FAILS:**
- [ ] Document the bug
- [ ] Assign priority (Critical/High/Medium/Low)
- [ ] Fix and re-test

---

## 📝 BUG REPORT TEMPLATE

```
TITLE: [Tab Name] - [Feature] - [Issue]

SEVERITY: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

STEPS TO REPRODUCE:
1. Go to Tab: [X]
2. Click [Y]
3. Enter [Z]
4. Click [W]
5. [Issue occurs]

EXPECTED RESULT:
[What should happen]

ACTUAL RESULT:
[What actually happens]

ENVIRONMENT:
- Browser: Chrome 120 / Firefox / Safari
- OS: Windows / Mac / Linux
- Resolution: 1920x1080
- Network: Online / Offline

ATTACHMENTS:
- Screenshot
- Console error (F12)
- Network request log
```

---

## 📊 TEST SUMMARY TEMPLATE

```
TEST EXECUTION REPORT
Date: 27/01/2026
Tester: [Name]

TOTAL TESTS: 150+
✅ PASSED: [X]
❌ FAILED: [X]
⏭️  SKIPPED: [X]

PASS RATE: [X%]

CRITICAL ISSUES: [X]
HIGH ISSUES: [X]
MEDIUM ISSUES: [X]
LOW ISSUES: [X]

GO-LIVE READY: YES / NO / CONDITIONAL
```

---

**Ready? Let's start testing! 🧪**
