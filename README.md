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
- **Advanced Search**: Search documents by name, type, or description
- **Statistics Dashboard**: Track document count, storage usage, and sharing metrics

### Security Features
- **Aadhaar Validation**: Real Verhoeff algorithm implementation for Aadhaar number verification
- **File Type Validation**: Strict validation for allowed file types (PDF, DOC, DOCX, Images)
- **Size Restrictions**: 5MB maximum file size for optimal performance
- **Access Control**: Granular permissions for document sharing (view-only or download)
- **Activity Tracking**: Complete audit trail for all document operations
- **Secure Authentication**: Firebase Authentication with email/password
- **Data Encryption**: Secure storage with Firebase Cloud Storage

### Technical Architecture
- **Modular Design**: Clean separation of concerns with reusable components
- **Firebase Integration**: Secure authentication, Firestore database, and Cloud Storage
- **Responsive UI**: Mobile-first design with Tailwind CSS
- **Real-time Updates**: Live synchronization of document status and sharing
- **Error Handling**: Comprehensive error logging and user feedback
- **Lazy Loading**: Optimized performance with code splitting
- **Debounced Search**: Efficient search with database query optimization

## 🛠 Technologies Used

- **Frontend**: React 18.3.1, JavaScript (ES6+), Vite 5.4.2
- **Styling**: Tailwind CSS 3.4.1
- **Backend**: Firebase 12.1.0 (Authentication, Firestore, Cloud Storage)
- **UI Components**: Lucide React Icons 0.344.0
- **Notifications**: React Hot Toast 2.6.0
- **Routing**: React Router DOM 7.8.1
- **Build Tool**: Vite with HMR support
- **Linting**: ESLint 9.9.1 with React hooks plugin

## 📋 Prerequisites

Before running this project, ensure you have:

- Node.js (v16 or higher)
- npm (v7 or higher) or yarn package manager
- Firebase project with the following services enabled:
  - Firebase Authentication
  - Cloud Firestore
  - Cloud Storage
  - (Optional) Firebase Analytics

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

#### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project" and follow the setup wizard
3. Choose a project name (e.g., "securegov-docs")

#### B. Enable Firebase Authentication
1. Navigate to **Authentication** → **Sign-in method** tab
2. Click on **Email/Password** provider
3. **Enable** both "Email/Password" and "Email link (passwordless sign-in)" if desired
4. Click **Save**

**⚠️ CRITICAL**: The `auth/configuration-not-found` error occurs when Email/Password authentication is not enabled. This step is mandatory.

#### C. Enable Firestore Database
1. Navigate to **Firestore Database** → **Create database**
2. Choose **Start in production mode** (recommended) or test mode for development
3. Select your preferred location (choose closest to your users)
4. Click **Enable**

#### D. Enable Cloud Storage
1. Navigate to **Storage** → **Get started**
2. Choose **Start in production mode** (recommended) or test mode for development
3. Select the same location as Firestore
4. Click **Done**

#### E. Get Firebase Configuration
1. Go to **Project Settings** (gear icon) → **General** tab
2. Scroll down to "Your apps" section
3. Click the web icon (</>) to add a web app
4. Register your app with a nickname
5. Copy the Firebase configuration object

