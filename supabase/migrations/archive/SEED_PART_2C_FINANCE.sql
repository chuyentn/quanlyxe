/*
 * SEED_PART_2C_FINANCE.sql
 * 
 * MỤC ĐÍCH: Nhập dữ liệu Tài chính (Chi phí, Bảo dưỡng).
 * CHẠY FILE NÀY SAU KHI CHẠY PART 2B.
 * 
 * UPDATE: Fix lỗi thiếu expense_code, category_id, order_code.
 */

BEGIN;

DO $$
DECLARE
    -- Constants
    c_company_id UUID := '11111111-1111-1111-1111-111111111111';
    v_user_id UUID := '871d92ba-0981-4fc5-9801-dd7b6977a883'::UUID; 

    -- Vars
    i INT;
    v_trip_id UUID;
    v_vehicle_id UUID;
    v_category_id UUID;
BEGIN

    -- 0. Ensure at least one Expense Category exists (Required for Expenses)
    -- Try to find one, or create if not exists
    SELECT id INTO v_category_id FROM expense_categories LIMIT 1;
    
    IF v_category_id IS NULL THEN
        v_category_id := gen_random_uuid();
        INSERT INTO expense_categories (id, category_code, category_name, category_type)
        VALUES (v_category_id, 'FUEL', 'Nhien lieu', 'variable')
        ON CONFLICT DO NOTHING; -- Handle potential constraints if schema differs
    END IF;

    -- 7. Operations: Expenses (10)
    FOR i IN 1..10 LOOP
         -- Select Random FKs
        SELECT id INTO v_vehicle_id FROM vehicles WHERE company_id = c_company_id ORDER BY random() LIMIT 1;
        SELECT id INTO v_trip_id FROM trips WHERE company_id = c_company_id ORDER BY random() LIMIT 1;
        
        IF v_vehicle_id IS NOT NULL THEN
            INSERT INTO expenses (
                id, company_id, trip_id, vehicle_id, category_id,
                expense_code, -- Added
                expense_date, amount, expense_type, description, 
                status
            ) VALUES (
                gen_random_uuid(), c_company_id,
                CASE WHEN i % 2 = 0 THEN v_trip_id ELSE NULL END, 
                v_vehicle_id,
                v_category_id, -- Required FK
                'EXP-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(i::text, 3, '0'), -- Required Code
                CURRENT_DATE - (i || ' days')::INTERVAL,
                CASE WHEN i % 2 = 0 THEN 200000 ELSE 50000 END,
                CASE WHEN i % 2 = 0 THEN 'FUEL' ELSE 'TOLL' END,
                CASE WHEN i % 2 = 0 THEN 'Do dau 50L' ELSE 'Phi cau duong' END,
                'confirmed'::expense_status
            );
        END IF;
    END LOOP;

    -- 8. Maintenance Orders (10)
    FOR i IN 1..10 LOOP
        SELECT id INTO v_vehicle_id FROM vehicles WHERE company_id = c_company_id ORDER BY random() LIMIT 1;

        IF v_vehicle_id IS NOT NULL THEN
            INSERT INTO maintenance_orders (
                id, company_id, vehicle_id,
                order_code, -- Added possibly required
                started_at, completed_at, scheduled_date,
                maintenance_type, status,
                parts_cost, labor_cost, -- Corrected column names
                description
            ) VALUES (
                gen_random_uuid(), c_company_id,
                v_vehicle_id,
                'MNT-' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || '-' || LPAD(i::text, 3, '0'), -- Code
                CURRENT_DATE + (i || ' days')::INTERVAL, -- started_at
                CURRENT_DATE + (i || ' days')::INTERVAL + '1 day'::INTERVAL, -- completed_at
                CURRENT_DATE + (i || ' days')::INTERVAL, -- scheduled_date
                'periodic',
                CASE WHEN i % 2 = 0 THEN 'completed'::maintenance_status ELSE 'scheduled'::maintenance_status END,
                1500000, 500000,
                'Bao duong dinh ky cap ' || i
            );
        END IF;
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
