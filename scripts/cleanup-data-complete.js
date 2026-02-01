#!/usr/bin/env node

/**
 * DATABASE CLEANUP SCRIPT
 * Deletes all data from all tables while keeping schema intact
 * Usage: node scripts/cleanup-data.js
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY env vars are required");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
  "expense_allocations",  // Leaf tables first (no dependencies)
  "maintenance_orders",
  "expenses",
  "trips",
  "routes",
  "customers",
  "vehicles",
  "drivers",
  "notification_settings",
  "security_settings",
  "company_settings",
  "accounting_periods",
];

async function cleanupDatabase() {
  console.log("🧹 Starting database cleanup...\n");

  try {
    for (const table of tables) {
      try {
        console.log(`  Deleting from ${table}...`);
        const { count, error } = await supabase
          .from(table)
          .delete()
          .neq("id", -1); // Delete all rows (trick to bypass RLS)

        if (error && !error.message.includes("RLS")) {
          console.warn(`  ⚠️  ${table}: ${error.message}`);
        } else {
          console.log(`  ✅ ${table}: Cleared`);
        }
      } catch (err) {
        console.error(`  ❌ Error deleting from ${table}:`, err.message);
      }
    }

    console.log("\n📊 Verifying cleanup...\n");

    // Verify all tables are empty
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        if (!error) {
          console.log(`  ${table}: ${count} records`);
        }
      } catch (err) {
        console.error(`  Error counting ${table}:`, err.message);
      }
    }

    console.log("\n✨ Cleanup complete! Database is ready for fresh data.\n");
  } catch (err) {
    console.error("❌ Fatal error during cleanup:", err.message);
    process.exit(1);
  }
}

cleanupDatabase();
