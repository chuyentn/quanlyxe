# MANUAL TESTING CHECKLIST - Reports Module

## Environment Setup
- [ ] Run `npm run dev` or `npm start` - ensure app loads without errors
- [ ] Navigate to `/reports` - should show ReportsLayout with 3 tabs (Theo Xe, Theo Tài Xế, Theo Nhóm Xe)
- [ ] Verify page loads data without console errors

---

## TAB 1: BÁO CÁO THEO XE (ReportByVehicleTable)

### 1. Data Loading & Display
- [ ] Tab loads vehicle data and displays table with vehicles
- [ ] Table shows: Mã Xe, Biển Số, Loại Xe, Trạng Thái, Số Chuyến, Tổng KM, Doanh Thu, Chi Phí, Lợi Nhuận
- [ ] All values display correctly (not NaN, not undefined)
- [ ] Footer "Tổng Hợp" row shows correct totals (SUM of revenue, costs, profit, etc.)
- [ ] No console warnings/errors

### 2. Date Range Filtering
- [ ] Default date range shows last 30 days
- [ ] Change "Từ ngày" and "Đến ngày" - data updates accordingly
- [ ] Click "Hôm nay" chip - shows data for today only
- [ ] Click "Tuần này" chip - shows data for current week
- [ ] Click "Tháng này" chip - shows data for current month

### 3. Multi-Select Filtering
- [ ] Click "Xe" dropdown - list of vehicles appears
- [ ] Select 1 vehicle - table updates to show only that vehicle
- [ ] Select multiple vehicles - table filters correctly
- [ ] Click "Tất cả" button - selects all vehicles
- [ ] Click "Xóa" button - clears all selections
- [ ] Same tests for "Tài xế", "Tuyến", "Khách hàng" dropdowns
- [ ] Filters work together (e.g., select vehicle + date range)

### 4. Column Management (ColumnPicker)
- [ ] Click "Cột (X/Y)" button - dropdown shows all columns with checkboxes
- [ ] Uncheck a column - it disappears from table immediately
- [ ] Check a hidden column - it reappears
- [ ] Click "Tất cả" - all columns visible
- [ ] Click "Tối thiểu" - only required columns (Mã Xe, Biển Số) visible
- [ ] Required columns have "(bắt buộc)" label and cannot be unchecked

### 5. Column Reordering (Drag & Drop)
- [ ] Hover over column header - cursor shows grab icon
- [ ] Drag column header left/right - column order changes in table
- [ ] Dragged column stays in new position after release

### 6. Sorting
- [ ] Click column header (e.g., "Doanh Thu") - data sorts ascending (arrow down)
- [ ] Click again - data sorts descending (arrow up)
- [ ] Click another column - sorting switches to that column
- [ ] Sort works for all columns marked as sortable

### 7. Scrolling & Sticky Header
- [ ] Scroll down table - column headers remain sticky at top
- [ ] Scroll right - "Mã Xe" and "Biển Số" columns remain pinned on left (should have blue border)
- [ ] Horizontal and vertical scrolling works smoothly

### 8. Export Functionality
- [ ] Click "Xuất" button - dropdown shows CSV, XLSX, PDF options
- [ ] Click "Xuất CSV" - CSV file downloads with correct filename
- [ ] Open CSV file - data matches table display with visible columns only
- [ ] Click "Xuất Excel (XLSX)" - XLSX file downloads
- [ ] Open XLSX - data and formatting looks correct
- [ ] Click "Xuất PDF" - PDF preview opens with table data

### 9. Reset Filters
- [ ] Change multiple filters (date range, vehicles, drivers)
- [ ] Click "Đặt lại" button
- [ ] All filters reset to default (last 30 days, no selections)
- [ ] Table updates to show all data for default date range

### 10. Empty State Handling
- [ ] Set date range with no data (e.g., year 2020) - shows "Không có dữ liệu phù hợp với bộ lọc"
- [ ] Select vehicles that have no trips - shows empty message

---

## TAB 2: BÁO CÁO THEO TÀI XẾ (ReportByDriverTable)

### 11. Data Loading & Display
- [ ] Tab loads driver data and displays table with drivers
- [ ] Table shows: Mã TX, Họ Tên, Hạng GPLX, Trạng Thái, Số Chuyến, Tổng KM, Doanh Thu, Chi Phí, Lợi Nhuận
- [ ] License status column shows "Còn hiệu lực" or "Hết hạn" correctly
- [ ] All values display correctly

### 12. Filter Behavior (Same as Tab 1)
- [ ] Date range filtering works
- [ ] Multi-select filtering works (vehicles, routes, customers, drivers)
- [ ] Filters combine correctly

### 13. Column Operations
- [ ] Column picker works (show/hide/minimum)
- [ ] Drag & drop reordering works
- [ ] Sorting works

### 14. Export
- [ ] Export CSV/XLSX/PDF works
- [ ] Exported file contains driver data with correct columns

