# Complete Database Schema

## Overview
Fleet management system with PostgreSQL + Supabase. Supports vehicles, drivers, customers, trips, expenses, maintenance, and financial tracking.

---

## Core Tables

### users
**Purpose:** Authentication and user management

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key (from Supabase Auth) |
| email | text | Unique email address |
| first_name | text | User's first name |
| last_name | text | User's last name |
| company_id | uuid | FK to company_settings |
| role | text | Role (admin, manager, dispatcher, accountant, driver, viewer) |
| is_active | boolean | Account status |
| created_at | timestamp | Created date |
| updated_at | timestamp | Last updated |
| last_login | timestamp | Last login timestamp |

**Indexes:**
```sql
CREATE INDEX idx_users_company_id ON users(company_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**RLS Policies:**
- Admin: Can view/edit all users
- Manager: Can view users in same company
- Others: Can only view self

---

### vehicles
**Purpose:** Fleet vehicle management

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| vehicle_code | text | Unique code (e.g., "XE001") |
| license_plate | text | Vehicle registration (unique) |
| vehicle_type | text | Type (truck, van, car, etc.) |
| brand | text | Brand (e.g., "Toyota") |
| model | text | Model name |
| year | integer | Year of manufacture |
| color | text | Color |
| engine_type | text | Engine (diesel, petrol, electric) |
| fuel_tank_capacity | numeric | Tank capacity (liters) |
| tare_weight | numeric | Empty weight (kg) |
| payload_weight | numeric | Max payload (kg) |
| insurance_expiry | date | Insurance expiry date |
| inspection_expiry | date | Inspection expiry date |
| status | text | Status (active, maintenance, retired) |
| is_deleted | boolean | Soft delete flag |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |
| deleted_at | timestamp | Deletion timestamp |
| company_id | uuid | FK to company_settings |

**Indexes:**
```sql
CREATE INDEX idx_vehicles_vehicle_code ON vehicles(vehicle_code);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);
CREATE INDEX idx_vehicles_is_deleted ON vehicles(is_deleted);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
```

**Soft Delete Logic:**
- When deleting: Set is_deleted=true, append timestamp to unique fields
- Example: vehicle_code changes from "XE001" → "XE001_DEL_20260201120000"
- Allows re-creating record with original code

**RLS Policies:**
- Admin: CRUD all
- Manager: Read all, update own company
- Dispatcher: Read only
- Others: Depends on role

---

### drivers
**Purpose:** Driver management and tracking

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| driver_code | text | Unique code (e.g., "TXC001") |
| first_name | text | First name |
| last_name | text | Last name |
| phone | text | Phone number |
| email | text | Email |
| license_number | text | License number (unique) |
| license_class | text | License class (A, B, C, D, etc.) |
| license_expiry | date | License expiry date |
| dob | date | Date of birth |
| address | text | Home address |
| salary_type | text | Salary type (monthly, per-km, per-trip) |
| salary_amount | numeric | Base salary |
| driver_type | text | Type (owner, employee) |
| assigned_vehicle_id | uuid | FK to vehicles |
| status | text | Status (active, inactive, on-leave) |
| is_deleted | boolean | Soft delete flag |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |
| company_id | uuid | FK to company_settings |

**Indexes:**
```sql
CREATE INDEX idx_drivers_driver_code ON drivers(driver_code);
CREATE INDEX idx_drivers_license_number ON drivers(license_number);
CREATE INDEX idx_drivers_assigned_vehicle_id ON drivers(assigned_vehicle_id);
CREATE INDEX idx_drivers_is_deleted ON drivers(is_deleted);
CREATE INDEX idx_drivers_company_id ON drivers(company_id);
```

**RLS Policies:**
- Admin: CRUD all
- Manager: Read own company
- Driver: Read own record only
- Others: Read-only

---

### customers
**Purpose:** Customer management and credit tracking

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| customer_code | text | Unique code (e.g., "KH001") |
| customer_name | text | Customer name |
| customer_type | text | Type (individual, company) |
| phone | text | Contact phone |
| email | text | Email |
| address | text | Delivery address |
| tax_code | text | Tax identification number |
| bank_account | text | Bank account for transfer |
| bank_name | text | Bank name |
| credit_limit | numeric | Credit limit (VND) |
| credit_used | numeric | Current debt (VND) |
| is_deleted | boolean | Soft delete flag |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |
| company_id | uuid | FK to company_settings |

**Indexes:**
```sql
CREATE INDEX idx_customers_customer_code ON customers(customer_code);
CREATE INDEX idx_customers_customer_name ON customers(customer_name);
CREATE INDEX idx_customers_is_deleted ON customers(is_deleted);
CREATE INDEX idx_customers_company_id ON customers(company_id);
```

**Business Logic:**
- credit_used = sum of unpaid trips for this customer
- Can't create trips if credit_used > credit_limit
- Tracks debt for each customer

**RLS Policies:**
- Admin: CRUD all
- Manager: Read/update own company
- Accountant: Read all
- Others: Read-only

---

### routes
**Purpose:** Predefined routes and distance tracking

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| route_code | text | Unique code (e.g., "LX001") |
| origin_city | text | Starting city |
| destination_city | text | Destination city |
| distance | numeric | Route distance (km) |
| estimated_time | integer | Estimated time (hours) |
| tolls_cost | numeric | Toll costs (VND) |
| is_deleted | boolean | Soft delete flag |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |
| company_id | uuid | FK to company_settings |

**Indexes:**
```sql
CREATE INDEX idx_routes_route_code ON routes(route_code);
CREATE INDEX idx_routes_is_deleted ON routes(is_deleted);
CREATE INDEX idx_routes_company_id ON routes(company_id);
```

**Usage:** Used to set default distance/cost for trips between same cities

**RLS Policies:**
- Admin: CRUD all
- Manager: Read/update own company
- Others: Read-only

---

### trips
**Purpose:** Trip/shipment records with financial tracking

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| trip_code | text | Unique code (e.g., "CB001") |
| trip_date | date | Trip date |
| departure_date | timestamp | Departure date/time |
| completion_date | timestamp | Completion date/time |
| vehicle_id | uuid | FK to vehicles |
| driver_id | uuid | FK to drivers |
| customer_id | uuid | FK to customers |
| route_id | uuid | FK to routes (optional) |
| origin | text | Starting point |
| destination | text | Ending point |
| distance | numeric | Actual distance (km) |
| cargo_weight | numeric | Cargo weight (kg) |
| cargo_type | text | Type of cargo |
| freight_rate | numeric | Rate per unit (VND) |
| revenue | numeric | Total revenue (VND) |
| status | text | Status (draft→confirmed→completed→closed) |
| notes | text | Additional notes |
| is_deleted | boolean | Soft delete flag |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |
| created_by_id | uuid | FK to users (creator) |
| company_id | uuid | FK to company_settings |

**Indexes:**
```sql
CREATE INDEX idx_trips_trip_code ON trips(trip_code);
CREATE INDEX idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX idx_trips_driver_id ON trips(driver_id);
CREATE INDEX idx_trips_customer_id ON trips(customer_id);
CREATE INDEX idx_trips_trip_date ON trips(trip_date);
CREATE INDEX idx_trips_departure_date ON trips(departure_date);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_is_deleted ON trips(is_deleted);
CREATE INDEX idx_trips_company_id ON trips(company_id);
```

**Workflow:**
1. Draft: Created but not confirmed
2. Confirmed: Confirmed by manager
3. Completed: Delivery confirmed
4. Closed: No further changes allowed

**Financial Calculations:**
```
revenue = distance * freight_rate
cost = expenses + fuel + salary
profit = revenue - cost
```

**RLS Policies:**
- Admin: CRUD all
- Manager: CRUD own company
- Dispatcher: Can only create/view
- Accountant: Read-only
- Driver: Can only update own trips (if owner)

---

### expenses
**Purpose:** Cost tracking for trips and maintenance

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| expense_code | text | Unique code (e.g., "CHI001") |
| expense_date | date | Expense date |
| category | text | Category (fuel, toll, repair, salary, other) |
| description | text | Description |
| amount | numeric | Expense amount (VND) |
| payment_method | text | Method (cash, bank, credit) |
| receipt_number | text | Receipt/invoice number |
| vehicle_id | uuid | FK to vehicles (optional) |
| driver_id | uuid | FK to drivers (optional) |
| is_deleted | boolean | Soft delete flag |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |
| company_id | uuid | FK to company_settings |

**Indexes:**
```sql
CREATE INDEX idx_expenses_expense_code ON expenses(expense_code);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX idx_expenses_driver_id ON expenses(driver_id);
CREATE INDEX idx_expenses_is_deleted ON expenses(is_deleted);
CREATE INDEX idx_expenses_company_id ON expenses(company_id);
```

**RLS Policies:**
- Admin: CRUD all
- Manager: Read/create own company
- Accountant: Read all
- Others: No access

---

### expense_allocations
**Purpose:** Link expenses to trips

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| expense_id | uuid | FK to expenses |
| trip_id | uuid | FK to trips |
| allocated_amount | numeric | Amount allocated to trip (VND) |
| created_at | timestamp | Created date |

**Foreign Key Constraints:**
```sql
ALTER TABLE expense_allocations 
ADD CONSTRAINT fk_expense_allocations_expense_id 
FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE;

