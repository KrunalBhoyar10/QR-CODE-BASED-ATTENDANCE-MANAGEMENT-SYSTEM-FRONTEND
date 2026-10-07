import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

// ─── Singleton axios instance ─────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
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
        const response = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken }
        );
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
      ({ coords }) =>
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
        }),
      (err) => {
        const msgs = {
          1: 'Location access was denied. Please allow location in browser settings.',
          2: 'Your location could not be determined. Try again.',
          3: 'Location request timed out. Please try again.',
        };
        reject(new Error(msgs[err.code] || 'Unable to get location.'));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  });
