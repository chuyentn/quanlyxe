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
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Tables in order of deletion (respecting foreign key constraints)
const TABLES_TO_DELETE = [
    'expense_allocations',  // Leaf tables first (no dependencies)
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

async function cleanupAllData() {
    const isForced = process.argv.includes('--force');

    if (!isForced) {
        console.log('⚠️  WARNING: This will DELETE ALL DATA from all tables!');
        console.log('To proceed, run with: node scripts/cleanup-data.ts --force');
        process.exit(0);
    }

    console.log('🧹 Starting COMPLETE DATA CLEANUP...\n');

    let totalDeleted = 0;
    let totalErrors = 0;

    for (const tableName of TABLES_TO_DELETE) {
        try {
            console.log(`  Deleting from ${tableName}...`);

            // Get count before deletion
            const { count: countBefore } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (!countBefore || countBefore === 0) {
                console.log(`    ✅ Already empty (0 records)`);
                continue;
            }

            // Delete all records
            const { count: countDeleted, error } = await supabase
                .from(tableName)
                .delete()
                .neq('id', ''); // This deletes all records

            if (error) {
                console.error(`    ❌ Error: ${error.message}`);
                totalErrors++;
            } else {
                console.log(`    ✅ Deleted ${countDeleted} records`);
                totalDeleted += countDeleted || 0;
            }
        } catch (err: any) {
            console.error(`    ❌ Exception: ${err.message}`);
            totalErrors++;
        }
    }

    console.log('\n📊 Verifying cleanup...\n');

    // Verify all tables are empty
    let allEmpty = true;
    for (const tableName of TABLES_TO_DELETE) {
        try {
            const { count, error } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });

            if (!error && count !== null && count > 0) {
                console.log(`  ⚠️  ${tableName}: ${count} records remaining`);
                allEmpty = false;
            } else {
                console.log(`  ✅ ${tableName}: empty`);
            }
        } catch (err: any) {
            console.error(`  ❌ ${tableName}: ${err.message}`);
            allEmpty = false;
        }
    }

    console.log('\n================================================');
    console.log('CLEANUP SUMMARY');
    console.log('================================================');
    console.log(`✅ Total Deleted: ${totalDeleted}`);
    console.log(`❌ Errors: ${totalErrors}`);
    console.log(`📦 Status: ${allEmpty ? 'ALL TABLES EMPTY ✨' : 'Some data remains'}`);
    console.log('================================================\n');
    console.log('🎉 Database is ready for fresh data!\n');
}

cleanupAllData();
