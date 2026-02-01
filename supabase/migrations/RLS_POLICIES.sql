-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Fleet Management System - Comprehensive Access Control
-- ============================================================================

-- Enable RLS for all tables
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VEHICLES - Vehicle Management Access Control
-- ============================================================================

-- Admin: Full access
CREATE POLICY "admin_vehicles_all"
ON vehicles FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Manager: Can view and edit own company vehicles
CREATE POLICY "manager_vehicles_view"
ON vehicles FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager' 
    AND company_id = vehicles.company_id
  )
);

CREATE POLICY "manager_vehicles_edit"
ON vehicles FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager' 
    AND company_id = vehicles.company_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager' 
    AND company_id = vehicles.company_id
  )
);

-- Dispatcher: View only
CREATE POLICY "dispatcher_vehicles_view"
ON vehicles FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'dispatcher'
  )
);

-- Default: Deny all others
CREATE POLICY "vehicles_deny_others"
ON vehicles FOR ALL
USING (false);

-- ============================================================================
-- DRIVERS - Driver Management Access Control
-- ============================================================================

-- Admin: Full access
CREATE POLICY "admin_drivers_all"
ON drivers FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Manager: View and manage own company drivers
CREATE POLICY "manager_drivers_view"
ON drivers FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = drivers.company_id
  )
);

CREATE POLICY "manager_drivers_edit"
ON drivers FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = drivers.company_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = drivers.company_id
  )
);

-- Driver: View own record
CREATE POLICY "driver_own_record"
ON drivers FOR SELECT
USING (id = auth.uid());

-- Dispatcher: View only
CREATE POLICY "dispatcher_drivers_view"
ON drivers FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'dispatcher'
  )
);

-- ============================================================================
-- CUSTOMERS - Customer Management Access Control
-- ============================================================================

-- Admin: Full access
CREATE POLICY "admin_customers_all"
ON customers FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Manager: Full access to own company
CREATE POLICY "manager_customers_all"
ON customers FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = customers.company_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = customers.company_id
  )
);

-- Accountant: Read only
CREATE POLICY "accountant_customers_view"
ON customers FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'accountant'
  )
);

-- Dispatcher: Read only
CREATE POLICY "dispatcher_customers_view"
ON customers FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'dispatcher'
  )
);

-- ============================================================================
-- TRIPS - Trip Management Access Control
-- ============================================================================

-- Admin: Full access
CREATE POLICY "admin_trips_all"
ON trips FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Manager: Full access to own company trips
CREATE POLICY "manager_trips_all"
ON trips FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = trips.company_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = trips.company_id
  )
);

-- Dispatcher: Can create and view
CREATE POLICY "dispatcher_trips_view"
ON trips FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'dispatcher'
  )
);

CREATE POLICY "dispatcher_trips_create"
ON trips FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'dispatcher'
  )
);

-- Driver: Can only view/update own trips
CREATE POLICY "driver_trips_own"
ON trips FOR SELECT
USING (driver_id = auth.uid() OR created_by_id = auth.uid());

CREATE POLICY "driver_trips_update_own"
ON trips FOR UPDATE
USING (driver_id = auth.uid())
WITH CHECK (driver_id = auth.uid());

-- Accountant: Read only
CREATE POLICY "accountant_trips_view"
ON trips FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'accountant'
  )
);

-- ============================================================================
-- EXPENSES - Expense Management Access Control
-- ============================================================================

-- Admin: Full access
CREATE POLICY "admin_expenses_all"
ON expenses FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Manager: Full access to own company
CREATE POLICY "manager_expenses_all"
ON expenses FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = expenses.company_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = expenses.company_id
  )
);

-- Accountant: Full access (read, create, update)
CREATE POLICY "accountant_expenses_all"
ON expenses FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'accountant'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'accountant'
  )
);

-- Driver: Can view own expenses
CREATE POLICY "driver_expenses_own"
ON expenses FOR SELECT
USING (driver_id = auth.uid());

-- ============================================================================
-- EXPENSE ALLOCATIONS - Cost Allocation Access Control
-- ============================================================================

-- Admin: Full access
CREATE POLICY "admin_allocations_all"
ON expense_allocations FOR ALL
USING (
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Manager: Full access
CREATE POLICY "manager_allocations_all"
ON expense_allocations FOR ALL
USING (
  auth.uid() IN (
    SELECT users.id FROM users, expenses
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
    AND expenses.id = expense_allocations.expense_id
    AND users.company_id = expenses.company_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT users.id FROM users, expenses
    WHERE users.id = auth.uid()
    AND users.role = 'manager'
    AND expenses.id = expense_allocations.expense_id
    AND users.company_id = expenses.company_id
  )
);

-- Accountant: Full access
CREATE POLICY "accountant_allocations_all"
ON expense_allocations FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'accountant'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'accountant'
  )
);

-- ============================================================================
-- MAINTENANCE ORDERS - Maintenance Access Control
-- ============================================================================

-- Admin: Full access
CREATE POLICY "admin_maintenance_all"
ON maintenance_orders FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Manager: Full access to own company
CREATE POLICY "manager_maintenance_all"
ON maintenance_orders FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = maintenance_orders.company_id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = maintenance_orders.company_id
  )
);

-- Dispatcher: View only
CREATE POLICY "dispatcher_maintenance_view"
ON maintenance_orders FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'dispatcher'
  )
);

-- Driver: View own vehicle maintenance
CREATE POLICY "driver_maintenance_own"
ON maintenance_orders FOR SELECT
USING (
  vehicle_id IN (
    SELECT assigned_vehicle_id FROM drivers WHERE id = auth.uid()
  )
);

-- ============================================================================
-- COMPANY SETTINGS - Configuration Access Control
-- ============================================================================

-- Admin: Full access
CREATE POLICY "admin_settings_all"
ON company_settings FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Manager: Read and update own company
CREATE POLICY "manager_settings_own"
ON company_settings FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = company_settings.id
  )
);

CREATE POLICY "manager_settings_update"
ON company_settings FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = company_settings.id
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'manager'
    AND company_id = company_settings.id
  )
);

-- Others: View own company settings
CREATE POLICY "users_settings_own"
ON company_settings FOR SELECT
USING (
  auth.uid() IN (
    SELECT id FROM users 
    WHERE company_id = company_settings.id
  )
);

-- ============================================================================
-- SECURITY TESTING
-- ============================================================================

-- Test RLS policies are active:
-- SELECT * FROM pg_policies WHERE tablename = 'vehicles';
-- SELECT * FROM pg_policies WHERE tablename = 'drivers';
-- 
-- RLS policies summary:
-- ✅ Admin: Full access to all tables
-- ✅ Manager: Full access to own company data
-- ✅ Dispatcher: Create/view trips and vehicles, view only others
-- ✅ Accountant: Full access to expenses, read-only trips/customers
-- ✅ Driver: View own record and trips
-- ✅ Viewer: Read-only access (if role exists)
-- ============================================================================
