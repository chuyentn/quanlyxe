-- =====================================================
-- DATABASE AUDIT SCRIPT
-- Chạy script này để xem database hiện tại có gì
-- =====================================================

-- 1. Kiểm tra tables hiện có
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Kiểm tra views hiện có
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- 3. Kiểm tra materialized views
SELECT 
    schemaname,
    matviewname,
    matviewowner
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;

-- 4. Kiểm tra cấu trúc bảng trips
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'trips'
ORDER BY ordinal_position;

-- 5. Kiểm tra có dữ liệu không
SELECT 
    'trips' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE is_deleted = false) as active_rows
FROM trips
UNION ALL
SELECT 
    'expenses',
    COUNT(*),
    COUNT(*) FILTER (WHERE is_deleted = false)
FROM expenses
UNION ALL
SELECT 
    'vehicles',
    COUNT(*),
    COUNT(*) FILTER (WHERE is_deleted = false)
FROM vehicles
UNION ALL
SELECT 
    'drivers',
    COUNT(*),
    COUNT(*) FILTER (WHERE is_deleted = false)
FROM drivers;

-- HƯỚNG DẪN:
-- 1. Chạy script này trong Supabase SQL Editor
-- 2. Screenshot KẾT QUẢ của từng query
-- 3. Gửi cho tôi
-- 4. Tôi sẽ viết migration CHÍNH XÁC dựa trên kết quả
