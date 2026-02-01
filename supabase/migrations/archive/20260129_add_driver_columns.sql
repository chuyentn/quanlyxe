-- Migration: Add missing columns for 16-column Drivers table
-- Run this in Supabase SQL Editor

-- Add tax_code column
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS tax_code VARCHAR(20);

-- Add id_issue_date column (CCCD issue date)
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS id_issue_date DATE;

-- Add contract_type column
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS contract_type VARCHAR(50);

-- Add comment for clarity
COMMENT ON COLUMN drivers.tax_code IS 'Mã số thuế cá nhân';
COMMENT ON COLUMN drivers.id_issue_date IS 'Ngày cấp CCCD';
COMMENT ON COLUMN drivers.contract_type IS 'Loại hợp đồng lao động';
