// Documents Hook
import { useState, useEffect } from 'react';
import DocumentService from '../services/documentService';
import { useAuth } from './useAuth';
import Logger from '../utils/logger';

export const useDocuments = (filters = {}) => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch documents
  const fetchDocuments = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const docs = await DocumentService.getUserDocuments(currentUser.uid, filters);
      setDocuments(docs);
    } catch (error) {
      setError(error.message);
      Logger.logError(error, 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  // Upload document
  const uploadDocument = async (file, metadata, onProgress) => {
    try {
      setError(null);
      const result = await DocumentService.uploadDocument(
        currentUser.uid,
        file,
        metadata,
        onProgress
      );
      
      // Refresh documents list
      await fetchDocuments();
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update document
  const updateDocument = async (documentId, updates) => {
    try {
      setError(null);
      const result = await DocumentService.updateDocument(
        currentUser.uid,
        documentId,
        updates
      );
      
      // Update local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, ...updates, updatedAt: new Date() }
            : doc
        )
      );
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Delete document
  const deleteDocument = async (documentId, storagePath) => {
    try {
      setError(null);
      const result = await DocumentService.deleteDocument(
        currentUser.uid,
        documentId,
        storagePath
      );
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Share document
  const shareDocument = async (documentId, shareData) => {
    try {
      setError(null);
      const result = await DocumentService.shareDocument(
        currentUser.uid,
        documentId,
        shareData
      );
      
      // Update local state
      setDocuments(prev =>
        prev.map(doc =>
          doc.id === documentId
            ? { ...doc, isShared: true, updatedAt: new Date() }
            : doc
        )
      );
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Fetch documents when user or filters change
  useEffect(() => {
    fetchDocuments();
  }, [currentUser, JSON.stringify(filters)]);

  return {
    documents,
    loading,
    error,
    fetchDocuments,
    uploadDocument,
    updateDocument,
    deleteDocument,
    shareDocument,
    setError
  };
};

export default useDocuments;