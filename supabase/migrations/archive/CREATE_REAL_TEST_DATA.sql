-- ============================================================================
-- REAL TEST DATA CREATION SCRIPT
-- Purpose: Create minimal realistic data for testing (3 vehicles, 3 drivers, 3 routes, 3 customers, 10 trips, 20 expenses)
-- ============================================================================
-- IMPORTANT: Run this AFTER cleaning up all demo data (from CLEAN_DEMO_DATA.sql)
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CREATE 3 REAL VEHICLES
-- ============================================================================

INSERT INTO public.vehicles (vehicle_code, license_plate, vehicle_type, brand, model, year_manufactured, capacity_tons, capacity_cbm, fuel_type, fuel_consumption_per_100km, current_odometer, status, purchase_date, purchase_price)
VALUES
('REAL-V001', '51A-99999', 'Xe tải 10 tấn', 'Isuzu', 'FVR34Q', 2023, 10.0, 45.0, 'diesel', 22.0, 5000, 'active', '2023-01-15', 1250000000),
('REAL-V002', '51B-88888', 'Xe tải 15 tấn', 'Hino', 'FC9JLSW', 2023, 15.0, 62.0, 'diesel', 25.5, 3500, 'active', '2023-03-20', 1600000000),
('REAL-V003', '51C-77777', 'Xe tải 5 tấn', 'Thaco', 'Ollin 700E4', 2023, 5.0, 22.0, 'diesel', 18.0, 4200, 'active', '2023-02-10', 780000000)
ON CONFLICT (vehicle_code) DO NOTHING;

-- Get vehicle IDs for use in trips
WITH v_data AS (
  SELECT id, vehicle_code FROM vehicles WHERE vehicle_code LIKE 'REAL-V%'
)
SELECT * FROM v_data;

-- ============================================================================
-- STEP 2: CREATE 3 REAL DRIVERS
-- ============================================================================

INSERT INTO public.drivers (driver_code, full_name, phone, id_card, license_number, license_class, license_expiry, address, date_of_birth, hire_date, base_salary, status)
VALUES
('REAL-TX001', 'Phạm Anh Dũng', '0968234567', '023456789012', 'B2-456789012', 'C', '2028-06-15', '123 Nguyễn Trãi, Q1, TP.HCM', '1992-05-14', '2022-06-01', 12500000, 'active'),
('REAL-TX002', 'Trần Minh Hoàn', '0971345678', '034567890123', 'B2-567890123', 'C', '2027-12-20', '456 Lý Tự Trọng, Q3, TP.HCM', '1988-08-22', '2021-09-15', 13000000, 'active'),
('REAL-TX003', 'Lê Văn Tuấn', '0987456789', '045678901234', 'B2-678901234', 'C', '2028-03-10', '789 Đinh Bộ Lĩnh, Q5, TP.HCM', '1995-12-08', '2023-01-10', 12000000, 'active')
ON CONFLICT (driver_code) DO NOTHING;

-- Get driver IDs
WITH d_data AS (
  SELECT id, driver_code FROM drivers WHERE driver_code LIKE 'REAL-TX%'
)
SELECT * FROM d_data;

-- ============================================================================
-- STEP 3: CREATE 3 REAL ROUTES
-- ============================================================================

INSERT INTO public.routes (route_code, route_name, origin, destination, distance_km, toll_cost, standard_freight_rate)
VALUES
('REAL-R001', 'TPHCM - Biên Hòa (Chia sẻ)', 'TP. Hồ Chí Minh', 'Biên Hòa', 35, 18000, 1200000),
('REAL-R002', 'TPHCM - Cần Thơ (Hạt cà phê)', 'TP. Hồ Chí Minh', 'Cần Thơ', 170, 75000, 3500000),
('REAL-R003', 'TPHCM - Vũng Tàu (Hàng hóa)', 'TP. Hồ Chí Minh', 'Vũng Tàu', 125, 45000, 2800000)
ON CONFLICT (route_code) DO NOTHING;

-- Get route IDs
WITH r_data AS (
  SELECT id, route_code FROM routes WHERE route_code LIKE 'REAL-R%'
)
SELECT * FROM r_data;

-- ============================================================================
-- STEP 4: CREATE 3 REAL CUSTOMERS
-- ============================================================================

INSERT INTO public.customers (customer_code, customer_name, short_name, phone, email, payment_terms)
VALUES
('REAL-KH001', 'Công ty CP Phân phối Logistics Thành Công', 'LSC', '0228123456', 'info@logisticsthanhcong.vn', 30),
('REAL-KH002', 'Công ty TNHH Sản xuất Cà Phê Mỹ Tho', 'SCPM', '0273567890', 'sales@capheMyTho.com', 45),
('REAL-KH003', 'Công ty CP Thương mại Vũng Tàu Express', 'VTE', '02643892100', 'contact@vungtauexpress.vn', 30)
ON CONFLICT (customer_code) DO NOTHING;

