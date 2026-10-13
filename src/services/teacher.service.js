import api from './api';

export const teacherService = {
  // ── Profile ──────────────────────────────────────────────────────────────
  getProfile: async () => {
    const response = await api.get('/teacher/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.patch('/teacher/profile', data);
    return response.data;
  },

  changePassword: async (data) => {
    const response = await api.post('/teacher/change-password', data);
    return response.data;
  },

  // ── Teaching Assignments & Scopes ────────────────────────────────────────
  getAssignments: async (params = {}) => {
    const response = await api.get('/teacher/assignments', { params });
    return response.data;
  },

  getAssignmentById: async (id) => {
    const response = await api.get(`/teacher/assignments/${id}`);
    return response.data;
  },

  getAssignedPrograms: async () => {
    const response = await api.get('/teacher/programs');
    return response.data;
  },

  getAssignedAcademicYears: async (programId) => {
    const url = programId
      ? `/teacher/programs/${programId}/academic-years`
      : '/teacher/academic-years';
    const response = await api.get(url);
    return response.data;
  },

  getAssignedSections: async (academicYearId) => {
    const url = academicYearId
      ? `/teacher/academic-years/${academicYearId}/sections`
      : '/teacher/sections';
    const response = await api.get(url);
    return response.data;
  },

  getAssignedSubjects: async (params = {}) => {
    const response = await api.get('/teacher/subjects', { params });
    return response.data;
  },

  getSectionStudents: async (sectionId) => {
    const response = await api.get(`/teacher/sections/${sectionId}/students`);
    return response.data;
  },

  getSectionStudentsAttendance: async (sectionId) => {
    const response = await api.get(`/teacher/sections/${sectionId}/students/attendance`);
    return response.data;
  },

  getSectionStudentsSubjectAttendance: async (sectionId, subjectId, params = {}) => {
    const response = await api.get(`/teacher/sections/${sectionId}/students/attendance/${subjectId}`, { params });
    return response.data;
  },

  deleteStudent: async (studentId) => {
    const response = await api.delete(`/teacher/students/${studentId}`);
    return response.data;
  },

  // ── Face Photo Authorization ───────────────────────────────────────────────
  /**
   * Get a student's face change status (changeCount, limit, teacherAuthorized, hasPhoto).
   * Teacher can only view students in their assigned sections.
   */
  getStudentFaceStatus: async (studentId) => {
    const response = await api.get(`/teacher/students/${studentId}/face-status`);
    return response.data;
  },

  /**
   * Authorize one additional face photo change for a specific student.
   * Only works for students in the teacher's assigned sections.
   */
  authorizeStudentFaceChange: async (studentId) => {
    const response = await api.post(`/teacher/students/${studentId}/face-authorize`);
    return response.data;
  },

  /**
   * Revoke a previously granted face-change authorization.
   */
  revokeStudentFaceAuthorization: async (studentId) => {
    const response = await api.delete(`/teacher/students/${studentId}/face-authorize`);
    return response.data;
  },

  // ── Attendance Sessions & Live Monitoring ─────────────────────────────────
  createSession: async (data) => {
    const response = await api.post('/teacher/sessions', data);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await api.get('/teacher/sessions/active');
    return response.data;
  },

  getSessions: async (params = {}) => {
    const response = await api.get('/teacher/sessions', { params });
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await api.get(`/teacher/sessions/${id}`);
    return response.data;
  },

  closeSession: async (id) => {
    const response = await api.post(`/teacher/sessions/${id}/close`);
    return response.data;
  },

  getSessionAttendance: async (id, params = {}) => {
    const response = await api.get(`/teacher/sessions/${id}/attendance`, { params });
    return response.data;
  },
};

export default teacherService;
