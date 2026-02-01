-- ============================================================================
-- MASTER FIX - PART 1 OF 3
-- 1. FIX USER_ROLES and ADMIN ACCESS
-- Run this script FIRST in Supabase SQL Editor
-- ============================================================================

-- 1.1 Ensure user_roles table exists
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer',
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Add unique constraint
DO $migration$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_key' 
        AND conrelid = 'public.user_roles'::regclass
    ) THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint may already exist, ignoring error';
END $migration$;

-- 1.3 Add missing columns (email, full_name, timestamps)
DO $migration$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'email') THEN
        ALTER TABLE public.user_roles ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'full_name') THEN
        ALTER TABLE public.user_roles ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_roles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_roles' AND column_name = 'created_at') THEN
        ALTER TABLE public.user_roles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $migration$;

-- 1.4 Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1.5 Create RLS policies for user_roles
DROP POLICY IF EXISTS "Users can read all roles" ON public.user_roles;
CREATE POLICY "Users can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert roles" ON public.user_roles;
CREATE POLICY "Users can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update roles" ON public.user_roles;
CREATE POLICY "Users can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (true);

-- 1.6 Set ADMIN role for current user
INSERT INTO public.user_roles (user_id, role, email, full_name)
SELECT 
    id,
    'admin',
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- Verification
SELECT * FROM public.user_roles;
