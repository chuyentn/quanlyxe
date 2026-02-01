# 🚀 DEPLOYMENT CHECKLIST - Fleet Management System

**Version:** 1.0  
**Date:** 2026-01-22  
**Target:** Production Deployment

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### 1. Database Setup
- [ ] **Supabase project created**
  - Project name: _______________
  - Project URL: _______________
  - Project ref: _______________

- [ ] **Supabase CLI installed**
  ```bash
  npm install -g supabase
  supabase --version
  ```

- [ ] **Project linked**
  ```bash
  supabase link --project-ref YOUR_PROJECT_REF
  ```

- [ ] **Database backup created** (if existing data)
  ```bash
  supabase db dump -f backup_$(date +%Y%m%d).sql
  ```

---

### 2. Apply Migrations

- [ ] **Run auto-migration script**
  ```bash
  node scripts/apply-migrations.js
  ```

- [ ] **OR manually apply via Supabase Dashboard**
  - [ ] SQL Editor → Run `20260122_add_expense_allocations.sql`
  - [ ] SQL Editor → Run `20260122_add_accounting_periods.sql`
  - [ ] SQL Editor → Run `20260122_add_constraints_and_views.sql`
  - [ ] SQL Editor → Run `20260122_seed_data_part1.sql`
  - [ ] SQL Editor → Run `20260122_seed_data_part2.sql`
  - [ ] SQL Editor → Run `20260122_seed_data_part3.sql`
  - [ ] SQL Editor → Run `20260122_seed_data_part4.sql`

---

### 3. Verify Database

- [ ] **Check tables created**
  ```sql
  SELECT table_name FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('expense_allocations', 'accounting_periods');
  -- Should return 2 rows
  ```

- [ ] **Check views created**
  ```sql
  SELECT table_name FROM information_schema.views 
  WHERE table_schema = 'public';
  -- Should include: trip_financials, vehicle_performance, driver_performance, expense_summary_by_category
  ```

- [ ] **Verify seed data**
  ```sql
  SELECT 
    (SELECT COUNT(*) FROM vehicles WHERE is_deleted = false) as vehicles,
    (SELECT COUNT(*) FROM drivers WHERE is_deleted = false) as drivers,
    (SELECT COUNT(*) FROM routes WHERE is_deleted = false) as routes,
    (SELECT COUNT(*) FROM customers WHERE is_deleted = false) as customers,
    (SELECT COUNT(*) FROM trips WHERE is_deleted = false) as trips,
    (SELECT COUNT(*) FROM expenses WHERE is_deleted = false) as expenses;
  -- Should return: 30, 30, 30, 30, 15, 20
  ```

- [ ] **Test profit calculation**
  ```sql
  SELECT trip_code, total_revenue, total_expense, profit 
  FROM trip_financials 
  WHERE trip_code = 'CH-2024-001';
  -- Should show calculated profit
  ```

- [ ] **Test period lock**
  ```sql
  -- This should FAIL with error
  UPDATE trips SET freight_revenue = 99999999 
  WHERE trip_code = 'CH-2024-001';
  -- Expected: ERROR: Cannot modify trip in closed accounting period
  ```

- [ ] **Test allocation validation**
  ```sql
  -- This should FAIL (over 100%)
  INSERT INTO expense_allocations (expense_id, trip_id, allocated_amount)
  SELECT 
    (SELECT id FROM expenses WHERE expense_code = 'CP-2024-015'),
    (SELECT id FROM trips WHERE trip_code = 'CH-2024-002'),
    99999999;
  -- Expected: ERROR: Total allocation exceeds expense amount
  ```

---

### 4. Environment Setup

- [ ] **Create `.env.local` file**
  ```env
  VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
  VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
  ```

- [ ] **Install dependencies**
  ```bash
  npm install
  ```

- [ ] **Build project**
  ```bash
  npm run build
  ```

- [ ] **Test build locally**
  ```bash
  npm run preview
  ```

---

### 5. Authentication Setup

- [ ] **Enable Email Auth** in Supabase Dashboard
  - Authentication → Providers → Email → Enable

- [ ] **Create admin user**
  ```sql
  -- After user signs up via UI, assign admin role
  INSERT INTO user_roles (user_id, role)
  VALUES ('USER_UUID_HERE', 'admin');
  ```

- [ ] **Test RLS policies**
  - Login as admin → Should see all data
  - Login as viewer → Should see data but not edit

---

## ✅ DEPLOYMENT STEPS

### Option A: Vercel (Recommended)

- [ ] **Install Vercel CLI**
  ```bash
  npm install -g vercel
  ```

- [ ] **Deploy**
  ```bash
  vercel --prod
  ```

- [ ] **Set environment variables** in Vercel Dashboard
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Option B: Netlify

- [ ] **Install Netlify CLI**
  ```bash
  npm install -g netlify-cli
  ```

