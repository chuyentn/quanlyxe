-- Migration: Add missing columns for 12-column Routes table
-- Run this in Supabase SQL Editor

-- Add cargo_type column
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS cargo_type VARCHAR(100);

-- Add base_price column (đơn giá chuẩn)
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS base_price NUMERIC(15,2);

-- Add default_extra_fee column (phí phát sinh mặc định)
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS default_extra_fee NUMERIC(15,2);

-- Add status column  
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- Add comments
COMMENT ON COLUMN routes.cargo_type IS 'Loại hàng áp dụng';
COMMENT ON COLUMN routes.base_price IS 'Đơn giá chuẩn (VND)';
COMMENT ON COLUMN routes.default_extra_fee IS 'Phí phát sinh mặc định (VND)';
COMMENT ON COLUMN routes.status IS 'Trạng thái: active/inactive';
