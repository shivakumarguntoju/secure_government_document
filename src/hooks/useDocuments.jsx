// Documents Hook with Complete Database Integration
import { useState, useEffect } from 'react';
import DocumentService from '../services/documentService';
import { useAuth } from './useAuth.jsx';
import Logger from '../utils/logger';

export const useDocuments = (filters = {}) => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    sharedDocuments: 0,
    recentUploads: 0,
    storageUsed: 0
  });

  // Fetch documents from database
  const fetchDocuments = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      
      const docs = await DocumentService.getUserDocuments(currentUser.uid, filters);
      setDocuments(docs);
      
      // Also fetch stats
      const statistics = await DocumentService.getDocumentStats(currentUser.uid);
      setStats(statistics);
      
    } catch (error) {
      setError(error.message);
      Logger.logError(error, 'Failed to fetch documents from database');
    } finally {
      setLoading(false);
    }
  };

  // Upload document to database
  const uploadDocument = async (file, metadata, onProgress) => {
    try {
      setError(null);
      
      const result = await DocumentService.uploadDocument(
        currentUser.uid,
        file,
        metadata,
        onProgress
      );
      
      // Refresh documents list from database
      await fetchDocuments();
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Get single document from database
  const getDocument = async (documentId) => {
    try {
      setError(null);
      const document = await DocumentService.getDocument(documentId, currentUser.uid);
      return document;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Download document with database tracking
  const downloadDocument = async (documentId) => {
    try {
      setError(null);
      const result = await DocumentService.downloadDocument(documentId, currentUser.uid);
      
      // Refresh documents to get updated download count
      await fetchDocuments();
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Update document in database
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

  // Delete document from database
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
      
      // Refresh stats
      const statistics = await DocumentService.getDocumentStats(currentUser.uid);
      setStats(statistics);
      
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Share document via database
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

  // Search documents in database
  const searchDocuments = async (searchTerm) => {
    try {
      setError(null);
      setLoading(true);
      
      const results = await DocumentService.searchDocuments(currentUser.uid, searchTerm);
      setDocuments(results);
      
      return results;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get shared documents from database
  const getSharedDocuments = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { userProfile } = useAuth();
      if (!userProfile) throw new Error('User profile not loaded');
      
      const sharedDocs = await DocumentService.getSharedDocuments(
        userProfile.email,
        userProfile.aadhaarNumber
      );
      
      return sharedDocs;
    } catch (error) {
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
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
    stats,
    fetchDocuments,
    uploadDocument,
    getDocument,
    downloadDocument,
    updateDocument,
    deleteDocument,
    shareDocument,
    searchDocuments,
    getSharedDocuments,
    setError
  };
};

export default useDocuments;