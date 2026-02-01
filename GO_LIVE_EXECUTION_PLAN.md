#!/bin/bash
# ============================================================================
# FLEET MANAGEMENT APP - GO-LIVE EXECUTION PLAN
# Project: vi-t-truck-manager
# Supabase Project: limplhlzsonfphiprgkx
# Timeline: 24-28 Jan 2026 (Estimated)
# ============================================================================

## EXECUTIVE SUMMARY

**Current Status:** 🔴 **NOT READY FOR PRODUCTION**
**Timeline to Launch:** 3-5 business days
**Blocker Count:** 6 Critical, 4 Major, 5 Minor

**Critical Path:**
1. Clean demo data (1 day)
2. Implement missing business logic (2 days)
3. RLS security implementation (1 day)
4. Testing & validation (1 day)
5. UAT & sign-off (1 day)

---

## PHASE-BY-PHASE EXECUTION PLAN

### PHASE 1: DATA CLEANUP (24 Jan - 8 hours)

**Objective:** Remove 100+ demo records safely without data loss

**Steps:**
```sql
-- 1. Backup database
Supabase Dashboard → Database → Backups → Create Backup
(Estimated time: 5 minutes, backup file = ~2-5MB)

-- 2. Run cleanup script
Open Supabase SQL Editor
Copy content from: supabase/migrations/CLEAN_DEMO_DATA.sql
Run entire script in transaction
Verify: All active counts = 0

-- 3. Verify views updated
SELECT COUNT(*) FROM trip_financials;  -- Should = 0
SELECT COUNT(*) FROM vehicle_performance;  -- Should = 0
```

**Success Criteria:**
- ✅ All vehicles with code 'XE-%' marked as deleted
- ✅ All drivers with code 'TX-%' marked as deleted
- ✅ All demo routes, customers, trips soft-deleted
- ✅ Views return 0 rows (no data shown to users)
- ✅ No orphaned FK records

**Rollback Plan:** If anything breaks → Restore from backup (5 minutes)

---

### PHASE 2: IMPLEMENT MISSING BUSINESS LOGIC (25-26 Jan - 16 hours)

#### Task 2.1: Expense Allocation Validation (2 hours)

**Issue:** System allows expenses > trip revenue (over-allocation)

**Solution:**
```sql
-- Add constraint to prevent over-allocation
ALTER TABLE expense_allocations ADD CONSTRAINT 
  check_allocation_not_exceed_revenue 
  CHECK (allocated_amount <= (
    SELECT revenue_amount FROM trips WHERE id = trip_id
  ));

-- Create trigger to validate sum of allocations
CREATE OR REPLACE FUNCTION validate_expense_allocation()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT SUM(allocated_amount) FROM expense_allocations WHERE trip_id = NEW.trip_id) 
     > (SELECT revenue_amount FROM trips WHERE id = NEW.trip_id) THEN
    RAISE EXCEPTION 'Allocated expenses exceed trip revenue';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_allocation
BEFORE INSERT OR UPDATE ON expense_allocations
FOR EACH ROW EXECUTE FUNCTION validate_expense_allocation();
```

**Testing:**
- Create trip with revenue 10M
- Try to allocate 15M → Should fail with error message
- Check error message is user-friendly (not raw SQL)

**Acceptance Criteria:**
- ✅ Cannot create over-allocated trip
- ✅ Error message says: "Allocated expenses (15M) exceed trip revenue (10M)"
- ✅ Existing data validated on startup

---

#### Task 2.2: Trip State Machine Implementation (4 hours)

**Issue:** Trip can transition to invalid states (e.g., COMPLETED → CANCELLED)

**Valid Transitions:**
```
NEW → ASSIGNED → IN_TRANSIT → DELIVERED → COMPLETED (or CANCELLED at any point)
```

**Solution:**
```sql
-- Create valid state transition table
CREATE TABLE trip_state_transitions (
  from_state TEXT,
  to_state TEXT,
  is_allowed BOOLEAN,
  PRIMARY KEY (from_state, to_state)
);

INSERT INTO trip_state_transitions VALUES
('NEW', 'ASSIGNED', true),
('NEW', 'CANCELLED', true),
('ASSIGNED', 'IN_TRANSIT', true),
('ASSIGNED', 'CANCELLED', true),
('IN_TRANSIT', 'DELIVERED', true),
('IN_TRANSIT', 'CANCELLED', true),
('DELIVERED', 'COMPLETED', true),
('DELIVERED', 'CANCELLED', true),
('COMPLETED', 'CANCELLED', false),
('CANCELLED', '*', false);

-- Create validation trigger
CREATE OR REPLACE FUNCTION validate_trip_state_transition()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NOT EXISTS (
      SELECT 1 FROM trip_state_transitions
      WHERE from_state = OLD.status 
        AND to_state = NEW.status 
        AND is_allowed = true
    ) THEN
      RAISE EXCEPTION 'Invalid trip state transition: % → %', OLD.status, NEW.status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_trip_state
BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION validate_trip_state_transition();
```

