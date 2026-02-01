-- ============================================================================
-- MASTER FIX - PART 2 OF 3
-- 2. FIX RLS POLICIES FOR ALL TABLES
-- Run this script SECOND in Supabase SQL Editor
-- ============================================================================

-- Function to safely enable RLS and add policies
DO $migration$
BEGIN
    -- 2.1 VEHICLES
    EXECUTE 'ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can select vehicles" ON public.vehicles';
    EXECUTE 'CREATE POLICY "Authenticated users can select vehicles" ON public.vehicles FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert vehicles" ON public.vehicles';
    EXECUTE 'CREATE POLICY "Authenticated users can insert vehicles" ON public.vehicles FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update vehicles" ON public.vehicles';
    EXECUTE 'CREATE POLICY "Authenticated users can update vehicles" ON public.vehicles FOR UPDATE TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete vehicles" ON public.vehicles';
    EXECUTE 'CREATE POLICY "Authenticated users can delete vehicles" ON public.vehicles FOR DELETE TO authenticated USING (true)';

    -- 2.2 DRIVERS
    EXECUTE 'ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can select drivers" ON public.drivers';
    EXECUTE 'CREATE POLICY "Authenticated users can select drivers" ON public.drivers FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert drivers" ON public.drivers';
    EXECUTE 'CREATE POLICY "Authenticated users can insert drivers" ON public.drivers FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update drivers" ON public.drivers';
    EXECUTE 'CREATE POLICY "Authenticated users can update drivers" ON public.drivers FOR UPDATE TO authenticated USING (true)';

    -- 2.3 ROUTES
    EXECUTE 'ALTER TABLE public.routes ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can select routes" ON public.routes';
    EXECUTE 'CREATE POLICY "Authenticated users can select routes" ON public.routes FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert routes" ON public.routes';
    EXECUTE 'CREATE POLICY "Authenticated users can insert routes" ON public.routes FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update routes" ON public.routes';
    EXECUTE 'CREATE POLICY "Authenticated users can update routes" ON public.routes FOR UPDATE TO authenticated USING (true)';

    -- 2.4 CUSTOMERS
    EXECUTE 'ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can select customers" ON public.customers';
    EXECUTE 'CREATE POLICY "Authenticated users can select customers" ON public.customers FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert customers" ON public.customers';
    EXECUTE 'CREATE POLICY "Authenticated users can insert customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers';
    EXECUTE 'CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true)';

    -- 2.5 TRIPS
    EXECUTE 'ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can select trips" ON public.trips';
    EXECUTE 'CREATE POLICY "Authenticated users can select trips" ON public.trips FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert trips" ON public.trips';
    EXECUTE 'CREATE POLICY "Authenticated users can insert trips" ON public.trips FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update trips" ON public.trips';
    EXECUTE 'CREATE POLICY "Authenticated users can update trips" ON public.trips FOR UPDATE TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can delete trips" ON public.trips';
    EXECUTE 'CREATE POLICY "Authenticated users can delete trips" ON public.trips FOR DELETE TO authenticated USING (true)';

    -- 2.6 EXPENSES
    EXECUTE 'ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can select expenses" ON public.expenses';
    EXECUTE 'CREATE POLICY "Authenticated users can select expenses" ON public.expenses FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert expenses" ON public.expenses';
    EXECUTE 'CREATE POLICY "Authenticated users can insert expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update expenses" ON public.expenses';
    EXECUTE 'CREATE POLICY "Authenticated users can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true)';

    -- 2.7 EXPENSE CATEGORIES
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'expense_categories') THEN
        EXECUTE 'ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can select expense_categories" ON public.expense_categories';
        EXECUTE 'CREATE POLICY "Authenticated users can select expense_categories" ON public.expense_categories FOR SELECT TO authenticated USING (true)';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert expense_categories" ON public.expense_categories';
        EXECUTE 'CREATE POLICY "Authenticated users can insert expense_categories" ON public.expense_categories FOR INSERT TO authenticated WITH CHECK (true)';
        EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update expense_categories" ON public.expense_categories';
        EXECUTE 'CREATE POLICY "Authenticated users can update expense_categories" ON public.expense_categories FOR UPDATE TO authenticated USING (true)';
    END IF;

    -- 2.8 COMPANY SETTINGS (Create if needed)
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.company_settings (
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
    )';
    EXECUTE 'ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can select company_settings" ON public.company_settings';
    EXECUTE 'CREATE POLICY "Authenticated users can select company_settings" ON public.company_settings FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert company_settings" ON public.company_settings';
    EXECUTE 'CREATE POLICY "Authenticated users can insert company_settings" ON public.company_settings FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update company_settings" ON public.company_settings';
    EXECUTE 'CREATE POLICY "Authenticated users can update company_settings" ON public.company_settings FOR UPDATE TO authenticated USING (true)';

    -- 2.9 SECURITY SETTINGS
    EXECUTE 'CREATE TABLE IF NOT EXISTS public.security_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        two_factor_enabled BOOLEAN DEFAULT false,
        lock_completed_data BOOLEAN DEFAULT true,
        log_all_actions BOOLEAN DEFAULT true,
        auto_logout_30min BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
    )';
    EXECUTE 'ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can select security_settings" ON public.security_settings';
    EXECUTE 'CREATE POLICY "Authenticated users can select security_settings" ON public.security_settings FOR SELECT TO authenticated USING (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert security_settings" ON public.security_settings';
    EXECUTE 'CREATE POLICY "Authenticated users can insert security_settings" ON public.security_settings FOR INSERT TO authenticated WITH CHECK (true)';
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update security_settings" ON public.security_settings';
    EXECUTE 'CREATE POLICY "Authenticated users can update security_settings" ON public.security_settings FOR UPDATE TO authenticated USING (true)';

END $migration$;
