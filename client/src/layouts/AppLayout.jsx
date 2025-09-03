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

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Top Navigation */}
      <nav className="glass sticky top-0 z-30 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="rounded-lg p-2 text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 lg:hidden"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
              
              <Link to="/agents" className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
                  <span className="text-sm font-bold text-white">WC</span>
                </div>
                <span className="hidden text-xl font-bold text-gray-900 sm:block">
                  WiseChat
                </span>
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <OrganizationSwitcher />
              
              <div className="hidden sm:block">
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  Production
                </span>
              </div>
              
              {/* Profile dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2 rounded-xl p-2"
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
