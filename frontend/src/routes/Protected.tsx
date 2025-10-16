import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useIsAuthenticated } from '../store';

export default function Protected() {
  const isAuthenticated = useIsAuthenticated();
  const { pathname } = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  }

  return <Outlet />;
}
