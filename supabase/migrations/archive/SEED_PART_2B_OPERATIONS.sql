/*
 * SEED_PART_2B_OPERATIONS.sql
 * 
 * MỤC ĐÍCH: Nhập dữ liệu Vận hành (Chuyến đi).
 * CHẠY FILE NÀY SAU KHI CHẠY PART 2A.
 */

BEGIN;

DO $$
DECLARE
    -- Constants
    c_company_id UUID := '11111111-1111-1111-1111-111111111111';
    
    -- Vars
    i INT;
    v_vehicle_id UUID;
    v_driver_id UUID;
    v_route_id UUID;
    v_customer_id UUID;
BEGIN

    -- 6. Operations: Trips (10)
    FOR i IN 1..10 LOOP
        -- Select Random FKs
        SELECT id INTO v_vehicle_id FROM vehicles WHERE company_id = c_company_id ORDER BY random() LIMIT 1;
        SELECT id INTO v_driver_id FROM drivers WHERE company_id = c_company_id ORDER BY random() LIMIT 1;
        SELECT id INTO v_route_id FROM routes WHERE company_id = c_company_id ORDER BY random() LIMIT 1;
        SELECT id INTO v_customer_id FROM customers WHERE company_id = c_company_id ORDER BY random() LIMIT 1;

        IF v_vehicle_id IS NOT NULL AND v_driver_id IS NOT NULL THEN
            INSERT INTO trips (
                id, company_id, trip_code, 
                vehicle_id, driver_id, route_id, customer_id,
                departure_date, arrival_date,
                status, freight_revenue, 
                demo_flag
            ) VALUES (
                gen_random_uuid(), c_company_id,
                'TRIP-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(i::text, 3, '0'),
                v_vehicle_id, v_driver_id, v_route_id, v_customer_id,
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
        END IF;
    END LOOP;

END $$;

COMMIT;
