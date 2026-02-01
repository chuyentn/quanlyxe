-- Unified Migration to Fix Routes Schema (Run this if you see errors about missing 'base_price')

-- 1. Phase 3 Columns (12-column update)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS cargo_type VARCHAR(100);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS base_price NUMERIC(15,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS default_extra_fee NUMERIC(15,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 2. Phase 4 Columns (22-column update - Financial Norms)
ALTER TABLE routes ADD COLUMN IF NOT EXISTS cargo_weight_standard NUMERIC(10,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS transport_revenue_standard NUMERIC(15,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS driver_allowance_standard NUMERIC(15,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS support_fee_standard NUMERIC(15,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS police_fee_standard NUMERIC(15,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS fuel_liters_standard NUMERIC(10,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS fuel_cost_standard NUMERIC(15,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS tire_service_fee_standard NUMERIC(15,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS total_cost_standard NUMERIC(15,2);
ALTER TABLE routes ADD COLUMN IF NOT EXISTS profit_standard NUMERIC(15,2);

-- 3. Update Comments for clarity
COMMENT ON COLUMN routes.base_price IS 'Đơn giá chuẩn (VND)';
COMMENT ON COLUMN routes.cargo_weight_standard IS 'Số tấn định mức';
COMMENT ON COLUMN routes.transport_revenue_standard IS 'Doanh thu vận chuyển định mức';
COMMENT ON COLUMN routes.total_cost_standard IS 'Tổng chi phí định mức';
COMMENT ON COLUMN routes.profit_standard IS 'Lợi nhuận định mức';

-- 4. Notify PostgREST to reload schema (Supabase usually handles this via UI, but good to know)
NOTIFY pgrst, 'reload schema';
