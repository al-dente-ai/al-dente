import { NavLink, Outlet } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Logo } from '../ui';
import { cn } from '../../lib/utils';
import Header from './Header';

const navigation = [
  { name: 'Scan', href: '/app/scan', icon: '📸' },
  { name: 'Inventory', href: '/app/inventory', icon: '📦' },
  { name: 'Recipes', href: '/app/recipes', icon: '👨‍🍳' },
];

export default function Shell() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Set initial sidebar state based on screen width
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="h-screen flex bg-neutral-50">
      {/* Sidebar */}
      <div className={cn(
        "hidden md:flex md:flex-col transition-all duration-300 ease-in-out overflow-hidden",
        sidebarOpen ? "md:w-64" : "md:w-0"
      )}>
        <div className={cn(
          "flex flex-col flex-grow border-r border-neutral-200 bg-white overflow-y-auto transition-opacity duration-300 w-64 flex-shrink-0",
          sidebarOpen ? "opacity-100" : "opacity-0"
        )}>
          {/* Logo */}
          <div className="flex items-center justify-center flex-shrink-0 px-4 py-4 border-b border-gray-200">
            <Logo size={28} variant="mono" showText={false} to="" />
          </div>

          {/* Navigation */}
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-800'
                  )
                }
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header variant="solid" showSidebarToggle={true} onToggleSidebar={toggleSidebar} />

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-2 py-1">
          <nav className="flex justify-around">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center py-2 px-3 text-xs font-medium rounded transition-colors',
                    isActive
                      ? 'text-primary-600'
                      : 'text-neutral-600'
                  )
                }
              >
                <span className="text-lg mb-1">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none pb-16 md:pb-0 pt-20">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
