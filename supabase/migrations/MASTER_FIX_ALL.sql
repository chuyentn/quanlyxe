-- ============================================================================
-- MASTER FIX SCRIPT - FIX ALL ISSUES
-- 1. Fix user_roles table structure and add admin role
-- 2. Fix RLS policies for ALL tables
-- Date: 2026-01-31
-- ============================================================================

-- ===== PART 1: FIX USER_ROLES TABLE =====

-- 1.1 Ensure the user_roles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer',
    email TEXT,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Add unique constraint on user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'user_roles_user_id_key' 
        AND conrelid = 'public.user_roles'::regclass
    ) THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Constraint might already exist with different name, ignore error
    RAISE NOTICE 'Constraint may already exist: %', SQLERRM;
END $$;

-- 1.3 Add missing columns to user_roles if they don't exist
DO $$
BEGIN
    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'email') THEN
        ALTER TABLE public.user_roles ADD COLUMN email TEXT;
    END IF;
    
    -- Add full_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'full_name') THEN
        ALTER TABLE public.user_roles ADD COLUMN full_name TEXT;
    END IF;
    
    -- Add updated_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_roles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Add created_at column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'created_at') THEN
        ALTER TABLE public.user_roles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 1.4 Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 1.5 Create SELECT policy for user_roles
DROP POLICY IF EXISTS "Users can read all roles" ON public.user_roles;
CREATE POLICY "Users can read all roles" 
    ON public.user_roles FOR SELECT 
    TO authenticated 
    USING (true);

-- 1.6 Create INSERT policy for user_roles
DROP POLICY IF EXISTS "Users can insert roles" ON public.user_roles;
CREATE POLICY "Users can insert roles" 
    ON public.user_roles FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- 1.7 Create UPDATE policy for user_roles
DROP POLICY IF EXISTS "Users can update roles" ON public.user_roles;
CREATE POLICY "Users can update roles" 
    ON public.user_roles FOR UPDATE 
    TO authenticated 
    USING (true);

-- 1.8 Insert admin role for all existing auth users (using UPSERT)
INSERT INTO public.user_roles (user_id, role, email, full_name)
SELECT 
    id,
    'admin',
    email,
    COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1))
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET 
    role = 'admin';

-- ===== PART 2: FIX RLS FOR ALL CATALOG TABLES =====

-- 2.1 VEHICLES
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select vehicles" ON public.vehicles;
CREATE POLICY "Authenticated users can select vehicles" 
    ON public.vehicles FOR SELECT 
    TO authenticated USING (true);

-- 2.2 DRIVERS
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select drivers" ON public.drivers;
CREATE POLICY "Authenticated users can select drivers" 
    ON public.drivers FOR SELECT 
    TO authenticated USING (true);

-- 2.3 ROUTES
ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select routes" ON public.routes;
CREATE POLICY "Authenticated users can select routes" 
    ON public.routes FOR SELECT 
    TO authenticated USING (true);

-- 2.4 CUSTOMERS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select customers" ON public.customers;
CREATE POLICY "Authenticated users can select customers" 
    ON public.customers FOR SELECT 
    TO authenticated USING (true);

-- 2.5 TRIPS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select trips" ON public.trips;
CREATE POLICY "Authenticated users can select trips" 
    ON public.trips FOR SELECT 
    TO authenticated USING (true);

-- 2.6 EXPENSES
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can select expenses" ON public.expenses;
CREATE POLICY "Authenticated users can select expenses" 
    ON public.expenses FOR SELECT 
    TO authenticated USING (true);

-- 2.7 MAINTENANCE_ORDERS
DO $$ BEGIN
    ALTER TABLE public.maintenance_orders ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'maintenance_orders table does not exist, skipping';
END $$;

DROP POLICY IF EXISTS "Authenticated users can select maintenance_orders" ON public.maintenance_orders;
DO $$ BEGIN
    CREATE POLICY "Authenticated users can select maintenance_orders" 
        ON public.maintenance_orders FOR SELECT 
        TO authenticated USING (true);
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'maintenance_orders table does not exist, skipping policy';
END $$;

-- 2.8 EXPENSE_CATEGORIES
DO $$ BEGIN
    ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'expense_categories table does not exist, skipping';
END $$;

