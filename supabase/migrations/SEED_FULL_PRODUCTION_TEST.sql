/*
 * SEED_FULL_PRODUCTION_TEST.sql
 * 
 * MỤC ĐÍCH: Dữ liệu mẫu Demo cho Sếp (10 dòng/bảng - Full kịch bản).
 * 
 * NỘI DUNG:
 * 1. 10 Xe: Đủ loại (Tải nhẹ, Tải nặng, Cont), Đủ hãng (Hino, Hyundai, Isuzu), Đủ tình trạng.
 * 2. 10 Tài xế: Đủ bằng (C, FC), Có người nghỉ phép, Có người sắp hết hạn bằng.
 * 3. 10 Khách hàng: Các tập đoàn lớn (Samsung, LG, VinFast...).
 * 4. 10 Tuyến đường: Bắc - Trung - Nam.
 * 5. 12 Chuyến đi (Trips): 
 *    - 6 Chuyến tháng trước (Hoàn thành -> Có doanh thu).
 *    - 4 Chuyến đang chạy (Tracking).
 *    - 2 Chuyến kế hoạch (Tương lai).
 * 6. Tài chính: Full chi phí, Full bảo dưỡng.
 */

BEGIN;

-- 1. Dọn dẹp sạch sẽ
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE maintenance_orders CASCADE;
TRUNCATE TABLE trips CASCADE;
TRUNCATE TABLE vehicles CASCADE;
TRUNCATE TABLE drivers CASCADE;
TRUNCATE TABLE routes CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE fuel_prices CASCADE;
TRUNCATE TABLE expense_categories CASCADE;
TRUNCATE TABLE companies CASCADE;