-- Get customer IDs
WITH c_data AS (
  SELECT id, customer_code FROM customers WHERE customer_code LIKE 'REAL-KH%'
)
SELECT * FROM c_data;

-- ============================================================================
-- STEP 5: CREATE 10 REAL TRIPS
-- ============================================================================

INSERT INTO public.trips (
  trip_code, vehicle_id, driver_id, route_id, customer_id, 
  load_weight_tons, revenue_amount, status, 
  planned_departure, planned_arrival, actual_departure, actual_arrival,
  created_at
)
SELECT 
  'REAL-CHK-20260123-001'::text,
  v.id,
  d.id,
  r.id,
  c.id,
  8.5,
  1200000,
  'COMPLETED'::text,
  '2026-01-20 06:00:00'::timestamp,
  '2026-01-20 10:30:00'::timestamp,
  '2026-01-20 06:15:00'::timestamp,
  '2026-01-20 10:45:00'::timestamp,
  NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'REAL-V001' AND d.driver_code = 'REAL-TX001' AND r.route_code = 'REAL-R001' AND c.customer_code = 'REAL-KH001'
UNION ALL
SELECT 'REAL-CHK-20260123-002', v.id, d.id, r.id, c.id, 12.0, 3200000, 'COMPLETED', '2026-01-19 22:00:00', '2026-01-21 06:00:00', '2026-01-19 22:30:00', '2026-01-21 05:45:00', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'REAL-V002' AND d.driver_code = 'REAL-TX002' AND r.route_code = 'REAL-R002' AND c.customer_code = 'REAL-KH002'
UNION ALL
SELECT 'REAL-CHK-20260123-003', v.id, d.id, r.id, c.id, 4.5, 2500000, 'COMPLETED', '2026-01-21 08:00:00', '2026-01-21 14:00:00', '2026-01-21 08:15:00', '2026-01-21 13:45:00', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'REAL-V003' AND d.driver_code = 'REAL-TX003' AND r.route_code = 'REAL-R003' AND c.customer_code = 'REAL-KH003'
UNION ALL
SELECT 'REAL-CHK-20260123-004', v.id, d.id, r.id, c.id, 9.2, 1300000, 'COMPLETED', '2026-01-20 14:00:00', '2026-01-20 18:15:00', '2026-01-20 14:20:00', '2026-01-20 18:30:00', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'REAL-V001' AND d.driver_code = 'REAL-TX002' AND r.route_code = 'REAL-R001' AND c.customer_code = 'REAL-KH001'
UNION ALL
SELECT 'REAL-CHK-20260123-005', v.id, d.id, r.id, c.id, 14.5, 3600000, 'COMPLETED', '2026-01-18 20:00:00', '2026-01-20 08:00:00', '2026-01-18 20:30:00', '2026-01-20 07:45:00', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'REAL-V002' AND d.driver_code = 'REAL-TX001' AND r.route_code = 'REAL-R002' AND c.customer_code = 'REAL-KH002'
UNION ALL
SELECT 'REAL-CHK-20260123-006', v.id, d.id, r.id, c.id, 3.8, 2200000, 'DELIVERED', '2026-01-22 10:00:00', '2026-01-22 14:00:00', '2026-01-22 10:10:00', '2026-01-22 14:15:00', NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'REAL-V003' AND d.driver_code = 'REAL-TX001' AND r.route_code = 'REAL-R003' AND c.customer_code = 'REAL-KH003'
UNION ALL
SELECT 'REAL-CHK-20260123-007', v.id, d.id, r.id, c.id, 10.0, 1400000, 'IN_TRANSIT', '2026-01-23 05:00:00', '2026-01-23 09:30:00', '2026-01-23 05:15:00', NULL, NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'REAL-V001' AND d.driver_code = 'REAL-TX003' AND r.route_code = 'REAL-R001' AND c.customer_code = 'REAL-KH001'
UNION ALL
SELECT 'REAL-CHK-20260123-008', v.id, d.id, r.id, c.id, 13.0, 3800000, 'IN_TRANSIT', '2026-01-22 21:00:00', '2026-01-24 06:00:00', '2026-01-22 21:30:00', NULL, NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'REAL-V002' AND d.driver_code = 'REAL-TX002' AND r.route_code = 'REAL-R002' AND c.customer_code = 'REAL-KH002'
UNION ALL
SELECT 'REAL-CHK-20260123-009', v.id, d.id, r.id, c.id, 5.0, 2800000, 'ASSIGNED', '2026-01-24 06:00:00', '2026-01-24 12:00:00', NULL, NULL, NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'REAL-V003' AND d.driver_code = 'REAL-TX002' AND r.route_code = 'REAL-R003' AND c.customer_code = 'REAL-KH001'
UNION ALL
SELECT 'REAL-CHK-20260123-010', v.id, d.id, r.id, c.id, 11.0, 1500000, 'NEW', '2026-01-24 14:00:00', '2026-01-24 19:00:00', NULL, NULL, NOW()
FROM vehicles v, drivers d, routes r, customers c
WHERE v.vehicle_code = 'REAL-V001' AND d.driver_code = 'REAL-TX001' AND r.route_code = 'REAL-R001' AND c.customer_code = 'REAL-KH003'
ON CONFLICT (trip_code) DO NOTHING;

