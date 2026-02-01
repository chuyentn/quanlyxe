-- ============================================================================
-- TEST DATA CREATION FOR REPORTS MODULE
-- Create realistic data: 3 vehicles, 3 drivers, 3 routes, 3 customers, 10 trips, 20+ expenses
-- Run this on Supabase SQL Editor
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CREATE 3 VEHICLES
-- ============================================================================
INSERT INTO public.vehicles (vehicle_code, license_plate, vehicle_type, brand, model, year_manufactured, capacity_tons, capacity_cbm, fuel_type, status, purchase_date, purchase_price)
VALUES
('V-TEST-001', '51A-12345', 'Xe tải 10 tấn', 'Isuzu', 'FVR34Q', 2023, 10.0, 45.0, 'diesel', 'active', '2023-01-15', 1250000000),
('V-TEST-002', '51B-12346', 'Xe tải 15 tấn', 'Hino', 'FC9JLSW', 2023, 15.0, 62.0, 'diesel', 'active', '2023-03-20', 1600000000),
('V-TEST-003', '51C-12347', 'Xe tải 5 tấn', 'Thaco', 'Ollin 700E4', 2023, 5.0, 22.0, 'diesel', 'active', '2023-02-10', 780000000)
ON CONFLICT (vehicle_code) DO NOTHING;

-- ============================================================================
-- STEP 2: CREATE 3 DRIVERS
-- ============================================================================
INSERT INTO public.drivers (driver_code, full_name, phone, id_card, license_number, license_class, license_expiry, address, date_of_birth, hire_date, base_salary, status)
VALUES
('D-TEST-001', 'Phạm Anh Dũng', '0968234567', '023456789012', 'B2-456789012', 'C', '2028-06-15', '123 Nguyễn Trãi, Q1, TP.HCM', '1992-05-14', '2022-06-01', 12500000, 'active'),
('D-TEST-002', 'Trần Minh Hoàn', '0971345678', '034567890123', 'B2-567890123', 'C', '2027-12-20', '456 Lý Tự Trọng, Q3, TP.HCM', '1988-08-22', '2021-09-15', 13000000, 'active'),
('D-TEST-003', 'Lê Văn Tuấn', '0987456789', '045678901234', 'B2-678901234', 'C', '2028-03-10', '789 Đinh Bộ Lĩnh, Q5, TP.HCM', '1995-12-08', '2023-01-10', 12000000, 'active')
ON CONFLICT (driver_code) DO NOTHING;

-- ============================================================================
-- STEP 3: CREATE 3 ROUTES
-- ============================================================================
INSERT INTO public.routes (route_code, route_name, origin, destination, distance_km, toll_cost, standard_freight_rate)
VALUES
('R-TEST-001', 'TP.HCM - Biên Hòa', 'TP. Hồ Chí Minh', 'Biên Hòa', 35, 18000, 1200000),
('R-TEST-002', 'TP.HCM - Cần Thơ', 'TP. Hồ Chí Minh', 'Cần Thơ', 170, 75000, 3500000),
('R-TEST-003', 'TP.HCM - Vũng Tàu', 'TP. Hồ Chí Minh', 'Vũng Tàu', 125, 45000, 2800000)
ON CONFLICT (route_code) DO NOTHING;

-- ============================================================================
-- STEP 4: CREATE 3 CUSTOMERS
-- ============================================================================
INSERT INTO public.customers (customer_code, customer_name, short_name, phone, email, payment_terms)
VALUES
('C-TEST-001', 'Công ty Logistics Thành Công', 'LSC', '0228123456', 'info@logisticsthanhcong.vn', 30),
('C-TEST-002', 'Công ty Sản xuất Cà Phê Mỹ Tho', 'SCPM', '0273567890', 'sales@capheMyTho.com', 45),
('C-TEST-003', 'Công ty Thương mại Vũng Tàu Express', 'VTE', '02643892100', 'contact@vungtauexpress.vn', 30)
ON CONFLICT (customer_code) DO NOTHING;

-- ============================================================================
-- STEP 5: CREATE 10 TRIPS
-- ============================================================================
INSERT INTO public.trips (
  trip_code, vehicle_id, driver_id, route_id, customer_id,
  departure_date, actual_distance_km, cargo_weight_tons,
  freight_revenue, additional_charges, status, created_at
)
SELECT 
  'T-TEST-001', v.id, d.id, r.id, c.id,
  '2026-01-20'::DATE, 35, 8.5, 1200000, 0, 'completed', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'V-TEST-001' AND d.driver_code = 'D-TEST-001' AND r.route_code = 'R-TEST-001' AND c.customer_code = 'C-TEST-001'
