import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';
import { normalizeLatLng } from '../utils/geolocation';

/**
 * In dev, Vite proxies /api → backend on the dev machine.
 * On a phone (LAN IP host), localhost:5000 in .env points at the phone — use same-origin /api instead.
 */
export const resolveApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL?.trim()?.replace(/\/$/, '');
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    const onDevMachine = hostname === 'localhost' || hostname === '127.0.0.1';
    if (import.meta.env.DEV) {
      if (!onDevMachine) {
        return `${origin}/api/v1`;
      }
      if (!envUrl || /localhost|127\.0\.0\.1/.test(envUrl)) {
        return `${origin}/api/v1`;
      }
    }
  }
  return envUrl || 'http://localhost:5000/api/v1';
};

// ─── Singleton axios instance ─────────────────────────────────────────────────
const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 15000,
});

// Global auth failure callback (set by AuthContext)
let onAuthFailure = null;
export const setOnAuthFailure = (cb) => {
  onAuthFailure = cb;
};

// ─── Request interceptor – attach Bearer token ────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor – handle 401 / token refresh ───────────────────────
let isRefreshing = false;
let refreshQueue = [];

const processRefreshQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(Promise.reject.bind(Promise));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use the same api instance so the Vite proxy intercepts /api/* correctly.
        // Never use raw axios here — it bypasses the proxy and gets a 404.
        const response = await api.post('/auth/refresh-token', { refreshToken });
        const { accessToken, refreshToken: newRefresh } = response.data?.data || {};
        if (accessToken) {
          tokenStorage.setAccessToken(accessToken);
          if (newRefresh) tokenStorage.setRefreshToken(newRefresh);
          api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
          processRefreshQueue(null, accessToken);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processRefreshQueue(refreshError, null);
        tokenStorage.clearAuth();
        if (onAuthFailure) onAuthFailure();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Re-export teacher API (unchanged) ───────────────────────────────────────
export const teacherAPI = {
  getProfile: () => api.get('/teacher/profile'),
  updateProfile: (data) => api.patch('/teacher/profile', data),
  changePassword: (data) => api.post('/teacher/change-password', data),
  getAssignments: (params) => api.get('/teacher/assignments', { params }),
  getAssignmentById: (id) => api.get(`/teacher/assignments/${id}`),
  getAssignedPrograms: () => api.get('/teacher/programs'),
  getAssignedAcademicYears: (programId) =>
    api.get(programId ? `/teacher/programs/${programId}/academic-years` : '/teacher/academic-years'),
  getAssignedSections: (academicYearId) =>
    api.get(academicYearId ? `/teacher/academic-years/${academicYearId}/sections` : '/teacher/sections'),
  getAssignedSubjects: (params) => api.get('/teacher/subjects', { params }),
  createSession: (data) => api.post('/teacher/sessions', data),
  getActiveSessions: () => api.get('/teacher/sessions/active'),
  getSessions: (params) => api.get('/teacher/sessions', { params }),
  getSessionById: (id) => api.get(`/teacher/sessions/${id}`),
  closeSession: (id) => api.post(`/teacher/sessions/${id}/close`),
  getSessionAttendance: (id, params) =>
    api.get(`/teacher/sessions/${id}/attendance`, { params }),
};

// ─── Geolocation helper ────────────────────────────────────────────────────────
export const getGeolocation = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const normalized = normalizeLatLng(coords.latitude, coords.longitude);
        if (!normalized) {
          reject(new Error('Invalid GPS coordinates from device. Turn location off and on, then try again.'));
          return;
        }
        // Indoor / weak signal: warn above 2 km but still allow (geofence uses best available fix)
        if (coords.accuracy > 2000) {
          reject(new Error(
            `GPS accuracy too low (±${Math.round(coords.accuracy)}m). ` +
            'Move closer to a window, enable high-accuracy location, and try again.'
          ));
          return;
        }
        resolve({
          latitude: normalized.latitude,
          longitude: normalized.longitude,
          accuracy: coords.accuracy,
        });
      },
      (err) => {
        const msgs = {
          1: 'Location access was denied. Please allow location in browser settings.',
          2: 'Your location could not be determined. Try again.',
          3: 'Location request timed out. Please try again.',
        };
        reject(new Error(msgs[err.code] || 'Unable to get location.'));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }  // maximumAge:0 = always fresh
    );
  });
