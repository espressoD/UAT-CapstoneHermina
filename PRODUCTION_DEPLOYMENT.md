# Production Deployment Guide

## ✅ Perubahan yang Telah Dilakukan

### 1. **Environment Variables Configuration**
- ✅ File `.env` dan `backend/.env` ditambahkan ke `.gitignore`
- ✅ Template `.env.example` dibuat untuk dokumentasi
- ✅ Backend sekarang menggunakan environment variables:
  - `NODE_ENV` - production/development mode
  - `PORT` - port backend server (default: 3001)
  - `CORS_ORIGIN` - allowed CORS origin
  - `WEBHOOK_URL` - URL webhook eksternal

### 2. **Console Logging**
- ✅ Semua `console.log` di backend dikondisikan dengan `NODE_ENV`
- ✅ Semua `console.log` di frontend dikondisikan dengan `import.meta.env.DEV`
- ✅ Helper functions `devLog()` dan `devError()` dibuat untuk development-only logging

### 3. **Backend Configuration**
- ✅ CORS origin sekarang dinamis dari environment variable
- ✅ Port tidak lagi hardcoded
- ✅ Webhook URL diambil dari environment variable
- ✅ Production scripts ditambahkan di `package.json`

### 4. **Files Modified**
- `.gitignore` - Protect .env files
- `backend/.env` - Added production configuration
- `backend/server.js` - Dynamic configuration & conditional logging
- `backend/package.json` - Production scripts
- `src/context/AuthContext.jsx` - Conditional logging
- `src/pages/pagesAdmin/DashboardAdmin.jsx` - Conditional logging
- `src/pages/pagesAdmin/TampilanMonitorIGD.jsx` - Conditional logging
- `src/components/uiAdmin/PetugasJagaCard.jsx` - Conditional logging

---

## 🚀 Cara Menjalankan Production

### Backend

#### Development Mode:
```bash
cd backend
npm run dev
```

#### Production Mode:
```bash
cd backend
npm start
```

### Frontend

#### Development Mode:
```bash
npm run dev
```

#### Build untuk Production:
```bash
npm run build
```

#### Preview Production Build:
```bash
npm run preview
```

---

## 📋 Checklist Sebelum Deploy

### Backend Production Setup:

1. **Update backend/.env untuk production:**
```env
NODE_ENV=production
PORT=3001
CORS_ORIGIN=https://your-production-domain.com
WEBHOOK_URL=https://your-production-webhook-url.com
```

2. **Pastikan Supabase credentials benar:**
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

3. **Test production mode locally:**
```bash
cd backend
NODE_ENV=production node server.js
```

### Frontend Production Setup:

1. **Update .env untuk production:**
```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-backend-api.com
```

2. **Build aplikasi:**
```bash
npm run build
```

3. **Deploy folder `dist/` ke hosting:**
- Vercel
- Netlify
- AWS S3 + CloudFront
- Atau hosting pilihan Anda

---

## 🔒 Security Checklist

- ✅ `.env` files tidak ter-commit ke git
- ✅ Service Role Key hanya digunakan di backend
- ✅ CORS dikonfigurasi untuk domain production saja
- ✅ Console logs tidak aktif di production
- ✅ Environment variables terpisah untuk dev/prod

---

## 🐛 Troubleshooting

### Console logs masih muncul di production:
- Backend: Pastikan `NODE_ENV=production` di environment
- Frontend: Pastikan build dengan `npm run build` bukan `npm run dev`

### CORS Error di production:
- Update `CORS_ORIGIN` di backend/.env dengan domain production frontend
- Contoh: `CORS_ORIGIN=https://your-app.vercel.app`

### Webhook tidak jalan:
- Update `WEBHOOK_URL` di backend/.env dengan URL production webhook
- Pastikan webhook endpoint accessible dari server backend

---

## 📝 Notes

- **Development mode**: Console logs aktif untuk debugging
- **Production mode**: Console logs otomatis dinonaktifkan
- **Environment variables**: Selalu gunakan template dari `.env.example`
- **Never commit**: File `.env` ke repository

---

## 🎯 Next Steps (Optional)

1. **Add API rate limiting** untuk security
2. **Setup monitoring** (Sentry, LogRocket, dll)
3. **Add health check endpoint** untuk monitoring
4. **Setup CI/CD pipeline** untuk automated deployment
5. **Add request logging middleware** (Morgan, Winston)
6. **Setup SSL/TLS** untuk HTTPS
