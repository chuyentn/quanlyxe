/*
 * SEED_PART_2_INSERT_DATA.sql
 * 
 * MỤC ĐÍCH: Chỉ nhập dữ liệu (Sau khi đã chạy Part 1).
 */

BEGIN;

DO $$
DECLARE
    -- Constants
    c_company_id UUID := '11111111-1111-1111-1111-111111111111';
    -- USER ID CỦA ANH
    v_user_id UUID := '871d92ba-0981-4fc5-9801-dd7b6977a883'::UUID; 
    
    -- ID Arrays for random selection
    v_vehicle_ids UUID[];
    v_driver_ids UUID[];
    v_route_ids UUID[];
    v_customer_ids UUID[];
    v_trip_ids UUID[];
    
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
        v_id := gen_random_uuid();
        v_vehicle_ids[i] := v_id;
        
        INSERT INTO vehicles (
            id, company_id, vehicle_code, license_plate, vehicle_type, 
            brand, capacity_tons, fuel_type, 
            registration_expiry_date, current_location, status, demo_flag
        ) VALUES (
            v_id, c_company_id, 
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
        v_id := gen_random_uuid();
        v_driver_ids[i] := v_id;
        
        INSERT INTO drivers (
            id, company_id, driver_code, full_name, 
            license_number, license_class, phone_number, status, demo_flag
        ) VALUES (
            v_id, c_company_id,
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
        v_id := gen_random_uuid();
        v_customer_ids[i] := v_id;
        
        INSERT INTO customers (
            id, company_id, customer_code, customer_name, 
            short_name, address, tax_code, demo_flag
        ) VALUES (
            v_id, c_company_id,
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
        v_id := gen_random_uuid();
        v_route_ids[i] := v_id;
        
        INSERT INTO routes (
            id, company_id, route_code, route_name, 
            origin, destination, distance_km, estimated_duration_hours, demo_flag
        ) VALUES (
            v_id, c_company_id,
            'TR-' || LPAD(i::text, 3, '0'),
            'Hanoi - Province ' || i,
            'Hanoi Depot',
            'Industrial Park ' || i,
            100 + (i * 20),
            2 + (i * 0.5),
            true
        );
    END LOOP;

    -- 6. Operations: Trips (10)
    FOR i IN 1..10 LOOP
        v_id := gen_random_uuid();
        v_trip_ids[i] := v_id;
        
        INSERT INTO trips (
            id, company_id, trip_code, 
            vehicle_id, driver_id, route_id, customer_id,
            departure_date, arrival_date,
            status, freight_revenue, 
            demo_flag
        ) VALUES (
            v_id, c_company_id,
            'TRIP-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(i::text, 3, '0'),
            v_vehicle_ids[1 + (i % 10)], -- Rotate vehicles
            v_driver_ids[1 + (i % 10)],  -- Rotate drivers
            v_route_ids[1 + (i % 10)],   -- Rotate routes
            v_customer_ids[1 + (i % 10)],-- Rotate customers
            CURRENT_DATE - (i || ' days')::INTERVAL,
            CURRENT_DATE - (i || ' days')::INTERVAL + '5 hours'::INTERVAL,
            CASE 
                WHEN i <= 5 THEN 'completed'::trip_status 
                WHEN i <= 8 THEN 'in_progress'::trip_status 
                ELSE 'confirmed'::trip_status 
            END,
            5000000 + (i * 100000),
            true
        );
    END LOOP;

    -- 7. Operations: Expenses (10)
    FOR i IN 1..10 LOOP
        INSERT INTO expenses (
            id, company_id, trip_id, vehicle_id,
            expense_date, amount, expense_type, description, 
            status, demo_flag
        ) VALUES (
            gen_random_uuid(), c_company_id,
            CASE WHEN i % 2 = 0 THEN v_trip_ids[i] ELSE NULL END, 
            v_vehicle_ids[1 + (i % 10)],
            CURRENT_DATE - (i || ' days')::INTERVAL,
            CASE WHEN i % 2 = 0 THEN 200000 ELSE 50000 END,
            CASE WHEN i % 2 = 0 THEN 'FUEL' ELSE 'TOLL' END,
            CASE WHEN i % 2 = 0 THEN 'Do dau 50L' ELSE 'Phi cau duong' END,
            'confirmed',
            true
        );
    END LOOP;

    -- 8. Maintenance Orders (10)
    FOR i IN 1..10 LOOP
        INSERT INTO maintenance_orders (
            id, company_id, vehicle_id,
            start_date, end_date,
            maintenance_type, status,
            cost_material, cost_labor,
            description, demo_flag
        ) VALUES (
            gen_random_uuid(), c_company_id,
            v_vehicle_ids[1 + (i % 10)],
            CURRENT_DATE + (i || ' days')::INTERVAL,
            CURRENT_DATE + (i || ' days')::INTERVAL + '1 day'::INTERVAL,
            'periodic',
            CASE WHEN i % 2 = 0 THEN 'completed' ELSE 'scheduled' END,
            1500000, 500000,
            'Bao duong dinh ky cap ' || i,
            true
        );
    END LOOP;

    -- 9. Notification Settings
    BEGIN
        INSERT INTO notification_settings (
            id, company_id, user_id, 
            email_alerts_enabled, app_notifications_enabled
        ) VALUES (
            gen_random_uuid(), c_company_id, v_user_id,
            true, true
        ) 
        ON CONFLICT (user_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;

    -- 10. Rate Cards & Fuel (Safe Insert)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_prices') THEN
        INSERT INTO fuel_prices (id, company_id, fuel_type, price_per_liter, effective_date, demo_flag)
        VALUES (gen_random_uuid(), c_company_id, 'Diesel', 23000, CURRENT_DATE, true);
    END IF;

END $$;

COMMIT;