DROP POLICY IF EXISTS "Authenticated users can select expense_categories" ON public.expense_categories;
DO $$ BEGIN
    CREATE POLICY "Authenticated users can select expense_categories" 
        ON public.expense_categories FOR SELECT 
        TO authenticated USING (true);
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'expense_categories table does not exist, skipping policy';
END $$;

-- 2.9 ACCOUNTING_PERIODS
DO $$ BEGIN
    ALTER TABLE public.accounting_periods ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'accounting_periods table does not exist, skipping';
END $$;

DROP POLICY IF EXISTS "Authenticated users can select accounting_periods" ON public.accounting_periods;
DO $$ BEGIN
    CREATE POLICY "Authenticated users can select accounting_periods" 
        ON public.accounting_periods FOR SELECT 
        TO authenticated USING (true);
EXCEPTION WHEN undefined_table THEN
    RAISE NOTICE 'accounting_periods table does not exist, skipping policy';
END $$;

-- 2.10 COMPANY_SETTINGS
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT,
    tax_code TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select company_settings" ON public.company_settings;
CREATE POLICY "Authenticated users can select company_settings" 
    ON public.company_settings FOR SELECT 
    TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert company_settings" ON public.company_settings;
CREATE POLICY "Authenticated users can insert company_settings" 
    ON public.company_settings FOR INSERT 
    TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update company_settings" ON public.company_settings;
CREATE POLICY "Authenticated users can update company_settings" 
    ON public.company_settings FOR UPDATE 
    TO authenticated USING (true);

-- 2.11 SECURITY_SETTINGS
CREATE TABLE IF NOT EXISTS public.security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    lock_completed_data BOOLEAN DEFAULT true,
    log_all_actions BOOLEAN DEFAULT true,
    auto_logout_30min BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select security_settings" ON public.security_settings;
CREATE POLICY "Authenticated users can select security_settings" 
    ON public.security_settings FOR SELECT 
    TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert security_settings" ON public.security_settings;
CREATE POLICY "Authenticated users can insert security_settings" 
    ON public.security_settings FOR INSERT 
    TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update security_settings" ON public.security_settings;
CREATE POLICY "Authenticated users can update security_settings" 
    ON public.security_settings FOR UPDATE 
    TO authenticated USING (true);

-- ============================================
-- PHẦN 4: DASHBOARD VIEWS & MAINTENANCE
-- ============================================

-- 4.1 FIX EXPENSES COLUMNS
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'total_amount') THEN
        ALTER TABLE public.expenses ADD COLUMN total_amount NUMERIC(15,2) DEFAULT 0;
        UPDATE public.expenses SET total_amount = COALESCE(amount, 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'expense_date') THEN
        ALTER TABLE public.expenses ADD COLUMN expense_date DATE DEFAULT CURRENT_DATE;
        UPDATE public.expenses SET expense_date = COALESCE(DATE(created_at), CURRENT_DATE);
    END IF;
END $$;

-- 4.2 MAINTENANCE ORDERS
CREATE TABLE IF NOT EXISTS public.maintenance_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id),
    maintenance_type TEXT,
    description TEXT,
    status TEXT DEFAULT 'scheduled',
    scheduled_date DATE,
    completed_date DATE,
    cost NUMERIC(15,2),
    notes TEXT,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.maintenance_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can read maintenance_orders" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can read maintenance_orders" ON public.maintenance_orders FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can insert maintenance_orders" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can insert maintenance_orders" ON public.maintenance_orders FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update maintenance_orders" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can update maintenance_orders" ON public.maintenance_orders FOR UPDATE TO authenticated USING (true);

-- 4.3 DROP VIEWS FIRST
DROP VIEW IF EXISTS trip_financials CASCADE;
DROP VIEW IF EXISTS vehicle_performance CASCADE;
DROP VIEW IF EXISTS driver_performance CASCADE;
DROP VIEW IF EXISTS expense_summary_by_category CASCADE;

-- 4.4 RECREATE VIEWS

