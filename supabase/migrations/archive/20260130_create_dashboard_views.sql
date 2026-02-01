-- =====================================================
-- CRITICAL FIX: Create Dashboard Views
-- Issue: Dashboard showing 0đ because views don't exist
-- Priority: P0
-- =====================================================

-- 1. Trip Financials View (Main Dashboard Data Source)
-- Drop existing objects first to avoid conflicts
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
    t.cargo_cbm,
    t.freight_revenue,
    t.additional_charges,
    t.total_revenue,
    t.actual_distance_km,
    t.start_odometer,
    t.end_odometer,
    t.actual_departure_time,
    t.actual_arrival_time,
    t.closed_at,
    t.closed_by,
    t.confirmed_at,
    t.confirmed_by,
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
        SELECT SUM(e.amount)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    ), 0) as total_expense,
    
    -- Calculate profit
    COALESCE(t.total_revenue, 0) - COALESCE((
        SELECT SUM(e.amount)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    ), 0) as profit,
    
    -- Calculate profit margin
    CASE 
        WHEN t.total_revenue > 0 THEN
            ((COALESCE(t.total_revenue, 0) - COALESCE((
                SELECT SUM(e.amount)
                FROM expenses e
                WHERE e.trip_id = t.id 
                AND e.is_deleted = false
                AND e.status = 'confirmed'
            ), 0)) / t.total_revenue) * 100
        ELSE 0
    END as profit_margin_pct,
    
    -- Count expenses
    COALESCE((
        SELECT COUNT(*)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
    ), 0) as expense_count

FROM trips t
LEFT JOIN routes r ON t.route_id = r.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN drivers d ON t.driver_id = d.id
LEFT JOIN customers c ON t.customer_id = c.id
WHERE t.is_deleted = false;

-- 2. Expense Summary by Category
DROP VIEW IF EXISTS expense_summary_by_category CASCADE;
CREATE OR REPLACE VIEW expense_summary_by_category AS
SELECT 
    ec.id as category_id,
    ec.category_name,
    ec.category_type,
    COUNT(e.id) as expense_count,
    SUM(CASE WHEN e.status = 'confirmed' THEN e.amount ELSE 0 END) as total_confirmed,
    SUM(CASE WHEN e.status = 'draft' THEN e.amount ELSE 0 END) as total_draft,
    SUM(e.amount) as total_all
FROM expense_categories ec
LEFT JOIN expenses e ON e.category_id = ec.id AND e.is_deleted = false
WHERE ec.is_deleted = false
GROUP BY ec.id, ec.category_name, ec.category_type
ORDER BY total_confirmed DESC;

-- 3. Vehicle Performance View
DROP VIEW IF EXISTS vehicle_performance CASCADE;
CREATE OR REPLACE VIEW vehicle_performance AS
SELECT 
    v.id as vehicle_id,
    v.license_plate,
    v.vehicle_type,
    v.capacity_tons,
    COUNT(t.id) as trip_count,
    SUM(t.total_revenue) as total_revenue,
    SUM((
        SELECT COALESCE(SUM(e.amount), 0)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    )) as total_expense,
    SUM(t.total_revenue) - SUM((
        SELECT COALESCE(SUM(e.amount), 0)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    )) as total_profit,
    CASE 
        WHEN SUM(t.total_revenue) > 0 THEN
            ((SUM(t.total_revenue) - SUM((
                SELECT COALESCE(SUM(e.amount), 0)
                FROM expenses e
                WHERE e.trip_id = t.id 
                AND e.is_deleted = false
                AND e.status = 'confirmed'
            ))) / SUM(t.total_revenue)) * 100
        ELSE 0
    END as profit_margin,
    SUM(t.actual_distance_km) as total_distance_km,
    AVG(t.cargo_weight_tons) as avg_cargo_weight
FROM vehicles v
LEFT JOIN trips t ON t.vehicle_id = v.id AND t.is_deleted = false AND t.status IN ('completed', 'closed')
WHERE v.is_deleted = false
GROUP BY v.id, v.license_plate, v.vehicle_type, v.capacity_tons
ORDER BY total_profit DESC NULLS LAST;

-- 4. Driver Performance View
DROP VIEW IF EXISTS driver_performance CASCADE;
CREATE OR REPLACE VIEW driver_performance AS
SELECT 
    d.id as driver_id,
    d.full_name,
    d.driver_code,
    d.phone,
    COUNT(t.id) as trip_count,
    SUM(t.total_revenue) as total_revenue,
    SUM((
        SELECT COALESCE(SUM(e.amount), 0)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    )) as total_expense,
    SUM(t.total_revenue) - SUM((
        SELECT COALESCE(SUM(e.amount), 0)
        FROM expenses e
        WHERE e.trip_id = t.id 
        AND e.is_deleted = false
        AND e.status = 'confirmed'
    )) as total_profit,
    CASE 
        WHEN SUM(t.total_revenue) > 0 THEN
            ((SUM(t.total_revenue) - SUM((
                SELECT COALESCE(SUM(e.amount), 0)
                FROM expenses e
                WHERE e.trip_id = t.id 
                AND e.is_deleted = false
                AND e.status = 'confirmed'
            ))) / SUM(t.total_revenue)) * 100
        ELSE 0
    END as profit_margin,
    SUM(t.actual_distance_km) as total_distance_km,
    AVG(t.cargo_weight_tons) as avg_cargo_weight
FROM drivers d
LEFT JOIN trips t ON t.driver_id = d.id AND t.is_deleted = false AND t.status IN ('completed', 'closed')
WHERE d.is_deleted = false
GROUP BY d.id, d.full_name, d.driver_code, d.phone
ORDER BY total_profit DESC NULLS LAST;

-- Grant permissions
GRANT SELECT ON trip_financials TO authenticated;
GRANT SELECT ON expense_summary_by_category TO authenticated;
GRANT SELECT ON vehicle_performance TO authenticated;
GRANT SELECT ON driver_performance TO authenticated;

-- Add comments
COMMENT ON VIEW trip_financials IS 'Main view for dashboard - combines trips with calculated expenses and profit';
COMMENT ON VIEW expense_summary_by_category IS 'Expense breakdown by category for pie chart';
COMMENT ON VIEW vehicle_performance IS 'Vehicle performance metrics for reports';
COMMENT ON VIEW driver_performance IS 'Driver performance metrics for reports';
