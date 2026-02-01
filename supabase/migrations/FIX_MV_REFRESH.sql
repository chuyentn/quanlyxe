-- ============================================================================
-- FIX: ROBUST CONVERT TO STANDARD VIEW
-- Handles cases where trip_financials might be a VIEW or MATERIALIZED VIEW
-- ============================================================================

-- 1. Robust Drop: Try dropping as MV, then as View, ignoring type mismatch errors
DO $$ 
BEGIN
    -- Try dropping as Materialized View
    BEGIN
        DROP MATERIALIZED VIEW IF EXISTS public.trip_financials CASCADE;
    EXCEPTION
        WHEN wrong_object_type THEN NULL; -- Ignore if it's actually a regular View
        WHEN OTHERS THEN RAISE NOTICE 'Error dropping MV: %', SQLERRM;
    END;

    -- Try dropping as Standard View
    BEGIN
        DROP VIEW IF EXISTS public.trip_financials CASCADE;
    EXCEPTION
        WHEN wrong_object_type THEN NULL; -- Ignore if it's actually a MV (should be handled above)
        WHEN OTHERS THEN RAISE NOTICE 'Error dropping View: %', SQLERRM;
    END;
END $$;

-- 2. Drop any lingering triggers that might have been associated
DROP TRIGGER IF EXISTS trg_refresh_mv_trips ON public.trips;
DROP TRIGGER IF EXISTS trg_refresh_mv_expenses ON public.expenses;
DROP TRIGGER IF EXISTS trg_refresh_mv_allocations ON public.expense_allocations;

-- 3. Create as a Standard VIEW (Real-time, no triggers needed)
CREATE VIEW public.trip_financials AS
SELECT 
    t.id,
    t.trip_code,
    t.vehicle_id,
    t.driver_id,
    t.route_id,
    t.customer_id,
    t.departure_date,
    t.status,
    t.cargo_description,
    t.cargo_weight_tons,
    t.freight_revenue,
    t.additional_charges,
    t.total_revenue,
    t.actual_distance_km,
    t.actual_departure_time,
    t.actual_arrival_time,
    t.closed_at,
    t.cancelled_at,
    -- Direct Expenses (Confirmed only)
    COALESCE((SELECT SUM(amount) FROM public.expenses WHERE trip_id = t.id AND status = 'confirmed' AND is_deleted = false), 0) as direct_expenses,
    -- Allocated Expenses
    COALESCE((SELECT SUM(allocated_amount) FROM public.expense_allocations WHERE trip_id = t.id), 0) as allocated_expenses,
    -- Total Expense
    (
        COALESCE((SELECT SUM(amount) FROM public.expenses WHERE trip_id = t.id AND status = 'confirmed' AND is_deleted = false), 0) + 
        COALESCE((SELECT SUM(allocated_amount) FROM public.expense_allocations WHERE trip_id = t.id), 0)
    ) as total_expense,
    -- Profit
    t.total_revenue - (
        COALESCE((SELECT SUM(amount) FROM public.expenses WHERE trip_id = t.id AND status = 'confirmed' AND is_deleted = false), 0) + 
        COALESCE((SELECT SUM(allocated_amount) FROM public.expense_allocations WHERE trip_id = t.id), 0)
    ) as profit,
    -- Profit Margin
    CASE 
        WHEN t.total_revenue > 0 THEN
            ((t.total_revenue - (
                COALESCE((SELECT SUM(amount) FROM public.expenses WHERE trip_id = t.id AND status = 'confirmed' AND is_deleted = false), 0) + 
                COALESCE((SELECT SUM(allocated_amount) FROM public.expense_allocations WHERE trip_id = t.id), 0)
            )) / t.total_revenue) * 100
        ELSE 0
    END as profit_margin_pct,
    -- Counts
    (SELECT COUNT(*) FROM public.expenses WHERE trip_id = t.id AND status = 'confirmed' AND is_deleted = false) as expense_count,
    (SELECT COUNT(*) FROM public.expense_allocations WHERE trip_id = t.id) as allocation_count,
    t.is_deleted,
    t.created_at,
    t.updated_at
FROM public.trips t
WHERE t.is_deleted = false;

-- 4. Grant Permissions
GRANT SELECT ON public.trip_financials TO authenticated;

-- 5. Verify
SELECT count(*) as trip_count FROM public.trip_financials;
