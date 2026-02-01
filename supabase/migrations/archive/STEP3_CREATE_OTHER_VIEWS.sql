-- =====================================================
-- BƯỚC 3: TẠO CÁC VIEW CÒN LẠI
-- Chạy SAU KHI STEP2 thành công
-- =====================================================

-- 1. Expense Summary by Category
CREATE VIEW expense_summary_by_category AS
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

-- 2. Vehicle Performance View
CREATE VIEW vehicle_performance AS
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

-- 3. Driver Performance View
CREATE VIEW driver_performance AS
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
GRANT SELECT ON expense_summary_by_category TO authenticated;
GRANT SELECT ON vehicle_performance TO authenticated;
GRANT SELECT ON driver_performance TO authenticated;

-- Kết quả: Phải thấy "Success. No rows returned"