**Testing:**
- Create new trip → Change to ASSIGNED → OK ✅
- Change from COMPLETED → CANCELLED → Should fail ❌
- Verify error message: "Invalid trip state transition: COMPLETED → CANCELLED"

**Acceptance Criteria:**
- ✅ Only valid transitions allowed
- ✅ Invalid transitions rejected with clear error
- ✅ State machine documented in database

---

#### Task 2.3: Trip Audit Log Trigger (2 hours)

**Issue:** Trip changes not logged; cannot audit who changed what

**Solution:**
```sql
-- Create audit log trigger
CREATE OR REPLACE FUNCTION log_trip_state_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO trip_audit_log (trip_id, old_state, new_state, changed_by, changed_at)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_trip_state
AFTER UPDATE ON trips
FOR EACH ROW EXECUTE FUNCTION log_trip_state_change();

-- Verify trigger is working
SELECT * FROM trip_audit_log ORDER BY changed_at DESC LIMIT 10;
```

**Testing:**
- Create trip in NEW state
- Change to ASSIGNED → Verify entry in trip_audit_log
- Verify changed_by = current user, changed_at = now

**Acceptance Criteria:**
- ✅ Every trip state change logged
- ✅ Audit log shows user, old state, new state, timestamp
- ✅ Cannot be disabled by users

---

#### Task 2.4: Expense Category Dynamic Loading (4 hours)

**Issue:** Expense categories hard-coded in UI; new categories don't appear without code deployment

**UI Changes (React):**
```typescript
// src/components/Expenses/ExpenseForm.tsx

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function ExpenseForm() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load categories dynamically from DB
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_deleted', false)
        .order('category_name');
      
      if (error) {
        console.error('Failed to load expense categories:', error);
        setCategories([]);
      } else {
        setCategories(data || []);
      }
      setLoading(false);
    };

    loadCategories();
  }, []);

  return (
    <select disabled={loading}>
      <option value="">-- Select Category --</option>
      {categories.map(cat => (
        <option key={cat.id} value={cat.id}>
          {cat.category_name} ({cat.category_type})
        </option>
      ))}
    </select>
  );
}
```

**API Testing:**
```bash
# Verify categories endpoint
curl -X GET \
  https://limplhlzsonfphiprgkx.supabase.co/rest/v1/expense_categories?is_deleted=eq.false \
  -H "apikey: $SUPABASE_KEY" \
  -H "Accept: application/json"

# Should return all active categories
```

**Acceptance Criteria:**
- ✅ Expense form loads categories from DB
- ✅ Adding new category to DB auto-appears in form
- ✅ No code deployment needed for new categories
- ✅ Categories load in < 500ms

---

#### Task 2.5: Dashboard Drilldown Implementation (4 hours)

**Issue:** Cannot drill from Dashboard metric → Detail Report → Source Document

**Current Flow:**
```
Dashboard (Total Expenses: 5M) 
   ↓ [BROKEN - no link]
   ✗ No drill-down available
```

**Target Flow:**
```
Dashboard (Total Expenses: 5M)
   ↓ [CLICK]
   → Expense Report (filtered to same period)
   → Click on expense row
   → View original Trip & Expense Document
```

**Implementation:**

1. **Update Dashboard component** (src/pages/Dashboard.tsx):
```typescript
export function Dashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState({
    from: '2026-01-01',
    to: '2026-01-31'
  });

  const handleDrillDown = (metric: string) => {
    // Navigate to detailed report with same period
    const params = new URLSearchParams({
      period_from: selectedPeriod.from,
      period_to: selectedPeriod.to,
      metric: metric
    });
    navigate(`/reports/expense-detail?${params.toString()}`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg"
      onClick={() => handleDrillDown('expenses')}
    >
      <CardContent>
        <p className="text-gray-600">Total Expenses</p>
        <p className="text-3xl font-bold">₫{totalExpenses.toLocaleString()}</p>
        <p className="text-xs text-gray-500 mt-2">Click to view details →</p>
      </CardContent>
    </Card>
  );
}
```

