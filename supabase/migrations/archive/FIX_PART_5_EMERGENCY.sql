-- ============================================================================
-- MASTER FIX - PART 5 - EMERGENCY ACCESS (DISABLE SECURITY CHECKS)
-- Run this to TEMPORARILY disable Row Level Security (RLS)
-- This will confirm if permissions are causing the loading/admin issues.
-- ============================================================================

-- 1. Disable RLS on User Roles (The "Gatekeeper")
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- 2. Force update your specific user to ADMIN
UPDATE public.user_roles
SET role = 'admin'
WHERE email LIKE '%tranngocchuyen1980%'; -- Accounts for gmail.com

-- 3. Disable RLS on Data Tables ( To fix Infinite Loading)
ALTER TABLE public.vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings DISABLE ROW LEVEL SECURITY;

-- 4. Re-Grant Everything to Authenticated Users (Maximum Access)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 5. Verify the Admin Status
SELECT * FROM public.user_roles WHERE email LIKE '%tranngocchuyen%';
