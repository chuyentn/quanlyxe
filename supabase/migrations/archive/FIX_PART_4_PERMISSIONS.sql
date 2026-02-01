-- ============================================================================
-- MASTER FIX - PART 4 OF 4
-- 4. FIX TABLE PERMISSIONS (GRANT)
-- Run this script LAST to Ensure 'authenticated' role can actually access the tables
-- ============================================================================

-- Grant access to user_roles (Critical for Admin check)
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_roles TO service_role;

-- Grant access to catalog tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.drivers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.routes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trips TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounting_periods TO authenticated;

-- Grant access to settings tables
GRANT SELECT, INSERT, UPDATE ON public.company_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.security_settings TO authenticated;

-- Grant usesr to read auth.users (Optional, but often needed for user management)
-- Note: Supabase usually handles this via wrapper, but sometimes we need explicit grant for joins
-- GRANT SELECT ON auth.users TO authenticated; -- Be careful with this, usually not needed if using user_roles

-- Re-grant views just in case
GRANT SELECT ON public.trip_financials TO authenticated;
GRANT SELECT ON public.vehicle_performance TO authenticated;
GRANT SELECT ON public.driver_performance TO authenticated;
GRANT SELECT ON public.expense_summary_by_category TO authenticated;
GRANT ALL ON public.maintenance_orders TO authenticated;

-- Force refresh of schema cache (sometimes needed)
NOTIFY pgrst, 'reload config';
