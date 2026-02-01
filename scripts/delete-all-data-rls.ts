import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read .env file manually
const envPath = resolve('.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    envVars[key] = value;
});

const SUPABASE_URL = envVars['VITE_SUPABASE_URL'];
const SUPABASE_KEY = envVars['VITE_SUPABASE_PUBLISHABLE_KEY'];

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function cleanupWithSQL() {
    console.log('🧹 Running SQL cleanup with RLS disabled...\n');

    const sql = `
    -- Disable RLS temporarily
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

    -- Delete all records
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

    -- Re-enable RLS
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
    `;

    try {
        const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql });
        
        if (error) {
            console.error('❌ RPC method not available, trying direct queries...');
            await cleanupWithDirect();
            return;
        }

        console.log('✅ SQL executed successfully');
        await verifyCleanup();
    } catch (err) {
        console.log('Info: RPC not available, using direct deletion...');
        await cleanupWithDirect();
    }
}

async function cleanupWithDirect() {
    console.log('🧹 Using direct deletion approach...\n');

    const tables = [
        'expense_allocations',
        'maintenance_orders',
        'expenses',
        'trips',
        'routes',
        'customers',
        'vehicles',
        'drivers',
        'notification_settings',
        'security_settings',
        'company_settings',
        'accounting_periods',
    ];

    let totalDeleted = 0;

    // Delete each table
    for (const table of tables) {
        try {
            console.log(`  Deleting from ${table}...`);
            
            // Use delete without filter to delete all
            const { count, error } = await supabase
                .from(table)
                .delete()
                .gt('id', '00000000-0000-0000-0000-000000000000'); // This will match all UUIDs

            if (error) {
                // Try alternative: delete with is not null
                console.log(`    Retrying with alternative method...`);
                const { count: count2, error: error2 } = await supabase
                    .from(table)
                    .delete()
                    .not('id', 'is', null);
                
                if (error2) {
                    console.error(`    ⚠️  Could not delete all: ${error2.message}`);
                    continue;
                }
                console.log(`    ✅ Deleted ${count2 || 0} records`);
                totalDeleted += count2 || 0;
            } else {
                console.log(`    ✅ Deleted ${count || 0} records`);
                totalDeleted += count || 0;
            }
        } catch (err: any) {
            console.error(`    ❌ Exception: ${err.message}`);
        }
    }

    console.log(`\n📊 Total records deleted: ${totalDeleted}`);
    await verifyCleanup();
}

async function verifyCleanup() {
    console.log('\n✅ Verifying cleanup...\n');

    const tables = [
        'expense_allocations',
        'maintenance_orders',
        'expenses',
        'trips',
        'routes',
        'customers',
        'vehicles',
        'drivers',
        'notification_settings',
        'security_settings',
        'company_settings',
        'accounting_periods',
    ];

    let allEmpty = true;
    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`  ❌ ${table}: Error checking`);
            allEmpty = false;
        } else {
            const isEmpty = count === 0;
            const status = isEmpty ? '✅' : '❌';
            console.log(`  ${status} ${table}: ${count} records`);
            if (!isEmpty) allEmpty = false;
        }
    }

    if (allEmpty) {
        console.log('\n🎉 ALL TABLES EMPTY! Database cleanup complete!');
    } else {
        console.log('\n⚠️  Some tables still have data - may need manual intervention');
    }
}

cleanupWithSQL().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