#### F. Configure Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your-api-key
   VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your-project-id
   VITE_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
   VITE_FIREBASE_APP_ID=your-app-id
   VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
   ```

### 4. Firestore Security Rules

Navigate to **Firestore Database** → **Rules** and set up the following security rules:

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
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.userId ||
         request.auth.uid in resource.data.sharedWith);
      allow write: if request.auth != null &&
        request.auth.uid == resource.data.userId;
    }

    // Activity logs - users can write their own logs
    match /activityLogs/{logId} {
      allow write: if request.auth != null &&
        request.auth.uid == request.resource.data.userId;
      allow read: if request.auth != null &&
        request.auth.uid == resource.data.userId;
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

Navigate to **Storage** → **Rules** and configure:

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

### 7. Build for Production
```bash
npm run build
```

## 📖 User Workflow

### 1. Registration Process
1. **Personal Information**: Enter first name, last name, and email
2. **Password Setup**: Create a secure password (minimum 6 characters) with confirmation
3. **Identity Verification**: Provide phone number, Aadhaar number (validated with Verhoeff algorithm), address, and date of birth
4. **Email Verification**: Automatic verification through Firebase Authentication

### 2. Document Management
1. **Upload Documents**:
   - Click "Upload to Database" button
   - Drag and drop or select files (PDF, DOC, DOCX, JPG, PNG)
   - Maximum file size: 5MB
2. **Categorize**: Choose document type from dropdown (Aadhaar, PAN, Passport, Marksheet, Other)
3. **Add Description**: Provide meaningful descriptions for easy identification
4. **View & Edit**:
   - Preview documents in-app
   - Update document metadata
   - Download original files
5. **Delete**: Permanently remove documents with confirmation dialog

### 3. Document Sharing
1. **Select Document**: Choose the document to share from your list
2. **Choose Recipient**: Enter family member's email or Aadhaar number
3. **Set Permissions**: Grant view-only or download access
4. **Share**: Send secure access link to the recipient
5. **Track Sharing**: View shared documents in "Shared With Me" tab

### 4. Search & Filter
1. **Search Bar**: Type document name, type, or description
2. **Debounced Search**: Automatic search after 500ms pause
3. **Clear Search**: Reset to view all documents

### 5. Profile Management
1. **View Profile**: Access complete profile information with masked Aadhaar (shows only last 4 digits)
2. **Edit Details**: Update contact information, address, and personal details
3. **Security Status**: Monitor email verification status
4. **Activity History**: View comprehensive activity logs

## 🗂 Project Structure

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx           # User login interface
│   │   └── RegisterForm.jsx        # Multi-step registration
│   ├── common/
│   │   ├── Button.jsx              # Reusable button component
│   │   ├── ConfirmDialog.jsx       # Confirmation dialog
│   │   ├── ErrorMessage.jsx        # Error display component
│   │   ├── Input.jsx               # Styled input field
│   │   ├── LoadingSpinner.jsx      # Loading indicator
│   │   └── Modal.jsx               # Modal wrapper
│   ├── dashboard/
│   │   ├── ActivityLog.jsx         # Activity history view
│   │   ├── Dashboard.jsx           # Main dashboard
│   │   ├── DocumentEdit.jsx        # Document editing
│   │   ├── DocumentList.jsx        # Document grid display
│   │   ├── DocumentShare.jsx       # Sharing interface
│   │   ├── DocumentStats.jsx       # Statistics component
│   │   ├── DocumentUpload.jsx      # Upload modal
│   │   ├── DocumentViewer.jsx      # Document preview
│   │   └── SharedDocuments.jsx     # Shared docs view
│   ├── layout/
│   │   ├── Header.jsx              # Top navigation bar
│   │   └── Sidebar.jsx             # Left sidebar menu
│   ├── profile/
│   │   └── Profile.jsx             # User profile page
│   └── settings/
│       └── Settings.jsx            # App settings
├── hooks/
│   ├── useAuth.jsx                 # Authentication hook
│   └── useDocuments.jsx            # Document management hook
├── services/
│   ├── authService.js              # Auth operations
│   └── documentService.js          # Document CRUD operations
├── utils/
│   ├── helpers.js                  # Utility functions
│   ├── logger.js                   # Activity logging
│   └── validation.js               # Input validation
├── constants/
│   └── index.js                    # App-wide constants
├── config/
│   └── firebase.js                 # Firebase initialization
├── App.jsx                         # Main app component
├── main.jsx                        # Entry point
└── index.css                       # Global styles
```

## 🧪 Testing

### Validation Tests
- **Aadhaar Validation**: Verhoeff algorithm implementation ensures valid Aadhaar numbers
- **Email Validation**: RFC-compliant email verification
- **Phone Validation**: Indian mobile number format (10 digits)
- **File Validation**:
  - Type restrictions (PDF, DOC, DOCX, JPG, PNG)
  - Size limit (5MB maximum)

### Security Tests
- **Authentication**: Protected routes and user sessions
- **File Access**: User-specific document access controls
- **Data Validation**: Input sanitization and validation
- **Firebase Rules**: Server-side security rules enforcement

