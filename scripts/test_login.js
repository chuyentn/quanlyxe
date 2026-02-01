import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

let processEnv = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
            processEnv[key] = value;
        }
    });
} catch (e) {
    console.log('Could not read .env file', e.message);
}

const supabaseUrl = processEnv.VITE_SUPABASE_URL;
const supabaseKey = processEnv.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testLogin() {
    console.log('Testing Login with admin@example.com...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'password123',
    });

    if (error) {
        console.error('Login Failed:', error.message);
    } else {
        console.log('Login Success!', data.user.email);
    }
}

async function testRegister() {
    console.log('\nTesting Register with test_fix_login@example.com...');
    const email = `test_fix_login_${Date.now()}@example.com`;
    const password = 'password123';

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: 'Test Fix Login'
            }
        }
    });

    if (error) {
        console.error('Register Failed:', error.message);
    } else {
        console.log('Register Success!', data.user ? data.user.email : 'No user returned (check email confirmation settings)');
        if (data.session) console.log('Session created immediately.');
        else console.log('No session, likely requires email confirmation.');
    }
}

async function run() {
    await testLogin();
    await testRegister();
}

run();
