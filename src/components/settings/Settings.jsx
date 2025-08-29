// Settings Component
import React, { useState } from 'react';
import { 
  Shield, 
  Bell, 
  Lock, 
  Download, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import Button from '../common/Button';
import Modal from '../common/Modal';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const Settings = () => {
  const { currentUser, userProfile, logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    shareNotifications: true,
    securityAlerts: true,
    twoFactorAuth: false
  });

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    toast.success('Setting updated successfully');
  };

  const handleExportData = () => {
    toast.success('Data export initiated. You will receive an email shortly.');
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // In a real app, this would call a backend service
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Account deletion initiated');
      setShowDeleteModal(false);
      await logout();
    } catch (error) {
      toast.error('Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Manage your account preferences and security</p>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-600" />
          Security & Privacy
        </h2>
        
        <div className="space-y-4">
          {/* Email Verification Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentUser?.emailVerified ? 'bg-green-100' : 'bg-yellow-100'
              }`}>
                {currentUser?.emailVerified ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">Email Verification</p>
                <p className="text-sm text-gray-600">
                  {currentUser?.emailVerified ? 'Your email is verified' : 'Email not verified'}
                </p>
              </div>
            </div>
            {!currentUser?.emailVerified && (
              <Button variant="primary" size="small">
                Verify Email
              </Button>
            )}
          </div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Lock className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600">
                  {settings.twoFactorAuth ? 'Enabled' : 'Add an extra layer of security'}
                </p>
              </div>
            </div>
            <Button
              variant={settings.twoFactorAuth ? "danger" : "primary"}
              size="small"
              onClick={() => handleSettingChange('twoFactorAuth')}
            >
              {settings.twoFactorAuth ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-green-600" />
          Notifications
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">Receive updates about your documents</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={() => handleSettingChange('emailNotifications')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Share Notifications</p>
              <p className="text-sm text-gray-600">Get notified when documents are shared with you</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.shareNotifications}
                onChange={() => handleSettingChange('shareNotifications')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Security Alerts</p>
              <p className="text-sm text-gray-600">Important security and login notifications</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.securityAlerts}
                onChange={() => handleSettingChange('securityAlerts')}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Download className="w-5 h-5 mr-2 text-purple-600" />
          Data Management
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Export Your Data</p>
              <p className="text-sm text-gray-600">Download all your documents and profile data</p>
            </div>
            <Button
              variant="outline"
              icon={Download}
              onClick={handleExportData}
            >
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
        <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
          Danger Zone
        </h2>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-red-900">Delete Account</p>
              <p className="text-sm text-red-700">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
            </div>
            <Button
              variant="danger"
              icon={Trash2}
              onClick={() => setShowDeleteModal(true)}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowDeleteModal(false)}
          title="Delete Account"
          size="medium"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-red-900 mb-2">
                    This action cannot be undone
                  </h3>
                  <p className="text-sm text-red-700">
                    Deleting your account will permanently remove:
                  </p>
                  <ul className="text-sm text-red-700 mt-2 space-y-1">
                    <li>• All uploaded documents</li>
                    <li>• Your profile information</li>
                    <li>• All shared document access</li>
                    <li>• Activity logs and history</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteAccount}
                loading={deleting}
                className="flex-1"
              >
                Delete Account
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Settings;