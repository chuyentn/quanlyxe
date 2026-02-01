
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRoutes() {
    console.log("Testing fetch from 'routes' table...");
    const start = Date.now();

    const { data, error } = await supabase
        .from('routes')
        .select('*')
        .limit(5);

    const duration = Date.now() - start;

    if (error) {
        console.error("❌ Error fetching routes:", error);
    } else {
        console.log(`✅ Success! Fetched ${data.length} routes in ${duration}ms`);
        console.log("Sample Data:", data);
    }
}

testRoutes();
