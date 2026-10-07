import { STORAGE_KEYS } from './constants';

/**
 * Token and auth storage utility with error-resilient localStorage access
 */
export const tokenStorage = {
  getAccessToken: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || null;
    } catch {
      return null;
    }
  },

  setAccessToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      }
    } catch (e) {
      console.error('Failed to store access token:', e);
    }
  },

  getRefreshToken: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || null;
    } catch {
      return null;
    }
  },

  setRefreshToken: (token) => {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      }
    } catch (e) {
      console.error('Failed to store refresh token:', e);
    }
  },

  getUser: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch (e) {
      console.error('Failed to store user profile:', e);
    }
  },

  setAuth: ({ accessToken, refreshToken, user }) => {
    if (accessToken) tokenStorage.setAccessToken(accessToken);
    if (refreshToken) tokenStorage.setRefreshToken(refreshToken);
    if (user) tokenStorage.setUser(user);
  },

  clearAuth: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.USER);
    } catch (e) {
      console.error('Failed to clear auth storage:', e);
    }
  },

  isAuthenticated: () => {
    return Boolean(tokenStorage.getAccessToken() || tokenStorage.getRefreshToken());
  },
};
