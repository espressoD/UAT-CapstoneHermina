# User Role Authorization System

## 📋 Overview

Sistem aplikasi sekarang mendukung 2 jenis role pengguna:
1. **Superadmin** - Akses penuh ke semua pengaturan
2. **Admin** - Akses terbatas (hanya ubah password dan logout)

---

## 🔐 Role Permissions

### Superadmin
✅ Ubah password  
✅ Keluar dari sistem  
✅ **Pengaturan ESI** (warna kuning & merah)  
✅ **Pengaturan Batas Waktu Per Tahap** (Timer per tahap 1-6)  
✅ **Pengaturan Petugas Jaga** (Penanggung Jawab, Perawat, Dokter IGD)  

### Admin
✅ Ubah password  
✅ Keluar dari sistem  
❌ Tidak bisa akses pengaturan ESI  
❌ Tidak bisa akses pengaturan batas waktu  
❌ Tidak bisa akses pengaturan petugas jaga  

---

## 🚀 Cara Kerja

### 1. **Routing Otomatis**
Saat user mengakses `/admin/settings`, sistem akan otomatis redirect ke:
- `/admin/settings/superadmin` - Jika role = `superadmin`
- `/admin/settings/admin` - Jika role = `admin`

### 2. **Protected Routes**
Setiap route settings dilindungi dengan `ProtectedRoute` component yang:
- Cek apakah user sudah login
- Cek apakah user memiliki role yang sesuai
- Redirect ke dashboard jika role tidak cocok

### 3. **UI/UX Differences**

#### Superadmin Settings:
- Header menampilkan: "Mode: SUPERADMIN - Akses Penuh"
- 4 tabs tersedia: Profil Saya, Pengaturan ESI, Pengaturan Per Tahap, Pengaturan Petugas Jaga
- Dapat mengubah semua pengaturan sistem

#### Admin Settings:
- Header menampilkan: "Mode: ADMIN - Ubah Password & Keluar"
- Info alert biru menjelaskan keterbatasan akses
- Hanya 2 section: Profil Saya & Keamanan (password + logout)
- Tidak ada tab untuk pengaturan lainnya

---

## 📁 File Structure

```
src/
├── components/
│   └── layout/
│       ├── ProtectedRoute.jsx          # HOC untuk proteksi route berdasarkan role
│       └── SettingsRedirect.jsx        # Component untuk redirect settings berdasarkan role
├── pages/
│   └── pagesAdmin/
│       ├── SettingsAkunAdmin.jsx       # Settings untuk Superadmin (semua tab)
│       └── SettingsAkunAdminBiasa.jsx  # Settings untuk Admin (password & logout only)
└── routes/
    └── AdminRoutes.jsx                 # Routing configuration dengan role-based access
```

---

## 🔧 Implementation Details

### 1. ProtectedRoute Component
```jsx
<ProtectedRoute allowedRoles={['superadmin']}>
  <SettingsAkunAdmin />
</ProtectedRoute>
```

### 2. Settings Redirect Logic
```jsx
// Di SettingsRedirect.jsx
if (userProfile.role === 'superadmin') {
  return <Navigate to="/admin/settings/superadmin" />;
} else {
  return <Navigate to="/admin/settings/admin" />;
}
```

### 3. Route Configuration
```jsx
// Redirect berdasarkan role
<Route path="/admin/settings" element={<SettingsRedirect />} />

// Superadmin only
<Route 
  path="/admin/settings/superadmin" 
  element={
    <ProtectedRoute allowedRoles={['superadmin']}>
      <SettingsAkunAdmin />
    </ProtectedRoute>
  } 
/>

// Admin only
<Route 
  path="/admin/settings/admin" 
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <SettingsAkunAdminBiasa />
    </ProtectedRoute>
  } 
/>
```

---

## 🧪 Testing

### Test Case 1: Superadmin Access
1. Login sebagai user dengan role `superadmin`
2. Klik menu Settings
3. ✅ Should redirect ke `/admin/settings/superadmin`
4. ✅ Should see 4 tabs
5. ✅ Should dapat mengubah ESI, batas waktu, dan petugas jaga

### Test Case 2: Admin Access
1. Login sebagai user dengan role `admin`
2. Klik menu Settings
3. ✅ Should redirect ke `/admin/settings/admin`
4. ✅ Should see info alert about limited access
5. ✅ Should only see profile and password sections
6. ❌ Should NOT see tabs for ESI, batas waktu, or petugas jaga

### Test Case 3: Unauthorized Access
1. Login sebagai admin (bukan superadmin)
2. Manually navigate ke `/admin/settings/superadmin`
3. ✅ Should automatically redirect to `/admin/dashboard`

---

## 📊 Database Schema

Role disimpan di tabel `profiles`:
```sql
profiles (
  id uuid,
  role varchar,  -- 'superadmin' | 'admin'
  nama_lengkap varchar,
  jabatan varchar,
  id_pegawai varchar
)
```

---

## 🎯 Summary

✅ Role-based access control implemented  
✅ Superadmin can access all settings  
✅ Admin can only change password & logout  
✅ Protected routes prevent unauthorized access  
✅ Automatic redirection based on user role  
✅ Clear UI indicators for each role  
✅ Info alerts for limited access users  

**Status**: ✅ IMPLEMENTED & READY TO USE
