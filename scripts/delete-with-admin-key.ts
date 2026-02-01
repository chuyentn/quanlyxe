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

// Use service_role_key for admin access (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function cleanupAllData() {
    console.log('🧹 Using SERVICE ROLE KEY for admin deletion (bypasses RLS)...\n');

    const tables = [
        'expense_allocations',
        'maintenance_orders',
        'expenses',
        'trips',
        'drivers',  // Delete drivers BEFORE vehicles (FK constraint)
        'vehicles',
        'routes',
        'customers',
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
            
            // With service role key, we can delete all records
            const { count, error } = await supabase
                .from(table)
                .delete()
                .gt('id', '00000000-0000-0000-0000-000000000000');

            if (error) {
                console.error(`    ❌ Error: ${error.message}`);
                continue;
            }

            console.log(`    ✅ Deleted ${count || 0} records`);
            totalDeleted += count || 0;
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
        console.log('1. Hard refresh browser (Ctrl+Shift+R)');
        console.log('2. All tabs should be EMPTY');
        console.log('3. Start entering real data following DATA_ENTRY_GUIDE.md');
    } else {
        console.log('\n⚠️  Some tables still have data');
    }
}

cleanupAllData().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