### Manual Testing Scenarios
1. **Registration Flow**:
   - Test with valid/invalid Aadhaar numbers
   - Verify password strength requirements
   - Check email verification process
2. **Document Upload**:
   - Test file type validation
   - Verify size restrictions
   - Check upload progress and error handling
3. **Document Sharing**:
   - Test sharing with email/Aadhaar
   - Verify access permissions
   - Check shared document visibility
4. **Profile Updates**:
   - Validate profile modification workflows
   - Test Aadhaar masking
5. **Error Handling**:
   - Test network failures
   - Verify timeout handling
   - Check user-friendly error messages

## 📊 Logging & Monitoring

### Activity Logging
All user actions are logged with:
- User ID and action type
- Timestamp (stored as Firebase Timestamp)
- Document references (when applicable)
- Detailed action descriptions
- IP address (where available)

### Log Categories
- **Authentication**:
  - `login` - User logged in
  - `logout` - User logged out
  - `register` - New user registration
- **Document Actions**:
  - `upload` - Document uploaded to storage
  - `view` - Document viewed/previewed
  - `download` - Document downloaded
  - `share` - Document shared with user
  - `delete` - Document removed
  - `edit` - Document metadata updated
- **Profile Updates**:
  - `profile_update` - User profile modifications
- **Security Events**:
  - Failed login attempts
  - Access violations

## 🔒 Security Considerations

### Data Protection
- **Aadhaar Masking**: Display only last 4 digits (e.g., XXXX-XXXX-1234)
- **File Encryption**: Secure storage in Firebase Cloud Storage with server-side encryption
- **Access Control**: Role-based document access with Firebase Security Rules
- **Input Validation**: Comprehensive client and server-side validation
- **Password Security**: Minimum 6 characters enforced by Firebase Auth

### Best Practices
- **Password Security**: Firebase handles password hashing and salting
- **File Restrictions**: Limited file types prevent malicious uploads
- **Session Management**: Secure authentication state with Firebase SDK
- **Audit Trail**: Complete activity logging for compliance
- **HTTPS Only**: All Firebase connections use secure HTTPS
- **Environment Variables**: Sensitive config stored in .env (not committed to git)

### Privacy Compliance
- User data stored per-user in Firestore
- Documents accessible only to owner and shared recipients
- Activity logs private to each user
- No third-party data sharing
- GDPR-compliant data handling

## 📝 API Documentation

### Authentication Services (`src/services/authService.js`)

#### `register(userData)`
Creates new user account with profile
- **Parameters**:
  - `userData.email` - User email
  - `userData.password` - User password
  - `userData.firstName` - First name
  - `userData.lastName` - Last name
  - `userData.phone` - Phone number
  - `userData.aadhaarNumber` - Aadhaar number
  - `userData.address` - User address
  - `userData.dob` - Date of birth
- **Returns**: User object
- **Throws**: Authentication errors

#### `login(email, password)`
Authenticates user credentials
- **Parameters**: Email and password
- **Returns**: User object with authentication token
- **Throws**: Invalid credentials error

#### `logout()`
Terminates user session
- **Returns**: Promise
- **Side effects**: Clears authentication state

### Document Operations (`src/services/documentService.js`)

#### `uploadDocument(file, metadata)`
Stores document with metadata
- **Parameters**:
  - `file` - File object
  - `metadata` - Document metadata (type, description, etc.)
- **Returns**: Document ID
- **Throws**: Upload errors

#### `fetchDocuments(userId, filters)`
Retrieves user documents with optional filtering
- **Parameters**:
  - `userId` - Current user ID
  - `filters` - Optional filter criteria
- **Returns**: Array of documents
- **Pagination**: Built-in support

#### `shareDocument(documentId, recipientInfo, permissions)`
Grants access to family members
- **Parameters**:
  - `documentId` - Document to share
  - `recipientInfo` - Email or Aadhaar number
  - `permissions` - Access level (view/download)
- **Returns**: Share record ID

#### `deleteDocument(documentId)`
Removes document permanently
- **Parameters**: Document ID
- **Returns**: Promise
- **Side effects**: Deletes from Firestore and Storage

