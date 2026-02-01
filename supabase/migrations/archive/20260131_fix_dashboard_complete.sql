-- ============================================================================
-- FIX DASHBOARD - COMPLETE SQL MIGRATION
-- Chạy này để fix tất cả lỗi Dashboard
-- Date: 2026-01-31
-- ============================================================================

-- ============================================
-- PHẦN 1: THÊM CỘT THIẾU VÀO BẢNG EXPENSES
-- ============================================

-- Thêm cột total_amount nếu chưa có (copy từ amount)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'total_amount'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN total_amount NUMERIC(15,2) DEFAULT 0;
        -- Copy data from amount column if it exists
        UPDATE public.expenses SET total_amount = COALESCE(amount, 0);
    END IF;
END $$;

-- Thêm cột expense_date nếu chưa có (copy từ created_at)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'expense_date'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN expense_date DATE DEFAULT CURRENT_DATE;
        UPDATE public.expenses SET expense_date = COALESCE(DATE(created_at), CURRENT_DATE);
    END IF;
END $$;

-- Thêm cột expense_code nếu chưa có
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'expenses' 
        AND column_name = 'expense_code'
    ) THEN
        ALTER TABLE public.expenses ADD COLUMN expense_code TEXT;
    END IF;
END $$;

-- ============================================
-- PHẦN 2: TẠO VIEW trip_financials
-- ============================================
DROP VIEW IF EXISTS trip_financials CASCADE;
CREATE OR REPLACE VIEW trip_financials AS
SELECT 
    t.id,
    t.trip_code,
    t.vehicle_id,
    t.driver_id,
    t.route_id,
    t.customer_id,
    t.departure_date,
    t.planned_arrival_date,
    t.status,
    t.cargo_weight_tons,
    t.cargo_description,
    COALESCE(t.freight_revenue, 0) as freight_revenue,
    COALESCE(t.additional_charges, 0) as additional_charges,
    COALESCE(t.total_revenue, t.freight_revenue, 0) as total_revenue,
    t.actual_distance_km,
    t.start_odometer,
    t.end_odometer,
    t.actual_departure_time,
    t.actual_arrival_time,
    t.closed_at,
    t.closed_by,
    t.created_at,
    t.updated_at,
    
    -- Join route info
    r.route_name,
    r.origin,
    r.destination,
    r.distance_km as route_distance_km,
    
    -- Join vehicle info
    v.license_plate,
    v.vehicle_type,
    
    -- Join driver info
    d.full_name as driver_name,
    
    -- Join customer info
    c.customer_name,
    
    -- Calculate total expense from expenses table
    COALESCE((
        SELECT SUM(COALESCE(e.amount, e.total_amount, 0))
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    ), 0) as total_expense,
    
    -- Calculate profit
    COALESCE(t.total_revenue, t.freight_revenue, 0) - COALESCE((
        SELECT SUM(COALESCE(e.amount, e.total_amount, 0))
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    ), 0) as profit,
    
    -- Calculate profit margin
    CASE 
        WHEN COALESCE(t.total_revenue, t.freight_revenue, 0) > 0 THEN
            ((COALESCE(t.total_revenue, t.freight_revenue, 0) - COALESCE((
                SELECT SUM(COALESCE(e.amount, e.total_amount, 0))
                FROM expenses e
                WHERE e.trip_id = t.id 
                AND e.is_deleted = false
                AND e.status = 'confirmed'
            ), 0)) / COALESCE(t.total_revenue, t.freight_revenue, 0)) * 100
        ELSE 0
    END as profit_margin_pct

FROM trips t
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN drivers d ON t.driver_id = d.id
LEFT JOIN customers c ON t.customer_id = c.id
WHERE t.is_deleted = false;

-- ============================================
-- PHẦN 3: TẠO VIEW vehicle_performance
-- ============================================
DROP VIEW IF EXISTS vehicle_performance CASCADE;
CREATE OR REPLACE VIEW vehicle_performance AS
SELECT 
    v.id as vehicle_id,
    v.license_plate,
    v.vehicle_type,
    v.capacity_tons,
    COUNT(t.id) as trip_count,
    COALESCE(SUM(t.total_revenue), 0) as total_revenue,
    COALESCE(SUM((
        SELECT COALESCE(SUM(COALESCE(e.amount, e.total_amount, 0)), 0)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    )), 0) as total_expense,
    COALESCE(SUM(t.total_revenue), 0) - COALESCE(SUM((
        SELECT COALESCE(SUM(COALESCE(e.amount, e.total_amount, 0)), 0)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    )), 0) as total_profit,
    CASE 
        WHEN COALESCE(SUM(t.total_revenue), 0) > 0 THEN
            ((COALESCE(SUM(t.total_revenue), 0) - COALESCE(SUM((
                SELECT COALESCE(SUM(COALESCE(e.amount, e.total_amount, 0)), 0)
                FROM expenses e
                WHERE e.trip_id = t.id 
                AND e.is_deleted = false
                AND e.status = 'confirmed'
            )), 0)) / COALESCE(SUM(t.total_revenue), 0)) * 100
        ELSE 0
    END as profit_margin,
    COALESCE(SUM(t.actual_distance_km), 0) as total_distance_km,
    COALESCE(AVG(t.cargo_weight_tons), 0) as avg_cargo_weight
