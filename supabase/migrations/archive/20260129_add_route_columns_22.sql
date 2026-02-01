-- Migration: Add missing columns for 22-column Routes table (Financial Norms)
-- Run this in Supabase SQL Editor

-- 8. Số tấn (Định mức)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS cargo_weight_standard NUMERIC(10,2);

-- 10. Doanh thu vận chuyển (Định mức)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS transport_revenue_standard NUMERIC(15,2);

-- 11. Tiền Tài Xế (Định mức)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS driver_allowance_standard NUMERIC(15,2);

-- 12. Bồi Dưỡng (Định mức)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS support_fee_standard NUMERIC(15,2);

-- 13. Công An (Định mức)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS police_fee_standard NUMERIC(15,2);

-- 14. Số lít dầu (Định mức)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS fuel_liters_standard NUMERIC(10,2);

-- 15. Tiền Xăng/dầu (Định mức)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS fuel_cost_standard NUMERIC(15,2);

-- 16. Bơm hơi, Vá vỏ (Định mức)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS tire_service_fee_standard NUMERIC(15,2);

-- 19. Tổng Chi Phí (Định mức)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS total_cost_standard NUMERIC(15,2);

-- 20. Lợi Nhuận (Định mức)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS profit_standard NUMERIC(15,2);

-- Comments
COMMENT ON COLUMN routes.cargo_weight_standard IS 'Số tấn định mức';
COMMENT ON COLUMN routes.transport_revenue_standard IS 'Doanh thu vận chuyển định mức';
COMMENT ON COLUMN routes.driver_allowance_standard IS 'Tiền tài xế định mức';
COMMENT ON COLUMN routes.support_fee_standard IS 'Tiền bồi dưỡng định mức';
COMMENT ON COLUMN routes.police_fee_standard IS 'Tiền công an định mức';
COMMENT ON COLUMN routes.fuel_liters_standard IS 'Số lít dầu định mức';
COMMENT ON COLUMN routes.fuel_cost_standard IS 'Tiền xăng dầu định mức';
COMMENT ON COLUMN routes.tire_service_fee_standard IS 'Tiền bơm hơi vá vỏ định mức';
COMMENT ON COLUMN routes.total_cost_standard IS 'Tổng chi phí định mức';
COMMENT ON COLUMN routes.profit_standard IS 'Lợi nhuận định mức';