- [ ] **Deploy**
  ```bash
  netlify deploy --prod
  ```

- [ ] **Set environment variables** in Netlify Dashboard

### Option C: Manual Hosting

- [ ] **Build production bundle**
  ```bash
  npm run build
  ```

- [ ] **Upload `dist/` folder** to hosting provider

- [ ] **Configure environment variables** on server

---

## ✅ POST-DEPLOYMENT VERIFICATION

### 1. Smoke Tests

- [ ] **Homepage loads** without errors
- [ ] **Login works** with test account
- [ ] **Dashboard displays** real data (not mock)
- [ ] **All navigation links** work

### 2. CRUD Operations

- [ ] **Create vehicle** → Refresh → Vehicle persists ✓
- [ ] **Update vehicle** → Changes saved ✓
- [ ] **Search vehicle** → Results filter correctly ✓
- [ ] **Delete vehicle** → Soft delete (is_deleted=true) ✓

- [ ] **Create trip** → Shows in list ✓
- [ ] **Add expense to trip** → Profit recalculates ✓
- [ ] **Confirm trip** → Status changes ✓

### 3. Financial Accuracy

- [ ] **Dashboard totals** match Reports totals
- [ ] **Profit calculation** = Revenue - Confirmed Expenses
- [ ] **Allocated expenses** included in trip profit
- [ ] **Draft expenses** NOT included in profit

### 4. Period Lock

- [ ] **Closed period** shows lock icon
- [ ] **Cannot edit** trips in closed period
- [ ] **Cannot edit** expenses in closed period
- [ ] **Error message** clear and helpful

### 5. Performance

- [ ] **Page load** < 3 seconds
- [ ] **Search** responds instantly
- [ ] **Charts render** smoothly
- [ ] **No console errors**

---

## ✅ USER ACCEPTANCE TESTING

### Test Scenarios

- [ ] **Scenario 1: New Trip Workflow**
  1. Create new trip
  2. Confirm trip
  3. Add 3 expenses (fuel, toll, salary)
  4. Verify profit updates
  5. Close trip
  6. Verify appears in dashboard

- [ ] **Scenario 2: Shared Expense**
  1. Create fuel expense (not linked to trip)
  2. Allocate 40% to Trip A
  3. Allocate 35% to Trip B
  4. Allocate 25% to Trip C
  5. Verify both trips' profit updated

- [ ] **Scenario 3: Period Close**
  1. Verify all trips in period are CLOSED
  2. Close accounting period
  3. Try to edit trip → Should fail
  4. Try to add expense → Should fail
  5. Dashboard shows lock status

- [ ] **Scenario 4: Reports Drilldown**
  1. Click dashboard revenue card
  2. Verify opens trip list
  3. Click trip code
  4. Verify shows expense breakdown
  5. Numbers match dashboard

---

## ✅ ROLLBACK PLAN

If deployment fails:

### 1. Database Rollback

- [ ] **Restore from backup**
  ```bash
  supabase db reset
  psql -f backup_YYYYMMDD.sql
  ```

### 2. Application Rollback

- [ ] **Revert to previous deployment**
  ```bash
  vercel rollback  # or
  netlify rollback
  ```

### 3. Notify Users

- [ ] **Post maintenance notice**
- [ ] **Communicate ETA for fix**

---

## ✅ MONITORING SETUP

### 1. Error Tracking

- [ ] **Sentry** or similar configured
- [ ] **Error alerts** set up
- [ ] **Test error reporting**

### 2. Performance Monitoring

- [ ] **Vercel Analytics** enabled (if using Vercel)
- [ ] **Core Web Vitals** tracked
- [ ] **API response times** monitored

### 3. Database Monitoring

- [ ] **Supabase Dashboard** → Database → Performance
- [ ] **Set up alerts** for slow queries
- [ ] **Monitor connection pool**

---

## ✅ DOCUMENTATION

- [ ] **User guide** created
- [ ] **Admin guide** created
- [ ] **API documentation** (if applicable)
- [ ] **Troubleshooting guide** available

---

## ✅ TRAINING

- [ ] **Admin training** completed
- [ ] **User training** scheduled
- [ ] **Support team** briefed

---

## 📊 DEPLOYMENT SIGN-OFF

**Deployed by:** _______________  
**Date:** _______________  
**Time:** _______________  
**Environment:** [ ] Staging [ ] Production  

**Verification:**
- [ ] All checklist items completed
- [ ] No critical errors
- [ ] Performance acceptable
- [ ] Users can access system

**Approved by:** _______________  
**Signature:** _______________  
**Date:** _______________

---

## 🆘 SUPPORT CONTACTS

**Technical Lead:** _______________  
**Database Admin:** _______________  
**DevOps:** _______________  
**Emergency Hotline:** _______________

---

**Checklist Version:** 1.0  
**Last Updated:** 2026-01-22  
**Next Review:** After first production deployment