2. **Create Expense Detail Report** (src/pages/Reports/ExpenseDetail.tsx):
```typescript
export function ExpenseDetailReport() {
  const { period_from, period_to } = useSearchParams();

  const { data: expenses } = useExpenses(period_from, period_to);

  const handleExpenseClick = (expenseId: string, tripId: string) => {
    // Show expense detail modal with link to trip
    openExpenseModal(expenseId, tripId);
  };

  return (
    <DataTable
      columns={[
        { header: 'Expense Code', accessor: 'expense_code', className: 'cursor-pointer text-blue-600' },
        { header: 'Trip', accessor: 'trip_code' },
        { header: 'Amount', accessor: 'amount', format: 'currency' },
        { header: 'Category', accessor: 'category_name' },
        { header: 'Date', accessor: 'created_at', format: 'date' }
      ]}
      data={expenses}
      onRowClick={row => handleExpenseClick(row.id, row.trip_id)}
    />
  );
}
```

3. **Create Expense & Trip Detail Modal** (src/components/Expenses/ExpenseDetailModal.tsx):
```typescript
export function ExpenseDetailModal({ expenseId, tripId, onClose }) {
  const { data: expense } = useQuery(`expense-${expenseId}`, () => 
    supabase.from('expenses').select('*').eq('id', expenseId).single()
  );

  const { data: trip } = useQuery(`trip-${tripId}`, () =>
    supabase.from('trip_financials').select('*').eq('id', tripId).single()
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Expense Detail</DialogTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold">Expense Code</label>
              <p>{expense?.expense_code}</p>
            </div>
            <div>
              <label className="text-sm font-semibold">Amount</label>
              <p className="text-lg font-bold">₫{expense?.amount.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-semibold">Category</label>
              <p>{expense?.category_name}</p>
            </div>
            <div>
              <label className="text-sm font-semibold">Trip</label>
              <Link to={`/trips/${tripId}`} className="text-blue-600 hover:underline">
                {trip?.trip_code} →
              </Link>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-semibold">Description</label>
              <p className="text-gray-700">{expense?.description}</p>
            </div>
            <div className="col-span-2">
              <label className="text-sm font-semibold">Trip Summary</label>
              <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                <p>Revenue: ₫{trip?.revenue_amount.toLocaleString()}</p>
                <p>Expenses: ₫{trip?.total_expenses.toLocaleString()}</p>
                <p className="font-semibold">Margin: ₫{trip?.net_margin.toLocaleString()} ({trip?.margin_percentage}%)</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={onClose}>Close</Button>
            <Button variant="outline" asChild>
              <Link to={`/trips/${tripId}`}>View Full Trip</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };
}
```

**Testing Checklist:**
- ✅ Click Total Expenses on Dashboard → Navigate to expense report
- ✅ Click expense row → See expense detail + trip summary
- ✅ Click "View Full Trip" → Navigate to trip detail page
- ✅ Verify all metrics (revenue, expenses, margin) match between views

**Acceptance Criteria:**
- ✅ All Dashboard metrics have drill-down
- ✅ Drill-down preserves period filters
- ✅ Users can trace expense → trip → details in < 3 clicks
- ✅ No 404 errors when following drill-down links

---

### PHASE 3: SECURITY - ROW-LEVEL SECURITY (26 Jan - 4 hours)

**Issue:** No RLS policies; any user can access all data

**Solution:**
```sql
-- Enable RLS on all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;

-- Create role for authenticated users
CREATE ROLE authenticated;

-- Policy: Users can only see their organization's data
-- (Assumes users table has company_id / org_id field)
CREATE POLICY "Users see all data in their organization"
  ON vehicles FOR SELECT
  USING (
    company_id = (SELECT company_id FROM auth.users WHERE id = auth.uid())
  );

-- Similar policies for other tables...
-- Policy: Drivers can only see their own trip records
CREATE POLICY "Drivers see only their trips"
  ON trips FOR SELECT
  USING (
    driver_id = (SELECT id FROM drivers WHERE user_id = auth.uid())
  );

-- Policy: Managers can see all data
CREATE POLICY "Managers see all company data"
  ON vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
        AND role = 'manager'
        AND company_id = vehicles.company_id
    )
  );
```

