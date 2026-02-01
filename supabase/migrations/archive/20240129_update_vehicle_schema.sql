-- Add new columns to vehicles table
ALTER TABLE "public"."vehicles"
ADD COLUMN "usage_limit_years" text,
ADD COLUMN "engine_number" text,
ADD COLUMN "chassis_number" text,
ADD COLUMN "insurance_purchase_date" date,
ADD COLUMN "insurance_expiry_date" date,
ADD COLUMN "insurance_cost" numeric,
ADD COLUMN "registration_cycle" text,
ADD COLUMN "registration_date" date,
ADD COLUMN "registration_expiry_date" date,
ADD COLUMN "registration_cost" numeric,
ADD COLUMN "current_location" text;

-- Add comments for documentation
COMMENT ON COLUMN "public"."vehicles"."usage_limit_years" IS 'Niên hạn sử dụng (VD: 2011-2036)';
COMMENT ON COLUMN "public"."vehicles"."engine_number" IS 'Số máy';
COMMENT ON COLUMN "public"."vehicles"."chassis_number" IS 'Số khung';
COMMENT ON COLUMN "public"."vehicles"."insurance_purchase_date" IS 'Ngày mua bảo hiểm';
COMMENT ON COLUMN "public"."vehicles"."insurance_expiry_date" IS 'Ngày hết hạn bảo hiểm';
COMMENT ON COLUMN "public"."vehicles"."insurance_cost" IS 'Số tiền mua bảo hiểm';
COMMENT ON COLUMN "public"."vehicles"."registration_cycle" IS 'Chu kỳ đăng kiểm (VD: 6 tháng)';
COMMENT ON COLUMN "public"."vehicles"."registration_date" IS 'Ngày đăng kiểm';
COMMENT ON COLUMN "public"."vehicles"."registration_expiry_date" IS 'Ngày hết hạn đăng kiểm';
COMMENT ON COLUMN "public"."vehicles"."registration_cost" IS 'Số tiền đăng kiểm';
COMMENT ON COLUMN "public"."vehicles"."current_location" IS 'Vị trí hiện tại của xe';
