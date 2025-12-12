# Sistem Keamanan Nomor Antrian dengan Hashids

## 📌 Overview
Sistem ini menggunakan **Hashids** untuk mengamankan nomor antrian pasien IGD. Alih-alih menggunakan nomor antrian asli (format `DDMMHHxxx`) di URL, sistem akan meng-encode nomor tersebut menjadi hash yang tidak dapat ditebak.

## 🔒 Keamanan
- **Secret Key**: `hermina-pasteur-igd-2025-secure-key` (dapat diubah via environment variable `HASHIDS_SECRET`)
- **Minimum Length**: 10 karakter
- **Encoding**: ID kunjungan di-encode menjadi hash yang unik
- **Backward Compatible**: Sistem masih menerima nomor antrian asli untuk kompatibilitas

## 🔄 Alur Kerja

### 1. Input Nomor Antrian (CekAntrian.jsx)
```
User memasukkan: 19112115001
         ↓
POST /api/public/encode-antrian
         ↓
Verifikasi nomor valid & aktif
         ↓
Encode ID kunjungan → hash (contoh: "aBc123XyZ0")
         ↓
Navigate ke: /status/aBc123XyZ0
```

### 2. Akses Halaman Status (StatusPasien.jsx)
```
URL: /status/aBc123XyZ0
         ↓
GET /api/public/status?q=aBc123XyZ0
         ↓
Decode hash → ID kunjungan
         ↓
Query database by ID
         ↓
Return data kunjungan
```

## 🛡️ API Endpoints

### POST /api/public/encode-antrian
**Request:**
```json
{
  "nomor_antrian": "19112115001"
}
```

**Response (Success):**
```json
{
  "hash": "aBc123XyZ0",
  "nomor_antrian": "19112115001"
}
```

**Response (Error):**
```json
{
  "error": "Nomor antrian tidak ditemukan atau sudah kedaluwarsa."
}
```

### GET /api/public/status?q=HASH_OR_NOMOR
**Parameter:** `q` (hash atau nomor antrian asli)

**Behavior:**
1. Coba decode sebagai hash terlebih dahulu
2. Jika gagal, anggap sebagai nomor antrian (backward compatible)
3. Query database berdasarkan ID atau nomor antrian
4. Return data kunjungan jika valid (< 24 jam)

## 🔧 Konfigurasi

### Environment Variables (Opsional)
```bash
HASHIDS_SECRET=your-custom-secret-key-here
```

### Backend Setup
```javascript
const Hashids = require('hashids/cjs');
const SECRET_KEY = process.env.HASHIDS_SECRET || 'hermina-pasteur-igd-2025-secure-key';
const hashids = new Hashids(SECRET_KEY, 10);
```

## ✅ Keuntungan
1. **Tidak dapat ditebak**: Hash tidak mengikuti pola sequential
2. **Privasi**: Nomor antrian asli tidak terexpose di URL
3. **Backward compatible**: Masih menerima nomor antrian asli
4. **Validasi otomatis**: Hanya nomor yang valid dan aktif yang bisa di-encode

## 🧪 Testing

### Test Case 1: Cek Manual dengan Nomor Antrian
```
1. Masukkan nomor antrian: 19112115001
2. System encode → hash: aBc123XyZ0
3. Redirect ke: /status/aBc123XyZ0
4. Data pasien ditampilkan ✅
```

### Test Case 2: Akses Langsung dengan Hash (dari link/bookmark)
```
1. Akses URL: /status/aBc123XyZ0
2. System decode hash → ID kunjungan
3. Query database
4. Data pasien ditampilkan ✅
```

### Test Case 3: Hash Invalid
```
1. Akses URL: /status/invalidHash123
2. Decode gagal
3. Coba sebagai nomor antrian
4. Tidak ditemukan → Error 404 ✅
```

### Test Case 4: Nomor Kedaluwarsa
```
1. Masukkan nomor antrian > 24 jam
2. Validasi gagal
3. Error: "Nomor antrian tidak ditemukan atau sudah kedaluwarsa" ✅
```

## 📝 Notes
- Hash bersifat **deterministik**: ID yang sama selalu menghasilkan hash yang sama
- Hash **tidak dapat di-reverse** tanpa secret key
- Secret key sebaiknya disimpan di **environment variable** untuk production
- Sistem **tidak menyimpan mapping** hash-to-ID di database (computed on the fly)
