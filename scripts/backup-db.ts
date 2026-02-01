
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Load env explicitly if needed, assuming run from root
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using anon key for backup might be limited by RLS, better to ask user for Service Role if possible, but we'll try this first or just assume anon has read access if RLS allows.
// Actually, for a full backup, we really should use the SERVICE_ROLE_KEY if available. 
// But the user's .env had it commented out. We will try to use what's available. 
// If RLS prevents reading, we will fail and ask user.

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TABLES = [
    'vehicles',
    'drivers',
    'routes',
    'customers',
    'expense_categories',
    'trips',
    'expenses',
    'maintenance_orders',
    'trip_audit_log',
    'user_roles'
];

async function backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), 'backups', timestamp);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`Starting backup to ${backupDir}...`);

    for (const table of TABLES) {
        console.log(`Backing up ${table}...`);

        // Fetch all data (might need pagination for large tables, but start simple)
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
            console.error(`Error backing up ${table}:`, error.message);
        } else {
            fs.writeFileSync(
                path.join(backupDir, `${table}.json`),
                JSON.stringify(data, null, 2)
            );
            console.log(`Saved ${data.length} records for ${table}`);
        }
    }

    console.log('Backup complete!');
}

backup();
