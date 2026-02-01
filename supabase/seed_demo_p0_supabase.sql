-- ================================================
-- SEED DEMO P0 (10 dòng / mỗi tab) cho Supabase Postgres
-- App Fleet / Quản lý đội xe: Vehicles, Drivers, Routes,
-- Customers, Item Codes, Dispatch(Trips), Expenses, Maintenance,
-- Rates/Norms, Notifications settings.
--
-- IMPORTANT:
-- 1) Bạn PHẢI thay __USER_ID__ bằng auth.uid() của user đang login Supabase.
--    Lấy ở Supabase Dashboard -> Authentication -> Users -> copy UUID.
-- 2) Nếu RLS đang bật chặt, cần profile + company_id khớp để đọc/ghi.
-- 3) Script cố gắng ADD COLUMN IF NOT EXISTS cho demo_flag + các cột phụ.
-- ================================================

BEGIN;

-- Extensions (gen_random_uuid)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- (Optional) ensure columns exist (an toàn nếu đã có)
ALTER TABLE IF EXISTS public.vehicles ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;
ALTER TABLE IF EXISTS public.drivers ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;
ALTER TABLE IF EXISTS public.routes ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;
ALTER TABLE IF EXISTS public.item_codes ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;

ALTER TABLE IF EXISTS public.trips ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;
ALTER TABLE IF EXISTS public.expenses ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;
ALTER TABLE IF EXISTS public.maintenance_orders ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;

ALTER TABLE IF EXISTS public.fuel_prices ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;
ALTER TABLE IF EXISTS public.fuel_norms ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;
ALTER TABLE IF EXISTS public.rate_cards ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;

ALTER TABLE IF EXISTS public.notifications ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;

-- Optional columns that many fleet apps need
ALTER TABLE IF EXISTS public.vehicles ADD COLUMN IF NOT EXISTS registration_expiry_date date;
ALTER TABLE IF EXISTS public.vehicles ADD COLUMN IF NOT EXISTS current_location text;

-- If profiles/companies exist (per your schema)
ALTER TABLE IF EXISTS public.companies ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS demo_flag boolean DEFAULT false;

DO $$
DECLARE
  v_company_id uuid := '11111111-1111-1111-1111-111111111111';
  v_user_id uuid := '__USER_ID__'::uuid; -- <-- REPLACE THIS