DO $$
DECLARE
    -- ID Công ty
    c_company_id UUID := '11111111-1111-1111-1111-111111111111';
    
    -- Danh sách ID (Khai báo mảng để loop hoặc gán cứng cho dễ nhớ)
    v_veh_ids UUID[] := ARRAY[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
    v_drv_ids UUID[] := ARRAY[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
    v_cust_ids UUID[] := ARRAY[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
    v_route_ids UUID[] := ARRAY[gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid()];
    
    -- Categories
    v_cat_fuel UUID := gen_random_uuid();
    v_cat_toll UUID := gen_random_uuid();
    v_cat_repair UUID := gen_random_uuid();
    v_cat_load UUID := gen_random_uuid();
    v_cat_police UUID := gen_random_uuid();
    v_cat_other UUID := gen_random_uuid();

BEGIN
    -- 0. Tạo Công ty
    INSERT INTO companies (id, name, subscription_tier)
    VALUES (c_company_id, 'Logistics Việt Nam JSC', 'enterprise')
    ON CONFLICT (id) DO NOTHING;

    -- 0.5. Danh mục Chi phí (Full 6 loại)
    INSERT INTO expense_categories (id, category_code, category_name, category_type) VALUES
    (v_cat_fuel, 'FUEL', 'Nhiên liệu', 'variable'),
    (v_cat_toll, 'TOLL', 'Phí cầu đường', 'variable'),
    (v_cat_repair, 'REPAIR', 'Sửa chữa bảo dưỡng', 'fixed'),
    (v_cat_load, 'LOAD', 'Bốc xếp', 'variable'),
    (v_cat_police, 'POLICE', 'Luật / Phạt', 'variable'),
    (v_cat_other, 'OTHER', 'Khác', 'variable');

    -- 1. DANH MỤC XE (10 Xe - Đủ kịch bản)
    INSERT INTO vehicles (
        id, company_id, vehicle_code, license_plate, vehicle_type, brand, model,
        capacity_tons, fuel_type, fuel_consumption_per_100km,
        purchase_date, status, current_location,
        insurance_expiry_date, registration_expiry_date, current_odometer
    ) VALUES 
    -- Xe 1-3: Xe Tải Nhẹ (Hoạt động tốt)
    (v_veh_ids[1], c_company_id, 'XE-001', '29H-123.45', 'Truck 1.5T', 'Kia', 'K250', 1.5, 'Diesel', 9.0, '2023-01-10', 'active'::vehicle_status, 'Hanoi Depot', CURRENT_DATE + 365, CURRENT_DATE + 180, 45000),
    (v_veh_ids[2], c_company_id, 'XE-002', '29H-567.89', 'Truck 2.5T', 'Kia', 'K250', 2.5, 'Diesel', 10.0, '2023-02-15', 'active'::vehicle_status, 'Bac Ninh', CURRENT_DATE + 300, CURRENT_DATE + 150, 52000),
    (v_veh_ids[3], c_company_id, 'XE-003', '29C-999.99', 'Truck 5T', 'Hino', '300 Series', 5.0, 'Diesel', 12.0, '2022-05-20', 'active'::vehicle_status, 'Hung Yen', CURRENT_DATE + 200, CURRENT_DATE + 100, 89000),
    
    -- Xe 4-6: Xe Tải Trung (1 Xe hết hạn đăng kiểm đỏ, 1 xe hết bảo hiểm vàng)
    (v_veh_ids[4], c_company_id, 'XE-004', '88C-111.22', 'Truck 8T', 'Isuzu', 'FVR', 8.0, 'Diesel', 16.0, '2021-08-10', 'active'::vehicle_status, 'Vinh Phuc', CURRENT_DATE + 60, CURRENT_DATE - 5, 120000), -- Hết hạn đăng kiểm
    (v_veh_ids[5], c_company_id, 'XE-005', '98C-333.44', 'Truck 10T', 'Hyundai', 'HD210', 10.0, 'Diesel', 18.0, '2021-09-01', 'active'::vehicle_status, 'Bac Giang', CURRENT_DATE + 10, CURRENT_DATE + 90, 150000), -- Sắp hết bảo hiểm
    (v_veh_ids[6], c_company_id, 'XE-006', '19C-555.66', 'Truck 15T', 'Hino', '500 Series', 15.0, 'Diesel', 20.0, '2020-12-12', 'maintenance'::vehicle_status, 'Garage Toyota', CURRENT_DATE + 365, CURRENT_DATE + 180, 200000), -- Đang sửa chữa
    
    -- Xe 7-10: Xe Container / Đầu kéo (Chạy đường dài)
    (v_veh_ids[7], c_company_id, 'XE-007', '15C-777.88', 'Container', 'Isuzu', 'GIGA', 30.0, 'Diesel', 32.0, '2022-01-01', 'active'::vehicle_status, 'Haiphong Port', CURRENT_DATE + 200, CURRENT_DATE + 120, 250000),
    (v_veh_ids[8], c_company_id, 'XE-008', '51D-888.99', 'Tractor', 'Daewoo', 'Novus', 40.0, 'Diesel', 35.0, '2022-03-15', 'active'::vehicle_status, 'Da Nang', CURRENT_DATE + 250, CURRENT_DATE + 150, 300000),
    (v_veh_ids[9], c_company_id, 'XE-009', '51D-000.01', 'Tractor', 'Chenglong', 'H7', 40.0, 'Diesel', 34.0, '2023-06-01', 'active'::vehicle_status, 'Saigon Port', CURRENT_DATE + 300, CURRENT_DATE + 200, 100000),
    (v_veh_ids[10], c_company_id,'XE-010', '60C-666.66', 'Container', 'Maxxforce', 'ProStar', 35.0, 'Diesel', 36.0, '2020-01-01', 'maintenance'::vehicle_status, 'Dong Nai', CURRENT_DATE + 100, CURRENT_DATE + 50, 450000);

    -- 2. DANH MỤC TÀI XẾ (10 Tài - Đủ hoàn cảnh)
    INSERT INTO drivers (
        id, company_id, driver_code, full_name, phone_number,
        license_number, license_class, license_expiry,
        status, base_salary
    ) VALUES
    (v_drv_ids[1], c_company_id, 'TX-001', 'Nguyen Van Hung', '0901234567', '001001001001', 'C', CURRENT_DATE + 1000, 'active'::driver_status, 10000000),
    (v_drv_ids[2], c_company_id, 'TX-002', 'Tran Van Nam', '0902345678', '002002002002', 'C', CURRENT_DATE + 800, 'active'::driver_status, 10000000),
    (v_drv_ids[3], c_company_id, 'TX-003', 'Le Van Binh', '0903456789', '003003003003', 'FC', CURRENT_DATE + 500, 'active'::driver_status, 15000000),
    (v_drv_ids[4], c_company_id, 'TX-004', 'Pham Van Dung', '0904567890', '004004004004', 'FC', CURRENT_DATE + 20, 'active'::driver_status, 15000000), -- Sắp hết hạn bằng
    (v_drv_ids[5], c_company_id, 'TX-005', 'Hoang Van Hai', '0905678901', '005005005005', 'FC', CURRENT_DATE + 365, 'on_leave'::driver_status, 14000000), -- Nghỉ phép
    (v_drv_ids[6], c_company_id, 'TX-006', 'Do Van Kien', '0906789012', '006006006006', 'C', CURRENT_DATE + 700, 'active'::driver_status, 11000000),
    (v_drv_ids[7], c_company_id, 'TX-007', 'Bui Van Long', '0907890123', '007007007007', 'FC', CURRENT_DATE + 600, 'active'::driver_status, 16000000),
    (v_drv_ids[8], c_company_id, 'TX-008', 'Truong Van Manh', '0908901234', '008008008008', 'FC', CURRENT_DATE + 400, 'active'::driver_status, 16000000),
    (v_drv_ids[9], c_company_id, 'TX-009', 'Ngo Van Nghia', '0909012345', '009009009009', 'C', CURRENT_DATE + 300, 'active'::driver_status, 10500000),
    (v_drv_ids[10], c_company_id,'TX-010', 'Vu Van Quyet', '0910123456', '010010010010', 'FC', CURRENT_DATE - 10, 'on_leave'::driver_status, 15000000); -- Hết hạn bằng

    -- 3. KHÁCH HÀNG (10 Khách - Tập đoàn thật)
    INSERT INTO customers (
        id, company_id, customer_code, customer_name, short_name, 
        address, tax_code, payment_terms
    ) VALUES
    (v_cust_ids[1], c_company_id, 'KH-SS', 'Samsung Electronics Vietnam', 'Samsung', 'KCN Yen Phong, Bac Ninh', '0101010001', 30),
    (v_cust_ids[2], c_company_id, 'KH-LG', 'LG Display Vietnam', 'LG Display', 'KCN Trang Due, Hai Phong', '0101010002', 45),
    (v_cust_ids[3], c_company_id, 'KH-VF', 'VinFast Trading & Production', 'VinFast', 'KKT Dinh Vu, Hai Phong', '0101010003', 30),
    (v_cust_ids[4], c_company_id, 'KH-HONDA', 'Honda Vietnam Company', 'Honda', 'Phuc Yen, Vinh Phuc', '0101010004', 30),
    (v_cust_ids[5], c_company_id, 'KH-TOY', 'Toyota Motor Vietnam', 'Toyota', 'Phuc Yen, Vinh Phuc', '0101010005', 45),
    (v_cust_ids[6], c_company_id, 'KH-UNILEVER', 'Unilever Vietnam International', 'Unilever', 'KCN Tay Bac Cu Chi, HCM', '0101010006', 60),
    (v_cust_ids[7], c_company_id, 'KH-PEPSI', 'Suntory Pepsico Vietnam', 'Pepsico', 'Quan 1, TP HCM', '0101010007', 30),
    (v_cust_ids[8], c_company_id, 'KH-COKE', 'Coca-Cola Beverages Vietnam', 'Coca-Cola', 'Thu Duc, TP HCM', '0101010008', 30),
    (v_cust_ids[9], c_company_id, 'KH-MASAN', 'Masan Consumer Corporation', 'Masan', 'Quan 1, TP HCM', '0101010009', 15),
    (v_cust_ids[10], c_company_id,'KH-VNM', 'Vietnam Dairy Products (Vinamilk)', 'Vinamilk', 'Quan 7, TP HCM', '0101010010', 30);

    -- 4. TUYẾN ĐƯỜNG (10 Tuyến - Đa dạng khoảng cách)
    INSERT INTO routes (
        id, company_id, route_code, route_name, origin, destination,
        distance_km, estimated_duration_hours, standard_freight_rate
    ) VALUES
    (v_route_ids[1], c_company_id, 'RT-HN-BN', 'Ha Noi - Bac Ninh', 'Hanoi Depot', 'KCN Yen Phong', 40, 1.5, 1200000),
    (v_route_ids[2], c_company_id, 'RT-HN-HP', 'Ha Noi - Hai Phong', 'Hanoi Depot', 'KCN Trang Due', 120, 2.5, 2500000),
    (v_route_ids[3], c_company_id, 'RT-HN-QN', 'Ha Noi - Quang Ninh', 'Hanoi Depot', 'Cang Cai Lan', 160, 3.5, 3000000),
    (v_route_ids[4], c_company_id, 'RT-HN-VP', 'Ha Noi - Vinh Phuc', 'Hanoi Depot', 'Nha may Honda', 50, 1.5, 1500000),
    (v_route_ids[5], c_company_id, 'RT-HN-LS', 'Ha Noi - Lang Son', 'Hanoi Depot', 'Cua khau Huu Nghi', 180, 4.0, 3500000),
    (v_route_ids[6], c_company_id, 'RT-HN-NA', 'Ha Noi - Nghe An', 'Hanoi Depot', 'KCN VSIP Nghe An', 300, 6.0, 5000000),
    (v_route_ids[7], c_company_id, 'RT-HN-DN', 'Ha Noi - Da Nang', 'Hanoi Depot', 'KCN Hoa Khanh', 800, 16.0, 15000000),
    (v_route_ids[8], c_company_id, 'RT-DN-HCM', 'Da Nang - HCM', 'KCN Hoa Khanh', 'Cang Cat Lai', 950, 20.0, 18000000),
    (v_route_ids[9], c_company_id, 'RT-HN-HCM', 'Ha Noi - HCM', 'Hanoi Depot', 'Cang Cat Lai', 1700, 48.0, 35000000),
    (v_route_ids[10], c_company_id,'RT-HCM-CT', 'HCM - Can Tho', 'Cang Cat Lai', 'KCN Tra Noc', 180, 4.0, 4000000);

    -- 5. CHUYẾN ĐI (Trips) - Sinh 10 chuyến cho sinh động
    
    -- Chuyến 1-4: Tháng trước -> Completed -> Có doanh thu
    INSERT INTO trips (id, company_id, trip_code, vehicle_id, driver_id, route_id, customer_id, departure_date, arrival_date, status, freight_revenue) VALUES
    (gen_random_uuid(), c_company_id, 'TRIP-2401-01', v_veh_ids[3], v_drv_ids[1], v_route_ids[2], v_cust_ids[2], CURRENT_DATE - 30, CURRENT_DATE - 29, 'completed'::trip_status, 2500000),
    (gen_random_uuid(), c_company_id, 'TRIP-2401-02', v_veh_ids[7], v_drv_ids[3], v_route_ids[7], v_cust_ids[6], CURRENT_DATE - 25, CURRENT_DATE - 23, 'completed'::trip_status, 15000000),
    (gen_random_uuid(), c_company_id, 'TRIP-2401-03', v_veh_ids[8], v_drv_ids[7], v_route_ids[9], v_cust_ids[6], CURRENT_DATE - 20, CURRENT_DATE - 15, 'completed'::trip_status, 35000000),
    (gen_random_uuid(), c_company_id, 'TRIP-2401-04', v_veh_ids[1], v_drv_ids[2], v_route_ids[1], v_cust_ids[1], CURRENT_DATE - 10, CURRENT_DATE - 10 + INTERVAL '5 hours', 'completed'::trip_status, 1200000);

    -- Chuyến 5-8: Hnay/Tuần này -> In Progress -> Tracking
    INSERT INTO trips (id, company_id, trip_code, vehicle_id, driver_id, route_id, customer_id, departure_date, status, freight_revenue) VALUES
    (gen_random_uuid(), c_company_id, 'TRIP-2402-01', v_veh_ids[4], v_drv_ids[4], v_route_ids[3], v_cust_ids[3], CURRENT_DATE - 1, 'in_progress'::trip_status, 3000000),
    (gen_random_uuid(), c_company_id, 'TRIP-2402-02', v_veh_ids[9], v_drv_ids[8], v_route_ids[9], v_cust_ids[9], CURRENT_DATE - 2, 'in_progress'::trip_status, 35000000),
    (gen_random_uuid(), c_company_id, 'TRIP-2402-03', v_veh_ids[7], v_drv_ids[3], v_route_ids[2], v_cust_ids[2], CURRENT_DATE, 'in_progress'::trip_status, 2500000),
    (gen_random_uuid(), c_company_id, 'TRIP-2402-04', v_veh_ids[2], v_drv_ids[1], v_route_ids[1], v_cust_ids[1], CURRENT_DATE, 'in_progress'::trip_status, 1200000);

    -- Chuyến 9-10: Tương lai -> Scheduled
    INSERT INTO trips (id, company_id, trip_code, vehicle_id, driver_id, route_id, customer_id, departure_date, status, freight_revenue) VALUES
    (gen_random_uuid(), c_company_id, 'TRIP-2402-05', v_veh_ids[1], v_drv_ids[2], v_route_ids[4], v_cust_ids[4], CURRENT_DATE + 2, 'confirmed'::trip_status, 1500000),
    (gen_random_uuid(), c_company_id, 'TRIP-2402-06', v_veh_ids[8], v_drv_ids[7], v_route_ids[8], v_cust_ids[10], CURRENT_DATE + 3, 'confirmed'::trip_status, 18000000);

    -- 6. CHI PHÍ (Đi kèm chuyến & Độc lập)
    INSERT INTO expenses (id, company_id, vehicle_id, category_id, expense_code, amount, expense_date, status, description) VALUES
    -- Nhiên liệu
    (gen_random_uuid(), c_company_id, v_veh_ids[1], v_cat_fuel, 'EXP-001', 500000, CURRENT_DATE - 10, 'confirmed'::expense_status, 'Do dau 50 Lit'),
    (gen_random_uuid(), c_company_id, v_veh_ids[8], v_cat_fuel, 'EXP-002', 5000000, CURRENT_DATE - 20, 'confirmed'::expense_status, 'Do dau 300 Lit'),
    (gen_random_uuid(), c_company_id, v_veh_ids[9], v_cat_fuel, 'EXP-003', 4500000, CURRENT_DATE - 2, 'confirmed'::expense_status, 'Do dau 280 Lit'),
    -- Cầu đường
    (gen_random_uuid(), c_company_id, v_veh_ids[3], v_cat_toll, 'EXP-004', 200000, CURRENT_DATE - 29, 'confirmed'::expense_status, 'Ve cau duong 5B'),
    (gen_random_uuid(), c_company_id, v_veh_ids[7], v_cat_toll, 'EXP-005', 120000, CURRENT_DATE, 'confirmed'::expense_status, 'Ve cau duong QL5'),
    -- Luật
    (gen_random_uuid(), c_company_id, v_veh_ids[4], v_cat_police, 'EXP-006', 500000, CURRENT_DATE - 1, 'confirmed'::expense_status, 'Phat qua toc do');

    -- 7. BẢO TRÌ SỬA CHỮA
    INSERT INTO maintenance_orders (id, company_id, vehicle_id, order_code, maintenance_type, status, started_at, completed_at, parts_cost, labor_cost, description) VALUES
    (gen_random_uuid(), c_company_id, v_veh_ids[1], 'MNT-001', 'periodic', 'completed'::maintenance_status, CURRENT_DATE - 60, CURRENT_DATE - 60, 1500000, 200000, 'Bao duong 5000km'),
    (gen_random_uuid(), c_company_id, v_veh_ids[6], 'MNT-002', 'repair', 'in_progress'::maintenance_status, CURRENT_DATE - 5, NULL, 15000000, 3000000, 'Dai tu may (Hong nang)'),
    (gen_random_uuid(), c_company_id, v_veh_ids[10], 'MNT-003', 'repair', 'in_progress'::maintenance_status, CURRENT_DATE - 2, NULL, 5000000, 1000000, 'Thay lop xe');

    -- 8. GIÁ NHIÊN LIỆU
    INSERT INTO fuel_prices (id, company_id, fuel_type, price_per_liter, effective_date) VALUES 
    (gen_random_uuid(), c_company_id, 'Diesel', 22000, '2023-12-01'),
    (gen_random_uuid(), c_company_id, 'Diesel', 23500, '2024-01-01');

END $$;

COMMIT;
