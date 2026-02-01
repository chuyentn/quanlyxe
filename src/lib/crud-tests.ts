/**
 * CRUD Operations Testing Utilities
 * Test all major CRUD operations for the fleet management system
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
);

// ============================================================================
// VEHICLES CRUD TESTS
// ============================================================================

export async function testVehiclesCRUD() {
  console.log('\n🚗 Testing Vehicles CRUD...\n');

  try {
    // CREATE
    console.log('  Creating vehicle...');
    const { data: createData, error: createError } = await supabase
      .from('vehicles')
      .insert({
        vehicle_code: `XE_TEST_${Date.now()}`,
        license_plate: `TEST_${Date.now()}`,
        vehicle_type: 'truck',
        brand: 'Toyota',
        model: 'Hino',
        year_manufactured: 2023,
        capacity_tons: 5.0,
        fuel_type: 'diesel',
        status: 'active',
      })
      .select()
      .single();

    if (createError) throw createError;
    const vehicleId = createData.id;
    console.log(`  ✅ Created vehicle: ${createData.vehicle_code}`);

    // READ
    console.log('  Reading vehicle...');
    const { data: readData, error: readError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (readError) throw readError;
    console.log(`  ✅ Read vehicle: ${readData.vehicle_code}`);

    // UPDATE
    console.log('  Updating vehicle...');
    const { data: updateData, error: updateError } = await supabase
      .from('vehicles')
      .update({ status: 'maintenance' })
      .eq('id', vehicleId)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log(`  ✅ Updated vehicle status: ${updateData.status}`);

    // DELETE (soft)
    console.log('  Deleting vehicle (soft)...');
    const { error: deleteError } = await supabase
      .from('vehicles')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', vehicleId);

    if (deleteError) throw deleteError;
    console.log(`  ✅ Soft deleted vehicle`);

    return { success: true, vehicleId };
  } catch (error) {
    console.error('  ❌ Vehicles CRUD test failed:', error);
    return { success: false, error };
  }
}

// ============================================================================
// DRIVERS CRUD TESTS
// ============================================================================

export async function testDriversCRUD() {
  console.log('\n👤 Testing Drivers CRUD...\n');

  try {
    // CREATE
    console.log('  Creating driver...');
    const { data: createData, error: createError } = await supabase
      .from('drivers')
      .insert({
        driver_code: `TXC_TEST_${Date.now()}`,
        full_name: 'Test Driver',
        phone: '0901234567',
        license_number: `LIC_${Date.now()}`,
        license_class: 'C',
        license_expiry: '2027-12-31',
        hire_date: new Date().toISOString().split('T')[0],
        status: 'active',
      })
      .select()
      .single();

    if (createError) throw createError;
    const driverId = createData.id;
    console.log(`  ✅ Created driver: ${createData.driver_code}`);

    // READ
    console.log('  Reading driver...');
    const { data: readData, error: readError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driverId)
      .single();

    if (readError) throw readError;
    console.log(`  ✅ Read driver: ${readData.full_name}`);

    // UPDATE
    console.log('  Updating driver...');
    const { data: updateData, error: updateError } = await supabase
      .from('drivers')
      .update({ base_salary: 15000000 })
      .eq('id', driverId)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log(`  ✅ Updated driver salary: ₫${updateData.base_salary}`);

    // DELETE (soft)
    console.log('  Deleting driver (soft)...');
    const { error: deleteError } = await supabase
      .from('drivers')
      .update({ is_deleted: true })
      .eq('id', driverId);

    if (deleteError) throw deleteError;
    console.log(`  ✅ Soft deleted driver`);

    return { success: true, driverId };
  } catch (error) {
    console.error('  ❌ Drivers CRUD test failed:', error);
    return { success: false, error };
  }
}

// ============================================================================
// CUSTOMERS CRUD TESTS
// ============================================================================

export async function testCustomersCRUD() {
  console.log('\n🏢 Testing Customers CRUD...\n');

  try {
    // CREATE
    console.log('  Creating customer...');
    const { data: createData, error: createError } = await supabase
      .from('customers')
      .insert({
        customer_code: `KH_TEST_${Date.now()}`,
        customer_name: 'Test Customer Company',
        customer_type: 'company',
        phone: '0901234567',
        address: 'Test Address',
        credit_limit: 500000000,
      })
      .select()
      .single();

    if (createError) throw createError;
    const customerId = createData.id;
    console.log(`  ✅ Created customer: ${createData.customer_code}`);

    // READ
    console.log('  Reading customer...');
    const { data: readData, error: readError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (readError) throw readError;
    console.log(`  ✅ Read customer: ${readData.customer_name}`);

    // UPDATE
    console.log('  Updating customer...');
    const { data: updateData, error: updateError } = await supabase
      .from('customers')
      .update({ credit_limit: 750000000 })
      .eq('id', customerId)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log(`  ✅ Updated customer credit limit: ₫${updateData.credit_limit}`);

    // DELETE (soft)
    console.log('  Deleting customer (soft)...');
    const { error: deleteError } = await supabase
      .from('customers')
      .update({ is_deleted: true })
      .eq('id', customerId);

    if (deleteError) throw deleteError;
    console.log(`  ✅ Soft deleted customer`);

    return { success: true, customerId };
  } catch (error) {
    console.error('  ❌ Customers CRUD test failed:', error);
    return { success: false, error };
  }
}

// ============================================================================
// TRIPS CRUD TESTS
// ============================================================================

export async function testTripsCRUD(vehicleId?: string, driverId?: string, customerId?: string) {
  console.log('\n🚌 Testing Trips CRUD...\n');

  try {
    // CREATE
    console.log('  Creating trip...');
    const { data: createData, error: createError } = await supabase
      .from('trips')
      .insert({
        trip_code: `CB_TEST_${Date.now()}`,
        trip_date: new Date().toISOString().split('T')[0],
        departure_date: new Date().toISOString(),
        origin: 'Ho Chi Minh',
        destination: 'Hanoi',
        distance: 1700,
        cargo_weight: 4000,
        cargo_type: 'General',
        freight_rate: 50000,
        revenue: 85000000,
        status: 'draft',
        vehicle_id: vehicleId,
        driver_id: driverId,
        customer_id: customerId,
      })
      .select()
      .single();

    if (createError) throw createError;
    const tripId = createData.id;
    console.log(`  ✅ Created trip: ${createData.trip_code}`);

    // READ
    console.log('  Reading trip...');
    const { data: readData, error: readError } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (readError) throw readError;
    console.log(`  ✅ Read trip: ${readData.trip_code} - Status: ${readData.status}`);

    // UPDATE (transition status)
    console.log('  Updating trip status...');
    const { data: updateData, error: updateError } = await supabase
      .from('trips')
      .update({ status: 'confirmed' })
      .eq('id', tripId)
      .select()
      .single();

    if (updateError) throw updateError;
    console.log(`  ✅ Updated trip status: ${updateData.status}`);

    // DELETE (soft)
    console.log('  Deleting trip (soft)...');
    const { error: deleteError } = await supabase
      .from('trips')
      .update({ is_deleted: true })
      .eq('id', tripId);

    if (deleteError) throw deleteError;
    console.log(`  ✅ Soft deleted trip`);

    return { success: true, tripId };
  } catch (error) {
    console.error('  ❌ Trips CRUD test failed:', error);
    return { success: false, error };
  }
}

// ============================================================================
// BULK OPERATIONS TEST
// ============================================================================

export async function testBulkOperations() {
  console.log('\n📦 Testing Bulk Operations...\n');

  try {
    // Bulk CREATE
    console.log('  Creating 5 test expenses...');
    const expenses = Array.from({ length: 5 }, (_, i) => ({
      expense_code: `CHI_TEST_${Date.now()}_${i}`,
      expense_date: new Date().toISOString().split('T')[0],
      category: ['fuel', 'toll', 'repair', 'salary', 'other'][i],
      description: `Test expense ${i + 1}`,
      amount: (i + 1) * 1000000,
    }));

    const { data: bulkCreateData, error: bulkCreateError } = await supabase
      .from('expenses')
      .insert(expenses)
      .select();

    if (bulkCreateError) throw bulkCreateError;
    console.log(`  ✅ Created ${bulkCreateData.length} expenses`);

    // Bulk READ
    console.log('  Reading all created expenses...');
    const { data: bulkReadData, error: bulkReadError } = await supabase
      .from('expenses')
      .select('*')
      .in('id', bulkCreateData.map(e => e.id));

    if (bulkReadError) throw bulkReadError;
    console.log(`  ✅ Read ${bulkReadData.length} expenses`);

    // Bulk UPDATE
    console.log('  Deleting all created expenses...');
    const { error: bulkDeleteError } = await supabase
      .from('expenses')
      .update({ is_deleted: true })
      .in('id', bulkCreateData.map(e => e.id));

    if (bulkDeleteError) throw bulkDeleteError;
    console.log(`  ✅ Soft deleted ${bulkCreateData.length} expenses`);

    return { success: true, count: bulkCreateData.length };
  } catch (error) {
    console.error('  ❌ Bulk operations test failed:', error);
    return { success: false, error };
  }
}

// ============================================================================
// SEARCH & FILTER TEST
// ============================================================================

export async function testSearchAndFilter() {
  console.log('\n🔍 Testing Search & Filter...\n');

  try {
    // Search vehicles
    console.log('  Searching vehicles...');
    const { data: vehicleResults, error: vehicleError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('is_deleted', false)
      .limit(10);

    if (vehicleError) throw vehicleError;
    console.log(`  ✅ Found ${vehicleResults.length} vehicles`);

    // Filter by status
    console.log('  Filtering active vehicles...');
    const { data: activeVehicles, error: filterError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('status', 'active')
      .eq('is_deleted', false);

    if (filterError) throw filterError;
    console.log(`  ✅ Found ${activeVehicles.length} active vehicles`);

    // Sort & Limit
    console.log('  Getting top 5 highest revenue trips...');
    const { data: topTrips, error: sortError } = await supabase
      .from('trips')
      .select('*')
      .eq('is_deleted', false)
      .order('revenue', { ascending: false })
      .limit(5);

    if (sortError) throw sortError;
    console.log(`  ✅ Got ${topTrips.length} top trips`);

    return { success: true };
  } catch (error) {
    console.error('  ❌ Search & filter test failed:', error);
    return { success: false, error };
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

export async function runAllTests() {
  console.log('='.repeat(50));
  console.log('🧪 RUNNING CRUD OPERATIONS TESTS');
  console.log('='.repeat(50));

  const results = {
    vehicles: await testVehiclesCRUD(),
    drivers: await testDriversCRUD(),
    customers: await testCustomersCRUD(),
    trips: await testTripsCRUD(),
    bulk: await testBulkOperations(),
    search: await testSearchAndFilter(),
  };

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50) + '\n');

  const passed = Object.values(results).filter(r => r.success).length;
  const total = Object.keys(results).length;

  Object.entries(results).forEach(([key, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${key.toUpperCase()}`);
  });

  console.log(`\n📈 Results: ${passed}/${total} tests passed`);

  if (passed === total) {
    console.log('\n🎉 All CRUD tests passed! System is ready for production.');
  } else {
    console.log(`\n⚠️  ${total - passed} test(s) failed. Check errors above.`);
  }

  return results;
}

// Export for use in other files
export default {
  testVehiclesCRUD,
  testDriversCRUD,
  testCustomersCRUD,
  testTripsCRUD,
  testBulkOperations,
  testSearchAndFilter,
  runAllTests,
};
