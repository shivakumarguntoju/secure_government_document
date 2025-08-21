// Application Constants
export const APP_NAME = 'SecureGov Docs';
export const APP_DESCRIPTION = 'Secure Government Document Sharing Platform';

// Document Types
export const DOCUMENT_TYPES = {
  AADHAAR: 'aadhaar',
  PAN: 'pancard',
  PASSPORT: 'passport',
  MARKSHEET: 'marksheet',
  OTHER: 'other'
};

export const DOCUMENT_TYPE_LABELS = {
  [DOCUMENT_TYPES.AADHAAR]: 'Aadhaar Card',
  [DOCUMENT_TYPES.PAN]: 'PAN Card',
  [DOCUMENT_TYPES.PASSPORT]: 'Passport',
  [DOCUMENT_TYPES.MARKSHEET]: 'Marksheet/Certificate',
  [DOCUMENT_TYPES.OTHER]: 'Other Document'
};

// File Upload Constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Validation Constants
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  AADHAAR_LENGTH: 12,
  PHONE_LENGTH: 10
};

// UI Constants
export const COLORS = {
  PRIMARY: '#1E40AF',
  SECONDARY: '#059669',
  ACCENT: '#EA580C',
  SUCCESS: '#10B981',
  ERROR: '#EF4444',
  WARNING: '#F59E0B'
};

// Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  DOCUMENTS: '/documents'
};