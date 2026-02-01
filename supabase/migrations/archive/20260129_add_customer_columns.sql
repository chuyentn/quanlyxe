-- Migration: Add missing columns for Customers table
-- 1. customer_type: Loại khách hàng (Cá nhân / Doanh nghiệp)
-- 2. current_debt: Công nợ hiện tại
-- 3. status: Trạng thái (Hoạt động / Ngưng)

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50) DEFAULT 'Doanh nghiệp',
ADD COLUMN IF NOT EXISTS current_debt NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add comments
COMMENT ON COLUMN customers.customer_type IS 'Loại khách hàng: Cá nhân / Doanh nghiệp';
COMMENT ON COLUMN customers.current_debt IS 'Công nợ hiện tại (VND)';
COMMENT ON COLUMN customers.status IS 'Trạng thái: active/inactive';

-- Notify PostgREST
NOTIFY pgrst, 'reload schema';
