import apiClient from './api';
// uses the shared singleton axios instance (token interceptors already attached)

/**
 * Student API Service – all calls map 1-to-1 to real backend endpoints.
 * No mock data. No hard-coded results.
 */
const studentService = {
  // ─── Profile ─────────────────────────────────────────────────────────────
  getProfile: () =>
    apiClient.get('/student/profile').then((r) => r.data?.data),

  updateProfile: (data) =>
    apiClient.patch('/student/profile', data).then((r) => r.data?.data),

  changePassword: ({ currentPassword, newPassword }) =>
    apiClient
      .post('/student/change-password', { currentPassword, newPassword })
      .then((r) => r.data),

  forgotPassword: ({ email }) =>
    apiClient.post('/student/forgot-password', { email }).then((r) => r.data),

  resetPassword: ({ token, newPassword }) =>
    apiClient
      .post('/student/reset-password', { token, newPassword })
      .then((r) => r.data),

  // ─── Enrollment ──────────────────────────────────────────────────────────
  getEnrollments: () =>
    apiClient.get('/student/enrollments').then((r) => r.data?.data),

  // ─── Attendance Marking (QR → GPS → Face) ────────────────────────────────
  /**
   * @param {object} payload
   * @param {string}  payload.sessionId   UUID from QR code
   * @param {string}  payload.token       token field from QR payload
   * @param {number|null} payload.latitude
   * @param {number|null} payload.longitude
   * @param {object|null} payload.faceVerificationData
   */
  markAttendance: (payload) =>
    apiClient.post('/student/attendance/mark', payload).then((r) => r.data?.data),

  // ─── Attendance Data ──────────────────────────────────────────────────────
  getAttendanceSummary: () =>
    apiClient.get('/student/attendance/summary').then((r) => r.data?.data),

  getSubjectWiseAttendance: () =>
    apiClient.get('/student/attendance/subjects').then((r) => r.data?.data),

  /**
   * @param {object} params - page, limit, startDate, endDate, status, subjectId
   */
  getAttendanceHistory: (params = {}) =>
    apiClient
      .get('/student/attendance/history', { params })
      .then((r) => ({ records: r.data?.data || [], pagination: r.data?.pagination })),
};

export default studentService;
