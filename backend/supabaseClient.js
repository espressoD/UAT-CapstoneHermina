// supabaseClient.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // Muat variabel dari .env

// Ambil kredensial dari file .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Buat dan ekspor satu "client" saja
// Kita akan "import" ini di file mana pun yang butuh koneksi database
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;