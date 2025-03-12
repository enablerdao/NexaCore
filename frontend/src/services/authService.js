/**
 * Authentication service
 */

import { api, setAuthToken } from './api';

// Register a new user
const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData, false);
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response.user;
  } catch (error) {
    throw new Error(error);
  }
};

// Login a user
const login = async (credentials) => {
  try {
    const response = await api.post('/auth/login', credentials, false);
    
    if (response.token) {
      setAuthToken(response.token);
    }
    
    return response.user;
  } catch (error) {
    throw new Error(error);
  }
};

// Logout the current user
const logout = async () => {
  try {
    await api.post('/auth/logout');
    setAuthToken(null);
  } catch (error) {
    // Still remove the token even if the API call fails
    setAuthToken(null);
    throw new Error(error);
  }
};

// Get the current user
const getCurrentUser = async () => {
  try {
    return await api.get('/auth/me');
  } catch (error) {
    // If unauthorized, clear the token
    if (error.includes('401')) {
      setAuthToken(null);
    }
    return null;
  }
};

// Request a password reset
const requestPasswordReset = async (email) => {
  try {
    return await api.post('/auth/forgot-password', { email }, false);
  } catch (error) {
    throw new Error(error);
  }
};

// Reset password with token
const resetPassword = async (token, newPassword) => {
  try {
    return await api.post('/auth/reset-password', { token, password: newPassword }, false);
  } catch (error) {
    throw new Error(error);
  }
};

// Change password (for authenticated users)
const changePassword = async (currentPassword, newPassword) => {
  try {
    return await api.post('/auth/change-password', { 
      current_password: currentPassword, 
      new_password: newPassword 
    });
  } catch (error) {
    throw new Error(error);
  }
};

// Update user profile
const updateProfile = async (profileData) => {
  try {
    return await api.put('/auth/profile', profileData);
  } catch (error) {
    throw new Error(error);
  }
};

// Upload profile picture
const uploadProfilePicture = async (file) => {
  try {
    return await api.upload('/auth/profile/picture', file);
  } catch (error) {
    throw new Error(error);
  }
};

// Enable two-factor authentication
const enableTwoFactor = async () => {
  try {
    return await api.post('/auth/2fa/enable');
  } catch (error) {
    throw new Error(error);
  }
};

// Verify two-factor authentication
const verifyTwoFactor = async (code) => {
  try {
    return await api.post('/auth/2fa/verify', { code });
  } catch (error) {
    throw new Error(error);
  }
};

// Disable two-factor authentication
const disableTwoFactor = async (code) => {
  try {
    return await api.post('/auth/2fa/disable', { code });
  } catch (error) {
    throw new Error(error);
  }
};

export const authService = {
  register,
  login,
  logout,
  getCurrentUser,
  requestPasswordReset,
  resetPassword,
  changePassword,
  updateProfile,
  uploadProfilePicture,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor
};