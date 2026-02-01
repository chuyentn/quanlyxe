-- FIX RLS POLICIES FOR DASHBOARD & REPORTS (FULL)
-- Run this script in Supabase SQL Editor to unblock Admin Dashboard

-- 1. Enable RLS on all relevant tables
ALTER TABLE IF EXISTS public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.maintenance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accounting_periods ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies and create permissive SELECT policies for Authenticated users
-- We use DO blocks to avoid errors if policies don't exist

-- Vehicles
DROP POLICY IF EXISTS "Authenticated users can select vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Reports_View_Vehicles" ON public.vehicles;
CREATE POLICY "Authenticated users can select vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true);

-- Drivers
DROP POLICY IF EXISTS "Authenticated users can select drivers" ON public.drivers;
DROP POLICY IF EXISTS "Reports_View_Drivers" ON public.drivers;
CREATE POLICY "Authenticated users can select drivers" ON public.drivers FOR SELECT TO authenticated USING (true);

-- Trips
DROP POLICY IF EXISTS "Authenticated users can select trips" ON public.trips;
DROP POLICY IF EXISTS "Reports_View_Trips" ON public.trips;
CREATE POLICY "Authenticated users can select trips" ON public.trips FOR SELECT TO authenticated USING (true);

-- Expenses
DROP POLICY IF EXISTS "Authenticated users can select expenses" ON public.expenses;
DROP POLICY IF EXISTS "Reports_View_Expenses" ON public.expenses;
CREATE POLICY "Authenticated users can select expenses" ON public.expenses FOR SELECT TO authenticated USING (true);

-- Expense Categories
DROP POLICY IF EXISTS "Authenticated users can select expense_categories" ON public.expense_categories;
DROP POLICY IF EXISTS "Reports_View_Categories" ON public.expense_categories;
CREATE POLICY "Authenticated users can select expense_categories" ON public.expense_categories FOR SELECT TO authenticated USING (true);

-- Maintenance Orders
DROP POLICY IF EXISTS "Authenticated users can read maintenance_orders" ON public.maintenance_orders;
DROP POLICY IF EXISTS "Authenticated users can select maintenance_orders" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can select maintenance_orders" ON public.maintenance_orders FOR SELECT TO authenticated USING (true);

-- Accounting Periods
DROP POLICY IF EXISTS "Authenticated users can select accounting_periods" ON public.accounting_periods;
CREATE POLICY "Authenticated users can select accounting_periods" ON public.accounting_periods FOR SELECT TO authenticated USING (true);

-- 3. GRANT PERMISSIONS ON VIEWS (Critical for Dashboard)
GRANT SELECT ON public.trip_financials TO authenticated;
GRANT SELECT ON public.vehicle_performance TO authenticated;
GRANT SELECT ON public.driver_performance TO authenticated;

-- 4. Verify results
SELECT 'ALL Dashboard & Reports Policies Updated' as status;
