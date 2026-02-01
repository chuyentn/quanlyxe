-- ============================================
-- Admin Login Verification Queries
-- Kiểm tra admin user có thể đăng nhập được không
-- ============================================

-- ============ PHẦN 1: KIỂM TRA CẤU TRÚC DATABASE ============

-- 1.1 Kiểm tra bảng auth.users tồn tại
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'auth' AND table_name = 'users';
-- Kết quả: Phải hiển thị 'users'

-- 1.2 Kiểm tra bảng public.user_roles tồn tại
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'user_roles';
-- Kết quả: Phải hiển thị 'user_roles'

-- ============ PHẦN 2: KIỂM TRA USER TỒN TẠI ============

-- 2.1 Danh sách toàn bộ users
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
ORDER BY created_at DESC;
-- Kết quả: Danh sách email của tất cả user

-- 2.2 Kiểm tra user cụ thể (thay email của bạn vào)
SELECT id, email, created_at, last_sign_in_at 
FROM auth.users 
WHERE email = 'your-admin-email@example.com';
-- Kết quả: Hiển thị user hoặc không có kết quả (nếu user không tồn tại)

-- ============ PHẦN 3: KIỂM TRA ROLE ============

-- 3.1 Danh sách tất cả user_roles
SELECT user_id, role 
FROM public.user_roles 
ORDER BY created_at DESC;
-- Kết quả: Danh sách user_id và role

-- 3.2 Kiểm tra role của user cụ thể
SELECT ur.user_id, ur.role, au.email, au.created_at
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE au.email = 'your-admin-email@example.com';
-- Kết quả: Nếu role = 'admin' thì OK, nếu khác hoặc không có thì cần sửa

-- 3.3 Kiểm tra có user admin không
SELECT COUNT(*) as admin_count
FROM public.user_roles
WHERE role = 'admin';
-- Kết quả: Phải > 0

-- ============ PHẦN 4: TẠII/CẬP NHẬT ADMIN ============

-- 4.1 TẠO admin mới (sau khi user đã tồn tại trong auth.users)
-- Bước 1: Lấy user_id từ email
WITH user_data AS (
  SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com'
)
-- Bước 2: Thêm vào user_roles với role admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM user_data
ON CONFLICT (user_id) DO UPDATE
SET role = 'admin';

-- 4.2 CẬP NHẬT user thành admin
UPDATE public.user_roles 
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com'
);

-- 4.3 ĐỔI admin thành manager (nếu cần)
UPDATE public.user_roles 
SET role = 'manager'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com'
);

-- ============ PHẦN 5: KIỂM TRA QUYỀN TRUY CẬP ============

-- 5.1 Kiểm tra RLS policy cho admin
SELECT 
  schemaname, tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename IN ('vehicles', 'drivers', 'trips', 'customers')
LIMIT 10;
-- Kết quả: Danh sách policy cho mỗi table

-- 5.2 Kiểm tra admin có thể truy cập vehicles không
-- (Chạy với role admin)
SELECT COUNT(*) as vehicle_count FROM public.vehicles;
-- Kết quả: Phải trả về số lượng vehicles

-- 5.3 Kiểm tra admin có thể truy cập drivers không
SELECT COUNT(*) as driver_count FROM public.drivers;
-- Kết quả: Phải trả về số lượng drivers

-- ============ PHẦN 6: TROUBLESHOOTING ============

-- 6.1 Tìm user không có role
SELECT au.id, au.email 
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL;
-- Kết quả: Nếu có user ở đây, cần thêm role cho họ

-- 6.2 Kiểm tra user bị disable
SELECT id, email, is_super_admin 
FROM auth.users 
WHERE email = 'your-admin-email@example.com';
-- Kết quả: is_super_admin có thể là false

-- 6.3 Xem lần đăng nhập cuối cùng
SELECT id, email, last_sign_in_at, created_at 
FROM auth.users 
WHERE email = 'your-admin-email@example.com';
-- Kết quả: last_sign_in_at nên gần đây nếu đã đăng nhập

-- ============ PHẦN 7: RESET/KHÔI PHỤC ============

-- 7.1 XÓA user_role của 1 user (nếu cần reset)
DELETE FROM public.user_roles
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'your-admin-email@example.com'
);
-- Sau đó chạy 4.1 để thêm lại

-- 7.2 GÁN lại tất cả users thành viewer (reset toàn bộ)
UPDATE public.user_roles 
SET role = 'viewer';

-- 7.3 KHÔI PHỤC default roles (nếu có script backup)
-- Cần chạy migration script: ULTIMATE_MIGRATION.sql

-- ============ PHẦN 8: TEST ADMIN QUYỀN ============

-- 8.1 Xem tất cả roles có trong hệ thống
SELECT DISTINCT role FROM public.user_roles;
-- Kết quả: admin, manager, dispatcher, accountant, driver, viewer

-- 8.2 Đếm user theo từng role
SELECT role, COUNT(*) as user_count
FROM public.user_roles
GROUP BY role
ORDER BY user_count DESC;
-- Kết quả: Biểu đồ phân bố user

-- 8.3 Admin có thể xem tất cả user không
SELECT id, email, role FROM public.user_roles
JOIN auth.users ON user_roles.user_id = auth.users.id;
-- Kết quả: Admin nên thấy tất cả user

-- ============ PHẦN 9: QUICK VERIFICATION ============

-- 9.1 Quick check: Admin có tồn tại không?
SELECT COUNT(*) > 0 as has_admin
FROM public.user_roles
WHERE role = 'admin';
-- Kết quả: true = có admin, false = không có

-- 9.2 Quick check: Email nào là admin?
SELECT email FROM auth.users
WHERE id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
);
-- Kết quả: Email của tất cả admin

-- 9.3 Quick check: User đã đăng nhập bao giờ?
SELECT email, last_sign_in_at, 
       CASE 
         WHEN last_sign_in_at IS NULL THEN 'Chưa đăng nhập'
         ELSE 'Đã đăng nhập'
       END as status
FROM auth.users au
JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.role = 'admin';
-- Kết quả: Trạng thái đăng nhập của admin

-- ============ HƯỚNG DẪN THỰC HIỆN ============
/*
 * 1. Copy query từ PHẦN 2.2 (kiểm tra user tồn tại)
 * 2. Thay 'your-admin-email@example.com' bằng email của bạn
 * 3. Chạy query trong Supabase SQL Editor
 * 4. Kiểm tra kết quả:
 *    - Nếu có user: Chạy PHẦN 3.2
 *    - Nếu không có: Cần tạo user mới
 * 5. Kiểm tra role:
 *    - Nếu role = 'admin': ✅ OK
 *    - Nếu khác: Chạy PHẦN 4.2 để cập nhật
 * 6. Thử đăng nhập qua UI: http://localhost:8080/auth
 *    - Nhập email & password
 *    - Kiểm tra có thấy admin menu không
 */

-- ============ NOTES ============
-- * Thay 'your-admin-email@example.com' bằng email của bạn
-- * Chạy trên Supabase SQL Editor
-- * Admin role: 'admin'
-- * Khác role: 'manager', 'dispatcher', 'accountant', 'driver', 'viewer'
-- * User phải tồn tại trong auth.users trước
-- * User phải có entry trong user_roles
