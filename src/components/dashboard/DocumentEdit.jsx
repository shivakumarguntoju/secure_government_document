// Document Edit Component
import React, { useState } from 'react';
import { Edit3, Save, X } from 'lucide-react';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../../constants';
import useDocuments from '../../hooks/useDocuments.jsx';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import ErrorMessage from '../common/ErrorMessage';
import toast from 'react-hot-toast';

const DocumentEdit = ({ document, onClose, onUpdated }) => {
  const { updateDocument } = useDocuments();
  const [formData, setFormData] = useState({
    documentType: document.documentType,
    description: document.description
  });
  const [updating, setUpdating] = useState(false);
  const [errors, setErrors] = useState({});

  const documentTypes = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUpdating(true);

    try {
      await updateDocument(document.id, {
        documentType: formData.documentType,
        description: formData.description.trim()
      });
      
      toast.success('Document updated successfully!');
      onUpdated();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to update document. Please try again.');
    } finally {
      setUpdating(false);
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

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Edit Document"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 truncate">{document.fileName}</h3>
          <p className="text-sm text-gray-600">{document.fileType}</p>
          <p className="text-xs text-gray-500 mt-1">
            Uploaded: {document.uploadedAt.toLocaleDateString()}
          </p>
        </div>

        {/* Document Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document Type *
          </label>
          <select
            name="documentType"
            value={formData.documentType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {documentTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Brief description of the document"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {errors.description && <ErrorMessage message={errors.description} />}
        </div>

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            icon={X}
            onClick={onClose}
            disabled={updating}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="success"
            icon={Save}
            loading={updating}
            className="flex-1"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DocumentEdit;