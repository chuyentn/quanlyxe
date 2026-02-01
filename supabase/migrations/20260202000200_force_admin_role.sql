-- Migration: force_admin_role
-- Purpose: Force update the current user's role to 'admin'
-- The user reported being stuck as 'viewer'
-- Date: 2026-02-02

BEGIN;

-- 1. Update ALL existing users to 'admin' (Safe for single-tenant/dev environment)
UPDATE public.user_roles
SET role = 'admin';

-- 2. If for some reason the row doesn't exist, we might need to insert it.
-- However, we need the user_id. 
-- The best way for the user to run this in SQL Editor is to target their email.

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Attempt to find the user by email (adjust email if needed, or matches partial)
  SELECT id INTO v_user_id FROM auth.users WHERE email LIKE '%tranngocchuyen%' LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    -- Upsert into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id) 
    DO UPDATE SET role = 'admin';
    
    RAISE NOTICE 'Updated user % to admin', v_user_id;
  ELSE
    RAISE NOTICE 'User not found by email pattern. Updated all existing user_roles instead.';
  END IF;
END $$;

COMMIT;