UNION ALL
SELECT 'T-TEST-002', v.id, d.id, r.id, c.id, '2026-01-19'::DATE, 170, 12.0, 3200000, 100000, 'completed', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'V-TEST-002' AND d.driver_code = 'D-TEST-002' AND r.route_code = 'R-TEST-002' AND c.customer_code = 'C-TEST-002'
UNION ALL
SELECT 'T-TEST-003', v.id, d.id, r.id, c.id, '2026-01-21'::DATE, 125, 4.5, 2500000, 50000, 'completed', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'V-TEST-003' AND d.driver_code = 'D-TEST-003' AND r.route_code = 'R-TEST-003' AND c.customer_code = 'C-TEST-003'
UNION ALL
SELECT 'T-TEST-004', v.id, d.id, r.id, c.id, '2026-01-20'::DATE, 35, 9.2, 1300000, 0, 'completed', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'V-TEST-001' AND d.driver_code = 'D-TEST-002' AND r.route_code = 'R-TEST-001' AND c.customer_code = 'C-TEST-001'
UNION ALL
SELECT 'T-TEST-005', v.id, d.id, r.id, c.id, '2026-01-18'::DATE, 170, 14.5, 3600000, 200000, 'completed', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'V-TEST-002' AND d.driver_code = 'D-TEST-001' AND r.route_code = 'R-TEST-002' AND c.customer_code = 'C-TEST-002'
UNION ALL
SELECT 'T-TEST-006', v.id, d.id, r.id, c.id, '2026-01-22'::DATE, 125, 3.8, 2200000, 0, 'completed', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'V-TEST-003' AND d.driver_code = 'D-TEST-001' AND r.route_code = 'R-TEST-003' AND c.customer_code = 'C-TEST-003'
UNION ALL
SELECT 'T-TEST-007', v.id, d.id, r.id, c.id, '2026-01-23'::DATE, 35, 10.0, 1400000, 0, 'in_progress', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'V-TEST-001' AND d.driver_code = 'D-TEST-003' AND r.route_code = 'R-TEST-001' AND c.customer_code = 'C-TEST-001'
UNION ALL
SELECT 'T-TEST-008', v.id, d.id, r.id, c.id, '2026-01-22'::DATE, 170, 13.0, 3800000, 150000, 'in_progress', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'V-TEST-002' AND d.driver_code = 'D-TEST-002' AND r.route_code = 'R-TEST-002' AND c.customer_code = 'C-TEST-002'
UNION ALL
SELECT 'T-TEST-009', v.id, d.id, r.id, c.id, '2026-01-24'::DATE, 125, 5.0, 2800000, 0, 'confirmed', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'V-TEST-003' AND d.driver_code = 'D-TEST-002' AND r.route_code = 'R-TEST-003' AND c.customer_code = 'C-TEST-001'
UNION ALL
SELECT 'T-TEST-010', v.id, d.id, r.id, c.id, '2026-01-24'::DATE, 35, 11.0, 1500000, 0, 'draft', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'V-TEST-001' AND d.driver_code = 'D-TEST-001' AND r.route_code = 'R-TEST-001' AND c.customer_code = 'C-TEST-003'
ON CONFLICT (trip_code) DO NOTHING;

-- ============================================================================
-- STEP 6: CREATE EXPENSE CATEGORIES (if not exist)
-- ============================================================================
INSERT INTO public.expense_categories (category_code, category_name, category_type, is_trip_related, is_vehicle_related)
VALUES
('FUEL', 'Nhiên liệu', 'fuel', true, true),
('TOLL', 'BOT/Đường bộ', 'toll', true, true),
('MAINTENANCE', 'Bảo trì', 'maintenance', true, true),
('REPAIR', 'Sửa chữa', 'repair', true, true),
('LOADING', 'Bốc xếp', 'loading', true, false),
('OTHER', 'Chi phí khác', 'other', true, true)
ON CONFLICT (category_code) DO NOTHING;

-- ============================================================================
-- STEP 7: CREATE 20+ EXPENSES
-- ============================================================================
INSERT INTO public.expenses (
  expense_code, trip_id, vehicle_id, category_id,
  expense_date, amount, description, status, confirmed_at, is_deleted
)
SELECT 'EXP-T001-F1'::text, t.id, v.id,
  (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1),
  '2026-01-20'::DATE, 280000, 'Xăng dầu diesel T-TEST-001', 'confirmed', NOW(), false
FROM trips t, vehicles v
WHERE t.trip_code = 'T-TEST-001' AND v.vehicle_code = 'V-TEST-001'
UNION ALL
SELECT 'EXP-T001-T1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1),
  '2026-01-20'::DATE, 18000, 'Phí BOT Biên Hòa', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-001' AND v.vehicle_code = 'V-TEST-001'
UNION ALL
SELECT 'EXP-T002-F1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1),
  '2026-01-19'::DATE, 620000, 'Xăng dầu diesel T-TEST-002', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-002' AND v.vehicle_code = 'V-TEST-002'
UNION ALL
SELECT 'EXP-T002-T1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1),
  '2026-01-20'::DATE, 75000, 'Phí BOT Cần Thơ', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-002' AND v.vehicle_code = 'V-TEST-002'
UNION ALL
SELECT 'EXP-T002-L1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'LOADING' LIMIT 1),
  '2026-01-20'::DATE, 350000, 'Phí bốc xếp hàng', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-002' AND v.vehicle_code = 'V-TEST-002'
UNION ALL
SELECT 'EXP-T003-F1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1),
  '2026-01-21'::DATE, 225000, 'Xăng dầu diesel T-TEST-003', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-003' AND v.vehicle_code = 'V-TEST-003'
