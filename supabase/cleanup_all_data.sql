-- ============================================================================
-- CLEANUP ALL DATA - REMOVE ALL DEMO/TEST DATA FROM DATABASE
-- ============================================================================
-- This script will PERMANENTLY DELETE all data from all tables
-- Use when starting fresh with real data entry

-- Step 1: Disable RLS temporarily (to allow data deletion)
ALTER TABLE expense_allocations DISABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;
ALTER TABLE routes DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_periods DISABLE ROW LEVEL SECURITY;

-- Step 2: Delete all records (in order respecting FK constraints)
-- Start with leaf tables (no FK dependencies)
DELETE FROM expense_allocations;
DELETE FROM maintenance_orders;
DELETE FROM expenses;
DELETE FROM trips;
DELETE FROM routes;
DELETE FROM customers;
DELETE FROM vehicles;
DELETE FROM drivers;
DELETE FROM notification_settings;
DELETE FROM security_settings;
DELETE FROM company_settings;
DELETE FROM accounting_periods;

-- Step 3: Reset sequences to 1
ALTER SEQUENCE IF EXISTS expense_allocations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS maintenance_orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS expenses_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS trips_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS routes_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS vehicles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS drivers_id_seq RESTART WITH 1;

-- Step 4: Re-enable RLS
ALTER TABLE expense_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_periods ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify all tables are now empty
SELECT 'vehicles' as table_name, COUNT(*) as record_count FROM vehicles
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers
UNION ALL
SELECT 'customers', COUNT(*) FROM customers
UNION ALL
SELECT 'routes', COUNT(*) FROM routes
UNION ALL
SELECT 'trips', COUNT(*) FROM trips
UNION ALL
SELECT 'expenses', COUNT(*) FROM expenses
UNION ALL
SELECT 'expense_allocations', COUNT(*) FROM expense_allocations
UNION ALL
SELECT 'maintenance_orders', COUNT(*) FROM maintenance_orders
UNION ALL
SELECT 'accounting_periods', COUNT(*) FROM accounting_periods
UNION ALL
SELECT 'company_settings', COUNT(*) FROM company_settings
UNION ALL
SELECT 'notification_settings', COUNT(*) FROM notification_settings
UNION ALL
SELECT 'security_settings', COUNT(*) FROM security_settings
ORDER BY table_name;

-- ============================================================================
-- EXPECTED OUTPUT:
-- All tables should show record_count = 0
-- Database is now clean and ready for real data entry!
-- ============================================================================
