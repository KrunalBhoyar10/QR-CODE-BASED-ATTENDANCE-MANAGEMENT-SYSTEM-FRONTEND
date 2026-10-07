import api from './api';
import { tokenStorage } from '../utils/tokenStorage';

// alias
const apiClient = api;

/**
 * Authentication Service connecting to the real backend auth endpoints
 */
export const authService = {
  /**
   * Login with email and password
   */
  login: async ({ email, password }) => {
    const response = await apiClient.post('/auth/login', { email, password });
    const payload = response.data?.data;
    if (payload?.accessToken) {
      tokenStorage.setAuth({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
      });
    }
    return payload;
  },

  /**
   * Revoke refresh token and clear client storage
   */
  logout: async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      if (refreshToken) {
        await apiClient.post('/auth/logout', { refreshToken });
      }
    } catch (e) {
      // Even if network or backend fails, always clear local credentials
      console.warn('Backend logout encountered error, clearing local state:', e);
    } finally {
      tokenStorage.clearAuth();
    }
  },

  /**
   * Retrieve current authenticated user profile
   */
  getProfile: async () => {
    const response = await apiClient.get('/auth/me');
    const user = response.data?.data;
    if (user) {
      tokenStorage.setUser(user);
    }
    return user;
  },

  /**
   * Change current password (requires active session)
   */
  changePassword: async ({ currentPassword, newPassword }) => {
    const response = await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Request password reset token
   */
  forgotPassword: async ({ email }) => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Reset password with token
   */
  resetPassword: async ({ token, newPassword }) => {
    const response = await apiClient.post('/auth/reset-password', {
      token,
      newPassword,
    });
    return response.data;
  },
};

export default authService;
