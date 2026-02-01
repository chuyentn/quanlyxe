-- ============================================================================
-- MASTER FIX - PART 3 OF 3
-- 3. DASHBOARD VIEWS AND REPORTS
-- Run this script THIRD in Supabase SQL Editor
-- ============================================================================

-- 3.1 MAINTENANCE ORDERS (Create table first)
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


-- 3.2 FIX EXPENSES COLUMNS
DO $migration$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'total_amount') THEN
        ALTER TABLE public.expenses ADD COLUMN total_amount NUMERIC(15,2) DEFAULT 0;
        UPDATE public.expenses SET total_amount = COALESCE(amount, 0);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'expense_date') THEN
        ALTER TABLE public.expenses ADD COLUMN expense_date DATE DEFAULT CURRENT_DATE;
        UPDATE public.expenses SET expense_date = COALESCE(DATE(created_at), CURRENT_DATE);
    END IF;
END $migration$;

-- 3.3 RECREATE VIEWS

DROP VIEW IF EXISTS trip_financials CASCADE;
DROP VIEW IF EXISTS vehicle_performance CASCADE;
DROP VIEW IF EXISTS driver_performance CASCADE;
DROP VIEW IF EXISTS expense_summary_by_category CASCADE;

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
    0 as total_expense, 
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
    0 as total_expense,
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
