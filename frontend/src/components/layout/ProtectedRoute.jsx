// src/components/layout/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
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

  // Jika ada role yang diizinkan dan user tidak termasuk, redirect
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return children;
}
