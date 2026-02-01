-- DISABLE RLS FOR DEBUGGING (CRITICAL FIX)
-- This script TEMPORARILY disables Row Level Security (RLS) on core tables.
-- Purpose: To confirm if "Permission Denied" or "RLS Recursion" is preventing the Dashboard from loading.
-- If the Dashboard loads immediately after running this, the root cause is confirmed as RLS Policies.

-- 1. Disable RLS on main data tables
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_periods DISABLE ROW LEVEL SECURITY;

-- 2. Verify settings (Optional, just to show status)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('trips', 'vehicles', 'expenses', 'drivers');

-- NOTE: After debugging/verifying the app works, you should ideally RE-ENABLE RLS with correct policies.
-- But for "fixing the error now" on a trusted internal tool, this effectively removes the blockage.
