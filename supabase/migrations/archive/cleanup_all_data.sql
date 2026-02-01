-- ============================================================================
-- CLEANUP ALL DATA SCRIPT
-- Purpose: Delete all records from all tables to start fresh with real data
-- Keep: Database schema, views, RLS policies, constraints
-- Date: 2026-01-27
-- ============================================================================

-- DISABLE RLS POLICIES TEMPORARILY FOR CLEANUP
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE expense_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_periods DISABLE ROW LEVEL SECURITY;

-- DELETE ALL DATA IN PROPER ORDER (respect foreign key constraints)
-- Start with leaf tables (no foreign key dependencies), work up to root tables

-- Delete from tables with no dependencies on other data tables
DELETE FROM expense_allocations;
DELETE FROM maintenance_orders;
DELETE FROM expenses;
DELETE FROM trips;

-- Delete reference data
DELETE FROM routes;
DELETE FROM customers;
DELETE FROM vehicles;
DELETE FROM drivers;

-- Delete settings and config
-- Delete settings and config
DELETE FROM notification_settings;
DELETE FROM security_settings;
DELETE FROM company_settings;
DELETE FROM accounting_periods;

-- Users are preserved to maintain login access
-- DELETE FROM users WHERE id != (SELECT id FROM users WHERE email = 'system@app.local' LIMIT 1);

-- RE-ENABLE RLS POLICIES
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;

-- RESET AUTO-INCREMENT SEQUENCES (if any)
-- This ensures new records start from ID 1
ALTER SEQUENCE IF EXISTS trips_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS expenses_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS expense_allocations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vehicles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS drivers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS routes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS maintenance_orders_id_seq RESTART WITH 1;

-- VERIFY CLEANUP
SELECT 
  'trips' as table_name, COUNT(*) as record_count FROM trips
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'expense_allocations', COUNT(*) FROM expense_allocations
UNION ALL
SELECT 'vehicles', COUNT(*) FROM vehicles
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'maintenance_orders', COUNT(*) FROM maintenance_orders
UNION ALL
SELECT 'company_settings', COUNT(*) FROM company_settings
UNION ALL
SELECT 'accounting_periods', COUNT(*) FROM accounting_periods
ORDER BY table_name;
