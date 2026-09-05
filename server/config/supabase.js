const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Ensure env vars are loaded
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY; // Ideally Service Role Key, but Anon works if RLS allows

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL or Key missing in backend environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
