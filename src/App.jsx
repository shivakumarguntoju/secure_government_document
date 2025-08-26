// Main App Component
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { APP_NAME } from './constants';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/dashboard/Dashboard';
import Profile from './components/profile/Profile';
import LoadingSpinner from './components/common/LoadingSpinner';

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2 mt-4">{APP_NAME}</h2>
          <p className="text-gray-600">Loading your secure document platform...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return authMode === 'login' ? (
      <LoginForm onSwitchToRegister={() => setAuthMode('register')} />
    ) : (
      <RegisterForm onSwitchToLogin={() => setAuthMode('login')} />
    );
  }

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'profile':
        return <Profile />;
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings</h2>
            <p className="text-gray-600">Settings functionality coming soon...</p>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header
          currentView={currentView}
          onViewChange={setCurrentView}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <main className="flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 w-full">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </AuthProvider>
  );
};

export default App;