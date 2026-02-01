-- =====================================================
-- BƯỚC 2: TẠO VIEW trip_financials
-- Chạy SAU KHI chạy STEP1 thành công
-- =====================================================

CREATE VIEW trip_financials AS
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
    
    -- Calculate total expense
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

-- Grant permissions
GRANT SELECT ON trip_financials TO authenticated;

-- Kết quả: Phải thấy "Success. No rows returned"
