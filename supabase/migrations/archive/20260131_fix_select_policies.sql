-- ============================================================================
-- FIX MISSING SELECT POLICIES
-- Issue: Catalog tabs (Vehicles, Drivers, etc.) spinning indefinitely
-- Reason: Missing SELECT policies for 'authenticated' role when RLS is enabled
-- Date: 2026-01-31
-- ============================================================================

-- 1. VEHICLES
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select vehicles" ON public.vehicles;
CREATE POLICY "Authenticated users can select vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);

-- 2. DRIVERS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select drivers" ON public.drivers;
CREATE POLICY "Authenticated users can select drivers" ON public.drivers FOR SELECT TO authenticated USING (true);

-- 3. ROUTES
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select routes" ON public.routes;
CREATE POLICY "Authenticated users can select routes" ON public.routes FOR SELECT TO authenticated USING (true);

-- 4. CUSTOMERS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select customers" ON public.customers;
CREATE POLICY "Authenticated users can select customers" ON public.customers FOR SELECT TO authenticated USING (true);

-- 5. TRIPS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select trips" ON public.trips;
CREATE POLICY "Authenticated users can select trips" ON public.trips FOR SELECT TO authenticated USING (true);

-- 6. EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select expenses" ON public.expenses;
CREATE POLICY "Authenticated users can select expenses" ON public.expenses FOR SELECT TO authenticated USING (true);

-- 7. MAINTENANCE
ALTER TABLE public.maintenance_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select maintenance_orders" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can select maintenance_orders" ON public.maintenance_orders FOR SELECT TO authenticated USING (true);

-- 8. EXPENSE CATEGORIES
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select categories" ON public.expense_categories;
CREATE POLICY "Authenticated users can select categories" ON public.expense_categories FOR SELECT TO authenticated USING (true);

-- 9. ACCOUNTING PERIODS
ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select periods" ON public.accounting_periods;
CREATE POLICY "Authenticated users can select periods" ON public.accounting_periods FOR SELECT TO authenticated USING (true);

-- 10. Grant Usage on Sequences (just in case)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
