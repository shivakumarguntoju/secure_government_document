// Profile Component
import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, CreditCard, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { validatePhone } from '../../utils/validation';
import { maskAadhaar, formatDate } from '../../utils/helpers';
import Button from '../common/Button';
import Input from '../common/Input';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const Profile = () => {
  const { userProfile, updateUserProfile, currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: userProfile?.firstName || '',
    lastName: userProfile?.lastName || '',
    phoneNumber: userProfile?.phoneNumber || '',
    address: userProfile?.address || '',
    dateOfBirth: userProfile?.dateOfBirth || ''
  });

  const handleEdit = () => {
    setEditing(true);
    setFormData({
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      phoneNumber: userProfile?.phoneNumber || '',
      address: userProfile?.address || '',
      dateOfBirth: userProfile?.dateOfBirth || ''
    });
  };

  const handleCancel = () => {
    setEditing(false);
    setErrors({});
    setFormData({
      firstName: userProfile?.firstName || '',
      lastName: userProfile?.lastName || '',
      phoneNumber: userProfile?.phoneNumber || '',
      address: userProfile?.address || '',
      dateOfBirth: userProfile?.dateOfBirth || ''
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      await updateUserProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        dateOfBirth: formData.dateOfBirth
      });

      toast.success('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      toast.error(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="large" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {userProfile.firstName} {userProfile.lastName}
              </h1>
              <p className="text-gray-600">{userProfile.email}</p>
              <p className="text-sm text-gray-500">
                Member since {formatDate(userProfile.createdAt)}
              </p>
            </div>
          </div>
          
          {!editing && (
            <Button
              variant="primary"
              icon={Edit3}
              onClick={handleEdit}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
          {editing && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                icon={X}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                icon={Save}
                onClick={handleSave}
                loading={loading}
              >
                Save
              </Button>
            </div>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              icon={User}
              error={errors.firstName}
              required
            />

            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              icon={Phone}
              error={errors.phoneNumber}
              maxLength={10}
              required
            />

            <Input
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              icon={Calendar}
              error={errors.dateOfBirth}
              required
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.address ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  required
                />
              </div>
              {errors.address && <ErrorMessage message={errors.address} />}
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">
                  {userProfile.firstName} {userProfile.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{userProfile.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium text-gray-900">{userProfile.phoneNumber}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Aadhaar Number</p>
                <p className="font-medium text-gray-900">{maskAadhaar(userProfile.aadhaarNumber)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Calendar className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium text-gray-900">
                  {formatDate(userProfile.dateOfBirth)}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">{userProfile.address}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Security */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div>
              <p className="font-medium text-green-900">Email Verification</p>
              <p className="text-sm text-green-700">
                {currentUser?.emailVerified ? 'Your email is verified' : 'Email not verified'}
              </p>
            </div>
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white">
              {currentUser?.emailVerified ? '✓' : '!'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div>
              <p className="font-medium text-blue-900">Two-Factor Authentication</p>
              <p className="text-sm text-blue-700">Not enabled</p>
            </div>
            <Button variant="primary" size="small">
              Enable
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;