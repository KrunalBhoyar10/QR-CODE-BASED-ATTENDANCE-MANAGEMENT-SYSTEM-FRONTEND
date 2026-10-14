import apiClient from './api';
import { coordsToApiFields } from '../utils/geolocation';
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
  markAttendance: (payload) => {
    const geo = coordsToApiFields(payload.latitude, payload.longitude, payload.accuracy);
    const body = {
      ...payload,
      ...(geo || {}),
    };
    return apiClient
      .post('/student/attendance/mark', body, { timeout: 60000 })
      .then((r) => r.data?.data);
  },

  // ─── Face Photo / Biometrics ─────────────────────────────────────────────

  /**
   * Register or update face photo.
   * @param {FormData} formData  Must contain `facePhoto` (File) and `faceDescriptor` (JSON string)
   */
  registerFace: (formData) =>
    apiClient.post('/student/face/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }).then((r) => r.data?.data),

  /**
   * Change face photo (limited to 2 times, or if teacher-authorized).
   * @param {FormData} formData  Must contain `facePhoto` (File) and `faceDescriptor` (JSON string)
   */
  updateFace: (formData) =>
    apiClient.patch('/student/face/update', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }).then((r) => r.data?.data),

  /**
   * Get current face registration status, change count, and teacher-auth status.
   * Returns { hasPhoto, changeCount, changeLimit, teacherAuthorized, facePhotoUrl }
   */
  getFaceStatus: () =>
    apiClient.get('/student/face/status').then((r) => r.data?.data),

  /**
   * Check if a specific session is still active and if student already marked attendance.
   * Returns { sessionActive: bool, alreadyMarked: bool }
   */
  checkSessionStatus: (sessionId) =>
    apiClient.get(`/student/attendance/session-status/${sessionId}`).then((r) => r.data?.data).catch(() => null),

  // ─── Attendance Data ──────────────────────────────────────────────────────
  getAttendanceSummary: () =>
    apiClient.get('/student/attendance/summary').then((r) => {
      const d = r.data?.data || {};
      const total = Number(d.totalSessions ?? d.totalClasses ?? 0);
      const attended = Number(d.presentCount ?? d.effectiveAttended ?? d.attended ?? 0);
      const absent = Number(
        (d.absentCount && d.absentCount > 0)
          ? d.absentCount
          : (d.absent && d.absent > 0)
          ? d.absent
          : Math.max(0, total - attended)
      );
      const overall = Number(
        d.attendancePercentage ?? d.overallPercentage ?? (total > 0 ? (attended / total) * 100 : 0)
      );
      return {
        ...d,
        totalClasses: total,
        totalSessions: total,
        attended,
        presentCount: attended,
        effectiveAttended: attended,
        absent,
        absentCount: absent,
        overallPercentage: overall,
        attendancePercentage: overall,
      };
    }),

  getSubjectWiseAttendance: () =>
    apiClient.get('/student/attendance/subjects').then((r) => {
      const arr = Array.isArray(r.data?.data) ? r.data.data : [];
      return arr.map((item) => {
        const total = Number(item.totalSessions ?? item.totalClasses ?? 0);
        const attended = Number(item.presentCount ?? item.effectiveAttended ?? item.attended ?? 0);
        const absent = Number(
          (item.absentCount && item.absentCount > 0)
            ? item.absentCount
            : (item.absent && item.absent > 0)
            ? item.absent
            : Math.max(0, total - attended)
        );
        const pct = item.attendancePercentage != null
          ? Number(item.attendancePercentage)
          : (total > 0 ? Number(((attended / total) * 100).toFixed(1)) : 0);
        return {
          ...item,
          totalClasses: total,
          totalSessions: total,
          attended,
          presentCount: attended,
          effectiveAttended: attended,
          absent,
          absentCount: absent,
          attendancePercentage: pct,
        };
      });
    }),

  /**
   * @param {object} params - page, limit, startDate, endDate, status, subjectId
   */
  getAttendanceHistory: (params = {}) =>
    apiClient
      .get('/student/attendance/history', { params })
      .then((r) => ({ records: r.data?.data || [], pagination: r.data?.pagination })),
};

export default studentService;
