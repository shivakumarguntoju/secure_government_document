// Documents Hook with Complete Database Integration
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth.jsx';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  limit
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import Logger from '../utils/logger';

// Cache for documents to avoid repeated database calls
const documentsCache = new Map();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for documents

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
    
    // Check if Firestore is available
    if (!db) {
      console.warn('Firestore not available, cannot fetch documents');
      setDocuments([]);
      setStats({
        totalDocuments: 0,
        sharedDocuments: 0,
        recentUploads: 0,
        storageUsed: 0
      });
      setLoading(false);
      return;
    }

    // Check cache first
    const cacheKey = `${currentUser.uid}_${JSON.stringify(filters)}`;
    const cached = documentsCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      setDocuments(cached.documents);
      setStats(cached.stats);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let q = query(
        collection(db, 'documents'),
        where('userId', '==', currentUser.uid),
        orderBy('uploadedAt', 'desc'),
        limit(50) // Limit initial load for better performance
      );
      
      // Apply document type filter
      if (filters.documentType && filters.documentType !== 'all') {
        // Additional filtering can be added here if needed
      }
      
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        // Filter for active status in memory to avoid index requirement
        .filter(doc => doc.status === 'active');
      
      const formattedDocs = docs.map(doc => ({
        ...doc,
        uploadedAt: doc.uploadedAt?.toDate?.() || new Date(),
        lastAccessed: doc.lastAccessed?.toDate?.() || new Date()
      }));
      
      setDocuments(formattedDocs);
      
      // Calculate stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const statistics = {
        totalDocuments: docs.length,
        sharedDocuments: docs.filter(doc => doc.isShared).length,
        recentUploads: docs.filter(doc => doc.uploadedAt > thirtyDaysAgo).length,
        storageUsed: docs.reduce((total, doc) => total + (doc.fileSize || 0), 0),
        totalDownloads: docs.reduce((total, doc) => total + (doc.downloadCount || 0), 0)
      };
      
      setStats(statistics);
      
      // Cache the results
      documentsCache.set(cacheKey, {
        documents: formattedDocs,
        stats: statistics,
        timestamp: Date.now()
      });
      
      await Logger.logUserAction(
        currentUser.uid,
        'FETCH_DOCUMENTS',
        `Fetched ${docs.length} documents from database`
      );
      
    } catch (error) {
      setError(error.message);
      Logger.logError(error, 'Failed to fetch documents from database');
    } finally {
      setLoading(false);
    }
  };

  // Get single document from database
  const getDocument = async (documentId) => {
    try {
      setError(null);
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found in database');
      }
      
      const data = docSnap.data();
      
      // Security check - ensure user owns the document
      if (data.userId !== currentUser.uid) {
        throw new Error('Access denied. You do not have permission to view this document.');
      }
      
      // Update last accessed time
      await updateDoc(docRef, {
        lastAccessed: new Date()
      });
      
      await Logger.logUserAction(
        currentUser.uid,
        'VIEW_DOCUMENT',
        `Viewed document: ${data.fileName} from database`
      );
      
      return {
        id: docSnap.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        lastAccessed: new Date()
      };
      
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Download document with database tracking
  const downloadDocument = async (documentId) => {
    try {
      setError(null);
      
      // Get document data from database
      const document = await getDocument(documentId);
      
      // Update download count in database
      await updateDoc(doc(db, 'documents', documentId), {
        downloadCount: (document.downloadCount || 0) + 1,
        lastAccessed: new Date()
      });
      
      // Log download action
      await Logger.logUserAction(
        currentUser.uid,
        'DOWNLOAD_DOCUMENT',
        `Downloaded document: ${document.fileName} from database`
      );
      
      // Create download link
      const link = document.createElement('a');
      link.href = document.fileUrl;
      link.download = document.originalFileName || document.fileName;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Refresh documents to get updated download count
      await fetchDocuments();
      
      return {
        success: true,
        message: 'Download started successfully!',
        document: document
      };
      
    } catch (error) {
      setError(error.message);
      throw new Error('Download failed. Please try again.');
    }
  };

  // Update document in database
  const updateDocument = async (documentId, updates) => {
    try {
      setError(null);
      
      // Security check - get document first
      const document = await getDocument(documentId);
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'documents', documentId), updateData);
      
      // Update local state
      setDocuments(prev => 
        prev.map(doc => 
          doc.id === documentId 
            ? { ...doc, ...updates, updatedAt: new Date() }
            : doc
        )
      );
      
      // Clear cache to force refresh
      documentsCache.clear();
      
      await Logger.logUserAction(
        currentUser.uid,
        'UPDATE_DOCUMENT',
        `Updated document: ${Object.keys(updates).join(', ')} in database`
      );
      
      return {
        success: true,
        message: 'Document updated successfully in database!'
      };
      
    } catch (error) {
      setError(error.message);
      throw new Error('Failed to update document in database. Please try again.');
    }
  };

  // Delete document from database
  const deleteDocument = async (documentId, storagePath) => {
    try {
      setError(null);
      
      // Security check - get document first
      const document = await getDocument(documentId);
      
      // Soft delete in Firestore (mark as deleted)
      await updateDoc(doc(db, 'documents', documentId), {
        status: 'deleted',
        deletedAt: new Date(),
        updatedAt: new Date()
      });
      
      // Delete from Storage
      try {
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
      } catch (storageError) {
        // Log but don't fail if storage deletion fails
        Logger.logError(storageError, 'Failed to delete file from storage');
      }
      
      // Remove from local state
      setDocuments(prev => prev.filter(doc => doc.id !== documentId));
      
      // Clear cache to force refresh
      documentsCache.clear();
      
      await Logger.logUserAction(
        currentUser.uid,
        'DELETE_DOCUMENT',
        `Deleted document: ${document.fileName} from database`
      );
      
      return {
        success: true,
        message: 'Document deleted successfully from database!'
      };
      
    } catch (error) {
      setError(error.message);
      throw new Error('Failed to delete document from database. Please try again.');
    }
  };

  // Search documents in database
  const searchDocuments = async (searchTerm) => {
    try {
      setError(null);
      setLoading(true);
      
      // Get all documents first (Firestore doesn't support full-text search)
      const allDocs = await fetchDocuments();
      
      const filteredDocs = documents.filter(doc => 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setDocuments(filteredDocs);
      
      await Logger.logUserAction(
        currentUser.uid,
        'SEARCH_DOCUMENTS',
        `Searched documents in database with term: "${searchTerm}" - ${filteredDocs.length} results`
      );
      
      return filteredDocs;
      
    } catch (error) {
      setError(error.message);
      throw new Error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents when user or filters change
  useEffect(() => {
    if (currentUser) {
      fetchDocuments();
    }
  }, [currentUser, JSON.stringify(filters)]);

  return {
    documents,
    loading,
    error,
    stats,
    fetchDocuments,
    getDocument,
    downloadDocument,
    updateDocument,
    deleteDocument,
    searchDocuments,
    setError
  };
};

export default useDocuments;