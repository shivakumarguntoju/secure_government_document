// Authentication Service - Complete Login/Logout Implementation
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Logger from '../utils/logger';

class AuthService {
  /**
   * Logs in a user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Login result
   */
  static async login(email, password) {
    try {
      // Attempt to sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update last login time in database
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          lastLoginAt: new Date(),
          updatedAt: new Date()
        });
      } catch (dbError) {
        // Don't fail login if database update fails
        console.warn('Failed to update last login time:', dbError);
      }
      
      // Log successful login
      await Logger.logAuthAction('LOGIN', `User logged in successfully: ${email}`);
      await Logger.logUserAction(user.uid, 'LOGIN', `Successful login from ${await Logger.getClientIP()}`);
      
      return {
        success: true,
        user: user,
        message: 'Login successful! Welcome back.'
      };
      
    } catch (error) {
      // Log failed login attempt
      await Logger.logAuthAction('LOGIN_FAILED', `Failed login attempt for: ${email} - ${error.code}`);
      Logger.logError(error, 'Login failed');
      
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Logs out the current user
   * @returns {Promise<Object>} - Logout result
   */
  static async logout() {
    try {
      const user = auth.currentUser;
      
      if (user) {
        // Log logout action before signing out
        await Logger.logUserAction(user.uid, 'LOGOUT', `User logged out from ${await Logger.getClientIP()}`);
        await Logger.logAuthAction('LOGOUT', `User logged out: ${user.email}`);
        
        // Update last logout time in database
        try {
          await updateDoc(doc(db, 'users', user.uid), {
            lastLogoutAt: new Date(),
            updatedAt: new Date()
          });
        } catch (dbError) {
          // Don't fail logout if database update fails
          console.warn('Failed to update last logout time:', dbError);
        }
      }
      
      // Sign out from Firebase Auth
      await signOut(auth);
      
      return {
        success: true,
        message: 'Logout successful! See you next time.'
      };
      
    } catch (error) {
      Logger.logError(error, 'Logout failed');
      throw new Error('Logout failed. Please try again.');
    }
  }

  /**
   * Registers a new user
   * @param {Object} userData - User registration data
   * @param {string} password - User password
   * @returns {Promise<Object>} - Registration result
   */
  static async register(userData, password) {
    try {
      // Create user account with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        password
      );
      
      const user = userCredential.user;
      
      // Update user profile display name
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Save complete user profile to Firestore
      const userProfile = {
        uid: user.uid,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        aadhaarNumber: userData.aadhaarNumber,
        address: userData.address,
        dateOfBirth: userData.dateOfBirth,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        emailVerified: false,
        isActive: true
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      // Log successful registration
      await Logger.logAuthAction('REGISTER', `New user registered: ${userData.email}`);
      await Logger.logUserAction(user.uid, 'REGISTER', `Account created successfully`);
      
      return {
        success: true,
        user: user,
        message: 'Registration successful! Please verify your email to complete setup.'
      };
      
    } catch (error) {
      // Log failed registration
      await Logger.logAuthAction('REGISTER_FAILED', `Registration failed for: ${userData.email} - ${error.code}`);
      Logger.logError(error, 'Registration failed');
      
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Gets user profile from Firestore
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile
   */
  static async getUserProfile(userId) {
    try {
      // Check if Firestore is available
      if (!db) {
        throw new Error('Database not configured');
      }
      
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          lastLoginAt: data.lastLoginAt?.toDate ? data.lastLoginAt.toDate() : null,
          lastLogoutAt: data.lastLogoutAt?.toDate ? data.lastLogoutAt.toDate() : null
        };
      } else {
        // If profile doesn't exist, create a basic one from auth user
        const user = auth.currentUser;
        if (user) {
          const basicProfile = {
            uid: userId,
            email: user.email,
            displayName: user.displayName || 'User',
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ')[1] || '',
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true
          };
          
          // Try to create the profile
          try {
            await setDoc(doc(db, 'users', userId), basicProfile);
            return basicProfile;
          } catch (createError) {
            // If we can't create, return basic profile without saving
            return basicProfile;
          }
        }
        throw new Error('User profile not found');
      }
      
    } catch (error) {
      // Handle specific Firestore errors
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        // Return a basic profile when offline
        const user = auth.currentUser;
        if (user) {
          return {
            uid: userId,
            email: user.email,
            displayName: user.displayName || 'User',
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ')[1] || '',
            isOffline: true
          };
        }
      }
      
      Logger.logError(error, 'Failed to fetch user profile from database');
      
      // Return basic profile instead of throwing error
      const user = auth.currentUser;
      if (user) {
        return {
          uid: userId,
          email: user.email,
          displayName: user.displayName || 'User',
          firstName: user.displayName?.split(' ')[0] || 'User',
          lastName: user.displayName?.split(' ')[1] || '',
          isOffline: true,
          error: 'Profile data unavailable'
        };
      }
      
      throw new Error('Authentication failed. Please try logging in again.');
    }
  }

  /**
   * Updates user profile in database
   * @param {string} userId - User ID
   * @param {Object} updates - Profile updates
   * @returns {Promise<Object>} - Update result
   */
  static async updateUserProfile(userId, updates) {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date()
      };
      
      await updateDoc(doc(db, 'users', userId), updatedData);
      
      await Logger.logUserAction(
        userId,
        'PROFILE_UPDATE',
        `Profile updated: ${Object.keys(updates).join(', ')}`
      );
      
      return {
        success: true,
        message: 'Profile updated successfully!'
      };
      
    } catch (error) {
      Logger.logError(error, 'Profile update failed');
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  /**
   * Checks if user is currently authenticated
   * @returns {Promise<Object|null>} - Current user or null
   */
  static getCurrentUser() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  }

  /**
   * Gets user-friendly error message for Firebase auth errors
   * @param {string} errorCode - Firebase error code
   * @returns {string} - User-friendly error message
   */
  static getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address. Please check your email or create a new account.',
      'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
      'auth/email-already-in-use': 'An account with this email already exists. Please use a different email or try logging in.',
      'auth/weak-password': 'Password is too weak. Please choose a stronger password with at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled. Please contact support for assistance.',
      'auth/too-many-requests': 'Too many failed login attempts. Please wait a few minutes before trying again.',
      'auth/network-request-failed': 'Network error. Please check your internet connection and try again.',
      'auth/invalid-credential': 'Invalid email or password. Please check your credentials and try again.',
      'auth/configuration-not-found': 'Authentication service is not properly configured. Please contact support.',
      'auth/project-not-found': 'Firebase project not found. Please contact support.',
      'auth/invalid-api-key': 'Invalid authentication configuration. Please contact support.',
      'auth/operation-not-allowed': 'This sign-in method is not enabled. Please contact support.',
      'auth/requires-recent-login': 'This operation requires recent authentication. Please log out and log back in.'
    };
    
    return errorMessages[errorCode] || 'An unexpected error occurred during authentication. Please try again.';
  }

  /**
   * Validates authentication state
   * @returns {Promise<boolean>} - True if user is authenticated
   */
  static async isAuthenticated() {
    try {
      const user = await this.getCurrentUser();
      return !!user;
    } catch (error) {
      return false;
    }
  }
}

export default AuthService;