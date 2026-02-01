# 🔍 APP ARCHITECTURE ANALYSIS - CUSTOMIZATION POINTS

**Date:** 27-01-2026  
**Purpose:** Identify where users can customize formulas, settings, and business logic

---

## 📊 CURRENT CUSTOMIZATION POINTS

### **1. Company Settings (Settings Tab)**

**Status:** ✅ Already Implemented

**Location:** 
- Frontend: `src/pages/Settings.tsx`
- Backend Table: `company_settings` (Supabase)
- Hook: `useCompanySettings.ts`

**Current Fields:**
```typescript
{
  company_name: string;
  tax_id: string;
  address: string;
  phone: string;
  email: string;
  // Add custom formula parameters here
}
```

**Customization Capability:** ⚠️ LIMITED
- Currently stores only basic info
- No custom formula parameters stored
- No user-defined calculation rules

---

### **2. Calculation Formulas**

**Status:** 🔴 HARDCODED (Need Improvement)

**Current Locations:**
```
Trip Revenue:
  Location: src/hooks/useTrips.ts (client-side)
  Formula: distance × base_price + surcharges (HARDCODED)
  ❌ Cannot be changed without code edit

Trip Financials (View):
  Location: supabase/migrations/ULTIMATE_MIGRATION.sql
  Formula: SQL materialized view (HARDCODED)
  ❌ Cannot be changed without DB migration

Driver Performance:
  Location: SQL view with aggregations
  Formula: SUM(profit), AVG(profit) (HARDCODED)
  ❌ Cannot be changed without code edit

Expense Allocation:
  Location: src/hooks/useExpenses.ts
  Formula: Split by trip_count (HARDCODED)
  ❌ Cannot be changed without code edit
```

---

## 🎯 RECOMMENDED IMPROVEMENTS FOR USER CUSTOMIZATION

### **Phase A: Company-Level Formula Configuration**

**Add to `company_settings` table:**

```sql
ALTER TABLE company_settings ADD COLUMN (
  -- Revenue Calculation
  base_price_per_km DECIMAL DEFAULT 50000,
  premium_service_fee DECIMAL DEFAULT 0,
  surcharge_long_distance_km INT DEFAULT 1000,
  surcharge_long_distance_multiplier DECIMAL DEFAULT 1.2,
  
  -- Expense Calculation  
  fuel_cost_per_km DECIMAL DEFAULT 15000,
  toll_cost_per_trip DECIMAL DEFAULT 200000,
  maintenance_percentage_of_revenue DECIMAL DEFAULT 5,
  insurance_percentage_of_revenue DECIMAL DEFAULT 2,
  
  -- Driver KPI
  driver_bonus_per_trip DECIMAL DEFAULT 100000,
  driver_bonus_if_profit_above DECIMAL DEFAULT 1000000,
  driver_bonus_if_profit_amount DECIMAL DEFAULT 500000,
  driver_penalty_late_delivery DECIMAL DEFAULT 50000,
  
  -- Vehicle KPI
  vehicle_maintenance_interval_km INT DEFAULT 5000,
  vehicle_depreciation_rate_percent DECIMAL DEFAULT 2,
  vehicle_utilization_target_percent INT DEFAULT 80,
  
  -- Other
  accounting_period_closing_day INT DEFAULT 28,
  currency_code VARCHAR DEFAULT 'VND'
);
```

**Implementation:**
1. Add UI form in Settings.tsx to edit these
2. Fetch settings when app loads
3. Pass to calculation functions
4. Re-calculate all metrics when settings change

---

### **Phase B: Dynamic Formula Engine**

**Create new table for user-defined formulas:**