**Testing:**
- Login as User A → Can only see User A's company data
- Login as User B (different company) → Cannot see User A's data
- Attempt direct API call with User A's token to User B's data → 403 Forbidden

**Acceptance Criteria:**
- ✅ RLS enabled on all tables
- ✅ Users can only see authorized data
- ✅ No data leakage between users/companies
- ✅ Audit log shows all access attempts

---

### PHASE 4: TESTING & VALIDATION (27 Jan - 8 hours)

#### Step 4.1: Create Real Test Data (1 hour)
```bash
# Run real test data creation script
Supabase SQL Editor
→ Copy content from: supabase/migrations/CREATE_REAL_TEST_DATA.sql
→ Execute

# Verify:
SELECT COUNT(*) FROM vehicles WHERE vehicle_code LIKE 'REAL-V%';  -- Should = 3
SELECT COUNT(*) FROM drivers WHERE driver_code LIKE 'REAL-TX%';  -- Should = 3
SELECT COUNT(*) FROM trips WHERE trip_code LIKE 'REAL-CHK%';     -- Should = 10
SELECT SUM(amount) FROM expenses WHERE expense_code LIKE 'REAL-EXP%';  -- Should = ~4.5M
```

#### Step 4.2: Regression Tests (2 hours)

**Test Suite 1: Data Integrity**
```sql
-- T1: No orphaned records
SELECT COUNT(*) as orphan_vehicles FROM vehicles 
WHERE id NOT IN (SELECT vehicle_id FROM trips WHERE vehicle_id IS NOT NULL);
-- Expected: 0 (or only REAL-V* unused)

-- T2: No over-allocated expenses
SELECT COUNT(*) as over_allocated FROM trips t
WHERE (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE trip_id = t.id) > t.revenue_amount;
-- Expected: 0

-- T3: Trip state validity
SELECT status, COUNT(*) FROM trips WHERE is_deleted = FALSE GROUP BY status;
-- Expected: Valid states only (NEW, ASSIGNED, IN_TRANSIT, DELIVERED, COMPLETED, CANCELLED)
```

**Test Suite 2: Business Logic**
```
T4: Create trip → Verify in dashboard ✅
T5: Add expense → Verify allocation validation ✅
T6: State transition NEW → ASSIGNED → IN_TRANSIT → OK ✅
T7: State transition COMPLETED → CANCELLED → FAIL ✅
T8: Audit log records state change ✅
```

**Test Suite 3: UI/UX**
```
T9: Dashboard loads (no errors, < 3 seconds) ✅
T10: Click expense metric → Drill-down works ✅
T11: Create vehicle → Form validation works ✅
T12: Create trip → Can select vehicle/driver/route ✅
T13: Export report → Excel file downloads correctly ✅
T14: Filter by date → Correct rows displayed ✅
T15: Soft-delete vehicle → No longer in active list ✅
```

**Test Suite 4: Cross-Check Reports**
```
T16: Dashboard total revenue = Trips report total revenue ✅
T17: Dashboard total expenses = Expense report total expenses ✅
T18: Dashboard margin = (Revenue - Expenses) ✅
T19: P&L by trip: Revenue > Expenses (profitable trip) ✅
T20: P&L by trip: Revenue < Expenses (loss-making trip) ✅
```

#### Step 4.3: Performance Testing (2 hours)

```
T21: Dashboard loads with 100 vehicles: < 3 seconds ✅
T22: Trip list loads with 1000 trips: < 5 seconds ✅
T23: Export 500 expenses: < 30 seconds ✅
T24: Search vehicles by code: < 500ms ✅
T25: Filter trips by date range: < 1 second ✅
```

#### Step 4.4: Security Testing (2 hours)

```
T26: User A cannot access User B's data (API test)
T27: Can generate auth token and access protected endpoints
T28: Expired token returns 401 Unauthorized
T29: Invalid SQL injection attempt blocked (e.g., ' OR 1=1)
T30: RLS policies enforce user isolation
```

#### Step 4.5: Error Handling (1 hour)

```
T31: Create trip with invalid vehicle_id → Error message shown
T32: Over-allocate expense → Validation error shown
T33: Invalid state transition → Friendly error message
T34: Disconnect from Supabase → Offline message shown
T35: Slow network → Loading spinner shown
```

**Success Criteria:** ✅ All 35 tests pass

---

### PHASE 5: USER ACCEPTANCE TESTING (27 Jan - 4 hours)

