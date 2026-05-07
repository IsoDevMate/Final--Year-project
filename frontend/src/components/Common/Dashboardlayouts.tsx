
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  FileText as Notes,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { title: 'Dashboard', path: '/dashboard', icon: <Home className="w-5 h-5" /> },
    { title: 'Events', path: '/dashboard/events', icon: <Calendar className="w-5 h-5" /> },
    { title: 'Reports', path: '/dashboard/reports', icon: <CreditCard className="w-5 h-5" />, roles: ['admin', 'organizer'] },
    { title: 'Notes', path: '/dashboard/notes', icon: <Notes className="w-5 h-5" /> },
    { title: 'Admin', path: '/dashboard/admin', icon: <ShieldCheck className="w-5 h-5" />, roles: ['admin'] },
    { title: 'Settings', path: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
    { title: 'Profile', path: '/dashboard/profile', icon: <Users className="w-5 h-5" /> },
  ].filter(link => !link.roles || link.roles.includes(user?.role || ''));

  const navigateToWebsite = () => {
    window.open('/', '_blank');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-16 lg:w-64 bg-tiffany-700 overflow-y-auto transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-4 text-white">
          <div
            className="flex items-center cursor-pointer"
            onClick={navigateToWebsite}
          >
            <div className="bg-gray-400 rounded-full p-3 mr-3">
              <img
                src="https://res.cloudinary.com/dmdvvasdy/image/upload/v1745915711/comfybase_logo_g6uqa4.svg"
                alt="Comfybase Logo"
                className="w-12 h-12"
              />
            </div>
            <span className="hidden lg:inline text-2xl font-bold">eventbase</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="lg:hidden focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6">
          <div className="px-2 lg:px-4 py-2">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center p-3 lg:px-4 lg:py-3 text-sm rounded-lg ${
                    isActive(link.path)
                      ? 'bg-tiffany-900 text-white'
                      : 'text-tiffany-100 hover:bg-tiffany-800'
                  }`}
                  title={link.title} // Add title attribute for tooltip
                >
                  {link.icon}
                  <span className="hidden lg:inline ml-3">{link.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-2 lg:p-4">
          <Link
            to="/auth/logout"
            className="flex items-center p-3 lg:px-4 lg:py-3 text-sm rounded-lg text-tiffany-100 hover:bg-tiffany-800"
            title="Logout" // Add title attribute for tooltip
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden lg:inline ml-3">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-16 lg:ml-64">
        {/* Topbar */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 focus:outline-none lg:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4">
              <button className="relative p-1 text-gray-500 hover:text-gray-800 focus:outline-none">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500"></span>
              </button>

              <div className="relative">
                <button className="flex items-center focus:outline-none">
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                    {user ? user.firstName || user.email : 'User Name'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
