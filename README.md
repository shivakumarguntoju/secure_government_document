# SecureGov Docs - Secure Government Document Sharing Platform

A comprehensive digital document management system built for securely storing and sharing government documents among family members. This platform enables citizens to maintain digital copies of important documents like Aadhaar cards, PAN cards, passports, and marksheets with robust security measures and family sharing capabilities.

## 🚀 Features

### Core Functionality
- **User Registration & Authentication**: Secure registration with email verification and Aadhaar integration
- **Document Upload & Management**: Upload, view, edit, and delete important government documents
- **Secure File Sharing**: Share documents with family members using email or Aadhaar number
- **Document Categorization**: Organize documents by type (Aadhaar, PAN, Passport, Marksheet, etc.)
- **Real-time Activity Logging**: Comprehensive logging of all user actions for security
- **Profile Management**: Complete user profile with secure Aadhaar masking

### Security Features
- **Aadhaar Validation**: Real Verhoeff algorithm implementation for Aadhaar number verification
- **File Type Validation**: Strict validation for allowed file types (PDF, DOC, DOCX, Images)
- **Size Restrictions**: 5MB maximum file size for optimal performance
- **Access Control**: Granular permissions for document sharing (view-only or download)
- **Activity Tracking**: Complete audit trail for all document operations

### Technical Architecture
- **Modular Design**: Clean separation of concerns with reusable components
- **Firebase Integration**: Secure authentication, Firestore database, and Cloud Storage
- **Responsive UI**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live synchronization of document status and sharing
- **Error Handling**: Comprehensive error logging and user feedback

## 🛠 Technologies Used

- **Frontend**: React 18, JavaScript (ES6+), Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore, Cloud Storage)
- **UI Components**: Lucide React Icons
- **Notifications**: React Hot Toast
- **Validation**: Custom validation utilities
- **Build Tool**: Vite

## 📋 Prerequisites

Before running this project, ensure you have:

- Node.js (v16 or higher)
- npm or yarn package manager
- Firebase project with the following services enabled:
  - Firebase Authentication
  - Cloud Firestore
  - Cloud Storage

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd secure-govt-document-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com)
2. Enable Authentication, Firestore, and Storage services
3. Copy your Firebase configuration
4. Update `src/config/firebase.js` with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 4. Firestore Security Rules
Set up the following Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can read/write their own documents
    match /documents/{docId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.userId || 
         request.auth.uid in resource.data.sharedWith);
    }
    
    // Activity logs - users can write their own logs
    match /activityLogs/{logId} {
      allow write: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Shared documents
    match /sharedDocuments/{shareId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.ownerId || 
         request.auth.uid == resource.data.sharedWithId);
    }
  }
}
```

### 5. Cloud Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Run the Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📖 User Workflow

### 1. Registration Process
1. **Personal Information**: Enter first name, last name, and email
2. **Password Setup**: Create a secure password with confirmation
3. **Identity Verification**: Provide phone number, Aadhaar number, address, and date of birth
4. **Email Verification**: Verify email address (automatic)

### 2. Document Management
1. **Upload Documents**: Drag and drop or select files (PDF, DOC, DOCX, Images)
2. **Categorize**: Choose document type (Aadhaar, PAN, Passport, etc.)
3. **Add Description**: Provide meaningful descriptions for easy identification
4. **View & Edit**: Preview documents and update details as needed

### 3. Document Sharing
1. **Select Document**: Choose the document to share
2. **Choose Recipient**: Enter family member's email or Aadhaar number
3. **Set Permissions**: Grant view-only or download access
4. **Share**: Send secure access to the recipient

### 4. Profile Management
1. **View Profile**: Access complete profile information with masked Aadhaar
2. **Edit Details**: Update contact information and address
3. **Security Status**: Monitor email verification and security settings

## 🗂 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   └── RegisterForm.jsx
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ErrorMessage.jsx
│   ├── dashboard/
│   │   ├── Dashboard.jsx
│   │   ├── DocumentList.jsx
│   │   ├── DocumentUpload.jsx
│   │   ├── DocumentViewer.jsx
│   │   └── DocumentShare.jsx
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   └── profile/
│       └── Profile.jsx
├── hooks/
│   ├── useAuth.js
│   └── useDocuments.js
├── services/
│   ├── authService.js
│   └── documentService.js
├── utils/
│   ├── validation.js
│   ├── helpers.js
│   └── logger.js
├── constants/
│   └── index.js
├── config/
│   └── firebase.js
├── App.jsx
└── main.jsx
```