-- Get trip IDs for expense insertion
WITH t_data AS (
  SELECT id, trip_code FROM trips WHERE trip_code LIKE 'REAL-CHK%'
)
SELECT * FROM t_data;

-- ============================================================================
-- STEP 6: CREATE 20 REAL EXPENSES WITH REALISTIC ALLOCATIONS
-- ============================================================================

-- Trip REAL-CHK-20260123-001 (Revenue: 1,200,000): Fuel + Toll + Labor
INSERT INTO public.expenses (expense_code, trip_id, category_id, amount, description, receipt_date, is_verified)
SELECT 'REAL-EXP-001-F1'::text, t.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1), 280000, 'Xăng dầu diesel - CHK-001', '2026-01-20'::date, true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-001'
UNION ALL
SELECT 'REAL-EXP-001-T1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1), 18000, 'Phí cầu đường Biên Hòa', '2026-01-20', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-001'
UNION ALL
SELECT 'REAL-EXP-001-M1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'DRIVER_MEAL' LIMIT 1), 75000, 'Tiền ăn tài xế', '2026-01-20', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-001'
-- Trip REAL-CHK-20260123-002 (Revenue: 3,200,000): Fuel + Toll + Loading + Labor
UNION ALL
SELECT 'REAL-EXP-002-F1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1), 620000, 'Xăng dầu diesel - CHK-002', '2026-01-19', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-002'
UNION ALL
SELECT 'REAL-EXP-002-T1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1), 75000, 'Phí cầu đường Cần Thơ', '2026-01-20', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-002'
UNION ALL
SELECT 'REAL-EXP-002-L1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'LOADING' LIMIT 1), 350000, 'Phí bốc xếp hàng', '2026-01-20', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-002'
UNION ALL
SELECT 'REAL-EXP-002-M1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'DRIVER_MEAL' LIMIT 1), 150000, 'Tiền ăn 2 ngày', '2026-01-20', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-002'
-- Trip REAL-CHK-20260123-003 (Revenue: 2,500,000): Fuel + Toll + Labor
UNION ALL
SELECT 'REAL-EXP-003-F1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1), 225000, 'Xăng dầu diesel - CHK-003', '2026-01-21', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-003'
UNION ALL
SELECT 'REAL-EXP-003-T1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1), 45000, 'Phí cầu đường Vũng Tàu', '2026-01-21', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-003'
UNION ALL
SELECT 'REAL-EXP-003-M1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'DRIVER_MEAL' LIMIT 1), 100000, 'Tiền ăn tài xế', '2026-01-21', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-003'
-- Trip REAL-CHK-20260123-004 (Revenue: 1,300,000): Fuel + Toll + Labor (SHORT TRIP - LOSS MAKING)
UNION ALL
SELECT 'REAL-EXP-004-F1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1), 300000, 'Xăng dầu diesel - CHK-004', '2026-01-20', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-004'
UNION ALL
SELECT 'REAL-EXP-004-T1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1), 18000, 'Phí cầu đường', '2026-01-20', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-004'
UNION ALL
SELECT 'REAL-EXP-004-M1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'DRIVER_MEAL' LIMIT 1), 125000, 'Tiền ăn tài xế (Damaged)', '2026-01-20', false
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-004'
-- Trip REAL-CHK-20260123-005 (Revenue: 3,600,000): Fuel + Toll + Loading + Labor + Parking
UNION ALL
SELECT 'REAL-EXP-005-F1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1), 680000, 'Xăng dầu diesel - CHK-005', '2026-01-18', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-005'
UNION ALL
SELECT 'REAL-EXP-005-T1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1), 75000, 'Phí cầu đường', '2026-01-19', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-005'
UNION ALL
SELECT 'REAL-EXP-005-L1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'LOADING' LIMIT 1), 400000, 'Phí bốc xếp hàng', '2026-01-19', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-005'
UNION ALL
SELECT 'REAL-EXP-005-M1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'DRIVER_MEAL' LIMIT 1), 200000, 'Tiền ăn 2 ngày', '2026-01-19', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-005'
UNION ALL
SELECT 'REAL-EXP-005-P1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'PARKING' LIMIT 1), 100000, 'Phí đỗ xe qua đêm', '2026-01-19', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-005'
-- Trip REAL-CHK-20260123-006 (Revenue: 2,200,000): Fuel + Toll + Labor
UNION ALL
SELECT 'REAL-EXP-006-F1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1), 200000, 'Xăng dầu diesel - CHK-006', '2026-01-22', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-006'
UNION ALL
SELECT 'REAL-EXP-006-T1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1), 45000, 'Phí cầu đường', '2026-01-22', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-006'
UNION ALL
SELECT 'REAL-EXP-006-M1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'DRIVER_MEAL' LIMIT 1), 75000, 'Tiền ăn tài xế', '2026-01-22', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-006'
-- Trip REAL-CHK-20260123-007 (Revenue: 1,400,000): Fuel + Toll + Labor (IN_TRANSIT)
UNION ALL
SELECT 'REAL-EXP-007-F1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'FUEL' LIMIT 1), 320000, 'Xăng dầu diesel - CHK-007', '2026-01-23', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-007'
UNION ALL
SELECT 'REAL-EXP-007-T1', t.id, (SELECT id FROM expense_categories WHERE category_code = 'TOLL' LIMIT 1), 18000, 'Phí cầu đường', '2026-01-23', true
FROM trips t WHERE t.trip_code = 'REAL-CHK-20260123-007'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 7: CREATE EXPENSE ALLOCATIONS FOR REALISTIC EXPENSE ALLOCATION
-- ============================================================================

