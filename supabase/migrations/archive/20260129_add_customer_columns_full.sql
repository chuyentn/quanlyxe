-- ==============================================================================
-- DATABASE MIGRATION: UPGRADE CUSTOMERS TABLE
-- Description: Adds operational and financial columns to 'customers' table.
-- Author: Assistant
-- Date: 2026-01-29
-- ==============================================================================

BEGIN;

-- 1. Add 'customer_type' for classification (Doanh nghiệp / Cá nhân)
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50) DEFAULT 'Doanh nghiệp';

-- 2. Add 'current_debt' for real-time debt tracking
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS current_debt NUMERIC(15,2) DEFAULT 0;

-- 3. Add 'status' for soft archive (active / inactive)
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 4. Add 'notes' if it doesn't exist (useful for general remarks)
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 5. Add Comments for Documentation (Show up in Supabase UI)
COMMENT ON COLUMN public.customers.customer_type IS 'Loại khách hàng: Doanh nghiệp hoặc Cá nhân';
COMMENT ON COLUMN public.customers.current_debt IS 'Công nợ hiện tại (VND). Tự động cập nhật khi có đơn hàng/thanh toán.';
COMMENT ON COLUMN public.customers.status IS 'Trạng thái hoạt động: active (Hoạt động) hoặc inactive (Ngưng).';
COMMENT ON COLUMN public.customers.notes IS 'Ghi chú nội bộ về khách hàng.';

-- 6. Add Index for performance on common lookups (Optional but recommended)
CREATE INDEX IF NOT EXISTS idx_customers_customer_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);

COMMIT;

-- 7. Notify PostgREST to refresh the schema cache immediately
NOTIFY pgrst, 'reload schema';