### Profile Management

#### `getProfile(userId)`
Retrieves user information
- **Parameters**: User ID
- **Returns**: User profile object with masked Aadhaar

#### `updateProfile(userId, updates)`
Modifies user details
- **Parameters**:
  - `userId` - Current user ID
  - `updates` - Fields to update
- **Returns**: Updated profile

#### `getActivityLogs(userId, limit)`
Access user activity history
- **Parameters**:
  - `userId` - Current user ID
  - `limit` - Number of logs to fetch
- **Returns**: Array of activity logs

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

This creates an optimized build in the `dist/` directory.

### Firebase Hosting (Recommended)

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Initialize Hosting**:
   ```bash
   firebase init hosting
   ```
   - Select your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: Yes
   - Set up automatic builds: Optional

4. **Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Other Hosting Options

#### Vercel
```bash
npm install -g vercel
vercel
```

#### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Environment Variables
- Ensure all Firebase configuration is set in production
- Use your hosting platform's environment variable management
- Never commit `.env` file to git

## 🔧 Development Guidelines

### Code Quality
- **ESLint**: Configured for JavaScript and React best practices
- **Component Structure**: Functional components with React hooks
- **Error Boundaries**: Comprehensive error handling with try-catch blocks
- **Modular Architecture**: Clean separation of concerns
- **Prop Types**: Type checking for component props
- **Code Comments**: Meaningful inline documentation

### Performance Optimization
- **Lazy Loading**: Components loaded on demand with React.lazy()
- **Image Optimization**: Proper file compression (5MB limit)
- **Bundle Splitting**: Optimized build chunks via Vite
- **Caching**: Efficient data caching with Firestore
- **Debouncing**: Search debounced to reduce database queries
- **Code Splitting**: Route-based splitting for faster initial load

### Best Practices
- Follow the Single Responsibility Principle
- Keep components small and focused
- Use custom hooks for reusable logic
- Implement proper error handling
- Write semantic HTML
- Ensure accessibility (ARIA labels, keyboard navigation)
- Mobile-first responsive design

## 🐛 Troubleshooting

### Common Issues

#### Authentication Error: `auth/configuration-not-found`
**Solution**: Enable Email/Password authentication in Firebase Console
1. Go to Authentication → Sign-in method
2. Enable Email/Password provider
3. Save changes

#### Documents Not Loading
**Solution**: Check Firestore security rules
- Ensure rules allow authenticated users to read their documents
- Verify user is properly authenticated

#### Upload Failing
**Solution**: Check Storage configuration
1. Verify Storage is enabled in Firebase Console
2. Check Storage security rules
3. Ensure file size is under 5MB
4. Verify file type is allowed

#### Environment Variables Not Working
**Solution**:
1. Ensure `.env` file exists in project root
2. Variables must start with `VITE_`
3. Restart dev server after changing `.env`

### Debug Mode
Set `NODE_ENV=development` to enable detailed logging in the console.

## 📞 Support & Contributing

### Issue Reporting
Please report issues with:
- Detailed steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Browser and OS information
- Console error messages

### Contributing Guidelines
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- Follow existing code style and conventions
- Write meaningful commit messages
- Include comments for complex logic
- Update documentation for new features
- Test changes thoroughly before submitting

## 📄 License

This project is developed for educational and demonstration purposes.

### Important Notes
- Ensure compliance with local regulations regarding document management and data privacy
- This application handles sensitive personal information (Aadhaar, PAN, etc.)
- Implement additional security measures for production use
- Review and comply with GDPR, CCPA, or relevant data protection laws
- Obtain proper legal review before commercial deployment

## 🙏 Acknowledgments

- **React Team** - For the excellent React framework
- **Firebase Team** - For comprehensive backend services
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide Icons** - For beautiful, consistent icons
- **Vite Team** - For lightning-fast build tooling

## 📧 Contact

For questions, suggestions, or issues, please open an issue on the repository.

---

**SecureGov Docs** - Empowering citizens with secure, digital document management for the future of government services.

**Version**: 1.0.0
**Last Updated**: October 2025
**Maintained by**: SecureGov Development Team
