// src/supabaseClient.js
// Ini adalah CLIENT KHUSUS FRONTEND (menggunakan ANON KEY)

import { createClient } from '@supabase/supabase-js'

// Ambil variabel dari file .env yang baru Anda buat
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Ekspor client untuk digunakan di komponen React Anda (misal: DashboardAdmin)
// Konfigurasi untuk persist session dan mencegah auto logout
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Simpan session di localStorage
    autoRefreshToken: true, // Auto refresh token sebelum expired
    detectSessionInUrl: true, // Detect session dari URL (untuk reset password, dll)
    storage: window.localStorage, // Gunakan localStorage untuk menyimpan session
    storageKey: 'hermina-igd-auth-token', // Custom key untuk storage
  }
})
