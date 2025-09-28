import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../store';
import { cn } from '../../lib/utils';

const navigation = [
  { name: 'Scan', href: '/app/scan', icon: '📸' },
  { name: 'Inventory', href: '/app/inventory', icon: '📦' },
  { name: 'Recipes', href: '/app/recipes', icon: '👨‍🍳' },
];

export default function Shell() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    window.location.assign('/');
  };

  return (
    <div className="h-screen flex bg-neutral-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col">
        <div className="flex flex-col flex-grow border-r border-neutral-200 bg-white overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-neutral-200">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🍝</span>
              <span className="text-xl font-bold text-neutral-800">Al Dente</span>
            </div>
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

          {/* User menu */}
          <div className="flex-shrink-0 flex border-t border-neutral-200 p-4">
            <div className="flex items-center">
              <div className="flex-1">
                <div className="text-sm font-medium text-neutral-800">User</div>
                <div className="text-xs text-neutral-500">Manage your pantry</div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-3 text-neutral-400 hover:text-neutral-600 text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top nav */}
        <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🍝</span>
              <span className="text-xl font-bold text-neutral-800">Al Dente</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-neutral-400 hover:text-neutral-600 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

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
        <main className="flex-1 relative overflow-y-auto focus:outline-none pb-16 md:pb-0">
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