**UAT Participants:**
- Fleet Manager (key stakeholder)
- Accountant (financial review)
- System Administrator (technical sign-off)
- 1-2 real drivers/operators (practical testing)

**UAT Scenario 1: Complete Trip Workflow**
```
1. Fleet Manager creates new trip for route TPHCM → Biên Hòa
   - Select vehicle, driver, customer
   - Verify trip shows in "New Trips" list
   
2. Driver views assigned trip
   - Check trip details match what dispatcher entered
   
3. Driver marks "In Transit"
   - Verify status updates in real-time
   - Check Dashboard reflects state change
   
4. Driver marks "Delivered"
   - System prompts to log expenses
   
5. Driver adds expenses:
   - Fuel: ₫280K
   - Toll: ₫18K
   - Driver meal: ₫75K
   - Total: ₫373K
   
6. System marks "Completed"
   - Verify trip appears in Reports
   - Check margin calculation: Revenue ₫1.2M - Expenses ₫373K = ₫827K (68.9% margin)
   
7. Accountant reviews in Financial Report
   - Verify expense amounts match original logs
   - Can drill-down from Dashboard → Expense → Trip
   - Can export PDF with all details
```

**UAT Scenario 2: Multi-Trip Financial Analysis**
```
1. Run Financial Report for Jan 2026 (date range)
2. Compare Dashboard totals vs Report totals → Must match exactly
3. Verify P&L by trip (10 trips)
   - 9 profitable trips (margin > 0)
   - 1 loss-making trip (margin < 0)
4. Check total company margin: Should be positive
5. Export to Excel, verify formatting
```

**UAT Sign-Off:**
```
Fleet Manager: _____ (Signature) Date: _____
Accountant:    _____ (Signature) Date: _____
Tech Lead:     _____ (Signature) Date: _____

Approval: ☐ GO-LIVE   ☐ HOLD FOR FIXES   ☐ REJECT
Comments:
```

---

### PHASE 6: GO-LIVE PREPARATION (28 Jan - 2 hours)

#### Step 6.1: Final Checklist

```
✅ Demo data cleaned
✅ Business logic implemented (validation, state machine, audit)
✅ RLS enabled
✅ All 35 regression tests pass
✅ UAT sign-off obtained
✅ User training completed
✅ Runbooks created (how to operate, troubleshoot)
✅ Backup strategy documented
✅ Escalation contacts defined
✅ Monitoring/alerting configured
```

#### Step 6.2: Runbook Templates

**[Create] RUNBOOK_OPERATIONS.md**
```
# Fleet Management App - Operations Runbook

## Daily Tasks
1. Check Dashboard for trip exceptions (delays, cancellations)
2. Verify all completed trips logged in Expenses
3. Run end-of-day expense reconciliation

## Troubleshooting
### Problem: Trip shows wrong vehicle
- Check trip detail page
- Verify vehicle assignment
- Check trip audit log for state changes
- If wrong, contact System Administrator

### Problem: Expense doesn't appear in report
- Verify expense is not soft-deleted
- Check trip_id is valid
- Run data integrity check: `SELECT * FROM orphaned_records;`
- If still missing, restore from backup

## Escalation
- Data issues → System Administrator
- Report bugs → Development team
- Performance issues → Cloud Infrastructure team
```

**[Create] RUNBOOK_BACKUP.md**
```
# Backup & Disaster Recovery

## Automatic Backups
- Daily backup at 2:00 AM UTC
- Retention: 30 days
- Location: Supabase cloud storage (geo-redundant)

## Manual Backup
```
Supabase Dashboard
→ Database
→ Backups
→ Create Backup
```
Backup size: ~5-10 MB
Time to backup: ~5 minutes
Time to restore: ~10 minutes

## Recovery Process (if data loss)
1. Contact Supabase support (if entire DB corrupted)
2. Restore from latest backup:
   - Supabase Dashboard → Backups → Select backup → Restore
   - System will be in backup state (may lose recent data)
3. Verify data integrity after restore
4. Notify all users of recovery

## Testing Backup
- Monthly: Restore backup to staging → Verify data → Delete
- Check backup integrity: No corrupted records
```

#### Step 6.3: Monitoring & Alerts

**Configure Alerts (Supabase Dashboard → Settings → Alerts)**

