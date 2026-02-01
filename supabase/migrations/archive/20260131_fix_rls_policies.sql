-- ============================================================================
-- FIX RLS POLICIES - ALLOW INSERT/UPDATE/DELETE
-- Issue: "new row violates row-level security policy"
-- Reason: Previous migration only added SELECT policies
-- Date: 2026-01-31
-- ============================================================================

-- 1. VEHICLES
DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON public.vehicles;
CREATE POLICY "Authenticated users can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update vehicles" ON public.vehicles;
CREATE POLICY "Authenticated users can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete vehicles" ON public.vehicles;
CREATE POLICY "Authenticated users can delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (true);

-- 2. DRIVERS
DROP POLICY IF EXISTS "Authenticated users can insert drivers" ON public.drivers;
CREATE POLICY "Authenticated users can insert drivers" ON public.drivers FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update drivers" ON public.drivers;
CREATE POLICY "Authenticated users can update drivers" ON public.drivers FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete drivers" ON public.drivers;
CREATE POLICY "Authenticated users can delete drivers" ON public.drivers FOR DELETE TO authenticated USING (true);

-- 3. ROUTES
DROP POLICY IF EXISTS "Authenticated users can insert routes" ON public.routes;
CREATE POLICY "Authenticated users can insert routes" ON public.routes FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update routes" ON public.routes;
CREATE POLICY "Authenticated users can update routes" ON public.routes FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete routes" ON public.routes;
CREATE POLICY "Authenticated users can delete routes" ON public.routes FOR DELETE TO authenticated USING (true);

-- 4. CUSTOMERS
DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers;
CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

-- 5. TRIPS
DROP POLICY IF EXISTS "Authenticated users can insert trips" ON public.trips;
CREATE POLICY "Authenticated users can insert trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update trips" ON public.trips;
CREATE POLICY "Authenticated users can update trips" ON public.trips FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete trips" ON public.trips;
CREATE POLICY "Authenticated users can delete trips" ON public.trips FOR DELETE TO authenticated USING (true);

-- 6. EXPENSES
DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses;
CREATE POLICY "Authenticated users can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses;
CREATE POLICY "Authenticated users can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete expenses" ON public.expenses;
CREATE POLICY "Authenticated users can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (true);

-- 7. MAINTENANCE
DROP POLICY IF EXISTS "Authenticated users can insert maintenance" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can insert maintenance" ON public.maintenance_orders FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update maintenance" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can update maintenance" ON public.maintenance_orders FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete maintenance" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can delete maintenance" ON public.maintenance_orders FOR DELETE TO authenticated USING (true);

-- 8. EXPENSE CATEGORIES
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON public.expense_categories;
CREATE POLICY "Authenticated users can insert categories" ON public.expense_categories FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update categories" ON public.expense_categories;
CREATE POLICY "Authenticated users can update categories" ON public.expense_categories FOR UPDATE TO authenticated USING (true);

-- 9. ACCOUNTING PERIODS
DROP POLICY IF EXISTS "Authenticated users can insert periods" ON public.accounting_periods;
CREATE POLICY "Authenticated users can insert periods" ON public.accounting_periods FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update periods" ON public.accounting_periods;
CREATE POLICY "Authenticated users can update periods" ON public.accounting_periods FOR UPDATE TO authenticated USING (true);

