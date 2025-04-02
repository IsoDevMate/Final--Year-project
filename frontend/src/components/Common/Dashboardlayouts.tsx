

import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  Video,
  Users,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  FileText as Notes
} from 'lucide-react';
// import Dashboard from './Dashboard';
import {useAuth} from '../../contexts/AuthContext';

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
    // { title: 'Linkedin', path: '/dashboard/linkedin', icon: <Video className="w-5 h-5" /> },
    // { title: 'Payments', path: '/dashboard/payments', icon: <Video className="w-5 h-5" /> },
    { title: 'Reports', path: '/dashboard/reports', icon: <CreditCard className="w-5 h-5" />, roles: ['admin', 'organizer'] },
    { title: 'Settings', path: '/dashboard/settings', icon: <Settings className="w-5 h-5" />,  },
    { title: 'Notes', path: '/dashboard/notes', icon: <Notes className="w-5 h-5" /> },
    { title: 'Profile', path: '/dashboard/profile', icon: <Users className="w-5 h-5" /> },
  ].filter(link => !link.roles || link.roles.includes(user?.role));

  const navigateToWebsite = () => {
    window.open('/', '_blank');
  }


  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-indigo-700 overflow-y-auto transition-all duration-300 lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 text-white">
          <div className="flex items-center cursor-pointer" onClick={navigateToWebsite}>
            <div className="bg-white rounded-full p-2 mr-2">
              <span className="text-indigo-700 text-xl font-bold">C</span>
            </div>
            <span className="text-2xl font-bold">comfybase</span>
          </div>    <button
            onClick={toggleSidebar}
            className="lg:hidden focus:outline-none"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="mt-6">
          <div className="px-4 py-2">
            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center px-4 py-3 text-sm rounded-lg ${
                    isActive(link.path)
                      ? 'bg-indigo-900 text-white'
                      : 'text-indigo-100 hover:bg-indigo-800'
                  }`}
                >
                  {link.icon}
                  <span className="ml-3">{link.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <Link
            to="/auth/logout"
            className="flex items-center px-4 py-3 text-sm rounded-lg text-indigo-100 hover:bg-indigo-800"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-3">Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
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
                  {/* <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center">
                    <span className="text-indigo-700 font-bold">

                      {user ? user.email.toUpperCase() : 'U'}
                    </span>
                  </div> */}
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                    {/* Display full name or 'User Name' if no user */}
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
