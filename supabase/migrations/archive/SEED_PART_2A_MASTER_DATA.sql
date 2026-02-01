/*
 * SEED_PART_2A_MASTER_DATA.sql
 * 
 * MỤC ĐÍCH: Nhập dữ liệu nền tảng (Xe, Tài xế, Khách hàng, Tuyến đường).
 * CHẠY FILE NÀY SAU KHI CHẠY PART 1.
 */

BEGIN;

DO $$
DECLARE
    -- Constants
    c_company_id UUID := '11111111-1111-1111-1111-111111111111';
    
    -- Loop vars
    i INT;
    v_id UUID;
BEGIN
    -- 1. Ensure Company Exists
    INSERT INTO companies (id, name, subscription_tier)
    VALUES (c_company_id, 'Demo Logistics Co.', 'enterprise')
    ON CONFLICT (id) DO NOTHING;

    -- 2. Master Data: Vehicles (10)
    FOR i IN 1..10 LOOP
        INSERT INTO vehicles (
            id, company_id, vehicle_code, license_plate, vehicle_type, 
            brand, capacity_tons, fuel_type, 
            registration_expiry_date, current_location, status, demo_flag
        ) VALUES (
            gen_random_uuid(), c_company_id, 
            'XE-' || LPAD(i::text, 3, '0'), 
            '29H-' || (10000 + i), 
            CASE WHEN i % 3 = 0 THEN 'Container' WHEN i % 3 = 1 THEN 'Truck 5T' ELSE 'Truck 10T' END,
            CASE WHEN i % 2 = 0 THEN 'Hino' ELSE 'Hyundai' END,
            CASE WHEN i % 3 = 0 THEN 30 WHEN i % 3 = 1 THEN 5 ELSE 10 END,
            'Diesel',
            (CURRENT_DATE + (i * 30 || ' days')::INTERVAL)::DATE,
            CASE WHEN i % 2 = 0 THEN 'Hanoi Depot' ELSE 'Haiphong Port' END,
            'active',
            true
        );
    END LOOP;

    -- 3. Master Data: Drivers (10)
    FOR i IN 1..10 LOOP
        INSERT INTO drivers (
            id, company_id, driver_code, full_name, 
            license_number, license_class, phone_number, status, demo_flag
        ) VALUES (
            gen_random_uuid(), c_company_id,
            'TX-' || LPAD(i::text, 3, '0'),
            'Nguyen Van ' || CHR(65 + i), -- A, B, C...
            'LIC-' || (90000 + i),
            'Feature FC',
            '090' || (1234560 + i),
            'active',
            true
        );
    END LOOP;

    -- 4. Master Data: Customers (10)
    FOR i IN 1..10 LOOP
        INSERT INTO customers (
            id, company_id, customer_code, customer_name, 
            short_name, address, tax_code, demo_flag
        ) VALUES (
            gen_random_uuid(), c_company_id,
            'KH-' || LPAD(i::text, 3, '0'),
            'Cong Ty TNHH Khach Hang ' || i,
            'Khach ' || i,
            'Khu Cong Nghiep ' || i || ', Hanoi',
            'TAX00' || i,
            true
        );
    END LOOP;

    -- 5. Master Data: Routes (10)
    FOR i IN 1..10 LOOP
        INSERT INTO routes (
            id, company_id, route_code, route_name, 
            origin, destination, distance_km, estimated_duration_hours, demo_flag
        ) VALUES (
            gen_random_uuid(), c_company_id,
            'TR-' || LPAD(i::text, 3, '0'),
            'Hanoi - Province ' || i,
            'Hanoi Depot',
            'Industrial Park ' || i,
            100 + (i * 20),
            2 + (i * 0.5),
            true
        );
    END LOOP;

END $$;

COMMIT;