ALTER TABLE expense_allocations 
ADD CONSTRAINT fk_expense_allocations_trip_id 
FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
```

**Business Logic:**
- One expense can be allocated to multiple trips
- Sum of allocations must not exceed expense.amount
- Used for cost allocation in trip profitability calculations

---

### maintenance_orders
**Purpose:** Vehicle maintenance and service tracking

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| maintenance_code | text | Unique code (e.g., "BX001") |
| vehicle_id | uuid | FK to vehicles |
| maintenance_date | date | Maintenance date |
| maintenance_type | text | Type (oil change, repair, inspection, etc.) |
| description | text | Details of work |
| cost | numeric | Maintenance cost (VND) |
| service_provider | text | Name of service provider |
| parts_replaced | text | Parts replaced (json array) |
| next_service_date | date | Recommended next service |
| status | text | Status (pending, in-progress, completed) |
| is_deleted | boolean | Soft delete flag |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |
| company_id | uuid | FK to company_settings |

**Indexes:**
```sql
CREATE INDEX idx_maintenance_vehicle_id ON maintenance_orders(vehicle_id);
CREATE INDEX idx_maintenance_maintenance_date ON maintenance_orders(maintenance_date);
CREATE INDEX idx_maintenance_status ON maintenance_orders(status);
CREATE INDEX idx_maintenance_is_deleted ON maintenance_orders(is_deleted);
```

**RLS Policies:**
- Admin: CRUD all
- Manager: Read/create own company
- Driver: Can view maintenance for assigned vehicle

---

### accounting_periods
**Purpose:** Period lock management for financial closing

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| period_name | text | Period name (e.g., "Jan 2026") |
| period_start | date | Period start date |
| period_end | date | Period end date |
| is_locked | boolean | Lock status |
| locked_at | timestamp | When locked |
| locked_by_id | uuid | FK to users (who locked) |
| is_deleted | boolean | Soft delete flag |
| created_at | timestamp | Created date |
| company_id | uuid | FK to company_settings |

**Business Logic:**
- Once locked, no edits allowed to trips/expenses in that period
- Prevents accidental changes after closing books

**RLS Policies:**
- Admin: CRUD all
- Accountant: Read all
- Manager: Read-only

---

### company_settings
**Purpose:** Company configuration and branding

| Field | Type | Notes |
|-------|------|-------|
| id | uuid | Primary key |
| company_name | text | Company name |
| company_code | text | Company registration code |
| phone | text | Company phone |
| email | text | Company email |
| address | text | Company address |
| tax_id | text | Tax identification number |
| website | text | Website URL |
| logo_url | text | Logo URL |
| primary_color | text | Brand color (hex) |
| allow_employee_drivers | boolean | Policy setting |
| auto_logout_minutes | integer | Auto-logout timeout |
| enable_2fa | boolean | 2FA requirement |
| currency | text | Currency code (VND, USD) |
| language | text | Default language |
| timezone | text | Timezone |
| created_at | timestamp | Created date |
| updated_at | timestamp | Updated date |

**RLS Policies:**
- Admin: CRUD
- Manager: Read/update own company
- Others: Read-only

---

## Materialized Views

### trip_financials
**Purpose:** Pre-calculated financial data for reports

```sql
CREATE MATERIALIZED VIEW trip_financials AS
SELECT 
  t.id,
  t.trip_code,
  t.trip_date,
  t.revenue,
  t.distance,
  COALESCE(SUM(ea.allocated_amount), 0) as total_expenses,
  t.revenue - COALESCE(SUM(ea.allocated_amount), 0) as net_profit,
  (t.revenue - COALESCE(SUM(ea.allocated_amount), 0)) / 
    NULLIF(t.revenue, 0) * 100 as profit_margin,
  d.first_name || ' ' || d.last_name as driver_name,
  v.vehicle_code,
  c.customer_name,
  t.status
