/*
 * SEED_PART_1_FIX_SCHEMA.sql
 * 
 * MỤC ĐÍCH: Sửa lỗi cấu trúc Database (Thiếu bảng, thiếu cột) trước khi nhập dữ liệu.
 * BẠN HÃY CHẠY FILE NÀY TRƯỚC.
 */

BEGIN;

-- 1. Bật Extension cần thiết
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Tạo bảng Công ty (Companies) nếu chưa có
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    subscription_tier TEXT DEFAULT 'basic',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

-- 3. Tạo bảng Giá nhiên liệu (Fuel Prices) nếu chưa có
CREATE TABLE IF NOT EXISTS public.fuel_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id),
    fuel_type TEXT NOT NULL,
    price_per_liter NUMERIC NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    demo_flag BOOLEAN DEFAULT false
);
ALTER TABLE public.fuel_prices ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.fuel_prices TO authenticated;

-- 4. Bổ sung các cột bị thiếu vào các bảng (Tự động kiểm tra và thêm)
DO $$
BEGIN
    -- Thêm cột 'company_id' vào tất cả bảng chính (Lỗi 42703 phổ biến)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'company_id') THEN
        ALTER TABLE vehicles ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'company_id') THEN
        ALTER TABLE drivers ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'company_id') THEN
        ALTER TABLE customers ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'company_id') THEN
        ALTER TABLE routes ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'company_id') THEN
        ALTER TABLE trips ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'company_id') THEN
        ALTER TABLE expenses ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'expense_type') THEN
        ALTER TABLE expenses ADD COLUMN expense_type TEXT; -- Fix for missing column error
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_orders' AND column_name = 'company_id') THEN
        ALTER TABLE maintenance_orders ADD COLUMN company_id UUID;
    END IF;

    -- Thêm cột 'arrival_date' cho bảng Trips (Lỗi vừa gặp)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'arrival_date') THEN
        ALTER TABLE trips ADD COLUMN arrival_date TIMESTAMPTZ;
    END IF;

    -- Thêm cột info cho Drivers (Lỗi vừa gặp)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'phone_number') THEN
        ALTER TABLE drivers ADD COLUMN phone_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'license_class') THEN
        ALTER TABLE drivers ADD COLUMN license_class TEXT;
    END IF;

    -- Thêm cột info cho Vehicles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'registration_expiry_date') THEN
        ALTER TABLE vehicles ADD COLUMN registration_expiry_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'current_location') THEN
        ALTER TABLE vehicles ADD COLUMN current_location TEXT;
    END IF;

    -- Thêm cột 'demo_flag' để dễ dàng xóa dữ liệu mẫu sau này
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'demo_flag') THEN
        ALTER TABLE vehicles ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'demo_flag') THEN
        ALTER TABLE drivers ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'demo_flag') THEN
        ALTER TABLE customers ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'demo_flag') THEN
        ALTER TABLE routes ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'demo_flag') THEN
        ALTER TABLE trips ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'demo_flag') THEN
        ALTER TABLE expenses ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
END $$;

COMMIT;
