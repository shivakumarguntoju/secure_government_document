// Logging Utility
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

class Logger {
  /**
   * Logs activity to Firestore
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {string} details - Action details
   * @param {string} documentId - Document ID (optional)
   */
  static async logToFirestore(userId, action, details, documentId = null) {
    try {
      const logData = {
        userId,
        action,
        details,
        timestamp: new Date(),
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent
      };

      if (documentId) {
        logData.documentId = documentId;
      }

      await addDoc(collection(db, 'activityLogs'), logData);
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  /**
   * Gets client IP address
   * @returns {Promise<string>} - Client IP address
   */
  static async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Logs user action
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {string} details - Action details
   */
  static async logUserAction(userId, action, details) {
    console.log(`[USER_ACTION] ${action}: ${details}`);
    await this.logToFirestore(userId, action, details);
  }

  /**
   * Logs document action
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {string} details - Action details
   * @param {string} documentId - Document ID
   */
  static async logDocumentAction(userId, action, details, documentId) {
    console.log(`[DOCUMENT_ACTION] ${action}: ${details} - Document: ${documentId}`);
    await this.logToFirestore(userId, action, details, documentId);
  }

  /**
   * Logs authentication action
   * @param {string} action - Action performed
   * @param {string} details - Action details
   */
  static async logAuthAction(action, details) {
    console.log(`[AUTH_ACTION] ${action}: ${details}`);
    
    // Store in localStorage for non-authenticated actions
    const logs = JSON.parse(localStorage.getItem('authLogs') || '[]');
    logs.push({
      action,
      details,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('authLogs', JSON.stringify(logs));
  }

  /**
   * Logs error
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  static logError(error, context) {
    console.error(`[ERROR] ${context}:`, error);
    
    // Store error in localStorage for debugging
    const errors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    errors.push({
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    });
    localStorage.setItem('errorLogs', JSON.stringify(errors));
  }
}

export default Logger;