### 15. Notes & TODOs
- [ ] Yellow note appears: "Chi phí ước tính được tính gần đúng (20% doanh thu)"
- [ ] This is expected as placeholder until actual driver-linked expenses are available

---

## TAB 3: BÁO CÁO THEO NHÓM XE (ReportByFleetTable)

### 16. Group By Selection
- [ ] "Nhóm Theo" dropdown shows options: Loại Xe, Trạng Thái Xe, Tuyến Đường, Khách Hàng
- [ ] Select "Loại Xe" - table groups data by vehicle type
- [ ] Select "Trạng Thái Xe" - table groups by vehicle status
- [ ] Select "Tuyến Đường" - table groups by routes
- [ ] Select "Khách Hàng" - table groups by customers

### 17. Group Data Display
- [ ] Each group row shows:
  - Group name
  - Số Xe (count of vehicles in group)
  - Xe Hoạt Động (count of active vehicles)
  - Số Chuyến (sum of trips)
  - Tổng KM, Doanh Thu, Chi Phí, Lợi Nhuận
- [ ] Footer shows totals for all groups combined
- [ ] Blue info box shows total fleet status (Tổng số xe, Xe hoạt động, Xe dừng)

### 18. Filter & Sort in Group View
- [ ] Date range filtering works and updates group totals
- [ ] Column picker works
- [ ] Sorting works on group data
- [ ] Export works with group data

### 19. Group Summary Accuracy
- [ ] Manually verify one group:
  - Count vehicles in group manually
  - Verify SUM of trips, revenue, costs
  - Check if calculations match table

---

## CROSS-TAB FEATURES

### 20. Filter State Persistence
- [ ] Set filters in Tab 1 (e.g., date range + 2 vehicles)
- [ ] Switch to Tab 2 - filters should still be applied (if using shared context)
  - *Note: Currently each tab may have independent state - verify expected behavior*
- [ ] Switch back to Tab 1 - filters preserved

### 21. Performance
- [ ] Load a large date range with many vehicles - table responsive
- [ ] Scroll large table - no lag
- [ ] Filter/sort operations complete in < 1 second

### 22. Data Accuracy Spot Checks
- [ ] Pick one vehicle from Tab 1
- [ ] Go to Trips page and manually count its trips for date range
- [ ] Verify "Số Chuyến" matches in report
- [ ] Pick one vehicle and sum its revenue from trips manually
- [ ] Verify "Doanh Thu" matches in report
- [ ] Verify footer totals match SUM of visible rows

---

## EDGE CASES & ERROR HANDLING

### 23. Missing Data Handling
- [ ] If a trip has no distance_km - should show "—" not NaN
- [ ] If vehicle has no vehicle_type - should show "Không xác định" or "—"
- [ ] If driver has no license_expiry - should show "—"
- [ ] Totals calculate correctly even with missing values

### 24. Invalid Date Inputs
- [ ] Set "Từ ngày" after "Đến ngày" - app should handle gracefully (or show warning)
- [ ] Clear date fields - should default or show validation

### 25. No Data Scenarios
- [ ] Empty database - each tab shows "Không có dữ liệu"
- [ ] Filter with no results - shows "Không có dữ liệu phù hợp với bộ lọc"
- [ ] Footer totals show 0 or are hidden when no data

### 26. Responsive Design (if applicable)
- [ ] On mobile width - table scrollable, columns reorderable
- [ ] Export buttons accessible
- [ ] Filter bar responsive or has secondary menu

---

## BROWSER COMPATIBILITY

### 27. Cross-Browser Testing
- [ ] Chrome/Chromium - all features work
- [ ] Firefox - all features work
- [ ] Edge - all features work
- [ ] Safari (if applicable) - all features work

---

## KNOWN LIMITATIONS & TODOs (Record Below)

- [ ] **Drill-down Drawers**: Not yet implemented. TODO: Add side panel to show detailed trip list when clicking a row
- [ ] **Driver Expenses**: Driver report costs are estimated (20% of revenue). TODO: Implement actual driver-linked expenses
- [ ] **Route/Customer Reports**: Not yet implemented (skeleton tabs visible but not functional)
- [ ] **Saved Filters**: Filter presets not yet implemented. TODO: Add "Lưu bộ lọc" functionality
- [ ] **Column Pin Feature**: Currently not pinning columns on the left. TODO: Implement column pinning logic in ExcelDataTable

---

## SIGN-OFF

**Date Tested**: _________________

**Tester Name**: _________________

**Environment**: Dev / Staging / Production

**Overall Status**: 
- [ ] ✅ All Tests Passed - Ready for Merge
- [ ] ⚠️ Some Tests Failed - See Issues Below
- [ ] ❌ Critical Issues - Do Not Merge

**Issues Found**:
```
(List any failures here)
```

**Recommendations**:
```
(Any improvements or observations)
```
