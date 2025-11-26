// src/routes/AdminRoutes.jsx
import { Routes, Route } from "react-router-dom";
import DashboardAdmin from "../pages/pagesAdmin/DashboardAdmin";
import DashboardPadma from "../pages/pagesAdmin/DashboardPadma";
import DashboardKamala from "../pages/pagesAdmin/DashboardKamala";
import TampilanMonitorIGDKamala from "../pages/pagesAdmin/TampilanMonitorIGDKamala";
import TampilanMonitorIGDPadma from "../pages/pagesAdmin/TampilanMonitorIGDPadma";
import LoginAdmin from "../pages/pagesAdmin/LoginAdmin";
import SettingsAkunAdmin from "../pages/pagesAdmin/SettingsAkunAdmin";
import SettingsAkunAdminBiasa from "../pages/pagesAdmin/SettingsAkunAdminBiasa";
import PasienAktif from "../pages/pagesAdmin/PasienAktif";
import PasienSelesai from "../pages/pagesAdmin/PasienSelesai";
import CariPasien from "../pages/pagesAdmin/CariPasien";
import InputPasienBaru from "../pages/pagesAdmin/InputPasienBaru";
import DaftarKunjunganLama from "../pages/pagesAdmin/DaftarKunjunganLama";
import TampilanMonitorIGD from "../pages/pagesAdmin/TampilanMonitorIGD";
import ProtectedRoute from "../components/layout/ProtectedRoute";
import SettingsRedirect from "../components/layout/SettingsRedirect";
import DashboardRedirect from "../components/layout/DashboardRedirect";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/admin/login" element={<LoginAdmin />} />
      
      {/* Main dashboard route - redirect based on role */}
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <DashboardAdmin />
          </ProtectedRoute>
        } 
      />
      
      {/* Dashboard Padma - only for superadmin, admin, and perawat_padma */}
      <Route 
        path="/admin/dashboard-padma" 
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'perawat_padma']}>
            <DashboardPadma />
          </ProtectedRoute>
        } 
      />
      
      {/* Dashboard Kamala - only for superadmin, admin, and perawat_kamala */}
      <Route 
        path="/admin/dashboard-kamala" 
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'perawat_kamala']}>
            <DashboardKamala />
          </ProtectedRoute>
        } 
      />
      
      {/* Settings route yang redirect berdasarkan role */}
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute>
            <SettingsRedirect />
          </ProtectedRoute>
        } 
      />
      
      {/* Settings untuk Superadmin - bisa akses semua pengaturan */}
      <Route 
        path="/admin/settings/superadmin" 
        element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <SettingsAkunAdmin />
          </ProtectedRoute>
        } 
      />
      
      {/* Settings untuk Admin biasa - hanya bisa ubah password dan logout */}
      <Route 
        path="/admin/settings/admin" 
        element={
          <ProtectedRoute allowedRoles={['admin', 'perawat_padma', 'perawat_kamala']}>
            <SettingsAkunAdminBiasa />
          </ProtectedRoute>
        } 
      />
      
      <Route path="/admin/pasien-aktif" element={<PasienAktif />} />
      <Route path="/admin/pasien-selesai" element={<PasienSelesai />} />
      <Route path="/admin/cari-pasien" element={<CariPasien />} />
      <Route path="/admin/input-pasien-baru" element={<InputPasienBaru />} />
      <Route path="/admin/daftar-kunjungan-lama/:pasienId" element={<DaftarKunjunganLama />} />
      
      {/* Monitor IGD routes with protection */}
      <Route 
        path="/admin/monitor-igd" 
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <TampilanMonitorIGD />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/monitor-igd-kamala" 
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'perawat_kamala']}>
            <TampilanMonitorIGDKamala />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/monitor-igd-padma" 
        element={
          <ProtectedRoute allowedRoles={['superadmin', 'admin', 'perawat_padma']}>
            <TampilanMonitorIGDPadma />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
