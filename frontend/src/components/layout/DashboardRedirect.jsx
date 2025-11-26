// src/components/layout/DashboardRedirect.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function DashboardRedirect() {
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
  if (userProfile.role === 'perawat_kamala') {
    return <Navigate to="/admin/dashboard-kamala" replace />;
  } else if (userProfile.role === 'perawat_padma') {
    return <Navigate to="/admin/dashboard-padma" replace />;
  } else {
    // Superadmin dan Admin bisa akses dashboard umum
    return <Navigate to="/admin/dashboard" replace />;
  }
}