```sql
CREATE TABLE custom_calculation_rules (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR NOT NULL,
  target_entity VARCHAR NOT NULL, -- 'trip', 'driver', 'vehicle', 'route'
  calculation_type VARCHAR NOT NULL, -- 'revenue', 'expense', 'kpi'
  formula_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Example: 
{
  "name": "Premium Long-Distance Revenue",
  "target_entity": "trip",
  "calculation_type": "revenue",
  "formula": {
    "base": "distance * base_price_per_km",
    "conditions": [
      {
        "if": "distance > 1000",
        "then": "base * 1.2"
      },
      {
        "if": "premium_service = true",
        "then": "result + 500000"
      }
    ]
  }
}
```

**Implementation:**
1. Create Formula Builder UI (low-code/no-code)
2. Validate formula before saving
3. Execute formula at runtime
4. Fallback to default if formula invalid

---

### **Phase C: Accounting Period Customization**

**Status:** ⚠️ Partially Implemented

**Current:** 
- Accounting periods hardcoded to month (20260101-20260131)
- Stored in `accounting_periods` table

**Enhancement:**
```typescript
// Allow user to define custom periods in Settings
customPeriods: {
  period_type: 'monthly' | 'weekly' | 'quarterly' | 'custom',
  start_date: Date,
  end_date: Date,
  closing_day: number, // Day of month to close
  auto_approve_on_date: Date
}
```

---

### **Phase D: Dashboard Widget Customization**

**Status:** 🔴 FIXED (All users see same widgets)

**Enhancement:**
```typescript
// Allow users to:
1. Reorder KPI cards
2. Show/hide specific metrics
3. Change chart types (bar → line → area)
4. Select date range dynamically
5. Add custom calculated columns

// Store preferences:
CREATE TABLE user_dashboard_preferences (
  id UUID PRIMARY KEY,
  user_id UUID,
  widget_id VARCHAR,
  is_visible BOOLEAN,
  position INT,
  config JSONB
);
```

---

### **Phase E: Report Customization**

**Status:** ⚠️ Partially Implemented

**Current Reports Available:**
- Top profit by vehicle
- Top profit by driver
- Revenue trend (6 months)
- Expense breakdown by type

**Enhancement:**
```typescript
// Custom Report Builder
customReports: {
  name: string,
  metric: 'revenue' | 'expense' | 'profit' | 'kpi',
  group_by: 'vehicle' | 'driver' | 'route' | 'customer' | 'date',
  filter_by: {
    date_range: [start, end],
    status: string[],
    custom_filters: object
  },
  chart_type: 'bar' | 'line' | 'pie' | 'table'
}
```

---

## 🔧 IMPLEMENTATION PRIORITY

### **TIER 1 (HIGH IMPACT - Do First)**
- [ ] Add formula parameters to `company_settings`
- [ ] Create Settings UI to edit parameters
- [ ] Refactor calculation functions to use settings
- [ ] Update materialized views to use parameterized formulas

### **TIER 2 (MEDIUM IMPACT - Do Next)**
- [ ] Create custom formula UI
- [ ] Add accounting period customization
- [ ] Allow dashboard widget reordering

### **TIER 3 (NICE TO HAVE - Do Later)**
- [ ] Advanced report builder
- [ ] Formula validation & error handling
- [ ] Formula versioning & audit trail
- [ ] Formula templates library

---

## 📐 FORMULA ARCHITECTURE (PROPOSED)

