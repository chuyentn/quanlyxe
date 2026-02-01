-- CHECK IF trip_financials VIEW EXISTS AND WORKS
-- Run this in Supabase SQL Editor to debug

-- 1. Check if view exists
SELECT 
    table_schema, 
    table_name, 
    table_type
FROM information_schema.tables
WHERE table_name = 'trip_financials'
   OR table_name LIKE '%trip%'
ORDER BY table_name;

-- 2. If view exists, check its columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'trip_financials'
ORDER BY ordinal_position;

-- 3. Try to query the view
SELECT COUNT(*) as trip_count FROM trip_financials;

-- 4. Check actual trips table
SELECT COUNT(*) as trips_count FROM trips;

-- 5. Check all views that exist
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_type = 'VIEW' AND table_schema = 'public'
ORDER BY table_name;
