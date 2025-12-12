// config/database.js
const { createClient } = require('@supabase/supabase-js');
const config = require('./index');

// Validate required environment variables
if (!config.supabase.url || !config.supabase.anonKey) {
  console.error('Missing required Supabase environment variables');
  process.exit(1);
}

// Create and export Supabase client
const supabase = createClient(config.supabase.url, config.supabase.anonKey);

module.exports = supabase;