```typescript
// File: src/lib/calculationEngine.ts

interface CompanySettings {
  // Revenue parameters
  base_price_per_km: number;
  surcharge_long_distance_km: number;
  surcharge_multiplier: number;
  
  // Expense parameters
  fuel_cost_per_km: number;
  toll_cost_per_trip: number;
  maintenance_pct: number;
  
  // KPI parameters
  driver_bonus_per_trip: number;
  vehicle_depreciation_rate: number;
}

interface TripData {
  id: string;
  distance: number;
  expenses: Expense[];
  status: string;
}

// Calculate revenue using settings
function calculateTripRevenue(trip: TripData, settings: CompanySettings): number {
  let revenue = trip.distance * settings.base_price_per_km;
  
  if (trip.distance > settings.surcharge_long_distance_km) {
    revenue *= settings.surcharge_multiplier;
  }
  
  return revenue;
}

// Calculate expenses using settings
function calculateTripExpense(trip: TripData, settings: CompanySettings): number {
  let expense = settings.toll_cost_per_trip;
  expense += trip.distance * settings.fuel_cost_per_km;
  
  // Add allocated expenses
  trip.expenses
    .filter(e => e.status === 'confirmed')
    .forEach(e => expense += e.allocated_amount);
  
  return expense;
}

// Calculate profit
function calculateTripProfit(trip: TripData, settings: CompanySettings): number {
  const revenue = calculateTripRevenue(trip, settings);
  const expense = calculateTripExpense(trip, settings);
  return revenue - expense;
}

// Calculate Driver KPI
function calculateDriverBonus(profit: number, trips: number, settings: CompanySettings): number {
  let bonus = trips * settings.driver_bonus_per_trip;
  
  if (profit > settings.driver_bonus_if_profit_above) {
    bonus += settings.driver_bonus_if_profit_amount;
  }
  
  return bonus;
}
```

---

## 🗂️ FILES TO MODIFY

### **Frontend Changes:**

1. **src/pages/Settings.tsx**
   - Add formula parameters UI
   - Create form for company_settings
   - Add save/load logic

2. **src/hooks/useCompanySettings.ts**
   - Add fetch for new formula fields
   - Add mutation for updating settings
   - Add cache invalidation

3. **src/lib/calculationEngine.ts** (NEW)
   - Centralize all formula logic
   - Import settings from company_settings
   - Export calculation functions

4. **src/hooks/useTrips.ts**
   - Import calculation functions
   - Use settings instead of hardcoded values
   - Re-calculate on settings change

5. **src/pages/Reports.tsx**
   - Use new calculation engine
   - Reflect setting changes in KPIs

### **Backend Changes:**

1. **supabase/migrations/ULTIMATE_MIGRATION.sql**
   - Modify `company_settings` table to add formula fields
   - Create triggers to update materialized views on settings change
   - Add stored procedures for calculations

2. **supabase/migrations/CREATE_CALCULATION_FUNCTIONS.sql** (NEW)
   - Create SQL functions for calculations
   - Make functions parameterizable
   - Return results based on company_settings

---

## ✅ VERIFICATION CHECKLIST

After implementing customization:

- [ ] User can change `base_price_per_km` in Settings
- [ ] All trip revenues recalculate with new price
- [ ] Dashboard KPIs update automatically
- [ ] Reports show new calculations
- [ ] Historical data not affected (only new calculations use new settings)
- [ ] Settings changes logged for audit trail
- [ ] User can revert to default settings
- [ ] All calculations visible in calculation engine
- [ ] No hardcoded values in formulas

---

## 🎯 END STATE (Vision)

**User can configure 100% of business logic without touching code:**

```
Settings Tab → Company Settings → Formula Configuration

├─ Revenue Calculation
│  ├─ Base Price: [50000] ₫/km
│  ├─ Long Distance Threshold: [1000] km
│  ├─ Long Distance Surcharge: [1.2] ×
│  └─ Premium Service Fee: [500000] ₫
│
├─ Expense Calculation
│  ├─ Fuel Cost: [15000] ₫/km
│  ├─ Toll Cost: [200000] ₫/trip
│  ├─ Maintenance %: [5] %
│  └─ Insurance %: [2] %
│
├─ Driver KPI
│  ├─ Bonus Per Trip: [100000] ₫
│  ├─ Bonus If Profit >[1000000] ₫: [500000] ₫
│  └─ Late Delivery Penalty: [50000] ₫
│
└─ Vehicle KPI
   ├─ Maintenance Interval: [5000] km
   ├─ Depreciation Rate: [2] %/month
   └─ Utilization Target: [80] %

[SAVE] [DEFAULT] [CALCULATE SAMPLE]
```

**Result:** Every user has own business logic, no code changes needed! 🚀

