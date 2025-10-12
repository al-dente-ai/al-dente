import { Link, useNavigate } from 'react-router-dom';
import { Logo } from '../ui';
import { useAuth, useIsAuthenticated } from '../../store';

export default function Header() {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Left side: Logo and Site Name */}
        <Logo to="/" size={32} variant="mono" showText={true} className="hover:opacity-80 transition-opacity" />

        {/* Right side: Navigation */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Link
                to="/app"
                className="btn btn-secondary"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="btn btn-outline"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn btn-secondary"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="btn btn-primary"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

