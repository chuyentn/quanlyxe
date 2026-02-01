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

async function cleanupAllData() {
    console.log('🧹 Starting complete database cleanup...\n');

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
            
            const { count, error } = await supabase
                .from(table)
                .delete()
                .neq('id', '');

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
    } else {
        console.log('\n⚠️  Some tables still have data');
    }
}

cleanupAllData().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
