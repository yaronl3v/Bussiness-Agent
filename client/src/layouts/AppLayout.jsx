import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bars3Icon, 
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { authService } from '../services/index.js';
import Button from '../components/ui/Button.jsx';
import OrganizationSwitcher from '../components/OrganizationSwitcher.jsx';
import Logo from '../components/ui/Logo.jsx';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-gray-50/30 to-orange-50/20">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Top Navigation */}
      <nav className="glass sticky top-0 z-30 border-b border-green-200/20 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-gray-600 hover:bg-green-100/80 hover:text-gray-900 lg:hidden transition-colors"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              
              <Link to="/agents" className="flex items-center">
                <Logo size="sm" />
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <OrganizationSwitcher />
              
              <div className="hidden sm:block">
                <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800 border border-green-200">
                  Production
                </span>
              </div>
              
              {/* Profile dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2 rounded-xl p-2 hover:bg-green-50 transition-colors"
                >
                  <UserCircleIcon className="h-6 w-6 text-gray-600" />
                  <ArrowRightOnRectangleIcon className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
