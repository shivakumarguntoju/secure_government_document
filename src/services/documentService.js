// Document Service
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
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
   * Uploads a document
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
      
      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            if (onProgress) onProgress(Math.round(progress));
          },
          (error) => {
            Logger.logError(error, 'File upload failed');
            reject(new Error('Upload failed. Please try again.'));
          },
          async () => {
            try {
              // Get download URL
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              
              // Save document metadata to Firestore
              const documentData = {
                userId,
                fileName: file.name,
                storagePath: `documents/${userId}/${fileName}`,
                fileType: file.type,
                fileUrl: downloadURL,
                documentType: metadata.documentType,
                description: metadata.description,
                uploadedAt: new Date(),
                updatedAt: new Date(),
                isShared: false,
                sharedWith: [],
                fileSize: file.size,
                status: 'active'
              };
              
              const docRef = await addDoc(collection(db, 'documents'), documentData);
              
              // Log the action
              await Logger.logDocumentAction(
                userId,
                'UPLOAD_DOCUMENT',
                `Uploaded document: ${file.name} (${metadata.documentType})`,
                docRef.id
              );
              
              resolve({
                success: true,
                documentId: docRef.id,
                message: 'Document uploaded successfully!'
              });
              
            } catch (error) {
              Logger.logError(error, 'Failed to save document metadata');
              reject(new Error('Failed to save document information.'));
            }
          }
        );
      });
      
    } catch (error) {
      Logger.logError(error, 'Document upload failed');
      throw new Error('Upload failed. Please try again.');
    }
  }

  /**
   * Gets user documents
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
        q = query(q, where('documentType', '==', filters.documentType));
      }
      
      // Apply limit
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const documents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      }));
      
      await Logger.logUserAction(
        userId,
        'FETCH_DOCUMENTS',
        `Fetched ${documents.length} documents`
      );
      
      return documents;
      
    } catch (error) {
      Logger.logError(error, 'Failed to fetch documents');
      throw new Error('Failed to load documents. Please try again.');
    }
  }

  /**
   * Updates document metadata
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Update result
   */
  static async updateDocument(userId, documentId, updates) {
    try {
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
   * Deletes a document
   * @param {string} userId - User ID
   * @param {string} documentId - Document ID
   * @param {string} storagePath - Storage path
   * @returns {Promise<Object>} - Delete result
   */
  static async deleteDocument(userId, documentId, storagePath) {
    try {
      // Delete from Firestore
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
        `Deleted document`,
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
      // Create share record
      const shareRecord = {
        documentId,
        ownerId: userId,
        sharedWith: shareData.email || shareData.aadhaar,
        shareMethod: shareData.email ? 'email' : 'aadhaar',
        permissions: shareData.permissions,
        sharedAt: new Date(),
        status: 'active'
      };
      
      await addDoc(collection(db, 'sharedDocuments'), shareRecord);
      
      // Update document to mark as shared
      await updateDoc(doc(db, 'documents', documentId), {
        isShared: true,
        updatedAt: new Date()
      });
      
      const shareTarget = shareData.email || shareData.aadhaar;
      await Logger.logDocumentAction(
        userId,
        'SHARE_DOCUMENT',
        `Shared document with ${shareTarget} (${shareData.permissions})`,
        documentId
      );
      
      return {
        success: true,
        message: 'Document shared successfully!'
      };
      
    } catch (error) {
      Logger.logError(error, 'Document sharing failed');
      throw new Error('Failed to share document. Please try again.');
    }
  }

  /**
   * Gets shared documents for a user
   * @param {string} userEmail - User email
   * @param {string} userAadhaar - User Aadhaar
   * @returns {Promise<Array>} - Shared documents
   */
  static async getSharedDocuments(userEmail, userAadhaar) {
    try {
      const emailQuery = query(
        collection(db, 'sharedDocuments'),
        where('sharedWith', '==', userEmail),
        where('status', '==', 'active')
      );
      
      const aadhaarQuery = query(
        collection(db, 'sharedDocuments'),
        where('sharedWith', '==', userAadhaar),
        where('status', '==', 'active')
      );
      
      const [emailSnapshot, aadhaarSnapshot] = await Promise.all([
        getDocs(emailQuery),
        getDocs(aadhaarQuery)
      ]);
      
      const sharedDocs = [
        ...emailSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        ...aadhaarSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      ];
      
      return sharedDocs;
      
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
        storageUsed: documents.reduce((total, doc) => total + doc.fileSize, 0),
        documentsByType: {}
      };
      
      // Group by document type
      documents.forEach(doc => {
        stats.documentsByType[doc.documentType] = 
          (stats.documentsByType[doc.documentType] || 0) + 1;
      });
      
      return stats;
      
    } catch (error) {
      Logger.logError(error, 'Failed to fetch document statistics');
      throw new Error('Failed to load statistics. Please try again.');
    }
  }
}

export default DocumentService;