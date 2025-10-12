import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Logo } from '../ui';
import { useAuth, useIsAuthenticated } from '../../store';

interface HeaderProps {
  variant?: 'transparent' | 'solid';
  onToggleSidebar?: () => void;
  showSidebarToggle?: boolean;
}

export default function Header({ variant = 'transparent', onToggleSidebar, showSidebarToggle = false }: HeaderProps) {
  const navigate = useNavigate();
  const isAuthenticated = useIsAuthenticated();
  const { logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    // Only track scroll for transparent variant
    if (variant !== 'transparent') return;

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [variant]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getHeaderClasses = () => {
    if (variant === 'solid') {
      return 'bg-white border-b border-neutral-200 shadow-sm';
    }
    
    return isScrolled 
      ? 'bg-white/95 backdrop-blur-md border-b border-neutral-200/50 shadow-sm' 
      : 'bg-transparent';
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${getHeaderClasses()}`}
    >
      <div className="relative">
        {/* Sidebar Toggle Button - Absolute positioning on far left */}
        {showSidebarToggle && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="hidden md:flex items-center justify-center p-2 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2 z-10"
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Main Navigation - Centered with max-width */}
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
      </div>
    </header>
  );
}

