// Header Component - Complete with Logout Functionality
import React, { useState } from 'react';
import { FileText, LogOut, User, Settings, Activity, Menu, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { APP_NAME } from '../../constants';
import { maskAadhaar } from '../../utils/helpers';
import Button from '../common/Button';
import ConfirmDialog from '../common/ConfirmDialog';
import toast from 'react-hot-toast';

const Header = ({ currentView, onViewChange, onMenuToggle }) => {
  const { userProfile, logout, currentUser } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      const result = await logout();
      toast.success(result.message || 'Logged out successfully');
      setShowLogoutConfirm(false);
    } catch (error) {
      toast.error(error.message || 'Logout failed. Please try again.');
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      <header className="bg-white shadow-lg border-b-2 border-blue-600 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <button
                onClick={onMenuToggle}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors duration-200"
              >
                <Menu className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{APP_NAME}</h1>
                  <p className="text-xs text-gray-500 hidden sm:block">Secure Document Management</p>
                </div>
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                      currentView === item.id
                        ? 'bg-blue-100 text-blue-700 font-medium shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* User Profile Dropdown */}
              {userProfile && (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-gray-900">
                        {userProfile.firstName} {userProfile.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{userProfile.email}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* User Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {userProfile.firstName} {userProfile.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{userProfile.email}</p>
                        <p className="text-xs text-gray-500">
                          Aadhaar: {maskAadhaar(userProfile.aadhaarNumber)}
                        </p>
                      </div>
                      
                      <div className="py-2">
                        <button
                          onClick={() => {
                            onViewChange('profile');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <User className="w-4 h-4" />
                          <span>View Profile</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            onViewChange('settings');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Account Settings</span>
                        </button>
                      </div>
                      
                      <div className="border-t border-gray-100 py-2">
                        <button
                          onClick={() => {
                            setShowLogoutConfirm(true);
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Quick Logout Button */}
              <Button
                variant="outline"
                size="small"
                icon={LogOut}
                onClick={() => setShowLogoutConfirm(true)}
                className="text-red-600 border-red-300 hover:bg-red-50 hidden sm:flex"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors duration-200 ${
                    currentView === item.id
                      ? 'text-blue-700 bg-blue-100'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Logout Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to sign out? You'll need to log in again to access your documents."
        confirmText="Sign Out"
        cancelText="Stay Logged In"
        variant="danger"
        loading={loggingOut}
      />

      {/* Click outside to close user menu */}
      {showUserMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </>
  );
};

export default Header;