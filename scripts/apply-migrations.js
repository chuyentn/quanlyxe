#!/usr/bin/env node

/**
 * Auto-apply Database Migrations Script
 * Applies all Phase 1 migrations to Supabase in correct order
 * 
 * Usage:
 *   node scripts/apply-migrations.js
 * 
 * Prerequisites:
 *   - Supabase CLI installed: npm install -g supabase
 *   - Project linked: supabase link --project-ref YOUR_PROJECT_REF
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../supabase/migrations');

// Migration files in order
const MIGRATION_FILES = [
    '20260122_add_expense_allocations.sql',
    '20260122_add_accounting_periods.sql',
    '20260122_add_constraints_and_views.sql',
    '20260122_seed_data_part1.sql',
    '20260122_seed_data_part2.sql',
    '20260122_seed_data_part3.sql',
    '20260122_seed_data_part4.sql',
];

console.log('🚀 Fleet Management - Auto Migration Script\n');

// Check if Supabase CLI is installed
try {
    execSync('supabase --version', { stdio: 'ignore' });
    console.log('✅ Supabase CLI detected\n');
} catch (error) {
    console.error('❌ Supabase CLI not found!');
    console.error('   Install: npm install -g supabase');
    process.exit(1);
}

// Check if migrations directory exists
if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
}

console.log('📋 Migrations to apply:\n');
MIGRATION_FILES.forEach((file, index) => {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const exists = fs.existsSync(filePath);
    console.log(`   ${index + 1}. ${file} ${exists ? '✓' : '✗ MISSING'}`);

    if (!exists) {
        console.error(`\n❌ Migration file missing: ${file}`);
        process.exit(1);
    }
});

console.log('\n⚠️  This will apply migrations to your Supabase database.');
console.log('   Make sure you have a backup if running on production!\n');

// Apply migrations
console.log('🔄 Applying migrations...\n');

let successCount = 0;
let failCount = 0;

for (const file of MIGRATION_FILES) {
    const filePath = path.join(MIGRATIONS_DIR, file);

    try {
        console.log(`   Applying: ${file}`);
        execSync(`supabase db execute -f "${filePath}"`, {
            stdio: 'pipe',
            encoding: 'utf-8'
        });
        console.log(`   ✅ Success: ${file}\n`);
        successCount++;
    } catch (error) {
        console.error(`   ❌ Failed: ${file}`);
        console.error(`   Error: ${error.message}\n`);
        failCount++;

        // Ask if should continue
        if (failCount > 0 && successCount < MIGRATION_FILES.length - 1) {
            console.log('   ⚠️  Migration failed. Continuing may cause errors.\n');
        }
    }
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Migration Summary:');
console.log(`   ✅ Success: ${successCount}`);
console.log(`   ❌ Failed:  ${failCount}`);
console.log(`   📝 Total:   ${MIGRATION_FILES.length}`);
console.log('='.repeat(50) + '\n');

if (failCount === 0) {
    console.log('🎉 All migrations applied successfully!\n');
    console.log('Next steps:');
    console.log('   1. Verify data: SELECT COUNT(*) FROM vehicles;');
    console.log('   2. Test profit calc: SELECT * FROM trip_financials LIMIT 1;');
    console.log('   3. Test period lock: Try updating a closed period trip\n');
    process.exit(0);
} else {
    console.log('⚠️  Some migrations failed. Check errors above.\n');
    process.exit(1);
}