-- VIEW: trip_financials
CREATE OR REPLACE VIEW trip_financials AS
SELECT 
    t.id, t.trip_code, t.vehicle_id, t.driver_id, t.route_id, t.customer_id,
    t.departure_date, t.planned_arrival_date, t.status, t.cargo_weight_tons, t.cargo_description,
    COALESCE(t.freight_revenue, 0) as freight_revenue,
    COALESCE(t.additional_charges, 0) as additional_charges,
    COALESCE(t.total_revenue, t.freight_revenue, 0) as total_revenue,
    t.actual_distance_km, t.start_odometer, t.end_odometer,
    t.actual_departure_time, t.actual_arrival_time, t.closed_at,
    r.route_name, r.origin, r.destination, r.distance_km as route_distance_km,
    v.license_plate, v.vehicle_type,
    d.full_name as driver_name,
    c.customer_name,
    COALESCE((SELECT SUM(COALESCE(e.amount, e.total_amount, 0)) FROM expenses e WHERE e.trip_id = t.id AND e.is_deleted = false AND e.status = 'confirmed'), 0) as total_expense,
    COALESCE(t.total_revenue, t.freight_revenue, 0) - COALESCE((SELECT SUM(COALESCE(e.amount, e.total_amount, 0)) FROM expenses e WHERE e.trip_id = t.id AND e.is_deleted = false AND e.status = 'confirmed'), 0) as profit
FROM trips t
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN drivers d ON t.driver_id = d.id
LEFT JOIN customers c ON t.customer_id = c.id
WHERE t.is_deleted = false;

-- VIEW: vehicle_performance
CREATE OR REPLACE VIEW vehicle_performance AS
SELECT 
    v.id as vehicle_id, v.license_plate, v.vehicle_type,
    COUNT(t.id) as trip_count,
    COALESCE(SUM(t.total_revenue), 0) as total_revenue,
    0 as total_expense, -- Simplified for performance
    COALESCE(SUM(t.total_revenue), 0) as total_profit
FROM vehicles v
LEFT JOIN trips t ON t.vehicle_id = v.id AND t.is_deleted = false AND t.status IN ('completed', 'closed')
WHERE v.is_deleted = false
GROUP BY v.id, v.license_plate, v.vehicle_type;

-- VIEW: driver_performance
CREATE OR REPLACE VIEW driver_performance AS
SELECT 
    d.id as driver_id, d.full_name, d.driver_code,
    COUNT(t.id) as trip_count,
    COALESCE(SUM(t.total_revenue), 0) as total_revenue,
    0 as total_expense, -- Simplified
    COALESCE(SUM(t.total_revenue), 0) as total_profit
FROM drivers d
LEFT JOIN trips t ON t.driver_id = d.id AND t.is_deleted = false AND t.status IN ('completed', 'closed')
WHERE d.is_deleted = false
GROUP BY d.id, d.full_name, d.driver_code;

-- GRANT
GRANT SELECT ON trip_financials TO authenticated;
GRANT SELECT ON vehicle_performance TO authenticated;
GRANT SELECT ON driver_performance TO authenticated;
GRANT ALL ON maintenance_orders TO authenticated;

-- 2.10 COMPANY_SETTINGS
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT,
    tax_code TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select company_settings" ON public.company_settings;
CREATE POLICY "Authenticated users can select company_settings" 
    ON public.company_settings FOR SELECT 
    TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert company_settings" ON public.company_settings;
CREATE POLICY "Authenticated users can insert company_settings" 
    ON public.company_settings FOR INSERT 
    TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update company_settings" ON public.company_settings;
CREATE POLICY "Authenticated users can update company_settings" 
    ON public.company_settings FOR UPDATE 
    TO authenticated USING (true);

-- 2.11 SECURITY_SETTINGS
CREATE TABLE IF NOT EXISTS public.security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    two_factor_enabled BOOLEAN DEFAULT false,
    lock_completed_data BOOLEAN DEFAULT true,
    log_all_actions BOOLEAN DEFAULT true,
    auto_logout_30min BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select security_settings" ON public.security_settings;
CREATE POLICY "Authenticated users can select security_settings" 
    ON public.security_settings FOR SELECT 
    TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert security_settings" ON public.security_settings;
CREATE POLICY "Authenticated users can insert security_settings" 
    ON public.security_settings FOR INSERT 
    TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update security_settings" ON public.security_settings;
CREATE POLICY "Authenticated users can update security_settings" 
    ON public.security_settings FOR UPDATE 
    TO authenticated USING (true);

-- ===== PART 3: VERIFICATION =====

-- Show user roles
SELECT 'USER_ROLES' as table_name, user_id, role, email FROM public.user_roles;

-- Show policy count per table
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
