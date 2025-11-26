// src/utils/navigationHelper.js

/**
 * Get the correct dashboard route based on user role
 * @param {Object} userProfile - User profile object with role property
 * @returns {string} Dashboard route path
 */
export const getDashboardRoute = (userProfile) => {
  if (!userProfile) return '/admin/dashboard';
  
  switch (userProfile.role) {
    case 'perawat_kamala':
      return '/admin/dashboard-kamala';
    case 'perawat_padma':
      return '/admin/dashboard-padma';
    case 'admin':
    case 'superadmin':
    default:
      return '/admin/dashboard';
  }
};

/**
 * Navigate to the correct dashboard based on user role
 * @param {Function} navigate - React Router navigate function
 * @param {Object} userProfile - User profile object with role property
 */
export const navigateToDashboard = (navigate, userProfile) => {
  const route = getDashboardRoute(userProfile);
  navigate(route);
};