## 🧪 Testing

The application includes comprehensive validation and error handling:

### Validation Tests
- **Aadhaar Validation**: Verhoeff algorithm implementation
- **Email Validation**: RFC-compliant email verification
- **Phone Validation**: Indian mobile number format
- **File Validation**: Type and size restrictions

### Security Tests
- **Authentication**: Protected routes and user sessions
- **File Access**: Secure document access controls
- **Data Validation**: Input sanitization and validation

### Manual Testing Scenarios
1. **Registration Flow**: Test complete user registration process
2. **Document Upload**: Verify file validation and upload process
3. **Document Sharing**: Test sharing permissions and access
4. **Profile Updates**: Validate profile modification workflows
5. **Error Handling**: Test various error scenarios

## 📊 Logging & Monitoring

### Activity Logging
All user actions are logged with:
- User ID and action type
- Timestamp and IP address
- Document references (when applicable)
- Detailed action descriptions

### Log Categories
- **Authentication**: Login, logout, registration attempts
- **Document Actions**: Upload, view, download, share, delete
- **Profile Updates**: User profile modifications
- **Security Events**: Access attempts and violations

## 🔒 Security Considerations

### Data Protection
- **Aadhaar Masking**: Display only last 4 digits
- **File Encryption**: Secure storage in Firebase Cloud Storage
- **Access Control**: Role-based document access
- **Input Validation**: Comprehensive client and server-side validation

### Best Practices
- **Password Security**: Minimum 6 characters with complexity requirements
- **File Restrictions**: Limited file types and sizes
- **Session Management**: Secure authentication state management
- **Audit Trail**: Complete activity logging for compliance

## 📝 API Documentation

### Authentication Services
- **Register**: Create new user account with profile
- **Login**: Authenticate user credentials
- **Logout**: Terminate user session

### Document Operations
- **Upload**: Store document with metadata
- **List**: Retrieve user documents with pagination
- **View**: Access document content securely
- **Share**: Grant access to family members
- **Delete**: Remove documents permanently

### Profile Management
- **Get Profile**: Retrieve user information
- **Update Profile**: Modify user details
- **Activity Logs**: Access user activity history

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Firebase Hosting (Recommended)
```bash
npm install -g firebase-tools
firebase init hosting
firebase deploy
```

### Environment Variables
Ensure all Firebase configuration is properly set in production environment.

## 🔧 Development Guidelines

### Code Quality
- **ESLint**: Configured for JavaScript and React
- **Component Structure**: Functional components with hooks
- **Error Boundaries**: Comprehensive error handling
- **Modular Architecture**: Clean separation of concerns

### Performance Optimization
- **Lazy Loading**: Components loaded on demand
- **Image Optimization**: Proper file compression
- **Bundle Splitting**: Optimized build chunks
- **Caching**: Efficient data caching strategies

## 📞 Support & Contributing

### Issue Reporting
Please report issues with detailed steps to reproduce and expected behavior.

### Contributing Guidelines
1. Fork the repository
2. Create feature branch
3. Implement changes with tests
4. Submit pull request with description

### Code Standards
- Follow JavaScript best practices
- Write meaningful commit messages
- Include proper documentation
- Maintain consistent code style

## 📄 License

This project is developed for educational and demonstration purposes. Please ensure compliance with local regulations regarding document management and data privacy.

---

**SecureGov Docs** - Empowering citizens with secure, digital document management for the future of government services.