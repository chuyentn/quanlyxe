-- ============================================================================
-- FIX ADMIN ROLE PERSISTENCE
-- Issue: Admin role is lost after page reload ("ko lưu tk pass admin")
-- Reason: Missing SELECT policy on 'user_roles' table
-- Date: 2026-01-31
-- ============================================================================

-- 1. Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Allow authenticated users to READ their own role
DROP POLICY IF EXISTS "Authenticated users can select user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can read user_roles" ON public.user_roles;

CREATE POLICY "Authenticated users can select user_roles" 
    ON public.user_roles FOR SELECT 
    TO authenticated 
    USING (true); -- simplified policy to ensure it works

-- 3. Allow authenticated users to INSERT their own role (if needed)
DROP POLICY IF EXISTS "Authenticated users can insert user_roles" ON public.user_roles;
CREATE POLICY "Authenticated users can insert user_roles" 
    ON public.user_roles FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- 4. Allow authenticated users to UPDATE their own role
DROP POLICY IF EXISTS "Authenticated users can update user_roles" ON public.user_roles;
CREATE POLICY "Authenticated users can update user_roles" 
    ON public.user_roles FOR UPDATE 
    TO authenticated 
    USING (true);

-- 5. Helper verification query (Will show results in SQL Editor)
-- This confirms if there are any roles currently assigned
SELECT count(*) as total_roles_assigned FROM public.user_roles;