FROM trips t
LEFT JOIN expense_allocations ea ON t.id = ea.trip_id
LEFT JOIN drivers d ON t.driver_id = d.id
LEFT JOIN vehicles v ON t.vehicle_id = v.id
LEFT JOIN customers c ON t.customer_id = c.id
WHERE t.is_deleted = FALSE
GROUP BY t.id, t.trip_code, t.trip_date, t.revenue, t.distance, 
         d.first_name, d.last_name, v.vehicle_code, c.customer_name, t.status;

CREATE INDEX idx_trip_financials_trip_date 
  ON trip_financials(trip_date);
```

**Refresh Strategy:**
- Refresh after significant trips/expenses changes
- Scheduled refresh daily at 2 AM
- Manual refresh in Settings → Data Management

### vehicle_status_summary
**Purpose:** Current status of all vehicles

```sql
CREATE MATERIALIZED VIEW vehicle_status_summary AS
SELECT 
  v.id,
  v.vehicle_code,
  v.license_plate,
  v.status,
  COUNT(DISTINCT t.id) as trips_this_month,
  COALESCE(SUM(CASE WHEN t.revenue IS NOT NULL THEN t.revenue ELSE 0 END), 0) 
    as revenue_this_month,
  MAX(t.departure_date) as last_trip_date,
  CASE 
    WHEN v.insurance_expiry < CURRENT_DATE THEN 'Insurance Expired'
    WHEN v.inspection_expiry < CURRENT_DATE THEN 'Inspection Expired'
    WHEN v.insurance_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'Insurance Expiring Soon'
    WHEN v.inspection_expiry < CURRENT_DATE + INTERVAL '30 days' THEN 'Inspection Expiring Soon'
    ELSE 'OK'
  END as alert_status
