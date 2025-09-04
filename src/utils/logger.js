// Enhanced Logging Utility with Authentication Tracking
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

class Logger {
  /**
   * Logs activity to Firestore database
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
        userAgent: navigator.userAgent,
        sessionId: this.getSessionId()
      };

      if (documentId) {
        logData.documentId = documentId;
      }

      await addDoc(collection(db, 'activityLogs'), logData);
    } catch (error) {
      console.error('Failed to log activity to Firestore:', error);
      // Fallback to localStorage if Firestore fails
      this.logToLocalStorage(userId, action, details, documentId);
    }
  }

  /**
   * Fallback logging to localStorage
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {string} details - Action details
   * @param {string} documentId - Document ID (optional)
   */
  static logToLocalStorage(userId, action, details, documentId = null) {
    try {
      const logs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      const logEntry = {
        userId,
        action,
        details,
        timestamp: new Date().toISOString(),
        documentId,
        sessionId: this.getSessionId()
      };
      
      logs.push(logEntry);
      
      // Keep only last 100 logs in localStorage
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('activityLogs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to log to localStorage:', error);
    }
  }

  /**
   * Gets client IP address
   * @returns {Promise<string>} - Client IP address
   */
  static async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json', {
        timeout: 5000
      });
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Gets or creates session ID
   * @returns {string} - Session ID
   */
  static getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  /**
   * Logs user action with enhanced context
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {string} details - Action details
   */
  static async logUserAction(userId, action, details) {
    const logMessage = `[USER_ACTION] ${action}: ${details}`;
    console.log(logMessage);
    
    // Enhanced logging for authentication actions
    if (['LOGIN', 'LOGOUT', 'REGISTER'].includes(action)) {
      console.log(`[AUTH_TRACKING] User ${userId} performed ${action} at ${new Date().toISOString()}`);
    }
    
    await this.logToFirestore(userId, action, details);
  }

  /**
   * Logs document action with enhanced tracking
   * @param {string} userId - User ID
   * @param {string} action - Action performed
   * @param {string} details - Action details
   * @param {string} documentId - Document ID
   */
  static async logDocumentAction(userId, action, details, documentId) {
    const logMessage = `[DOCUMENT_ACTION] ${action}: ${details} - Document: ${documentId}`;
    console.log(logMessage);
    
    await this.logToFirestore(userId, action, details, documentId);
  }

  /**
   * Logs authentication action (login/logout/register)
   * @param {string} action - Action performed
   * @param {string} details - Action details
   */
  static async logAuthAction(action, details) {
    const logMessage = `[AUTH_ACTION] ${action}: ${details}`;
    console.log(logMessage);
    
    // Store authentication logs separately for security analysis
    const authLogs = JSON.parse(localStorage.getItem('authLogs') || '[]');
    authLogs.push({
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      sessionId: this.getSessionId()
    });
    
    // Keep only last 50 auth logs
    if (authLogs.length > 50) {
      authLogs.splice(0, authLogs.length - 50);
    }
    
    localStorage.setItem('authLogs', JSON.stringify(authLogs));
  }

  /**
   * Logs error with enhanced context
   * @param {Error} error - Error object
   * @param {string} context - Error context
   */
  static logError(error, context) {
    const errorMessage = `[ERROR] ${context}: ${error.message}`;
    console.error(errorMessage, error);
    
    // Store detailed error information
    const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
    errorLogs.push({
      error: error.message,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId()
    });
    
    // Keep only last 50 error logs
    if (errorLogs.length > 50) {
      errorLogs.splice(0, errorLogs.length - 50);
    }
    
    localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
  }

  /**
   * Logs security event
   * @param {string} userId - User ID
   * @param {string} event - Security event type
   * @param {string} details - Event details
   */
  static async logSecurityEvent(userId, event, details) {
    const logMessage = `[SECURITY] ${event}: ${details}`;
    console.log(logMessage);
    
    await this.logToFirestore(userId, `SECURITY_${event}`, details);
    
    // Also store in separate security log
    const securityLogs = JSON.parse(localStorage.getItem('securityLogs') || '[]');
    securityLogs.push({
      userId,
      event,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: await this.getClientIP(),
      sessionId: this.getSessionId()
    });
    
    localStorage.setItem('securityLogs', JSON.stringify(securityLogs));
  }

  /**
   * Gets all logs for debugging
   * @returns {Object} - All log types
   */
  static getAllLogs() {
    return {
      activities: JSON.parse(localStorage.getItem('activityLogs') || '[]'),
      auth: JSON.parse(localStorage.getItem('authLogs') || '[]'),
      errors: JSON.parse(localStorage.getItem('errorLogs') || '[]'),
      security: JSON.parse(localStorage.getItem('securityLogs') || '[]')
    };
  }

  /**
   * Clears all local logs (for privacy)
   */
  static clearAllLogs() {
    localStorage.removeItem('activityLogs');
    localStorage.removeItem('authLogs');
    localStorage.removeItem('errorLogs');
    localStorage.removeItem('securityLogs');
    console.log('[LOGGER] All local logs cleared');
  }
}

export default Logger;