// Document Share Component
import React, { useState } from 'react';
import { UserPlus, Mail, AlertCircle } from 'lucide-react';
import { validateEmail, validateAadhaar } from '../../utils/validation';
import useDocuments from '../../hooks/useDocuments';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import ErrorMessage from '../common/ErrorMessage';
import toast from 'react-hot-toast';

const DocumentShare = ({ document, onClose, onShared }) => {
  const { shareDocument } = useDocuments();
  const [shareMethod, setShareMethod] = useState('email');
  const [shareData, setShareData] = useState({
    email: '',
    aadhaar: '',
    permissions: 'view'
  });
  const [sharing, setSharing] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (shareMethod === 'email') {
      if (!shareData.email) {
        newErrors.email = 'Email address is required';
      } else if (!validateEmail(shareData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    } else {
      if (!shareData.aadhaar) {
        newErrors.aadhaar = 'Aadhaar number is required';
      } else if (!validateAadhaar(shareData.aadhaar)) {
        newErrors.aadhaar = 'Please enter a valid Aadhaar number';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleShare = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSharing(true);

    try {
      const sharePayload = {
        [shareMethod]: shareMethod === 'email' ? shareData.email : shareData.aadhaar,
        permissions: shareData.permissions
      };

      await shareDocument(document.id, sharePayload);
      toast.success('Document shared successfully!');
      onShared();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to share document. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShareData(prev => ({
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Share Document"
      size="medium"
    >
      <form onSubmit={handleShare} className="space-y-6">
        {/* Document Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 truncate">{document.fileName}</h3>
          <p className="text-sm text-gray-600 capitalize">{document.documentType}</p>
          <p className="text-xs text-gray-500 mt-1">{document.description}</p>
        </div>

        {/* Share Method Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Share with *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setShareMethod('email')}
              className={`flex items-center space-x-2 p-3 border rounded-lg transition-all duration-200 ${
                shareMethod === 'email'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <Mail className="w-4 h-4" />
              <span className="text-sm font-medium">Email</span>
            </button>
            
            <button
              type="button"
              onClick={() => setShareMethod('aadhaar')}
              className={`flex items-center space-x-2 p-3 border rounded-lg transition-all duration-200 ${
                shareMethod === 'aadhaar'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Aadhaar</span>
            </button>
          </div>
        </div>

        {/* Input Field */}
        <div>
          {shareMethod === 'email' ? (
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={shareData.email}
              onChange={handleChange}
              icon={Mail}
              placeholder="Enter recipient email address"
              error={errors.email}
              required
            />
          ) : (
            <Input
              label="Aadhaar Number"
              type="text"
              name="aadhaar"
              value={shareData.aadhaar}
              onChange={handleChange}
              icon={UserPlus}
              placeholder="Enter recipient Aadhaar number"
              error={errors.aadhaar}
              maxLength={12}
              required
            />
          )}
        </div>

        {/* Permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Permissions *
          </label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="radio"
                name="permissions"
                value="view"
                checked={shareData.permissions === 'view'}
                onChange={handleChange}
                className="mr-3"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">View Only</span>
                <p className="text-xs text-gray-600">Recipient can only view the document</p>
              </div>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="permissions"
                value="download"
                checked={shareData.permissions === 'download'}
                onChange={handleChange}
                className="mr-3"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">View & Download</span>
                <p className="text-xs text-gray-600">Recipient can view and download the document</p>
              </div>
            </label>
          </div>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800">
                <strong>Security Notice:</strong> Only share documents with trusted family members. 
                Shared documents cannot be unshared once sent.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={sharing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={sharing}
            disabled={!validateForm()}
            className="flex-1"
          >
            Share Document
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DocumentShare;