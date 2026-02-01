
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from .env manually (running with ts-node)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function checkTable(tableName: string) {
    console.log(`Checking table: ${tableName}...`);
    try {
        // Try selecting 1 row
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) {
            console.error(`Error querying ${tableName}:`, error);
        } else {
            console.log(`Success ${tableName}: Found ${data.length} rows`);
            if (data.length > 0) {
                console.log(`Sample row keys:`, Object.keys(data[0]));
            } else {
                console.log(`Table is empty.`);
            }
        }
    } catch (e) {
        console.error(`Exception checking ${tableName}:`, e);
    }
}

async function run() {
    await checkTable('routes');
    await checkTable('customers');
    await checkTable('vehicles');
}

run();
