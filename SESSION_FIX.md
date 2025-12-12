# Fix Session Management - Hermina IGD

## Masalah
User harus login berulang kali karena session tidak persisten, terutama untuk monitor Kamala dan Padma yang harus tetap aktif.

## Solusi yang Diterapkan

### 1. Frontend: Persist Session di localStorage
**File:** `frontend/src/supabaseClient.js`

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,        // ✅ Simpan session di localStorage
    autoRefreshToken: true,       // ✅ Auto refresh token sebelum expired
    detectSessionInUrl: true,     // ✅ Detect session dari URL
    storage: window.localStorage, // ✅ Storage medium
    storageKey: 'hermina-igd-auth-token', // ✅ Custom storage key
  }
})
```

### 2. Supabase Dashboard: Perpanjang JWT Expiry (OPSIONAL)

Jika masih ingin session lebih lama:

1. Login ke **Supabase Dashboard**
2. Pilih project → **Settings** → **Authentication**
3. Scroll ke **JWT Settings**:
   - **JWT Expiry**: Ubah dari 3600 (1 jam) ke **604800** (7 hari) atau lebih
   - **Refresh Token Rotation**: Pastikan **ENABLED**
   - **Reuse Interval**: 10 seconds (default OK)

4. **Save** perubahan

### 3. Hasil
✅ User hanya login sekali  
✅ Session tetap aktif meski refresh/reload browser  
✅ Token auto-refresh sebelum expired  
✅ Monitor Kamala/Padma tidak perlu login berulang  
✅ User hanya logout jika memang klik tombol Logout  

## Testing
1. Login sebagai admin
2. Refresh browser (F5) → Tetap login ✅
3. Tutup tab, buka lagi → Tetap login ✅
4. Tunggu beberapa jam → Tetap login (auto refresh) ✅
5. Klik Logout → Baru logout ✅

## Rollback (Jika Perlu)
Hapus konfigurasi auth di `supabaseClient.js`:
```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## Security Notes
- Session disimpan di localStorage (aman untuk internal app)
- JWT tetap punya expiry untuk security
- Auto refresh mencegah expired saat masih aktif
- Supabase RLS tetap enforce authorization per request
