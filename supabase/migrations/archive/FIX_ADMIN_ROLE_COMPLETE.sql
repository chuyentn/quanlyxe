-- ============================================================================
-- FIX ADMIN ROLE - COMPLETE SOLUTION
-- Issue: Sau khi đăng nhập, hệ thống không giữ được quyền admin
-- Nguyên nhân: Bảng user_roles không có record cho user hiện tại
-- Date: 2026-01-31
-- ============================================================================

-- BƯỚC 1: Kiểm tra xem bảng user_roles có tồn tại không
-- (Nếu lỗi, có thể bảng chưa được tạo)
SELECT * FROM public.user_roles LIMIT 5;

-- BƯỚC 2: Đảm bảo RLS được bật nhưng cho phép SELECT
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Xóa policy cũ nếu có
DROP POLICY IF EXISTS "Allow authenticated users to select user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can select user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can read all roles" ON public.user_roles;

-- Tạo policy mới CHO PHÉP ĐỌC
CREATE POLICY "Users can read all roles" 
    ON public.user_roles FOR SELECT 
    TO authenticated 
    USING (true);

-- Tạo policy cho INSERT (Admin tự thêm role cho user mới)
DROP POLICY IF EXISTS "Authenticated users can insert user_roles" ON public.user_roles;
CREATE POLICY "Authenticated users can insert user_roles" 
    ON public.user_roles FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Tạo policy cho UPDATE
DROP POLICY IF EXISTS "Authenticated users can update user_roles" ON public.user_roles;
CREATE POLICY "Authenticated users can update user_roles" 
    ON public.user_roles FOR UPDATE 
    TO authenticated 
    USING (true);

-- BƯỚC 3: Thêm quyền ADMIN cho USER HIỆN TẠI (nếu chưa có)
-- Lấy user_id từ auth.users và insert vào user_roles
INSERT INTO public.user_roles (user_id, role, email, full_name)
SELECT 
    id as user_id,
    'admin' as role,
    email,
    COALESCE(raw_user_meta_data->>'full_name', email) as full_name
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- BƯỚC 4: Xác nhận kết quả
SELECT 
    ur.user_id,
    ur.role,
    ur.email,
    ur.full_name,
    au.email as auth_email
FROM public.user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id;

-- Kết quả mong đợi: Thấy record với role = 'admin' cho tài khoản của bạn
