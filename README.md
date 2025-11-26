# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh


# Hermina IGD Management System

Sistem manajemen IGD digital untuk Rumah Sakit Hermina, berbasis React, Node.js, Supabase, Docker, dan CI/CD GitHub Actions. Dirancang untuk workflow IGD modern, keamanan data, dan kemudahan deployment.

---

## ✨ Fitur Utama

- **Manajemen Pasien IGD**: Input, update, dan rekap kunjungan pasien IGD secara real-time.
- **Role Authorization**: Superadmin & Admin, dengan akses pengaturan berbeda (lihat `ROLE_AUTHORIZATION.md`).
- **Keamanan Nomor Antrian**: Hashids untuk privasi nomor antrian pasien (lihat `SECURITY_HASHING.md`).
- **Export Rekap CSV**: Rekap pasien selesai dapat diexport ke CSV, filter nama/tanggal, format DD/MM/YYYY (lihat `steps.md`).
- **Dashboard Unit**: Dashboard terpisah untuk unit Padma (Umum/Asuransi) dan Kamala (JKN/BPJS).
- **Health Monitoring**: Endpoint `/health` untuk monitoring status backend & frontend.
- **CI/CD Otomatis**: Build, test, dan deploy otomatis via GitHub Actions & Docker.
- **Dokumentasi Lengkap**: Setup, troubleshooting, dan deployment (lihat file `.md`).

---

## 🏗️ Arsitektur

- **Frontend**: React + Vite, Nginx, Docker
- **Backend**: Node.js + Express, Docker
- **Database**: Supabase (Postgres, RLS)
- **Orkestrasi**: Docker Compose
- **CI/CD**: GitHub Actions, GHCR, SSH deploy

Diagram lengkap: lihat `ARCHITECTURE.md`

---

## 🚀 Cara Setup & Deploy

### 1. Local Development
```bash
cp .env.example .env
docker-compose up -d
```

### 2. Production
```bash
./deploy-local.sh
# atau
make rebuild
```

### 3. CI/CD Otomatis
Push ke branch `main` akan trigger build, test, dan deploy otomatis ke server (lihat `CI_CD_SETUP.md`).

---

## 🔑 Environment Variables

Lihat `.env.example`, `DEPLOYMENT_SUMMARY.md`, dan `PRODUCTION_READY.md` untuk variabel yang wajib diisi.

---

## 📁 Struktur Folder

```
backend/      # Backend Node.js API
frontend/     # Frontend React + Nginx
scripts/      # Utility & deployment scripts
.github/      # CI/CD workflows
docker-compose.yml
Makefile
*.md          # Dokumentasi lengkap
```

---

## 📚 Dokumentasi Penting

- [ARCHITECTURE.md](ARCHITECTURE.md) - Diagram & arsitektur sistem
- [CI_CD_SETUP.md](CI_CD_SETUP.md) - Panduan setup CI/CD
- [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) - Ringkasan implementasi
- [QUICK_START.md](QUICK_START.md) - Panduan singkat
- [PRODUCTION_READY.md](PRODUCTION_READY.md) - Checklist production
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solusi masalah umum
- [ROLE_AUTHORIZATION.md](ROLE_AUTHORIZATION.md) - Sistem role & akses
- [SECURITY_HASHING.md](SECURITY_HASHING.md) - Keamanan nomor antrian

---

## 🆘 Support

Jika ada kendala, cek dokumentasi di atas atau hubungi tim pengembang.

---

**Status:** ✅ Production Ready
**Last Updated:** November 26, 2025