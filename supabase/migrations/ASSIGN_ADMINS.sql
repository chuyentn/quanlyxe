-- ASSIGN ADMIN ROLES TO 4 USERS
-- Run this script in Supabase SQL Editor

-- 1. Francis (73b4fbe4...)
INSERT INTO public.user_roles (user_id, role, email, full_name)
VALUES (
    '73b4fbe4-0257-48b0-ae4a-080d5f12d036', 
    'admin', 
    'francis.ho87@gmail.com',
    'Francis Ho'
)
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', updated_at = NOW();

-- 2. Chuyen (871d92ba...)
INSERT INTO public.user_roles (user_id, role, email, full_name)
VALUES (
    '871d92ba-0981-4fc5-9801-dd7b6977a883', 
    'admin', 
    'trangocchuyen1980@gmail.com',
    'Tran Ngoc Chuyen'
)
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', updated_at = NOW();

-- 3. Dat (a6cb37f3...)
INSERT INTO public.user_roles (user_id, role, email, full_name)
VALUES (
    'a6cb37f3-79a0-470c-acee-ab0bee918d6c', 
    'admin', 
    'dataphuan@gmail.com',
    'Dat Phan'
)
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', updated_at = NOW();

-- 4. Thuy (a0187ba9...)
INSERT INTO public.user_roles (user_id, role, email, full_name)
VALUES (
    'a0187ba9-0658-4f41-bad1-b4543c8a85e0', 
    'admin', 
    'thuthuyccr@gmail.com',
    'Thu Thuy'
)
ON CONFLICT (user_id) DO UPDATE 
SET role = 'admin', updated_at = NOW();

-- Verify
SELECT * FROM public.user_roles WHERE role = 'admin';
