-- ============================================================================
-- UPDATE USER_ROLES TABLE - ADD EMAIL AND FULL_NAME COLUMNS
-- For client-side user management without admin API access
-- Date: 2026-01-31
-- ============================================================================

-- Add email column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.user_roles ADD COLUMN email TEXT;
    END IF;
END $$;

-- Add full_name column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles' 
        AND column_name = 'full_name'
    ) THEN
        ALTER TABLE public.user_roles ADD COLUMN full_name TEXT;
    END IF;
END $$;

-- Add created_at column if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.user_roles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Ensure RLS policies for user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read user_roles
DROP POLICY IF EXISTS "Authenticated users can read user_roles" ON public.user_roles;
CREATE POLICY "Authenticated users can read user_roles" 
    ON public.user_roles FOR SELECT 
    TO authenticated 
    USING (true);

-- Allow authenticated users to insert user_roles (admin check done at app level)
DROP POLICY IF EXISTS "Authenticated users can insert user_roles" ON public.user_roles;
CREATE POLICY "Authenticated users can insert user_roles" 
    ON public.user_roles FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Allow authenticated users to update user_roles
DROP POLICY IF EXISTS "Authenticated users can update user_roles" ON public.user_roles;
CREATE POLICY "Authenticated users can update user_roles" 
    ON public.user_roles FOR UPDATE 
    TO authenticated 
    USING (true);

-- Allow authenticated users to delete user_roles
DROP POLICY IF EXISTS "Authenticated users can delete user_roles" ON public.user_roles;
CREATE POLICY "Authenticated users can delete user_roles" 
    ON public.user_roles FOR DELETE 
    TO authenticated 
    USING (true);

-- Insert default admin role for the current logged-in user if not exists
-- Note: You need to run this with the actual admin user_id from auth.users
-- INSERT INTO public.user_roles (user_id, role, email, full_name)
-- SELECT id, 'admin', email, raw_user_meta_data->>'full_name'
-- FROM auth.users
-- WHERE email = 'admin@yourcompany.com'
-- ON CONFLICT (user_id) DO NOTHING;
