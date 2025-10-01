// Document Upload Component with Complete Database Integration
import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Database } from 'lucide-react';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS } from '../../constants';
import { useAuth } from '../../hooks/useAuth.jsx';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  collection, 
  addDoc 
} from 'firebase/firestore';
import { storage, db } from '../../config/firebase';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import ErrorMessage from '../common/ErrorMessage';
import toast from 'react-hot-toast';

const DocumentUpload = ({ onClose, onUploadComplete }) => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    documentType: DOCUMENT_TYPES.OTHER,
    description: ''
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadComplete, setUploadComplete] = useState(false);

  const documentTypes = Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  // File validation
  const validateFile = (file) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!file) return { isValid: false, errors: ['No file selected'] };
    
    const errors = [];
    
    if (!allowedTypes.includes(file.type)) {
      errors.push('Invalid file type. Please select PDF, DOC, DOCX, or image files.');
    }
    
    if (file.size > maxSize) {
      errors.push('File size too large. Maximum size is 5MB.');
    }
    
    if (file.size === 0) {
      errors.push('File appears to be empty.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

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
    const validation = validateFile(selectedFile);
    
    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setFile(selectedFile);
    setErrors({});
    
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
    } else {
      const fileValidation = validateFile(file);
      if (!fileValidation.isValid) {
        newErrors.file = fileValidation.errors[0];
      }
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Please provide a description for the document';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadToDatabase = async () => {
    if (!validateForm()) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const fileName = `${formData.documentType}_${timestamp}.${extension}`;
      
      // Create storage reference
      const storageRef = ref(storage, `documents/${currentUser.uid}/${fileName}`);
      
      // Add custom metadata to help with CORS
      const metadata = {
        contentType: file.type,
      // Use simple upload instead of resumable to avoid CORS issues
      setUploadProgress(25);
      
      // Upload file using uploadBytes (simpler, less CORS issues)
      const uploadResult = await uploadBytes(storageRef, file, {
        contentType: file.type
      });
      
      setUploadProgress(50);
      
      // Get download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      
      setUploadProgress(75);
      
      // Check if Firestore is available
      if (!db) {
        throw new Error('Database is not available. Please check your connection.');
      }
      
      // Save document metadata to Firestore
      const documentData = {
        userId: currentUser.uid,
        fileName: file.name,
        originalFileName: file.name,
        storagePath: `documents/${currentUser.uid}/${fileName}`,
        storageFileName: fileName,
        fileType: file.type,
        fileUrl: downloadURL,
        documentType: formData.documentType,
        description: formData.description.trim(),
        uploadedAt: new Date(),
        updatedAt: new Date(),
        isShared: false,
        sharedWith: [],
        fileSize: file.size,
        status: 'active',
        downloadCount: 0,
        lastAccessed: new Date()
      };
      
      const docRef = await addDoc(collection(db, 'documents'), documentData);
      
      setUploadProgress(100);
      setUploadComplete(true);
      toast.success('Document uploaded and saved to database successfully!');
      
      return {
        success: true,
        documentId: docRef.id,
        document: { id: docRef.id, ...documentData }
      };
      
    } catch (error) {
      console.error('Upload initialization failed:', error);
      
      let errorMessage = 'Upload failed due to network or configuration issues.';
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = 'Upload failed: You do not have permission to upload files.';
      } else if (error.code === 'storage/canceled') {
        errorMessage = 'Upload was canceled.';
      } else if (error.code === 'storage/unknown' || error.message.includes('CORS')) {
        errorMessage = 'Upload blocked by browser security. This is a known issue with the development environment.';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Database access denied. Please check your permissions.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Service is currently unavailable. Please try again later.';
      }
      
      throw new Error(errorMessage);
    } finally {
      if (!uploadComplete) {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await uploadToDatabase();
      
      // Auto-close after 2 seconds
      setTimeout(() => {
        onUploadComplete();
      }, 2000);
      
    } catch (error) {
      toast.error(error.message || 'Upload failed. Please try again.');
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

  const removeFile = () => {
    setFile(null);
    setErrors({});
    setUploadProgress(0);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Upload Document to Database"
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Database Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900">Secure Database Upload</h3>
              <p className="text-sm text-blue-700">
                Files will be stored in Firebase Cloud Storage with metadata in Firestore
              </p>
            </div>
          </div>
        </div>

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
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
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
            disabled={uploading}
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
            placeholder="Provide a detailed description (minimum 10 characters)"
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
              errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            required
            disabled={uploading}
            minLength={10}
          />
          {errors.description && <ErrorMessage message={errors.description} />}
          <p className="text-xs text-gray-500 mt-1">
            {formData.description.length}/200 characters
          </p>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 flex items-center">
                <Database className="w-4 h-4 mr-2" />
                {uploadProgress < 100 ? 'Uploading to database...' : 'Saving metadata...'}
              </span>
              <span className="text-gray-900 font-medium">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">
                {uploadProgress < 50 && 'Uploading file to Firebase Storage...'}
                {uploadProgress >= 50 && uploadProgress < 90 && 'Processing document...'}
                {uploadProgress >= 90 && uploadProgress < 100 && 'Saving metadata to Firestore...'}
                {uploadProgress === 100 && 'Upload complete!'}
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {uploadComplete && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">
                  Document uploaded and saved to database successfully!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  File stored in Firebase Storage, metadata saved in Firestore
                </p>
              </div>
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
            {uploadComplete ? 'Close' : 'Cancel'}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={uploading}
            disabled={!file || !formData.description.trim() || uploadComplete}
            className="flex-1"
            icon={Database}
          >
            {uploading ? 'Uploading...' : 'Upload to Database'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DocumentUpload;