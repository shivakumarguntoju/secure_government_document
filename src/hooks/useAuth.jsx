// Authentication Hook - Complete Login/Logout Management
import { useState, useEffect, createContext, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import AuthService from '../services/authService';
import Logger from '../utils/logger';

// Cache for user profiles to avoid repeated database calls
const profileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Login function with complete error handling
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await AuthService.login(email, password);
      
      // Authentication successful - user state will be updated by onAuthStateChanged
      return result;
      
    } catch (error) {
      setError(error.message);
      Logger.logError(error, 'Login attempt failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const result = await AuthService.register(userData, password);
      
      // Registration successful - user state will be updated by onAuthStateChanged
      return result;
      
    } catch (error) {
      setError(error.message);
      Logger.logError(error, 'Registration attempt failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function with complete cleanup
  const logout = async () => {
    try {
      setError(null);
      
      const result = await AuthService.logout();
      
      // Clear local state immediately
      setCurrentUser(null);
      setUserProfile(null);
      setIsAuthenticated(false);
      
      // Clear any cached data
      localStorage.removeItem('userPreferences');
      sessionStorage.clear();
      
      return result;
      
    } catch (error) {
      setError(error.message);
      Logger.logError(error, 'Logout attempt failed');
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    try {
      setError(null);
      
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      const result = await AuthService.updateUserProfile(currentUser.uid, updates);
      
      // Update local profile state
      setUserProfile(prev => ({ 
        ...prev, 
        ...updates,
        updatedAt: new Date()
      }));
      
      return result;
      
    } catch (error) {
      setError(error.message);
      Logger.logError(error, 'Profile update failed');
      throw error;
    }
  };

  // Check authentication status
  const checkAuthStatus = async () => {
    try {
      const isAuth = await AuthService.isAuthenticated();
      setIsAuthenticated(isAuth);
      return isAuth;
    } catch (error) {
      setIsAuthenticated(false);
      return false;
    }
  };

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        setIsAuthenticated(!!user);
        
        if (user) {
          // Check cache first to avoid unnecessary database calls
          const cacheKey = user.uid;
          const cached = profileCache.get(cacheKey);
          
          if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
            setUserProfile(cached.profile);
            setLoading(false);
            return;
          }
          
          // User is logged in - fetch their profile from database
          try {
            const profile = await AuthService.getUserProfile(user.uid);
            
            // Cache the profile
            profileCache.set(cacheKey, {
              profile,
              timestamp: Date.now()
            });
            
            setUserProfile(profile);
            
            // Show warning if profile is offline
            if (profile.isOffline) {
              setError('Limited functionality: Database connection unavailable. Some features may not work properly.');
            }
            
            // Log successful authentication state change
            try {
              await Logger.logUserAction(
                user.uid, 
                'AUTH_STATE_CHANGE', 
                'User authentication state updated - logged in'
              );
            } catch (logError) {
              // Don't fail auth if logging fails
              console.warn('Failed to log auth state change:', logError);
            }
            
          } catch (profileError) {
            // Create basic profile from auth user if database fails
            const basicProfile = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'User',
              firstName: user.displayName?.split(' ')[0] || 'User',
              lastName: user.displayName?.split(' ')[1] || '',
              isOffline: true
            };
            
            setUserProfile(basicProfile);
            
            // Cache basic profile too
            profileCache.set(cacheKey, {
              profile: basicProfile,
              timestamp: Date.now()
            });
            setError('Database unavailable. Limited functionality enabled.');
            
            Logger.logError(profileError, 'Failed to fetch user profile during auth state change');
          }
        } else {
          // User is logged out - clear profile
          setUserProfile(null);
          
          // Clear cache on logout
          profileCache.clear();
          
          // Log authentication state change
          try {
            await Logger.logAuthAction('AUTH_STATE_CHANGE', 'User authentication state updated - logged out');
          } catch (logError) {
            // Don't fail auth if logging fails
            console.warn('Failed to log auth state change:', logError);
          }
        }
        
      } catch (error) {
        // Don't completely fail auth on errors
        console.error('Auth state change handler failed:', error);
        
        // If we have a user but failed to get profile, create basic profile
        if (user) {
          const basicProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'User',
            firstName: user.displayName?.split(' ')[0] || 'User',
            lastName: user.displayName?.split(' ')[1] || '',
            isOffline: true
          };
          
          setCurrentUser(user);
          setUserProfile(basicProfile);
          setIsAuthenticated(true);
          setError('Limited functionality: Database connection issues detected.');
        } else {
          setError('Authentication error occurred. Please try logging in again.');
        }
        
        Logger.logError(error, 'Auth state change handler failed');
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Auto-logout on tab close/refresh (optional security feature)
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser) {
        try {
          await Logger.logUserAction(
            currentUser.uid, 
            'SESSION_END', 
            'User session ended (tab closed/refreshed)'
          );
        } catch (error) {
          console.warn('Failed to log session end:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser]);

  // Provide authentication context
  const value = {
    // State
    currentUser,
    userProfile,
    loading,
    error,
    isAuthenticated,
    
    // Actions
    login,
    register,
    logout,
    updateUserProfile,
    checkAuthStatus,
    
    // Utilities
    setError,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;