FROM vehicles v
LEFT JOIN trips t ON t.vehicle_id = v.id AND t.is_deleted = false AND t.status IN ('completed', 'closed')
WHERE v.is_deleted = false
GROUP BY v.id, v.license_plate, v.vehicle_type, v.capacity_tons
ORDER BY total_profit DESC NULLS LAST;

-- ============================================
-- PHẦN 4: TẠO VIEW driver_performance
-- ============================================
DROP VIEW IF EXISTS driver_performance CASCADE;
CREATE OR REPLACE VIEW driver_performance AS
SELECT 
    d.id as driver_id,
    d.full_name,
    d.driver_code,
    d.phone,
    COUNT(t.id) as trip_count,
    COALESCE(SUM(t.total_revenue), 0) as total_revenue,
    COALESCE(SUM((
        SELECT COALESCE(SUM(COALESCE(e.amount, e.total_amount, 0)), 0)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    )), 0) as total_expense,
    COALESCE(SUM(t.total_revenue), 0) - COALESCE(SUM((
        SELECT COALESCE(SUM(COALESCE(e.amount, e.total_amount, 0)), 0)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    )), 0) as total_profit,
    CASE 
        WHEN COALESCE(SUM(t.total_revenue), 0) > 0 THEN
            ((COALESCE(SUM(t.total_revenue), 0) - COALESCE(SUM((
                SELECT COALESCE(SUM(COALESCE(e.amount, e.total_amount, 0)), 0)
                FROM expenses e
                WHERE e.trip_id = t.id 
                AND e.is_deleted = false
                AND e.status = 'confirmed'
            )), 0)) / COALESCE(SUM(t.total_revenue), 0)) * 100
        ELSE 0
    END as profit_margin,
    COALESCE(SUM(t.actual_distance_km), 0) as total_distance_km,
    COALESCE(AVG(t.cargo_weight_tons), 0) as avg_cargo_weight
FROM drivers d
LEFT JOIN trips t ON t.driver_id = d.id AND t.is_deleted = false AND t.status IN ('completed', 'closed')
WHERE d.is_deleted = false
GROUP BY d.id, d.full_name, d.driver_code, d.phone
ORDER BY total_profit DESC NULLS LAST;

-- ============================================
-- PHẦN 5: TẠO VIEW expense_summary_by_category
-- ============================================
DROP VIEW IF EXISTS expense_summary_by_category CASCADE;
CREATE OR REPLACE VIEW expense_summary_by_category AS
SELECT 
    ec.id as category_id,
    ec.category_name,
    ec.category_type,
    COUNT(e.id) as expense_count,
    SUM(CASE WHEN e.status = 'confirmed' THEN COALESCE(e.amount, e.total_amount, 0) ELSE 0 END) as total_confirmed,
    SUM(CASE WHEN e.status = 'draft' THEN COALESCE(e.amount, e.total_amount, 0) ELSE 0 END) as total_draft,
    SUM(COALESCE(e.amount, e.total_amount, 0)) as total_all
FROM expense_categories ec
LEFT JOIN expenses e ON e.category_id = ec.id AND e.is_deleted = false
WHERE ec.is_deleted = false
GROUP BY ec.id, ec.category_name, ec.category_type
ORDER BY total_confirmed DESC;

-- ============================================
-- PHẦN 6: TẠO BẢNG maintenance_orders NẾU CHƯA CÓ
-- ============================================
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

-- Enable RLS for maintenance_orders
ALTER TABLE public.maintenance_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies for maintenance_orders
DROP POLICY IF EXISTS "Authenticated users can read maintenance_orders" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can read maintenance_orders" 
    ON public.maintenance_orders FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert maintenance_orders" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can insert maintenance_orders" 
    ON public.maintenance_orders FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update maintenance_orders" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can update maintenance_orders" 
    ON public.maintenance_orders FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete maintenance_orders" ON public.maintenance_orders;
CREATE POLICY "Authenticated users can delete maintenance_orders" 
    ON public.maintenance_orders FOR DELETE TO authenticated USING (true);

-- ============================================
-- PHẦN 7: GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON trip_financials TO authenticated;
GRANT SELECT ON expense_summary_by_category TO authenticated;
GRANT SELECT ON vehicle_performance TO authenticated;
GRANT SELECT ON driver_performance TO authenticated;
GRANT ALL ON maintenance_orders TO authenticated;

-- ============================================
-- PHẦN 8: VERIFY - KIỂM TRA KẾT QUẢ
-- ============================================
SELECT 'trip_financials' as view_name, COUNT(*) as row_count FROM trip_financials
UNION ALL
SELECT 'vehicle_performance', COUNT(*) FROM vehicle_performance
UNION ALL
SELECT 'driver_performance', COUNT(*) FROM driver_performance
UNION ALL
SELECT 'expense_summary_by_category', COUNT(*) FROM expense_summary_by_category;
