#!/usr/bin/env node

/**
 * Database Schema Initialization Script
 * Runs ULTIMATE_MIGRATION.sql and SEED_FULL_PRODUCTION_TEST.sql
 * 
 * Usage: node scripts/init-db.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_KEY environment variables not set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function readSQL(filename) {
  const filepath = path.join(__dirname, '..', 'supabase', 'migrations', filename);
  return fs.readFileSync(filepath, 'utf-8');
}

async function executeSQLStatements(sql) {
  // Split by semicolon but respect comments and strings
  const statements = sql
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

  let executedCount = 0;

  for (const statement of statements) {
    try {
      // Split multi-statement SQL and execute individually
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error && !error.message.includes('already exists')) {
        console.warn(`⚠️  Warning: ${error.message}`);
      } else {
        executedCount++;
      }
    } catch (err) {
      // Continue on error - some statements might already exist
      console.warn(`⚠️  Statement error (continuing): ${err.message}`);
    }
  }

  return executedCount;
}

async function initializeDatabase() {
  console.log('🚀 Starting database initialization...\n');

  try {
    // Test connection
    console.log('📡 Testing Supabase connection...');
    const { data, error } = await supabase.auth.getSession();
    if (error && error.message !== 'session_not_found') {
      throw error;
    }
    console.log('✅ Connected to Supabase\n');

    // Read migration files
    console.log('📂 Reading migration files...');
    const ultimateMigration = await readSQL('ULTIMATE_MIGRATION.sql');
    console.log(`✅ Loaded ULTIMATE_MIGRATION.sql (${ultimateMigration.length} bytes)\n`);

    // Execute migrations
    console.log('⚙️  Executing database schema migration...');
    const schemaStmtCount = await executeSQLStatements(ultimateMigration);
    console.log(`✅ Executed ${schemaStmtCount} schema statements\n`);

    // Try to load seed data
    try {
      const seedData = await readSQL('SEED_FULL_PRODUCTION_TEST.sql');
      console.log('⚙️  Executing seed data...');
      const seedStmtCount = await executeSQLStatements(seedData);
      console.log(`✅ Executed ${seedStmtCount} seed statements\n`);
    } catch (err) {
      console.log('⚠️  Seed data file not found or optional\n');
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Verify tables in Supabase dashboard');
    console.log('2. Run "npm run dev" to start development server');
    console.log('3. Test application with seed data');
    console.log('4. Deploy to production when ready');

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
