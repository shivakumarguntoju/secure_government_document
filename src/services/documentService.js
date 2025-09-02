// Document Service - Complete CRUD Operations
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  limit
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '../config/firebase';
import Logger from '../utils/logger';
import { generateUniqueFilename } from '../utils/helpers';

class DocumentService {
  /**
   * Uploads a document to Firebase Storage and saves metadata to Firestore
   * @param {string} userId - User ID
   * @param {File} file - File to upload
   * @param {Object} metadata - Document metadata
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} - Upload result
   */
  static async uploadDocument(userId, file, metadata, onProgress) {
    try {
      // Generate unique filename
      const fileName = generateUniqueFilename(file.name, metadata.documentType);
      
      // Create storage reference
      const storageRef = ref(storage, `documents/${userId}/${fileName}`);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          },
          (error) => {
            Logger.logError(error, 'File upload to storage failed');
            reject(new Error('Upload failed. Please check your connection and try again.'));
          },
          async () => {
            try {
              // Get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Save document metadata to Firestore
              const documentData = {
                userId,
                fileName: file.name,
                originalFileName: file.name,
                storagePath: `documents/${userId}/${fileName}`,
                storageFileName: fileName,
                fileType: file.type,
                fileUrl: downloadURL,
                documentType: metadata.documentType,
                description: metadata.description,
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
              
              // Log the upload action
              await Logger.logDocumentAction(
                userId,
                'UPLOAD_DOCUMENT',
                `Uploaded document: ${file.name} (${metadata.documentType})`,
                docRef.id
              );
              
              resolve({
                success: true,
                documentId: docRef.id,
                document: { id: docRef.id, ...documentData },
                message: 'Document uploaded successfully!'
              });
              
            } catch (error) {
              Logger.logError(error, 'Failed to save document metadata to Firestore');
              reject(new Error('Failed to save document information. Please try again.'));
            }
          }
        );
      });
      
    } catch (error) {
      Logger.logError(error, 'Document upload initialization failed');
      throw new Error('Upload failed. Please try again.');
    }
  }

  /**
   * Gets all documents for a user from Firestore
   * @param {string} userId - User ID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - User documents
   */
  static async getUserDocuments(userId, filters = {}) {
    try {
      let q = query(
        collection(db, 'documents'),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('uploadedAt', 'desc')
      );
      
      // Apply document type filter
      if (filters.documentType && filters.documentType !== 'all') {
        q = query(
          collection(db, 'documents'),
          where('userId', '==', userId),
          where('status', '==', 'active'),
          where('documentType', '==', filters.documentType),
          orderBy('uploadedAt', 'desc')
        );
      }
      
      // Apply limit
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          lastAccessed: data.lastAccessed?.toDate ? data.lastAccessed.toDate() : new Date(data.lastAccessed)
        };
      });
      
      await Logger.logUserAction(
        userId,
        'FETCH_DOCUMENTS',
        `Fetched ${documents.length} documents with filters: ${JSON.stringify(filters)}`
      );
      
      return documents;
      
    } catch (error) {
      Logger.logError(error, 'Failed to fetch documents from Firestore');
      throw new Error('Failed to load documents. Please refresh and try again.');
    }
  }

  /**
   * Gets a single document by ID
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID (for security)
   * @returns {Promise<Object>} - Document data
   */
  static async getDocument(documentId, userId) {
    try {
      const docRef = doc(db, 'documents', documentId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Document not found');
      }
      
      const data = docSnap.data();
      
      // Security check - ensure user owns the document or has access
      if (data.userId !== userId && !data.sharedWith.includes(userId)) {
        throw new Error('Access denied. You do not have permission to view this document.');
      }
      
      // Update last accessed time
      await updateDoc(docRef, {
        lastAccessed: new Date()
      });
      
      await Logger.logDocumentAction(
        userId,
        'VIEW_DOCUMENT',
        `Viewed document: ${data.fileName}`,
        documentId
      );
      
      return {
        id: docSnap.id,
        ...data,
        uploadedAt: data.uploadedAt?.toDate ? data.uploadedAt.toDate() : new Date(data.uploadedAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        lastAccessed: new Date()
      };
      
    } catch (error) {
      Logger.logError(error, 'Failed to fetch document');
      throw error;
    }
  }

  /**
   * Downloads a document and tracks download count
   * @param {string} documentId - Document ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Download result
   */
  static async downloadDocument(documentId, userId) {
    try {
      // Get document data
      const document = await this.getDocument(documentId, userId);
      
      // Update download count
      await updateDoc(doc(db, 'documents', documentId), {
        downloadCount: (document.downloadCount || 0) + 1,
        lastAccessed: new Date()
      });
      
      // Log download action
      await Logger.logDocumentAction(
        userId,
        'DOWNLOAD_DOCUMENT',
        `Downloaded document: ${document.fileName}`,
        documentId
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
      
      return {
        success: true,
        message: 'Download started successfully!',
        document: document
      };
      
    } catch (error) {
      Logger.logError(error, 'Document download failed');
      throw new Error('Download failed. Please try again.');
    }
  }

  /**
   * Updates document metadata in Firestore
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Update result
   */
  static async updateDocument(userId, documentId, updates) {
    try {
      // Security check - get document first
      const document = await this.getDocument(documentId, userId);
      
      const updateData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'documents', documentId), updateData);
      
      await Logger.logDocumentAction(
        userId,
        'UPDATE_DOCUMENT',
        `Updated document: ${Object.keys(updates).join(', ')}`,
        documentId
      );
      
      return {
        success: true,
        message: 'Document updated successfully!'
      };
      
    } catch (error) {
      Logger.logError(error, 'Document update failed');
      throw new Error('Failed to update document. Please try again.');
    }
  }

  /**
   * Deletes a document from both Firestore and Storage
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @param {string} storagePath - Storage path
   * @returns {Promise<Object>} - Delete result
   */
  static async deleteDocument(userId, documentId, storagePath) {
    try {
      // Security check - get document first
      const document = await this.getDocument(documentId, userId);
      
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
      
      await Logger.logDocumentAction(
        userId,
        'DELETE_DOCUMENT',
        `Deleted document: ${document.fileName}`,
        documentId
      );
      
      return {
        success: true,
        message: 'Document deleted successfully!'
      };
      
    } catch (error) {
      Logger.logError(error, 'Document deletion failed');
      throw new Error('Failed to delete document. Please try again.');
    }
  }

  /**
   * Shares a document with another user
   * @param {string} userId - Owner user ID
   * @param {string} documentId - Document ID
   * @param {Object} shareData - Share data
   * @returns {Promise<Object>} - Share result
   */
  static async shareDocument(userId, documentId, shareData) {
    try {
      // Security check - get document first
      const document = await this.getDocument(documentId, userId);
      
      // Create share record in Firestore
      const shareRecord = {
        documentId,
        ownerId: userId,
        ownerEmail: shareData.ownerEmail,
        sharedWith: shareData.email || shareData.aadhaar,
        shareMethod: shareData.email ? 'email' : 'aadhaar',
        permissions: shareData.permissions,
        sharedAt: new Date(),
        status: 'active',
        documentName: document.fileName,
        documentType: document.documentType
      };
      
      const shareRef = await addDoc(collection(db, 'sharedDocuments'), shareRecord);
      
      // Update document to mark as shared
      await updateDoc(doc(db, 'documents', documentId), {
        isShared: true,
        sharedWith: [...(document.sharedWith || []), shareData.email || shareData.aadhaar],
        updatedAt: new Date()
      });
      
      const shareTarget = shareData.email || shareData.aadhaar;
      await Logger.logDocumentAction(
        userId,
        'SHARE_DOCUMENT',
        `Shared document with ${shareTarget} (${shareData.permissions} permission)`,
        documentId
      );
      
      return {
        success: true,
        shareId: shareRef.id,
        message: 'Document shared successfully!'
      };
      
    } catch (error) {
      Logger.logError(error, 'Document sharing failed');
      throw new Error('Failed to share document. Please try again.');
    }
  }

  /**
   * Gets documents shared with a user
   * @param {string} userEmail - User email
   * @param {string} userAadhaar - User Aadhaar
   * @returns {Promise<Array>} - Shared documents
   */
  static async getSharedDocuments(userEmail, userAadhaar) {
    try {
      const emailQuery = query(
        collection(db, 'sharedDocuments'),
        where('sharedWith', '==', userEmail),
        where('status', '==', 'active'),
        orderBy('sharedAt', 'desc')
      );
      
      const aadhaarQuery = query(
        collection(db, 'sharedDocuments'),
        where('sharedWith', '==', userAadhaar),
        where('status', '==', 'active'),
        orderBy('sharedAt', 'desc')
      );
      
      const [emailSnapshot, aadhaarSnapshot] = await Promise.all([
        getDocs(emailQuery),
        getDocs(aadhaarQuery)
      ]);
      
      const sharedDocs = [];
      
      // Process email shares
      for (const docSnap of emailSnapshot.docs) {
        const shareData = docSnap.data();
        try {
          const originalDoc = await getDoc(doc(db, 'documents', shareData.documentId));
          if (originalDoc.exists()) {
            const originalData = originalDoc.data();
            sharedDocs.push({
              id: docSnap.id,
              shareId: docSnap.id,
              documentId: shareData.documentId,
              ...originalData,
              ...shareData,
              sharedAt: shareData.sharedAt?.toDate ? shareData.sharedAt.toDate() : new Date(shareData.sharedAt),
              uploadedAt: originalData.uploadedAt?.toDate ? originalData.uploadedAt.toDate() : new Date(originalData.uploadedAt)
            });
          }
        } catch (error) {
          console.warn('Failed to fetch shared document details:', error);
        }
      }
      
      // Process Aadhaar shares
      for (const docSnap of aadhaarSnapshot.docs) {
        const shareData = docSnap.data();
        try {
          const originalDoc = await getDoc(doc(db, 'documents', shareData.documentId));
          if (originalDoc.exists()) {
            const originalData = originalDoc.data();
            sharedDocs.push({
              id: docSnap.id,
              shareId: docSnap.id,
              documentId: shareData.documentId,
              ...originalData,
              ...shareData,
              sharedAt: shareData.sharedAt?.toDate ? shareData.sharedAt.toDate() : new Date(shareData.sharedAt),
              uploadedAt: originalData.uploadedAt?.toDate ? originalData.uploadedAt.toDate() : new Date(originalData.uploadedAt)
            });
          }
        } catch (error) {
          console.warn('Failed to fetch shared document details:', error);
        }
      }
      
      // Remove duplicates and sort by share date
      const uniqueDocs = sharedDocs.filter((doc, index, self) => 
        index === self.findIndex(d => d.documentId === doc.documentId)
      ).sort((a, b) => b.sharedAt - a.sharedAt);
      
      return uniqueDocs;
      
    } catch (error) {
      Logger.logError(error, 'Failed to fetch shared documents');
      throw new Error('Failed to load shared documents. Please try again.');
    }
  }

  /**
   * Gets document statistics for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Document statistics
   */
  static async getDocumentStats(userId) {
    try {
      const documents = await this.getUserDocuments(userId);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const stats = {
        totalDocuments: documents.length,
        sharedDocuments: documents.filter(doc => doc.isShared).length,
        recentUploads: documents.filter(doc => doc.uploadedAt > thirtyDaysAgo).length,
        storageUsed: documents.reduce((total, doc) => total + (doc.fileSize || 0), 0),
        totalDownloads: documents.reduce((total, doc) => total + (doc.downloadCount || 0), 0),
        documentsByType: {},
        averageFileSize: 0
      };
      
      // Group by document type
      documents.forEach(doc => {
        stats.documentsByType[doc.documentType] = 
          (stats.documentsByType[doc.documentType] || 0) + 1;
      });
      
      // Calculate average file size
      if (documents.length > 0) {
        stats.averageFileSize = stats.storageUsed / documents.length;
      }
      
      return stats;
      
    } catch (error) {
      Logger.logError(error, 'Failed to fetch document statistics');
      throw new Error('Failed to load statistics. Please try again.');
    }
  }

  /**
   * Searches documents by filename or description
   * @param {string} userId - User ID
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} - Search results
   */
  static async searchDocuments(userId, searchTerm) {
    try {
      const documents = await this.getUserDocuments(userId);
      
      const filteredDocs = documents.filter(doc => 
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      await Logger.logUserAction(
        userId,
        'SEARCH_DOCUMENTS',
        `Searched documents with term: "${searchTerm}" - ${filteredDocs.length} results`
      );
      
      return filteredDocs;
      
    } catch (error) {
      Logger.logError(error, 'Document search failed');
      throw new Error('Search failed. Please try again.');
    }
  }

  /**
   * Gets recent document activity
   * @param {string} userId - User ID
   * @param {number} limitCount - Number of recent activities
   * @returns {Promise<Array>} - Recent activities
   */
  static async getRecentActivity(userId, limitCount = 10) {
    try {
      const q = query(
        collection(db, 'activityLogs'),
        where('userId', '==', userId),
        where('action', 'in', ['UPLOAD_DOCUMENT', 'DOWNLOAD_DOCUMENT', 'SHARE_DOCUMENT', 'DELETE_DOCUMENT']),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const activities = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : new Date(doc.data().timestamp)
      }));
      
      return activities;
      
    } catch (error) {
      Logger.logError(error, 'Failed to fetch recent activity');
      return [];
    }
  }

  /**
   * Validates file before upload
   * @param {File} file - File to validate
   * @returns {Object} - Validation result
   */
  static validateFile(file) {
    const { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } = require('../constants');
    
    const errors = [];
    
    if (!file) {
      errors.push('No file selected');
      return { isValid: false, errors };
    }
    
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push('Invalid file type. Please select PDF, DOC, DOCX, or image files.');
    }
    
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size too large. Maximum size is ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB.`);
    }
    
    if (file.size === 0) {
      errors.push('File appears to be empty.');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets storage usage for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Storage usage data
   */
  static async getStorageUsage(userId) {
    try {
      const documents = await this.getUserDocuments(userId);
      
      const usage = {
        totalFiles: documents.length,
        totalSize: documents.reduce((total, doc) => total + (doc.fileSize || 0), 0),
        byType: {},
        largestFile: null,
        oldestFile: null,
        newestFile: null
      };
      
      // Group by file type
      documents.forEach(doc => {
        const type = doc.documentType;
        if (!usage.byType[type]) {
          usage.byType[type] = { count: 0, size: 0 };
        }
        usage.byType[type].count++;
        usage.byType[type].size += doc.fileSize || 0;
      });
      
      // Find largest file
      if (documents.length > 0) {
        usage.largestFile = documents.reduce((largest, doc) => 
          (doc.fileSize || 0) > (largest.fileSize || 0) ? doc : largest
        );
        
        usage.oldestFile = documents.reduce((oldest, doc) => 
          doc.uploadedAt < oldest.uploadedAt ? doc : oldest
        );
        
        usage.newestFile = documents.reduce((newest, doc) => 
          doc.uploadedAt > newest.uploadedAt ? doc : newest
        );
      }
      
      return usage;
      
    } catch (error) {
      Logger.logError(error, 'Failed to calculate storage usage');
      throw new Error('Failed to calculate storage usage.');
    }
  }
}

export default DocumentService;