BEGIN
  -- Company
  INSERT INTO public.companies (id, name, tax_code, address, phone, email, website, is_active, demo_flag)
  VALUES
    (v_company_id, 'Phú An Logistics (DEMO)', '0109999999', 'Cam Ranh, Khánh Hòa, VN', '0909000000', 'demo@phuan.local', 'https://example.local', true, true)
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    is_active = true,
    demo_flag = true;

  -- Profile for the logged-in user (required for RLS)
  INSERT INTO public.profiles (id, company_id, full_name, role, is_active, demo_flag)
  VALUES (v_user_id, v_company_id, 'Admin Demo', 'admin', true, true)
  ON CONFLICT (id) DO UPDATE SET
    company_id = EXCLUDED.company_id,
    role = 'admin',
    is_active = true,
    demo_flag = true;

  -- Notification settings (1 dòng)
  INSERT INTO public.notification_settings (
    company_id,
    maintenance_enabled, maintenance_days_before,
    license_enabled, license_days_before,
    expense_threshold_enabled, expense_threshold_amount,
    ar_overdue_enabled, ar_overdue_days,
    daily_digest_enabled, daily_digest_time, daily_digest_emails
  )
  VALUES (
    v_company_id,
    true, 7,
    true, 30,
    true, 25000000,
    false, 0,
    true, '08:30', ARRAY['demo@phuan.local']
  )
  ON CONFLICT (company_id) DO UPDATE SET
    maintenance_enabled = EXCLUDED.maintenance_enabled,
    license_enabled = EXCLUDED.license_enabled,
    expense_threshold_enabled = EXCLUDED.expense_threshold_enabled,
    daily_digest_enabled = EXCLUDED.daily_digest_enabled;

  -- Fuel prices (10 dòng)
  INSERT INTO public.fuel_prices (id, company_id, price_per_liter, effective_from, effective_to, created_at, demo_flag)
  VALUES
    (gen_random_uuid(), v_company_id, 21500, '2025-01-01', '2025-01-31', now(), true),
    (gen_random_uuid(), v_company_id, 21800, '2025-02-01', '2025-02-28', now(), true),
    (gen_random_uuid(), v_company_id, 22200, '2025-03-01', '2025-03-31', now(), true),
    (gen_random_uuid(), v_company_id, 22500, '2025-04-01', '2025-04-30', now(), true),
    (gen_random_uuid(), v_company_id, 22900, '2025-05-01', '2025-05-31', now(), true),
    (gen_random_uuid(), v_company_id, 23100, '2025-06-01', '2025-06-30', now(), true),
    (gen_random_uuid(), v_company_id, 23400, '2025-07-01', '2025-07-31', now(), true),
    (gen_random_uuid(), v_company_id, 23600, '2025-08-01', '2025-08-31', now(), true),
    (gen_random_uuid(), v_company_id, 23800, '2025-09-01', '2025-09-30', now(), true),
    (gen_random_uuid(), v_company_id, 24000, '2025-10-01', NULL,         now(), true);

  -- Fuel norms (10 dòng, theo loại xe & hiệu lực)
  INSERT INTO public.fuel_norms (id, company_id, vehicle_type, liters_per_100km, effective_from, effective_to, demo_flag)
  VALUES
    (gen_random_uuid(), v_company_id, 'XE CONT', 32.0, '2025-01-01', NULL, true),
    (gen_random_uuid(), v_company_id, 'XE THÙNG', 18.0, '2025-01-01', NULL, true),
    (gen_random_uuid(), v_company_id, 'XE BEN',  24.0, '2025-01-01', NULL, true),
    (gen_random_uuid(), v_company_id, 'XE ĐẦU KÉO', 35.0, '2025-01-01', NULL, true),
    (gen_random_uuid(), v_company_id, 'XE TẢI 8T', 16.5, '2025-01-01', NULL, true),
    (gen_random_uuid(), v_company_id, 'XE TẢI 5T', 14.0, '2025-01-01', NULL, true),
    (gen_random_uuid(), v_company_id, 'XE TẢI 3T', 12.0, '2025-01-01', NULL, true),
    (gen_random_uuid(), v_company_id, 'XE CẨU',   28.0, '2025-01-01', NULL, true),
    (gen_random_uuid(), v_company_id, 'XE BỒN',   22.0, '2025-01-01', NULL, true),
    (gen_random_uuid(), v_company_id, 'XE VAN',    9.5, '2025-01-01', NULL, true);

  -- Item codes (10 dòng)
  INSERT INTO public.item_codes (id, company_id, code, name, is_active, demo_flag)
  VALUES
    (gen_random_uuid(), v_company_id, 'HANG-001', 'Cát xây dựng', true, true),
    (gen_random_uuid(), v_company_id, 'HANG-002', 'Đá 1x2', true, true),
    (gen_random_uuid(), v_company_id, 'HANG-003', 'Xi măng', true, true),
    (gen_random_uuid(), v_company_id, 'HANG-004', 'Thép cuộn', true, true),
    (gen_random_uuid(), v_company_id, 'HANG-005', 'Gỗ nguyên liệu', true, true),
    (gen_random_uuid(), v_company_id, 'HANG-006', 'Nông sản', true, true),
    (gen_random_uuid(), v_company_id, 'HANG-007', 'Hải sản đông lạnh', true, true),
    (gen_random_uuid(), v_company_id, 'HANG-008', 'Thiết bị máy móc', true, true),
    (gen_random_uuid(), v_company_id, 'HANG-009', 'Hàng bách hóa', true, true),
    (gen_random_uuid(), v_company_id, 'HANG-010', 'Phế liệu', true, true);

  -- Customers (10 dòng)
  INSERT INTO public.customers (id, company_id, code, legal_name, tax_code, contact_name, phone, email, payment_term_days, credit_limit, status, is_active, demo_flag)
  VALUES
    (gen_random_uuid(), v_company_id, 'KH-001', 'Công ty TNHH Vật Liệu Minh Phát', '0101111111', 'Nguyễn Hùng', '0901000001', 'kh1@demo.local', 15, 50000000, 'active', true, true),
    (gen_random_uuid(), v_company_id, 'KH-002', 'Công ty CP Xây Dựng An Khang',     '0102222222', 'Trần Dũng',  '0901000002', 'kh2@demo.local', 30, 100000000,'active', true, true),
    (gen_random_uuid(), v_company_id, 'KH-003', 'Công ty TNHH Thương Mại Đại Lộc',  '0103333333', 'Lê Lan',     '0901000003', 'kh3@demo.local', 20, 70000000, 'active', true, true),
    (gen_random_uuid(), v_company_id, 'KH-004', 'Công ty TNHH Gỗ Phú Thịnh',        '0104444444', 'Phạm Tâm',   '0901000004', 'kh4@demo.local', 15, 60000000, 'active', true, true),
    (gen_random_uuid(), v_company_id, 'KH-005', 'Công ty CP Hải Sản Biển Xanh',     '0105555555', 'Võ Nam',     '0901000005', 'kh5@demo.local', 10, 40000000, 'active', true, true),
    (gen_random_uuid(), v_company_id, 'KH-006', 'Công ty TNHH Nông Sản Miền Trung', '0106666666', 'Đặng Vy',    '0901000006', 'kh6@demo.local', 30, 120000000,'active', true, true),
    (gen_random_uuid(), v_company_id, 'KH-007', 'Công ty TNHH Thiết Bị Cơ Khí A&T', '0107777777', 'Bùi Khoa',   '0901000007', 'kh7@demo.local', 45, 150000000,'active', true, true),
    (gen_random_uuid(), v_company_id, 'KH-008', 'Công ty TNHH TM Tổng Hợp Hòa Bình','0108888888', 'Ngô Sơn',    '0901000008', 'kh8@demo.local', 20, 80000000, 'active', true, true),
    (gen_random_uuid(), v_company_id, 'KH-009', 'Công ty CP Logistics Nam Việt',    '0109999998', 'Mai Hoa',    '0901000009', 'kh9@demo.local', 15, 90000000, 'active', true, true),
    (gen_random_uuid(), v_company_id, 'KH-010', 'Công ty TNHH Phế Liệu Thành Công', '0109999997', 'Hà Tín',     '0901000010', 'kh10@demo.local',10, 30000000, 'active', true, true);

  -- Routes (10 dòng)
  INSERT INTO public.routes (id, company_id, code, name, origin, destination, distance_km, duration_hours, toll_fee_default, base_fare_default, is_active, demo_flag)
  VALUES
    (gen_random_uuid(), v_company_id, 'TD-001', 'Cam Ranh → Nha Trang', 'Cam Ranh', 'Nha Trang', 55, 2.0, 120000, 850000, true, true),
    (gen_random_uuid(), v_company_id, 'TD-002', 'Cảng Cam Ranh → Cam Ranh', 'Cảng Cam Ranh', 'Cam Ranh', 12, 0.8, 0, 250000, true, true),
    (gen_random_uuid(), v_company_id, 'TD-003', 'Cam Ranh → Ninh Hòa', 'Cam Ranh', 'Ninh Hòa', 85, 2.8, 180000, 1100000, true, true),
    (gen_random_uuid(), v_company_id, 'TD-004', 'Cam Ranh → Diên Khánh', 'Cam Ranh', 'Diên Khánh', 70, 2.4, 150000, 980000, true, true),
    (gen_random_uuid(), v_company_id, 'TD-005', 'Nha Trang → Vạn Ninh', 'Nha Trang', 'Vạn Ninh', 65, 2.2, 140000, 950000, true, true),
    (gen_random_uuid(), v_company_id, 'TD-006', 'Cam Ranh → Suối Dầu', 'Cam Ranh', 'Suối Dầu', 40, 1.6, 80000, 650000, true, true),
    (gen_random_uuid(), v_company_id, 'TD-007', 'Cam Ranh → Phan Rang', 'Cam Ranh', 'Phan Rang', 95, 3.0, 200000, 1250000, true, true),
    (gen_random_uuid(), v_company_id, 'TD-008', 'Cam Ranh → Đà Lạt', 'Cam Ranh', 'Đà Lạt', 170, 5.0, 350000, 2400000, true, true),
    (gen_random_uuid(), v_company_id, 'TD-009', 'Nha Trang → Cam Lâm', 'Nha Trang', 'Cam Lâm', 45, 1.7, 100000, 780000, true, true),
    (gen_random_uuid(), v_company_id, 'TD-010', 'Cam Ranh → Khánh Vĩnh', 'Cam Ranh', 'Khánh Vĩnh', 120, 4.0, 250000, 1650000, true, true);

  -- Rate cards (10 dòng) — giá vận chuyển theo tuyến (per_trip)
  INSERT INTO public.rate_cards (id, company_id, route_id, item_code_id, price_type, unit_price, effective_from, effective_to, demo_flag)
  SELECT gen_random_uuid(), v_company_id, r.id, NULL, 'per_trip', r.base_fare_default, '2025-01-01', NULL, true
  FROM public.routes r
  WHERE r.company_id = v_company_id AND r.demo_flag = true
  ORDER BY r.code
  LIMIT 10;

  -- Trips (10 dòng) — Dispatch (draft/confirmed/closed)
  WITH v AS (
    SELECT id FROM public.vehicles
    WHERE company_id = v_company_id AND demo_flag=true
    ORDER BY license_plate
    LIMIT 10
  ),
  d AS (
    SELECT id FROM public.drivers
    WHERE company_id = v_company_id AND demo_flag=true
    ORDER BY code
    LIMIT 10
  ),
  r AS (
    SELECT id, distance_km, base_fare_default FROM public.routes
    WHERE company_id = v_company_id AND demo_flag=true
    ORDER BY code
    LIMIT 10
  ),
  c AS (
    SELECT id FROM public.customers
    WHERE company_id = v_company_id AND demo_flag=true
    ORDER BY code
    LIMIT 10
  ),
  i AS (
    SELECT id FROM public.item_codes
    WHERE company_id = v_company_id AND demo_flag=true
    ORDER BY code
    LIMIT 10
  )
  INSERT INTO public.trips (
    id, company_id, trip_code, trip_date, vehicle_id, driver_id, route_id, customer_id, item_code_id,
    km_actual, tonnage, unit_price, revenue_amount, status, created_at, demo_flag
  )
  SELECT
    gen_random_uuid(),
    v_company_id,
    'DEMO-TRIP-' || to_char(date '2025-10-01' + s.n, 'YYYYMMDD') || '-' || lpad((s.n+1)::text, 3, '0'),
    date '2025-10-01' + s.n,
    (SELECT id FROM v OFFSET s.n LIMIT 1),
    (SELECT id FROM d OFFSET s.n LIMIT 1),
    (SELECT id FROM r OFFSET s.n LIMIT 1),
    (SELECT id FROM c OFFSET s.n LIMIT 1),
    (SELECT id FROM i OFFSET s.n LIMIT 1),
    (SELECT distance_km FROM r OFFSET s.n LIMIT 1) + (10 * s.n),
    (5 + (s.n % 10))::numeric,
    (SELECT base_fare_default FROM r OFFSET s.n LIMIT 1),
    (SELECT base_fare_default FROM r OFFSET s.n LIMIT 1),
    CASE WHEN s.n < 3 THEN 'draft' WHEN s.n < 8 THEN 'confirmed' ELSE 'closed' END,
    now(),
    true
  FROM generate_series(0,9) AS s(n);

  -- Expenses (10 dòng)
  WITH t AS (
    SELECT id, trip_date, vehicle_id, driver_id
    FROM public.trips
    WHERE company_id = v_company_id AND demo_flag=true
    ORDER BY trip_date
    LIMIT 5
  ),
  v2 AS (
    SELECT id
    FROM public.vehicles
    WHERE company_id = v_company_id AND demo_flag=true
    ORDER BY license_plate
    LIMIT 5
  )
  INSERT INTO public.expenses (
    id, company_id, expense_date, category, amount, liters, vehicle_id, driver_id, trip_id, notes, status, created_at, demo_flag
  )
  SELECT gen_random_uuid(), v_company_id, t.trip_date, 'Nhiên liệu', 3200000, 150, t.vehicle_id, t.driver_id, t.id, 'Đổ dầu theo chuyến', 'confirmed', now(), true
  FROM t
  UNION ALL
  SELECT gen_random_uuid(), v_company_id, date '2025-10-05' + s2.n, 'BOT', 180000 + (s2.n+1)*20000, NULL,
         (SELECT id FROM v2 OFFSET s2.n LIMIT 1), NULL, NULL,
         'Phí trạm thu phí trong kỳ', 'confirmed', now(), true
  FROM generate_series(0,4) AS s2(n);

  -- Maintenance orders (10 dòng)
  INSERT INTO public.maintenance_orders (
    id, company_id, vehicle_id, order_date, type, description, vendor, amount, status, next_maintenance_date, created_at, demo_flag
  )
  SELECT
    gen_random_uuid(),
    v_company_id,
    v.id,
    date '2025-09-01' + s.n,
    CASE WHEN (s.n % 3) = 0 THEN 'Thay dầu' WHEN (s.n % 3) = 1 THEN 'Thay lốp' ELSE 'Sửa chữa' END,
    'Bảo trì định kỳ #' || (s.n+1)::text,
    'Garage Minh Thành',
    450000 + (s.n+1)*50000,
    CASE WHEN s.n < 6 THEN 'confirmed' ELSE 'draft' END,
    date '2025-11-01' + s.n,
    now(),
    true
  FROM (
    SELECT id, row_number() OVER (ORDER BY license_plate) - 1 AS n
    FROM public.vehicles
    WHERE company_id = v_company_id AND demo_flag=true
    ORDER BY license_plate
    LIMIT 10
  ) s
  JOIN public.vehicles v ON v.id = s.id;

END $$;

COMMIT;

-- ================================================
-- USAGE:
-- 1) Replace __USER_ID__ with your Supabase Auth user UUID.
-- 2) Run in Supabase SQL Editor.
-- 3) Verify tabs: Vehicles/Drivers/Routes/Customers/Dispatch/Expenses/Maintenance/Reports.
-- ================================================
