-- Migration: grant_full_admin_access_v2
-- Purpose: Bypass restrictive RLS policies for users with role='admin'
-- Corrected to use 'user_roles' table instead of non-existent 'users'
-- Date: 2026-02-02

BEGIN;

-- 1. Helper function to check admin status safely
-- Updated to check public.user_roles
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. "Admin Access All" Policies

-- Policy for VEHICLES
DROP POLICY IF EXISTS "admin_all_vehicles" ON public.vehicles;
CREATE POLICY "admin_all_vehicles" ON public.vehicles
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for DRIVERS
DROP POLICY IF EXISTS "admin_all_drivers" ON public.drivers;
CREATE POLICY "admin_all_drivers" ON public.drivers
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for TRIPS
DROP POLICY IF EXISTS "admin_all_trips" ON public.trips;
CREATE POLICY "admin_all_trips" ON public.trips
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for EXPENSES
DROP POLICY IF EXISTS "admin_all_expenses" ON public.expenses;
CREATE POLICY "admin_all_expenses" ON public.expenses
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for CUSTOMERS
DROP POLICY IF EXISTS "admin_all_customers" ON public.customers;
CREATE POLICY "admin_all_customers" ON public.customers
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for ROUTES
DROP POLICY IF EXISTS "admin_all_routes" ON public.routes;
CREATE POLICY "admin_all_routes" ON public.routes
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for MAINTENANCE_ORDERS
DROP POLICY IF EXISTS "admin_all_maintenance" ON public.maintenance_orders;
CREATE POLICY "admin_all_maintenance" ON public.maintenance_orders
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for EXPENSE_ALLOCATIONS
DROP POLICY IF EXISTS "admin_all_allocations" ON public.expense_allocations;
CREATE POLICY "admin_all_allocations" ON public.expense_allocations
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for USER_ROLES (Admin needs to see roles)
DROP POLICY IF EXISTS "admin_all_user_roles" ON public.user_roles;
CREATE POLICY "admin_all_user_roles" ON public.user_roles
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for PROFILES (If exists)
DROP POLICY IF EXISTS "admin_all_profiles" ON public.profiles;
CREATE POLICY "admin_all_profiles" ON public.profiles
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for EXPENSE_CATEGORIES
DROP POLICY IF EXISTS "admin_all_expense_categories" ON public.expense_categories;
CREATE POLICY "admin_all_expense_categories" ON public.expense_categories
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

COMMIT;