UNION ALL
SELECT 'EXP-T003-T1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1),
  '2026-01-21'::DATE, 45000, 'Phí BOT Vũng Tàu', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-003' AND v.vehicle_code = 'V-TEST-003'
UNION ALL
SELECT 'EXP-T004-F1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1),
  '2026-01-20'::DATE, 300000, 'Xăng dầu diesel T-TEST-004', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-004' AND v.vehicle_code = 'V-TEST-001'
UNION ALL
SELECT 'EXP-T004-T1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1),
  '2026-01-20'::DATE, 18000, 'Phí BOT', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-004' AND v.vehicle_code = 'V-TEST-001'
UNION ALL
SELECT 'EXP-T005-F1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1),
  '2026-01-18'::DATE, 680000, 'Xăng dầu diesel T-TEST-005', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-005' AND v.vehicle_code = 'V-TEST-002'
UNION ALL
SELECT 'EXP-T005-T1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1),
  '2026-01-19'::DATE, 75000, 'Phí BOT Cần Thơ', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-005' AND v.vehicle_code = 'V-TEST-002'
UNION ALL
SELECT 'EXP-T005-L1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'LOADING' LIMIT 1),
  '2026-01-19'::DATE, 400000, 'Phí bốc xếp hàng', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-005' AND v.vehicle_code = 'V-TEST-002'
UNION ALL
SELECT 'EXP-T006-F1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1),
  '2026-01-22'::DATE, 200000, 'Xăng dầu diesel T-TEST-006', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-006' AND v.vehicle_code = 'V-TEST-003'
UNION ALL
SELECT 'EXP-T006-T1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1),
  '2026-01-22'::DATE, 45000, 'Phí BOT Vũng Tàu', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-006' AND v.vehicle_code = 'V-TEST-003'
UNION ALL
SELECT 'EXP-T007-F1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1),
  '2026-01-23'::DATE, 320000, 'Xăng dầu diesel T-TEST-007', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-007' AND v.vehicle_code = 'V-TEST-001'
UNION ALL
SELECT 'EXP-T007-T1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1),
  '2026-01-23'::DATE, 18000, 'Phí BOT', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-007' AND v.vehicle_code = 'V-TEST-001'
UNION ALL
SELECT 'EXP-T008-F1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1),
  '2026-01-22'::DATE, 650000, 'Xăng dầu diesel T-TEST-008', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-008' AND v.vehicle_code = 'V-TEST-002'
UNION ALL
SELECT 'EXP-T008-T1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1),
  '2026-01-22'::DATE, 75000, 'Phí BOT Cần Thơ', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-008' AND v.vehicle_code = 'V-TEST-002'
UNION ALL
SELECT 'EXP-T009-F1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1),
  '2026-01-24'::DATE, 240000, 'Xăng dầu diesel T-TEST-009', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-009' AND v.vehicle_code = 'V-TEST-003'
UNION ALL
SELECT 'EXP-T009-T1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1),
  '2026-01-24'::DATE, 45000, 'Phí BOT Vũng Tàu', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-009' AND v.vehicle_code = 'V-TEST-003'
UNION ALL
SELECT 'EXP-T010-F1', t.id, v.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1),
  '2026-01-24'::DATE, 300000, 'Xăng dầu diesel T-TEST-010', 'confirmed', NOW(), false
FROM trips t, vehicles v WHERE t.trip_code = 'T-TEST-010' AND v.vehicle_code = 'V-TEST-001'
ON CONFLICT (expense_code) DO NOTHING;

-- ============================================================================
-- STEP 8: VERIFY DATA
-- ============================================================================
SELECT '✅ TEST DATA CREATED SUCCESSFULLY' as status;

SELECT 'VEHICLES' as entity, COUNT(*) as count FROM vehicles WHERE vehicle_code LIKE 'V-TEST-%'
UNION ALL
SELECT 'DRIVERS', COUNT(*) FROM drivers WHERE driver_code LIKE 'D-TEST-%'
UNION ALL
SELECT 'ROUTES', COUNT(*) FROM routes WHERE route_code LIKE 'R-TEST-%'
UNION ALL
SELECT 'CUSTOMERS', COUNT(*) FROM customers WHERE customer_code LIKE 'C-TEST-%'
UNION ALL
SELECT 'TRIPS', COUNT(*) FROM trips WHERE trip_code LIKE 'T-TEST-%'
UNION ALL
SELECT 'EXPENSES', COUNT(*) FROM expenses WHERE expense_code LIKE 'EXP-T%';

-- Show financial summary
SELECT 
  COUNT(DISTINCT t.id) as total_trips,
  COALESCE(SUM(t.freight_revenue + COALESCE(t.additional_charges, 0)), 0) as total_revenue,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(SUM(t.freight_revenue + COALESCE(t.additional_charges, 0)), 0) - COALESCE(SUM(e.amount), 0) as profit
FROM trips t
LEFT JOIN expenses e ON t.id = e.trip_id AND e.is_deleted = false
WHERE t.trip_code LIKE 'T-TEST-%' AND t.is_deleted = false;

COMMIT;
