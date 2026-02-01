# REPORTS MODULE IMPLEMENTATION SUMMARY
**Date**: 29 January 2026  
**Version**: 1.0 - Initial Release

---

## 📋 TABLE OF CONTENTS
1. [Files Created/Modified](#files-createdmodified)
2. [Database Schema & Mappings](#database-schema--mappings)
3. [Feature Implementation Status](#feature-implementation-status)
4. [Architecture Overview](#architecture-overview)
5. [Known Limitations & TODOs](#known-limitations--todos)

---

## 📁 FILES CREATED/MODIFIED

### Core Layout & Structure
- **[ReportsLayout.tsx](src/components/reports/ReportsLayout.tsx)** - Main layout with tab navigation
  - Defines shared filter context
  - Routes between 3 main report tabs (Vehicle, Driver, Fleet)
  - Supports future tabs (Route, Customer, Export Center)

### Shared Components (Reusable)
1. **[ExcelFilterBar.tsx](src/components/reports/ExcelFilterBar.tsx)**
   - Date range picker (from/to dates)
   - Quick date chips: Hôm nay, Tuần này, Tháng này
   - Multi-select dropdowns for: Vehicles, Drivers, Routes, Customers
   - Select All / Clear / Reset buttons
   - ~250 lines

2. **[ColumnPicker.tsx](src/components/reports/ColumnPicker.tsx)**
   - Show/hide columns via checkboxes
   - Required columns cannot be hidden
   - Quick select: "Tất cả" (All), "Tối thiểu" (Minimal)
   - Column pin indicator (visual only)
   - ~150 lines

3. **[ExcelDataTable.tsx](src/components/reports/ExcelDataTable.tsx)**
   - Core table component with Excel-style features:
     - Drag & drop column reordering
     - Sticky header (vertical scroll)
     - Pinned columns on left (with blue border)
     - Column sorting (asc/desc indicators)
     - Footer row with totals/summaries
     - Responsive scrolling (horizontal + vertical)
   - ~350 lines

4. **[ExportButtons.tsx](src/components/reports/ExportButtons.tsx)**
   - Dropdown menu for export options
   - Export to CSV (text-based, properly escaped)
   - Export to XLSX (using xlsx library)
   - Export to PDF (print preview)
   - ~200 lines

### Report-Specific Components

5. **[ReportByVehicleTable.tsx](src/components/reports/ReportByVehicleTable.tsx)** - **COMPLETE**
   - Report: "Hiệu suất & Lãi/Lỗ theo Xe"
   - Data aggregation: Vehicles with trips & expenses
   - Columns implemented: 17 total
     - Vehicle info: Mã xe, Biển số, Loại xe, Trạng thái
     - Trip stats: Số chuyến, Tổng km
     - Financial: Doanh thu, Nhiên liệu, BOT, Bảo trì, Chi phí khác, Tổng chi phí, Lợi nhuận, Biên LN%
     - Per-trip metrics: Doanh thu/chuyến, Chi phí/chuyến, Lợi nhuận/chuyến
   - Features: Filter, column management, sort, export, totals footer
   - ~400 lines

6. **[ReportByDriverTable.tsx](src/components/reports/ReportByDriverTable.tsx)** - **COMPLETE**
   - Report: "Doanh thu & Số chuyến theo Tài xế"
   - Data aggregation: Drivers with trips
   - Columns implemented: 15 total
     - Driver info: Mã TX, Họ tên, Hạng GPLX, GPLX hết hạn, Trạng thái GPLX, Trạng thái
     - Stats: Số chuyến, Tổng km, Doanh thu, Chi phí ước tính, Lợi nhuận, Chuyến/ngày
     - Per-trip metrics
   - **NOTE**: Costs estimated at 20% of revenue (TODO: update when driver-linked expenses available)
   - Features: Filter, column management, sort, export
   - ~400 lines

7. **[ReportByFleetTable.tsx](src/components/reports/ReportByFleetTable.tsx)** - **COMPLETE**
   - Report: "Tổng quan kinh doanh đội xe"
   - Group By options: Loại xe, Trạng thái xe, Tuyến, Khách hàng
   - Columns: Group name, Số xe, Xe hoạt động/dừng, Số chuyến, KM, Doanh thu, Chi phí, Lợi nhuận, Biên LN%
   - Includes fleet overview card showing total vehicles + active/inactive count
   - Features: Group by dropdown, filter, column management, sort, export
   - ~450 lines

---

## 🗄️ DATABASE SCHEMA & MAPPINGS

### Tables Used

#### 1. **trips** (Primary source)
| Column | Type | Used In | Notes |
|--------|------|---------|-------|
| id | UUID | All reports | Record identifier |
| trip_code | VARCHAR | Vehicle/Driver | Display ID |
| vehicle_id | UUID | All reports | Foreign key to vehicles |
| driver_id | UUID | All reports | Foreign key to drivers |
| route_id | UUID | Fleet (conditional) | Foreign key to routes |
| customer_id | UUID | Fleet (conditional) | Foreign key to customers |
| departure_date | DATE | All reports | Filter by date range |
| actual_distance_km | DECIMAL | Vehicle/Driver/Fleet | **TODO**: Missing in some routes - fallback to 0 |
| freight_revenue | DECIMAL | All reports | Part of total_revenue |
| additional_charges | DECIMAL | All reports | Part of total_revenue |
| total_revenue | DECIMAL (GENERATED) | All reports | freight_revenue + additional_charges |
| status | trip_status | Filter option | trip status enum |

#### 2. **vehicles** (Vehicle dimension)
| Column | Type | Used In | Notes |
|--------|------|---------|-------|
| id | UUID | All reports | PK, FK in trips |
| vehicle_code | VARCHAR | All reports | Vehicle ID (required) |
| license_plate | VARCHAR | All reports | License plate (required) |
| vehicle_type | VARCHAR | Vehicle/Fleet | Type grouping |
| status | vehicle_status | Vehicle/Fleet | active/maintenance/inactive |
| fuel_consumption_per_100km | DECIMAL | Vehicle | For fuel cost estimation (TODO: not used yet) |

#### 3. **drivers** (Driver dimension)
| Column | Type | Used In | Notes |
|--------|------|---------|-------|
| id | UUID | All reports | PK, FK in trips |
| driver_code | VARCHAR | All reports | Driver ID (required) |
| full_name | VARCHAR | All reports | Display name (required) |
| license_class | VARCHAR | Driver | License type |
| license_expiry | DATE | Driver | For "GPLX hết hạn" status check |
| status | driver_status | Driver | active/on_leave/inactive |

#### 4. **expenses** (Cost dimension)
| Column | Type | Used In | Notes |
|--------|------|---------|-------|
| id | UUID | Vehicle/Fleet | Record identifier |
| expense_date | DATE | Vehicle/Fleet | Linked to trips by vehicle |
| vehicle_id | UUID | Vehicle/Fleet | Primary grouping (used) |
| driver_id | UUID | --- | Available but not yet used in reports |
| trip_id | UUID | --- | Could link directly to trip |
| category_id | UUID | Vehicle | Foreign key to expense_categories |
| amount | DECIMAL | All | Cost amount |
| description | TEXT | Vehicle | Categorization helper |

#### 5. **expense_categories** (Category lookup)
| Column | Type | Used In | Notes |
|--------|------|---------|-------|
| id | UUID | Vehicle report | PK |
| category_name | VARCHAR | Vehicle | For display (fallback) |
| category_type | VARCHAR | Vehicle | For cost categorization |

**Expense Category Types Recognized**:
- `fuel` → Doanh Thu Nhiên Liệu
- `toll` or `road` → Chi Phí BOT/Đường
- `maintenance` or `repair` → Chi Phí Bảo Trì
- Other → Chi Phí Khác

#### 6. **routes** (Route dimension)
| Column | Type | Used In | Notes |
|--------|------|---------|-------|
| id | UUID | All reports | PK, FK in trips |
| route_name | VARCHAR | All reports | Display name |
| origin | VARCHAR | --- | Not used in reports yet |
| destination | VARCHAR | --- | Not used in reports yet |
| distance_km | DECIMAL | --- | Not synced to trips (TODO) |

#### 7. **customers** (Customer dimension)
| Column | Type | Used In | Notes |
|--------|------|---------|-------|
| id | UUID | All reports | PK, FK in trips |
| customer_name | VARCHAR | All reports | Display name |
| short_name | VARCHAR | --- | Alternative name |

---

## 🎯 FEATURE IMPLEMENTATION STATUS

### Implemented ✅

| Feature | Vehicle | Driver | Fleet |
|---------|---------|--------|-------|
| **Data Display** | ✅ | ✅ | ✅ |
| **Date Range Filter** | ✅ | ✅ | ✅ |
| **Multi-Select Filters** (Vehicle/Driver/Route/Customer) | ✅ | ✅ | ✅ |
| **Column Show/Hide** | ✅ | ✅ | ✅ |
| **Column Reorder (Drag & Drop)** | ✅ | ✅ | ✅ |
| **Sticky Header + Scrolling** | ✅ | ✅ | ✅ |
| **Sorting** | ✅ | ✅ | ✅ |
| **Export (CSV/XLSX/PDF)** | ✅ | ✅ | ✅ |
| **Footer Totals** | ✅ | ✅ | ✅ |
| **Quick Date Chips** | ✅ | ✅ | ✅ |
| **Group By Dropdown** | — | — | ✅ |
| **Column Pinning** | ⚠️ (Visual only) | ⚠️ (Visual only) | ⚠️ (Visual only) |
| **Drill-down Drawer** | ❌ TODO | ❌ TODO | ❌ TODO |
| **Saved Filters** | ❌ TODO | ❌ TODO | ❌ TODO |

---

## 🏗️ ARCHITECTURE OVERVIEW

### Component Hierarchy
```
ReportsLayout (main container)
├── Context: ReportContext (shared filters)
├── Tabs:
│   ├── Tab: "Theo Xe"
│   │   └── ReportByVehicleTable
│   │       ├── ExcelFilterBar
│   │       ├── Card (with ColumnPicker + ExportButtons)
│   │       └── ExcelDataTable
│   ├── Tab: "Theo Tài Xế"
│   │   └── ReportByDriverTable
│   │       ├── ExcelFilterBar
│   │       ├── Card (with ColumnPicker + ExportButtons)
│   │       └── ExcelDataTable
│   └── Tab: "Theo Nhóm Xe"
│       └── ReportByFleetTable
│           ├── Group By Select
│           ├── ExcelFilterBar
│           ├── Card (with ColumnPicker + ExportButtons)
│           └── ExcelDataTable
└── (Future tabs: Route, Customer, Export Center - stubs in place)
```

### Data Flow
1. **Fetch** (hooks): useTrips, useVehicles, useExpenses, useDrivers, useRoutes, useCustomers
2. **Filter**: Apply date range + multi-select filters
3. **Aggregate**: Group by vehicle/driver/fleet, calculate totals
4. **Sort**: Client-side sort on selection
5. **Display**: Render ExcelDataTable with columns, apply column visibility
6. **Export**: Prepare data with visible columns only, trigger download

### State Management
- Each report component manages own state:
  - `dateFrom`, `dateTo` (date range)
  - `selectedVehicles`, `selectedDrivers`, `selectedRoutes`, `selectedCustomers` (filters)
  - `columns` (visibility, order state)
  - `sortColumn`, `sortDirection`
  - `groupBy` (Fleet report only)

---

## 📊 DATA CALCULATION EXAMPLES

### Vehicle Report - Profit Calculation
```typescript
totalRevenue = SUM(trips.total_revenue) for vehicle
totalCost = SUM(expenses.amount) where vehicle_id matches
profit = totalRevenue - totalCost
profitMargin = (profit / totalRevenue) * 100 if totalRevenue > 0
```

**Expense Breakdown**:
```typescript
fuelCost = SUM(expenses) WHERE category_type = 'fuel'
tollCost = SUM(expenses) WHERE category_type IN ('toll', 'road')
maintenanceCost = SUM(expenses) WHERE category_type IN ('maintenance', 'repair')
otherCost = SUM(expenses) WHERE category_type NOT IN above
totalCost = fuelCost + tollCost + maintenanceCost + otherCost
```

### Driver Report - Distance Calculation
```typescript
totalKm = SUM(trips.actual_distance_km) for driver
daysWorked = COUNT(DISTINCT trips.departure_date) for driver
tripsPerDay = tripCount / daysWorked
```

**Cost Estimation** (placeholder):
```typescript
estimatedCost = totalRevenue * 0.20  // 20% estimate
// TODO: Replace with actual driver-linked expenses when available
```

### Fleet Report - Group Aggregation
```typescript
BY vehicle_type:
  groupName = vehicle.vehicle_type
  vehicleCount = COUNT(DISTINCT vehicles) in group
  tripCount = SUM(trips) for vehicles in group
  totalRevenue = SUM(trip.total_revenue)
  totalCost = SUM(expenses) for vehicles in group
```

---

## ⚠️ KNOWN LIMITATIONS & TODOS

### 🔴 HIGH PRIORITY

1. **Drill-Down Detail Panels** (Not Implemented)
   - Location: Each report component
   - Task: Add `RowDetailDrawer.tsx` component
   - Behavior:
     - Click table row → slide-in drawer from right
     - Show related trips (if vehicle/driver report) or vehicles in group (if fleet)
     - Show expense breakdown
     - Keep filter state
   - Estimated Lines: 200-300

2. **Driver-Linked Expenses** (Incomplete Cost Calculation)
   - Current: Driver report costs = 20% of revenue (estimate)
   - Needed: Use `expenses.driver_id` to calculate actual costs
   - Task: In ReportByDriverTable, filter expenses by driver_id instead of vehicle_id
   - Status: Schema supports this, but not implemented
   - Estimated Fix: 20-30 lines

3. **Column Pinning** (Visual Only)
   - Current: "pin" indicator shows in column picker but not functional in table
   - Task: Modify ExcelDataTable to implement sticky positioning for pinned columns
   - Estimated Lines: 50-100

### 🟡 MEDIUM PRIORITY

4. **Saved Filters** (Not Implemented)
   - Feature: "Lưu bộ lọc" button to save filter presets
   - Storage: localStorage or database (prefer localStorage first)
   - Task: Add SaveFilterDialog and FilterPresetManager component
   - Estimated Lines: 150-200

5. **Distance Normalization**
   - Current: Some trips may have `actual_distance_km = NULL`
   - Fallback: Treat as 0
   - Better: Calculate from route distance if available
   - Task: Add logic in vehicle report to use `routes.distance_km` as fallback
   - Estimated Lines: 10-20

6. **Trip Status Filter** (Not Visible)
   - Missing: Filter by trip status (draft, confirmed, in_progress, completed, etc.)
   - Task: Add status multi-select to ExcelFilterBar
   - Estimated Lines: 20-30

### 🟢 LOW PRIORITY

7. **Route & Customer Reports** (Skeleton Only)
   - Current: Tabs exist but show "Tính năng này sắp có" message
   - Task: Implement following same pattern as Vehicle/Driver reports
   - Estimated Lines: 400-500 each

8. **Export Center Tab** (Not Implemented)
   - Feature: Bulk export, scheduled exports, export history
   - Estimated Lines: 300-400

9. **Performance Optimization**
   - For 1000+ vehicles/drivers: Consider virtualization or pagination
   - Current implementation uses full array rendering
   - Task: Replace ExcelDataTable with virtualized table (if needed)
   - Note: Fine for typical fleet size (<500 vehicles)

10. **Advanced Filtering**
    - Missing: Range filters (e.g., "Revenue between X and Y")
    - Task: Add range input fields to ExcelFilterBar
    - Estimated Lines: 100-150

---

## 🔍 FIELD MAPPINGS CHECKLIST

### Trip Revenue Sources
- [x] `freight_revenue` - main revenue
- [x] `additional_charges` - additional revenue
- [x] `total_revenue` - generated column (sum of above)

### Expense Categories Recognized
- [x] Fuel (`category_type = 'fuel'`)
- [x] Toll/Road (`category_type IN ('toll', 'road')`)
- [x] Maintenance/Repair (`category_type IN ('maintenance', 'repair')`)
- [ ] Insurance (not in current expense_categories - TODO)
- [ ] Driver Salary (not in current expense_categories - TODO)

### Missing/Unavailable Fields
- [ ] `vehicles.fuel_consumption_per_100km` - exists but not used in cost calculation
- [ ] `routes.distance_km` - exists but not synced to `trips.actual_distance_km`
- [ ] Driver salary - not linked to trips
- [ ] Insurance expiry - vehicle has no insurance fields
- [ ] Vehicle registration expiry - not present in schema

---

## 📝 IMPLEMENTATION NOTES

### Why 20% Cost Estimate for Drivers?
Without driver-linked expense records, the report estimates costs at 20% of revenue. This is a placeholder that should be updated once actual driver expenses are recorded:
1. If expenses table has `driver_id` populated, query using that
2. If not, expenses stay at vehicle level (sum all vehicle expenses)
3. Once step 1 is ready, remove the 0.20 multiplier in ReportByDriverTable

### Why No Drill-Down in Phase 1?
Drill-down requires additional UI components (drawer, nested tables) that are orthogonal to the main grid. Implemented these first to validate:
- Data accuracy
- Filter/sort logic
- Export correctness
Then add drill-down as Phase 2 feature.

### Export Format Choice
- **CSV**: Simple, universally compatible, good for data import
- **XLSX**: Better formatting, supports multiple sheets (current: single sheet)
- **PDF**: Print-friendly, preserves layout
- **HTML**: Not included (can add later if print preview insufficient)

---

## 🚀 DEPLOYMENT CHECKLIST

- [x] All components error-free (no TypeScript errors)
- [x] Data sources verified (hooks work with schema)
- [x] Export library added (xlsx package)
- [x] Responsive design basic (tested on wide screens)
- [ ] Mobile responsiveness testing (TODO)
- [ ] Supabase RLS permissions (assuming same as other pages)
- [ ] Performance tested with large datasets (TODO: test with 1000+ rows)
- [ ] Accessibility review (labels, ARIA attributes - TODO)

---

## 📚 HOW TO EXTEND

### Add a New Report Tab

1. Create new file: `src/components/reports/ReportByXxxTable.tsx`
2. Define data interface and columns
3. Implement data fetching and aggregation logic
4. Use shared components: ExcelFilterBar, ColumnPicker, ExcelDataTable, ExportButtons
5. Add TabsTrigger in ReportsLayout
6. Import and render in TabsContent

### Add a New Filter

1. In ExcelFilterBar: Add new MultiSelectDropdown with options
2. Pass selected state from parent component
3. In report component: Add filter logic to the useMemo aggregation
4. Update ExcelFilterBar props interface

### Modify Column Definitions

1. Update DEFAULT_COLUMNS array in report component
2. Add/remove Column object from array
3. Column picker automatically respects changes
4. Footer totals update based on visible columns

---

## 📞 SUPPORT & QUESTIONS

- **Data Schema Issues**: Check ULTIMATE_MIGRATION.sql in supabase/migrations/
- **Component Reuse**: All shared components can be copied to other modules
- **Color/Styling**: Using Tailwind CSS + shadcn/ui, override as needed
- **Testing**: See REPORTS_TESTING_CHECKLIST.md

---

**Last Updated**: 29 January 2026  
**Next Review**: After Phase 2 (Drill-down + Driver Expenses)
