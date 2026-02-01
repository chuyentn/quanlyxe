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
const SERVICE_ROLE_KEY = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

// Use service_role_key for admin access
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function cleanupAllData() {
    console.log('🧹 Using RPC to disable RLS and delete all data...\n');

    // Step 1: Get all record IDs first
    const tables = [
        'expense_allocations',
        'maintenance_orders',
        'expenses',
        'trips',
        'drivers',
        'vehicles',
        'routes',
        'customers',
        'notification_settings',
        'security_settings',
        'company_settings',
        'accounting_periods',
    ];

    let totalDeleted = 0;

    for (const table of tables) {
        try {
            console.log(`  Processing ${table}...`);
            
            // Get all IDs
            const { data: allRecords, error: fetchError } = await supabase
                .from(table)
                .select('id');

            if (fetchError) {
                console.log(`    ⚠️  Could not fetch records: ${fetchError.message}`);
                continue;
            }

            if (!allRecords || allRecords.length === 0) {
                console.log(`    ✅ Already empty (0 records)`);
                continue;
            }

            console.log(`    Found ${allRecords.length} records to delete...`);

            // Delete in batches
            const batchSize = 100;
            for (let i = 0; i < allRecords.length; i += batchSize) {
                const batch = allRecords.slice(i, i + batchSize).map((r: any) => r.id);
                
                const { count, error: deleteError } = await supabase
                    .from(table)
                    .delete()
                    .in('id', batch);

                if (deleteError) {
                    console.error(`    ❌ Error deleting batch: ${deleteError.message}`);
                } else {
                    console.log(`    ✅ Deleted batch of ${count || 0}`);
                    totalDeleted += count || 0;
                }
            }
        } catch (err: any) {
            console.error(`    ❌ Exception: ${err.message}`);
        }
    }

    console.log(`\n📊 Total records deleted: ${totalDeleted}`);
    console.log('\n✅ Verifying cleanup...\n');

    // Verify all tables are empty
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
        console.log('\n📝 Next steps:');
        console.log('1. Refresh browser (Ctrl+Shift+R)');
        console.log('2. All tabs should be EMPTY');
        console.log('3. Start entering real data');
    } else {
        console.log('\n⚠️  Some tables still have data - checking what went wrong...');
    }
}

cleanupAllData().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
