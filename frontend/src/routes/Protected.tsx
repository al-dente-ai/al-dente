import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useIsAuthenticated, useAuth } from '../store';
import { useEffect } from 'react';

export default function Protected() {
  const isAuthenticated = useIsAuthenticated();
  const { phoneVerified, requiresPhoneVerification, fetchUser } = useAuth();
  const { pathname } = useLocation();

  // Fetch user data on mount to ensure we have phone verification status
  useEffect(() => {
    if (isAuthenticated) {
      fetchUser();
    }
  }, [isAuthenticated, fetchUser]);

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  }

  // If phone verification status is unknown, wait for it to load
  if (phoneVerified === undefined || requiresPhoneVerification === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Redirect to phone verification if not verified
  if (requiresPhoneVerification === true || phoneVerified === false) {
    return <Navigate to="/verify-phone" replace />;
  }

  return <Outlet />;
}