```
Alert 1: High Error Rate
- Condition: HTTP 5xx errors > 10 in 5 minutes
- Action: Email ops@company.com
- Severity: Critical

Alert 2: Database Performance
- Condition: Query time > 5 seconds
- Action: Email ops@company.com
- Severity: Warning

Alert 3: Storage Usage
- Condition: Database > 80% capacity
- Action: Email admin@company.com
- Severity: Warning

Alert 4: Auth Failures
- Condition: Login failures > 20 in 1 hour
- Action: Email security@company.com
- Severity: Medium
```

#### Step 6.4: Communication Plan

**Send to All Users (Morning of GO-LIVE)**

```
Subject: Fleet Management System - LIVE TODAY

Hi Team,

Today we're launching the new Fleet Management App! 

New URL: https://fleet.company.com (or your domain)

Key Features:
✅ Real-time trip tracking
✅ Automatic expense logging
✅ Financial reporting & dashboards
✅ Mobile-friendly interface

What's Changed:
- No more Excel spreadsheets!
- Trip data syncs automatically
- Reports generate in seconds (not days)

If you encounter any issues:
📞 Call: IT Support +84-28-xxxx-xxxx
📧 Email: support@company.com
🕐 Response time: < 30 minutes

Training materials: 
📹 Video: https://...
📄 Guide: https://...

Let's do this! 🚀
```

---

## CRITICAL PATH SUMMARY

| Phase | Duration | Status | Notes |
|-------|----------|--------|-------|
| **Data Cleanup** | 8h | To-Do | Run CLEAN_DEMO_DATA.sql |
| **Business Logic** | 16h | To-Do | State machine + validation + audit |
| **Security (RLS)** | 4h | To-Do | Row-level security policies |
| **Testing** | 8h | To-Do | 35 regression tests + UAT |
| **Go-Live Prep** | 2h | To-Do | Runbooks, alerts, communication |
| **TOTAL** | 38h | | ~5 business days |

**Timeline:**
- **Day 1 (24 Jan):** Data cleanup + Business logic (8h + 4h) = 12h
- **Day 2 (25 Jan):** Business logic continued (12h) + Security (4h) = 16h
- **Day 3 (26 Jan):** Testing (8h) + Buffer
- **Day 4 (27 Jan):** UAT (4h) + Go-Live prep (2h)
- **Day 5 (28 Jan):** GO-LIVE!

---

## RISKS & MITIGATION

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| **Data corruption during cleanup** | High | Low | Backup before cleanup, test on staging |
| **RLS breaks access for valid users** | High | Medium | Test RLS thoroughly, gradual rollout |
| **Business logic validation too strict** | Medium | Medium | User testing before go-live, feedback loop |
| **Performance degradation with real data** | Medium | Low | Load testing with 1000+ records |
| **Users untrained, high error rate** | High | High | Comprehensive training, 24/7 support initial week |
| **Bugs discovered post-launch** | High | High | Quick rollback plan, backup restore capability |

---

## POST-LAUNCH (First Week)

### Day 1-3: HIGH ALERT
- Monitor error logs every hour
- Call users for feedback
- Quick fix for critical bugs
- Support team on standby 24/7

### Day 4-7: MONITORING
- Monitor system health daily
- Collect user feedback
- Plan improvements
- Team debriefing

### Week 2+: NORMAL OPERATIONS
- Regular backups verified
- Monthly performance reviews
- Continuous improvement

---

## SUCCESS METRICS

**System is successful if:**
- ✅ 99.9% uptime (max 1 hour downtime/month)
- ✅ All 35 regression tests pass
- ✅ < 5 critical bugs reported in first week
- ✅ Users complete tasks in < time expected
- ✅ All financial reports reconcile with Excel (historical)
- ✅ 90% user satisfaction score

---

## FINAL GO/NO-GO DECISION CRITERIA

**✅ GO-LIVE if:**
1. All 38 hours of work completed
2. All 35 regression tests PASS
3. UAT sign-off obtained from 3+ stakeholders
4. RLS security verified
5. Backup/recovery tested
6. Support runbooks completed
7. Team trained & ready

**❌ NO-GO if:**
1. Regression tests fail > 3 tests
2. Data integrity issues found
3. RLS not working correctly
4. UAT sign-off rejected
5. Team not ready (training incomplete)
6. Critical bugs unfixed

---

**Document Prepared By:** Principal QA + Solution Architect
**Date:** 23 Jan 2026
**Status:** READY FOR EXECUTION
**Next Milestone:** Complete Phase 1 (Data Cleanup) by EOD 24 Jan 2026
