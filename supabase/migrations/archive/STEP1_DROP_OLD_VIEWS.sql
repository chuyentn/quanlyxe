-- =====================================================
-- BƯỚC 1: XÓA CÁC VIEW CŨ (nếu có)
-- Chạy script này TRƯỚC
-- =====================================================

-- Xóa materialized view cũ
DROP MATERIALIZED VIEW IF EXISTS trip_financials CASCADE;

-- Xóa các view thường
DROP VIEW IF EXISTS expense_summary_by_category CASCADE;
DROP VIEW IF EXISTS vehicle_performance CASCADE;
DROP VIEW IF EXISTS driver_performance CASCADE;

-- Xóa luôn nếu là table (phòng trường hợp)
DROP TABLE IF EXISTS trip_financials CASCADE;
DROP TABLE IF EXISTS expense_summary_by_category CASCADE;
DROP TABLE IF EXISTS vehicle_performance CASCADE;
DROP TABLE IF EXISTS driver_performance CASCADE;

-- Kết quả: Phải thấy "Success. No rows returned"
