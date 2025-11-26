// src/supabaseClient.js
// Ini adalah CLIENT KHUSUS FRONTEND (menggunakan ANON KEY)

import { createClient } from '@supabase/supabase-js'

// Ambil variabel dari file .env yang baru Anda buat
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Ekspor client untuk digunakan di komponen React Anda (misal: DashboardAdmin)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
