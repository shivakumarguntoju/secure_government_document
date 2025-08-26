// Document Upload Component
import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../../constants';
import { validateFileType, validateFileSize } from '../../utils/validation';
import useDocuments from '../../hooks/useDocuments.jsx';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import ErrorMessage from '../common/ErrorMessage';
import toast from 'react-hot-toast';

const DocumentUpload = ({ onClose, onUploadComplete }) => {
  const { uploadDocument } = useDocuments();
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    documentType: DOCUMENT_TYPES.OTHER,
    description: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});

  const documentTypes = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    if (!validateFileType(selectedFile)) {
      toast.error('Invalid file type. Please select a PDF, DOC, DOCX, or image file.');
      return;
    }

    // Validate file size
    if (!validateFileSize(selectedFile)) {
      toast.error('File size too large. Maximum size is 5MB.');
      return;
    }

    setFile(selectedFile);
    
    // Auto-detect document type based on filename
    const fileName = selectedFile.name.toLowerCase();
    if (fileName.includes('aadhaar') || fileName.includes('aadhar')) {
      setFormData(prev => ({ ...prev, documentType: DOCUMENT_TYPES.AADHAAR }));
    } else if (fileName.includes('pan')) {
      setFormData(prev => ({ ...prev, documentType: DOCUMENT_TYPES.PAN }));
    } else if (fileName.includes('passport')) {
      setFormData(prev => ({ ...prev, documentType: DOCUMENT_TYPES.PASSPORT }));
    } else if (fileName.includes('mark') || fileName.includes('certificate')) {
      setFormData(prev => ({ ...prev, documentType: DOCUMENT_TYPES.MARKSHEET }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!file) {
      newErrors.file = 'Please select a file to upload';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a description for the document';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      await uploadDocument(file, formData, setUploadProgress);
      toast.success('Document uploaded successfully!');
      onUploadComplete();
    } catch (error) {
      toast.error(error.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
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
      title="Upload Document"
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload Area */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Document *
          </label>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : file
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="flex items-center justify-center space-x-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div className="text-left">
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-900 font-medium mb-2">
                  Drag and drop your document here
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  or click to browse files
                </p>
                <input
                  type="file"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors duration-200"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Choose File
                </label>
              </>
            )}
          </div>
          
          {errors.file && <ErrorMessage message={errors.file} />}
          
          <div className="flex items-center space-x-2 mt-2">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            <p className="text-xs text-gray-500">
              Supported formats: PDF, DOC, DOCX, JPG, PNG (Max: 5MB)
            </p>
          </div>
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
            placeholder="Brief description of the document (e.g., 'Aadhaar Card - Primary ID proof')"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            required
          />
          {errors.description && <ErrorMessage message={errors.description} />}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Uploading...</span>
              <span className="text-gray-900 font-medium">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={uploading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={uploading}
            disabled={!file || !formData.description.trim()}
            className="flex-1"
          >
            Upload Document
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DocumentUpload;