FROM vehicles v
LEFT JOIN trips t ON v.id = t.vehicle_id 
  AND t.trip_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND t.is_deleted = FALSE
WHERE v.is_deleted = FALSE
GROUP BY v.id, v.vehicle_code, v.license_plate, v.status, 
         v.insurance_expiry, v.inspection_expiry;

CREATE INDEX idx_vehicle_summary_vehicle_id 
  ON vehicle_status_summary(id);
```

---

## Key Relationships

```
users
├── company_settings (many-to-one)
├── vehicles (many, created-by)
└── trips (many, created-by)

vehicles
├── company_settings (many-to-one)
├── trips (one-to-many)
├── maintenance_orders (one-to-many)
├── expenses (one-to-many)
└── drivers (one-to-many, assigned-vehicle)

drivers
├── company_settings (many-to-one)
├── vehicles (many-to-one, assigned-vehicle)
├── trips (one-to-many)
└── expenses (one-to-many)

trips
├── vehicles (many-to-one)
├── drivers (many-to-one)
├── customers (many-to-one)
├── routes (many-to-one)
├── company_settings (many-to-one)
├── expense_allocations (one-to-many)
└── created-by user (many-to-one)

expenses
├── vehicles (many-to-one)
├── drivers (many-to-one)
├── company_settings (many-to-one)
└── expense_allocations (one-to-many)

