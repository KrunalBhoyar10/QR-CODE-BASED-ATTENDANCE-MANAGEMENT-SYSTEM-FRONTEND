import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../../services/auth.service';
import { setOnAuthFailure } from '../../services/api';
import { tokenStorage } from '../../utils/tokenStorage';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => tokenStorage.getUser());
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize unrecoverable 401 auth failures directly to context
  const handleAuthFailure = useCallback(() => {
    tokenStorage.clearAuth();
    setUser(null);
  }, []);

  useEffect(() => {
    setOnAuthFailure(handleAuthFailure);
  }, [handleAuthFailure]);

  // Initial session verification with backend /me on mount if access token exists
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const accessToken = tokenStorage.getAccessToken();
      const refreshToken = tokenStorage.getRefreshToken();

      if (!accessToken && !refreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getProfile();
        if (isMounted) {
          setUser(profile);
        }
      } catch (error) {
        // If profile fetch fails completely and refresh also fails, clear credentials
        if (isMounted && !tokenStorage.getAccessToken()) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Log in user
   */
  const login = async (credentials) => {
    const payload = await authService.login(credentials);
    setUser(payload.user);
    return payload;
  };

  /**
   * Log out user
   */
  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  };

  /**
   * Change current user's password
   */
  const changePassword = async ({ currentPassword, newPassword }) => {
    return await authService.changePassword({ currentPassword, newPassword });
  };

  /**
   * Refresh authenticated user profile
   */
  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
      return profile;
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
      throw e;
    }
  };

  const value = {
    user,
    isAuthenticated: Boolean(user && (tokenStorage.getAccessToken() || tokenStorage.getRefreshToken())),
    isLoading,
    login,
    logout,
    changePassword,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
