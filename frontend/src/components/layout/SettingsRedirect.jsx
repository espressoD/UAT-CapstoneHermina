// src/components/layout/SettingsRedirect.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function SettingsRedirect() {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!userProfile) {
    return <Navigate to="/admin/login" replace />;
  }

  // Redirect berdasarkan role
  if (userProfile.role === 'superadmin') {
    return <Navigate to="/admin/settings/superadmin" replace />;
  } else {
    // Admin dan Perawat ke settings admin biasa
    return <Navigate to="/admin/settings/admin" replace />;
  }
}