expense_allocations
├── expenses (many-to-one, cascade-delete)
└── trips (many-to-one, cascade-delete)

customers
├── company_settings (many-to-one)
└── trips (one-to-many)

routes
├── company_settings (many-to-one)
└── trips (one-to-many)

maintenance_orders
├── vehicles (many-to-one)
└── company_settings (many-to-one)

accounting_periods
├── company_settings (many-to-one)
└── locked-by user (many-to-one)

company_settings
├── users (one-to-many)
├── vehicles (one-to-many)
├── drivers (one-to-many)
├── customers (one-to-many)
├── trips (one-to-many)
├── expenses (one-to-many)
├── routes (one-to-many)
├── maintenance_orders (one-to-many)
└── accounting_periods (one-to-many)
```

---

## Migration Management

### Creating Migrations
```bash
# Generate migration template
supabase migration new add_new_table

# Edit migration file
supabase/migrations/20260201000000_add_new_table.sql
```

### Standard Migration Template
```sql
-- Migration: add_new_table
-- Description: Brief description of changes
-- Date: 2026-02-01

BEGIN;

-- Create table
CREATE TABLE IF NOT EXISTS new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- columns here
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_new_table_field ON new_table(field);

-- Enable RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "admin_all" ON new_table
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

COMMIT;
```

### Testing Migrations
```bash
# Reset and apply migrations locally
supabase db reset

# Push to production
supabase db push --linked
```

---

## Data Cleanup Procedures

### Permanent Delete Soft-Deleted Items (Older than 30 days)
```sql
DELETE FROM vehicles 
WHERE is_deleted = TRUE 
  AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

DELETE FROM drivers 
WHERE is_deleted = TRUE 
  AND deleted_at < CURRENT_TIMESTAMP - INTERVAL '30 days';

-- Continue for all soft-deletable tables
```

### Archive Closed Trips (Older than 1 year)
```sql
-- Create archive table
CREATE TABLE trips_archive AS 
SELECT * FROM trips 
WHERE status = 'closed' 
  AND trip_date < CURRENT_DATE - INTERVAL '1 year';

-- Delete from main table
DELETE FROM trips 
WHERE id IN (SELECT id FROM trips_archive);
```

### Update Credit Balances
```sql
UPDATE customers SET credit_used = (
  SELECT COALESCE(SUM(revenue), 0) 
  FROM trips 
  WHERE customer_id = customers.id 
    AND status != 'closed'
    AND is_deleted = FALSE
);
```

---

## Performance Tuning

### Query Optimization
```sql
-- Enable slow query log
ALTER DATABASE mydb SET log_min_duration_statement = 1000;

-- Find slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Analyze query plan
EXPLAIN ANALYZE 
SELECT * FROM trips 
WHERE trip_date >= CURRENT_DATE - INTERVAL '30 days' 
  AND company_id = 'xxx';

-- Add missing indexes if needed
```

### Connection Pooling
```
Supabase automatically handles connection pooling.
Default: 10 connections per project
Configure in: Database → Connection Pooling
```

---

## Backup & Recovery

### Automatic Backups
- Supabase: Daily automatic backups (30 days retention)
- Access: Dashboard → Backups tab
- Restore: One-click restore from any backup

### Manual Backup
```bash
# Export as SQL
supabase db dump > backup_2026_02_01.sql

# Export as JSON
supabase db export --format json > backup.json
```

### Recovery Procedure
```bash
# 1. Restore from backup (Supabase Dashboard)
# 2. Verify data integrity
# 3. Test application
# 4. Clear browser cache and test again
```

---

This database schema supports the complete fleet management system with multi-tenant architecture, soft-delete pattern, and comprehensive financial tracking! 🗄️
