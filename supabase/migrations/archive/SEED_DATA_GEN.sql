/*
 * SEED_DATA_GEN.sql
 * 
 * INSTRUCTIONS:
 * 1. Open this file in the Supabase SQL Editor.
 * 2. Replace '__USER_ID__' with your actual Supabase User UUID (found in Authentication > Users).
 *    Example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
 * 3. Run the script.
 * 
 * FEATURES:
 * - Generates 10 realistic rows for each major table.
 * - Enforces referential integrity (UUIDs).
 * - Sets demo_flag = true for all records.
 * - Uses a fixed company_id.
 */

BEGIN;

-- 0. Setup Extensions & Columns
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    -- Add company_id column if missing (Critical for Multi-tenancy)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'company_id') THEN
        ALTER TABLE vehicles ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'company_id') THEN
        ALTER TABLE drivers ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'company_id') THEN
        ALTER TABLE customers ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'company_id') THEN
        ALTER TABLE routes ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'company_id') THEN
        ALTER TABLE trips ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'company_id') THEN
        ALTER TABLE expenses ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_orders' AND column_name = 'company_id') THEN
        ALTER TABLE maintenance_orders ADD COLUMN company_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'phone_number') THEN
        ALTER TABLE drivers ADD COLUMN phone_number TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'license_class') THEN
        ALTER TABLE drivers ADD COLUMN license_class TEXT;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_prices') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fuel_prices' AND column_name = 'company_id') THEN
            ALTER TABLE fuel_prices ADD COLUMN company_id UUID;
        END IF;
    END IF;

    -- Add demo_flag column to master tables if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'demo_flag') THEN
        ALTER TABLE vehicles ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'drivers' AND column_name = 'demo_flag') THEN
        ALTER TABLE drivers ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'demo_flag') THEN
        ALTER TABLE customers ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'routes' AND column_name = 'demo_flag') THEN
        ALTER TABLE routes ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'demo_flag') THEN
        ALTER TABLE trips ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'demo_flag') THEN
        ALTER TABLE expenses ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'maintenance_orders' AND column_name = 'demo_flag') THEN
        ALTER TABLE maintenance_orders ADD COLUMN demo_flag BOOLEAN DEFAULT false;
    END IF;

    -- Add specific requested columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'registration_expiry_date') THEN
        ALTER TABLE vehicles ADD COLUMN registration_expiry_date DATE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'current_location') THEN
        ALTER TABLE vehicles ADD COLUMN current_location TEXT;
    END IF;
END $$;

DO $$
DECLARE
    -- Constants
    c_company_id UUID := '11111111-1111-1111-1111-111111111111';
    v_user_id UUID := '871d92ba-0981-4fc5-9801-dd7b6977a883'::UUID; -- Updated with actual User ID
    
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
    -- 0.1 Ensure companies table exists (Fix for missing relation error)
    CREATE TABLE IF NOT EXISTS public.companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        subscription_tier TEXT DEFAULT 'basic',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- 0.2 Enable RLS on companies if not already (Optional but good practice)
    ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
    
    -- 0.3 Grant permissions to authenticated users to secure it
    GRANT ALL ON public.companies TO authenticated;
    GRANT ALL ON public.companies TO service_role;

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
                WHEN i <= 5 THEN 'completed' 
                WHEN i <= 8 THEN 'in_progress' 
                ELSE 'pending' 
            END,
            5000000 + (i * 100000),
            true
        );
    END LOOP;

    -- 7. Operations: Expenses (10)
    -- Mixed linked to trip and standalone vehicle
    FOR i IN 1..10 LOOP
        INSERT INTO expenses (
            id, company_id, trip_id, vehicle_id,
            expense_date, amount, expense_type, description, 
            status, demo_flag
        ) VALUES (
            gen_random_uuid(), c_company_id,
            CASE WHEN i % 2 = 0 THEN v_trip_ids[i] ELSE NULL END, -- 50% link to trip
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

    -- 9. Notification Settings (1 Row)
    -- Assuming table exists or fail silently/upsert
    BEGIN
        INSERT INTO notification_settings (
            id, company_id, user_id, 
            email_alerts_enabled, app_notifications_enabled
        ) VALUES (
            gen_random_uuid(), c_company_id, v_user_id,
            true, true
        ) 
        ON CONFLICT (user_id) DO NOTHING; -- Assuming user_id unique or PK
    EXCEPTION WHEN OTHERS THEN
        NULL; -- Ignore if table missing or structure diff
    END;

    -- 10. Rate Cards & Fuel (Mocking generic structure if tables vary)
    -- Skipping strict detail to avoid breakage if tables heavily modified, 
    -- but providing basic inserts if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fuel_prices') THEN
        INSERT INTO fuel_prices (id, company_id, fuel_type, price_per_liter, effective_date, demo_flag)
        VALUES (gen_random_uuid(), c_company_id, 'Diesel', 23000, CURRENT_DATE, true);
    END IF;

END $$;

COMMIT;