-- Allocate all expenses to their respective trips (should match trip revenue)
-- For demonstration, we'll allocate expenses that sum to ~80% of trip revenue

INSERT INTO public.expense_allocations (trip_id, expense_id, allocated_amount)
SELECT t.id, e.id, e.amount
FROM trips t
JOIN expenses e ON e.trip_id = t.id
WHERE t.trip_code LIKE 'REAL-CHK%'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 8: VERIFY DATA CREATION
-- ============================================================================

SELECT '=== REAL TEST DATA CREATION COMPLETE ===' as status;

SELECT 'VEHICLES CREATED' as entity, COUNT(*) as count FROM vehicles WHERE vehicle_code LIKE 'REAL-V%'
UNION ALL
SELECT 'DRIVERS CREATED', COUNT(*) FROM drivers WHERE driver_code LIKE 'REAL-TX%'
UNION ALL
SELECT 'ROUTES CREATED', COUNT(*) FROM routes WHERE route_code LIKE 'REAL-R%'
UNION ALL
SELECT 'CUSTOMERS CREATED', COUNT(*) FROM customers WHERE customer_code LIKE 'REAL-KH%'
UNION ALL
SELECT 'TRIPS CREATED', COUNT(*) FROM trips WHERE trip_code LIKE 'REAL-CHK%'
UNION ALL
SELECT 'EXPENSES CREATED', COUNT(*) FROM expenses WHERE expense_code LIKE 'REAL-EXP%'
UNION ALL
SELECT 'ALLOCATIONS CREATED', COUNT(*) FROM expense_allocations WHERE trip_id IN (SELECT id FROM trips WHERE trip_code LIKE 'REAL-CHK%');

-- Verify Financial Summary
SELECT 'FINANCIAL SUMMARY' as section;
SELECT 
  COUNT(DISTINCT t.id) as total_trips,
  COALESCE(SUM(t.revenue_amount), 0) as total_revenue,
  COALESCE(SUM(e.amount), 0) as total_expenses,
  COALESCE(SUM(t.revenue_amount), 0) - COALESCE(SUM(e.amount), 0) as net_margin,
  ROUND(((COALESCE(SUM(t.revenue_amount), 0) - COALESCE(SUM(e.amount), 0)) / COALESCE(SUM(t.revenue_amount), 1.0)) * 100, 2) as margin_percentage
FROM trips t
LEFT JOIN expenses e ON t.id = e.trip_id AND e.is_deleted = FALSE
WHERE t.trip_code LIKE 'REAL-CHK%' AND t.is_deleted = FALSE;

COMMIT;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. All data uses REAL-* prefixes for easy identification and cleanup
-- 2. Trip statuses represent realistic workflow:
--    - 4 COMPLETED (historical data for reporting)
--    - 2 IN_TRANSIT (ongoing operations)
--    - 1 DELIVERED (recently completed)
--    - 1 ASSIGNED (ready to go)
--    - 1 NEW (just scheduled)
--    - 1 (intentionally loss-making to test margin calculations)
-- 3. Expenses are realistic with proper allocation to trips
-- 4. Total trips: 10, Total expenses: 20 (some trips have multiple expenses)
-- 5. All timestamps are realistic (Jan 2026)
-- 6. Can clean up by: DELETE FROM ... WHERE code LIKE 'REAL-%'
-- ============================================================================
