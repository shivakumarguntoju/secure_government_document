// Authentication Service
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import Logger from '../utils/logger';

class AuthService {
  /**
   * Registers a new user
   * @param {Object} userData - User registration data
   * @param {string} password - User password
   * @returns {Promise<Object>} - Registration result
   */
  static async register(userData, password) {
    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        password
      );
      
      const user = userCredential.user;
      
      // Update user profile
      await updateProfile(user, {
        displayName: `${userData.firstName} ${userData.lastName}`
      });
      
      // Send email verification
      await sendEmailVerification(user);
      
      // Save user profile to Firestore
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
        emailVerified: false
      };
      
      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      // Log registration
      await Logger.logAuthAction('REGISTER', `User registered: ${userData.email}`);
      
      return {
        success: true,
        user: userCredential.user,
        message: 'Registration successful! Please verify your email.'
      };
      
    } catch (error) {
      Logger.logError(error, 'Registration failed');
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Logs in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} - Login result
   */
  static async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Log login
      await Logger.logAuthAction('LOGIN', `User logged in: ${email}`);
      
      return {
        success: true,
        user: userCredential.user,
        message: 'Login successful!'
      };
      
    } catch (error) {
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
        await Logger.logUserAction(user.uid, 'LOGOUT', 'User logged out');
      }
      
      await signOut(auth);
      
      return {
        success: true,
        message: 'Logout successful!'
      };
      
    } catch (error) {
      Logger.logError(error, 'Logout failed');
      throw new Error('Logout failed. Please try again.');
    }
  }

  /**
   * Gets user profile from Firestore
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - User profile
   */
  static async getUserProfile(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        return userDoc.data();
      } else {
        throw new Error('User profile not found');
      }
      
    } catch (error) {
      Logger.logError(error, 'Failed to fetch user profile');
      throw error;
    }
  }

  /**
   * Updates user profile
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
      
      await setDoc(doc(db, 'users', userId), updatedData, { merge: true });
      
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
   * Gets user-friendly error message
   * @param {string} errorCode - Firebase error code
   * @returns {string} - User-friendly error message
   */
  static getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password is too weak. Please choose a stronger password.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/invalid-credential': 'Invalid email or password.'
    };
    
    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }
}

export default AuthService;