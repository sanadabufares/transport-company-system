import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Make sure this API URL matches your backend server address
const API_URL = 'http://localhost:5000/api';

// Add console log to verify the API URL
console.log('[Auth] Using API URL:', API_URL);

// Enable logging for debugging
const debugLog = (message, data) => {
  console.log(`[Auth] ${message}`, data || '');
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshDashboard, setRefreshDashboard] = useState(false);

  const triggerDashboardRefresh = () => {
    setRefreshDashboard(prev => !prev);
  };

  // We'll handle navigation in components, not in the context

  // Set up axios header with token
  // Use a ref to hold the token to avoid stale closures in the interceptor
  const tokenRef = React.useRef(token);
  tokenRef.current = token;

  useEffect(() => {
    // Set up axios interceptor to dynamically add the token to headers
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const currentToken = tokenRef.current;
        if (currentToken) {
          config.headers.Authorization = `Bearer ${currentToken}`;
        }
        debugLog('Making request', { 
          url: config.url,
          hasAuthHeader: !!config.headers.Authorization
        });
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add interceptor to log all responses for debugging
    const responseInterceptor = axios.interceptors.response.use(
      response => {
        debugLog('Received response', { 
          url: response.config.url,
          status: response.status
        });
        return response;
      },
      error => {
        debugLog('Response error', { 
          url: error.config?.url,
          status: error.response?.status,
          message: error.response?.data?.message || error.message
        });
        return Promise.reject(error);
      }
    );

    // Clean up the interceptor when the component unmounts
    return () => {
      axios.interceptors.request.eject(interceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []); // Empty dependency array ensures this runs only once

  // Load user on mount or token change
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
        return;
      }

      debugLog('Loading user profile with token', { tokenPrefix: token.substring(0, 10) });
      try {
        // Make sure the authorization header is set correctly for this specific request
        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };
        debugLog('Making auth/me request with config', config);
        
        const res = await axios.get(`${API_URL}/auth/me`, config);
        debugLog('User profile loaded successfully', res.data);
        
        setCurrentUser(res.data.user);
        setUserProfile(res.data.profile);
        
        // Redirect based on role if on login page
        if (window.location.pathname === '/login' || window.location.pathname === '/') {
          redirectBasedOnRole(res.data.user.role);
        }
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Authentication failed';
        debugLog('Error loading user profile', { 
          status: err.response?.status, 
          message: errorMsg,
          error: err.message
        });
        console.error('Error loading user profile', err.response || err);
        
        // Only clear token if it's an auth error (401)
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
          setCurrentUser(null);
          setUserProfile(null);
          setError('Authentication failed. Please login again.');
        } else {
          // For other errors, keep the token but set an error message
          setError(`Failed to load profile: ${errorMsg}. Please try again later.`);
        }
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [token]);

  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      debugLog('Attempting login with:', { username });
      const res = await axios.post(`${API_URL}/auth/login`, { username, password });
      debugLog('Login response:', res.data);
      const { token: authToken, user, profile } = res.data;
      
      // Clear any previous auth data
      localStorage.removeItem('token');
      
      // Set new token and update axios headers immediately
      localStorage.setItem('token', authToken);
      setToken(authToken);
      setCurrentUser(user);
      setUserProfile(profile); // Set the profile on login
      
      // Set auth header directly to ensure it's available immediately
      axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
      debugLog('Auth header set after login', { bearer: `Bearer ${authToken.substring(0, 10)}...` });
      
      // Wait a moment for state to update before redirecting
      setTimeout(() => {
        redirectBasedOnRole(user.role);
      }, 100);
      
      return true;
    } catch (err) {
      console.error('Login error', err);
      debugLog('Login error details:', { 
        status: err.response?.status,
        message: err.response?.data?.message, 
        error: err.message 
      });
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register company function
  const registerCompany = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${API_URL}/auth/register/company`, userData);
      return true;
    } catch (err) {
      console.error('Registration error', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register driver function
  const registerDriver = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${API_URL}/auth/register/driver`, userData);
      return true;
    } catch (err) {
      console.error('Registration error', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setUserProfile(null);
    // Use window.location for navigation instead of navigate hook
    window.location.href = '/login';
  };

  // Helper to redirect user based on role
  const redirectBasedOnRole = (role) => {
    debugLog('Redirecting based on role:', { role });
    let path = '/login';
    
    switch(role) {
      case 'admin':
        path = '/admin/dashboard';
        break;
      case 'company':
        path = '/company/dashboard';
        break;
      case 'driver':
        path = '/driver/dashboard';
        break;
      default:
        path = '/login';
    }
    
    // Use window.location for navigation instead of navigate hook
    window.location.href = path;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        error,
        login,
        registerCompany,
        registerDriver,
        logout,
        setError,
        refreshDashboard,
        triggerDashboardRefresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
