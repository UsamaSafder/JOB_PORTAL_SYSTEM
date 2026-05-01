import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute Component
 * Prevents unauthorized access to protected pages
 * Redirects to login if user is not authenticated or has wrong role
 */
function ProtectedRoute({ element, allowedRoles = [], requiredAuth = true }) {
  // Get auth data from localStorage
  const token = localStorage.getItem('authToken');
  const userDataStr = localStorage.getItem('userData') || localStorage.getItem('currentUser');
  
  let userData = null;
  try {
    userData = userDataStr ? JSON.parse(userDataStr) : null;
  } catch (e) {
    console.error('Failed to parse userData:', e);
  }

  // Check if user is authenticated
  if (!token || !userData) {
    if (requiredAuth) {
      // Redirect to login if authentication is required
      return <Navigate to="/login" replace />;
    }
  }

  // Check if user has the required role
  if (allowedRoles.length > 0 && userData) {
    if (!allowedRoles.includes(userData.role)) {
      // Redirect to home if user doesn't have required role
      console.warn(`Access denied. User role: ${userData.role}, Required roles: ${allowedRoles.join(', ')}`);
      return <Navigate to="/" replace />;
    }
  }

  // User is authenticated and has required role
  return element;
}

export default ProtectedRoute;
