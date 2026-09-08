const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Ensure env vars are loaded
dotenv.config({ quiet: true });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
// Storage writes are performed by our authenticated API, not directly by a
// Supabase-authenticated browser.  The server must therefore use the service
// role key; using the public anon key makes every upload fail storage RLS.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in the backend environment.');
}

// Storage is an optional runtime dependency. The API must still boot so health,
// authentication, marketplace and collaboration endpoints remain available
// when a deployment has not configured storage yet.
const supabase = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    })
    : null;

module.exports = supabase;
