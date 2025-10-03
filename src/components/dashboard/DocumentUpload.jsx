import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle } from 'lucide-react';
import { storage, db } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';

const DocumentUpload = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload PDF, DOC, DOCX, TXT, or image files.';
    }
    if (file.size > maxFileSize) {
      return 'File size too large. Maximum size is 10MB.';
    }
    return null;
  };

  const handleFileSelect = useCallback((selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    const validFiles = [];
    const errors = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push({
          file,
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError('');
    }

    setFiles(prev => [...prev, ...validFiles]);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  const uploadToDatabase = async (file, downloadURL) => {
    if (!storage) {
      throw new Error('Firebase Storage is not available. Please check your configuration.');
    }

    try {
      const docData = {
        name: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        downloadURL,
        uploadedBy: user.uid,
        uploadedAt: serverTimestamp(),
        tags: [],
        description: '',
        isPublic: false,
        sharedWith: []
      };

      const docRef = await addDoc(collection(db, 'documents'), docData);
      return docRef.id;
    } catch (error) {
      console.error('Database upload error:', error);
      throw new Error(`Failed to save document metadata: ${error.message}`);
    }
  };

  const uploadFile = async (fileObj) => {
    const { file, id } = fileObj;
    
    try {
      setUploadProgress(prev => ({ ...prev, [id]: 0 }));

      // Create storage reference
      const timestamp = Date.now();
      const fileName = `${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}_${timestamp}`;
      const storageRef = ref(storage, `documents/${user.uid}/${fileName}`);

      // Upload file
      setUploadProgress(prev => ({ ...prev, [id]: 50 }));
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      setUploadProgress(prev => ({ ...prev, [id]: 75 }));
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Save to database
      setUploadProgress(prev => ({ ...prev, [id]: 90 }));
      await uploadToDatabase(file, downloadURL);
      
      setUploadProgress(prev => ({ ...prev, [id]: 100 }));
      
      return { success: true, fileName: file.name };
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({ ...prev, [id]: -1 }));
      
      let errorMessage = 'Upload failed';
      if (error.message.includes('CORS')) {
        errorMessage = 'Upload blocked by CORS policy. Please check Firebase Storage configuration.';
      } else if (error.message.includes('ERR_BLOCKED_BY_CLIENT')) {
        errorMessage = 'Upload blocked by browser. Please check your ad blocker or security settings.';
      } else {
        errorMessage = error.message || 'Unknown upload error';
      }
      
      throw new Error(errorMessage);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setError('Please select at least one file to upload.');
      return;
    }

    if (!user) {
      setError('You must be logged in to upload documents.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const uploadPromises = files.map(uploadFile);
      const results = await Promise.allSettled(uploadPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected');
      
      if (successful > 0) {
        setSuccess(`Successfully uploaded ${successful} file(s).`);
        setFiles([]);
        setUploadProgress({});
      }
      
      if (failed.length > 0) {
        const errorMessages = failed.map(f => f.reason.message).join('\n');
        setError(`Failed to upload ${failed.length} file(s):\n${errorMessages}`);
      }
      
    } catch (error) {
      console.error('Upload process error:', error);
      setError(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getProgressColor = (progress) => {
    if (progress === -1) return 'bg-red-500';
    if (progress === 100) return 'bg-green-500';
    return 'bg-blue-500';
  };

  const getProgressText = (progress) => {
    if (progress === -1) return 'Failed';
    if (progress === 100) return 'Complete';
    return `${progress}%`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <Upload className="mr-3 text-blue-600" />
          Upload Documents
        </h2>

        {error && <ErrorMessage message={error} />}
        
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* File Drop Zone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 mb-2">
              Drag and drop files here, or{' '}
              <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                browse
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                />
              </label>
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG, GIF (Max 10MB each)
            </p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Selected Files</h3>
              <div className="space-y-3">
                {files.map((fileObj) => {
                  const progress = uploadProgress[fileObj.id] || 0;
                  return (
                    <div key={fileObj.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center flex-1">
                        <FileText className="w-8 h-8 text-blue-600 mr-3" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{fileObj.name}</p>
                          <p className="text-sm text-gray-600">{formatFileSize(fileObj.size)}</p>
                          {progress > 0 && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">Upload Progress</span>
                                <span className={`font-medium ${progress === -1 ? 'text-red-600' : progress === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                                  {getProgressText(progress)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
                                  style={{ width: `${Math.max(0, progress)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {!uploading && (
                        <button
                          type="button"
                          onClick={() => removeFile(fileObj.id)}
                          className="ml-4 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors duration-200"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upload Button */}
          {files.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button
                type="submit"
                disabled={uploading}
                className="px-6 py-2"
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} File(s)`}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default DocumentUpload;