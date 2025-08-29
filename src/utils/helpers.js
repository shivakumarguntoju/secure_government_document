// Helper Utilities
import { DOCUMENT_TYPE_LABELS } from '../constants';

/**
 * Formats date for display
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date string
 */
export const formatDate = (date) => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Formats date and time for display
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date and time string
 */
export const formatDateTime = (date) => {
  const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
  return dateObj.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Masks Aadhaar number for security
 * @param {string} aadhaar - Aadhaar number to mask
 * @returns {string} - Masked Aadhaar number
 */
export const maskAadhaar = (aadhaar) => {
  if (aadhaar.length === 12) {
    return `XXXX XXXX ${aadhaar.slice(-4)}`;
  }
  return aadhaar;
};

/**
 * Gets document type label
 * @param {string} type - Document type
 * @returns {string} - Document type label
 */
export const getDocumentTypeLabel = (type) => {
  return DOCUMENT_TYPE_LABELS[type] || 'Unknown';
};

/**
 * Generates unique filename
 * @param {string} originalName - Original filename
 * @param {string} documentType - Document type
 * @returns {string} - Unique filename
 */
export const generateUniqueFilename = (originalName, documentType) => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  return `${documentType}_${timestamp}.${extension}`;
};

/**
 * Truncates text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalizes first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} - Capitalized string
 */
export const capitalizeWords = (str) => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Debounces function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Generates random OTP
 * @param {number} length - OTP length
 * @returns {string} - Generated OTP
 */
export const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

/**
 * Formats file size into KB/MB/GB
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size string
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
