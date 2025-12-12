# Testing Sistem Hashing Nomor Antrian

## 🧪 Cara Testing

### 1. Start Backend Server
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
npm run dev
```

### 3. Test Scenarios

#### ✅ Scenario 1: Cek Manual Normal Flow
1. Buka browser: `http://localhost:5173/cek-antrian`
2. Masukkan nomor antrian yang valid (contoh: `19112115001`)
3. Klik "Masuk ke Portal IGD"
4. **Expected**: 
   - URL berubah menjadi `/status/[HASH]` (contoh: `/status/aBc123XyZ0`)
   - Data pasien ditampilkan dengan benar
   - **HASH tidak bisa ditebak** dan berbeda dari nomor antrian asli

#### ✅ Scenario 2: Direct URL Access dengan Hash
1. Copy hash dari URL yang didapat di Scenario 1
2. Buka tab baru, paste URL: `http://localhost:5173/status/[HASH]`
3. **Expected**: Data pasien tetap ditampilkan dengan benar

#### ✅ Scenario 3: Backward Compatibility (Nomor Antrian Langsung)
1. Akses langsung: `http://localhost:5173/status/19112115001`
2. **Expected**: Masih berfungsi, data ditampilkan (untuk kompatibilitas)

#### ❌ Scenario 4: Invalid Hash
1. Akses URL dengan hash random: `http://localhost:5173/status/invalidHash999`
2. **Expected**: Redirect ke halaman error/salah

#### ❌ Scenario 5: Nomor Antrian Tidak Valid
1. Buka: `http://localhost:5173/cek-antrian`
2. Masukkan nomor yang tidak ada: `99999999999`
3. **Expected**: Redirect ke `/salah` dengan error message

#### ❌ Scenario 6: Nomor Kedaluwarsa (>24 jam)
1. Masukkan nomor antrian yang sudah lebih dari 24 jam
2. **Expected**: Error "Nomor antrian tidak ditemukan atau sudah kedaluwarsa"

### 4. API Testing dengan cURL/Postman

#### Test Encode Endpoint
```bash
# Request
curl -X POST http://localhost:3001/api/public/encode-antrian \
  -H "Content-Type: application/json" \
  -d '{"nomor_antrian": "19112115001"}'

# Expected Response (Success)
{
  "hash": "aBc123XyZ0",
  "nomor_antrian": "19112115001"
}

# Expected Response (Error)
{
  "error": "Nomor antrian tidak ditemukan atau sudah kedaluwarsa."
}
```

#### Test Status Endpoint dengan Hash
```bash
# Request dengan hash
curl http://localhost:3001/api/public/status?q=aBc123XyZ0

# Expected: Data kunjungan lengkap
```

#### Test Status Endpoint dengan Nomor Antrian
```bash
# Request dengan nomor antrian langsung
curl http://localhost:3001/api/public/status?q=19112115001

# Expected: Data kunjungan lengkap (backward compatible)
```

## 🔍 Verification Checklist

### Security
- [ ] URL tidak menampilkan nomor antrian asli (format DDMMHHxxx)
- [ ] Hash tidak dapat ditebak secara sequential
- [ ] Nomor antrian asli tidak terexpose di browser network tab
- [ ] Hash tetap konsisten untuk ID yang sama

### Functionality
- [ ] Cek manual dengan nomor antrian berfungsi
- [ ] Redirect ke URL dengan hash berfungsi
- [ ] Data pasien ditampilkan dengan benar
- [ ] Realtime update tetap berfungsi
- [ ] Error handling untuk nomor invalid bekerja
- [ ] Error handling untuk nomor kedaluwarsa bekerja

### Backward Compatibility
- [ ] Akses langsung dengan nomor antrian masih berfungsi
- [ ] Old bookmarks/links masih bisa diakses
- [ ] Tidak ada breaking changes di API existing

## 📊 Expected Results

### Browser Network Tab
```
POST /api/public/encode-antrian
Request: {"nomor_antrian": "19112115001"}
Response: {"hash": "aBc123XyZ0", "nomor_antrian": "19112115001"}

GET /api/public/status?q=aBc123XyZ0
Response: {id: 1, nomor_antrian: "19112115001", ...}
```

### Browser URL Bar
**Before (Not Secure):**
```
http://localhost:5173/status/19112115001
```

**After (Secure):**
```
http://localhost:5173/status/aBc123XyZ0
```

## 🐛 Common Issues

### Issue: Hash selalu berubah
**Solution**: Hash seharusnya konsisten untuk ID yang sama. Periksa SECRET_KEY tidak berubah.

### Issue: Decode gagal
**Solution**: Pastikan SECRET_KEY sama antara encode dan decode. Cek environment variable.

### Issue: Error 404 terus
**Solution**: 
1. Periksa nomor antrian ada di database
2. Periksa nomor antrian belum kedaluwarsa (< 24 jam)
3. Cek koneksi database

### Issue: Backend tidak start
**Solution**: 
1. Pastikan package `hashids` sudah terinstall: `npm install hashids`
2. Restart backend server

## 💡 Tips
- Gunakan Browser DevTools Network tab untuk melihat request/response
- Gunakan Console untuk melihat log encoding/decoding
- Test dengan data dummy di database development dulu
