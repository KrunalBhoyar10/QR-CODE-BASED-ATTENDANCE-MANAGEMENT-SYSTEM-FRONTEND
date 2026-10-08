import api from './api';

export const hodService = {
  // Programs
  listPrograms: async (params) => {
    const response = await api.get('/hod/programs', { params });
    return response.data;
  },
  createProgram: async (data) => {
    const response = await api.post('/hod/programs', data);
    return response.data;
  },
  updateProgram: async (id, data) => {
    const response = await api.patch(`/hod/programs/${id}`, data);
    return response.data;
  },

  // Academic Years
  listAcademicYears: async (programId) => {
    const response = await api.get(`/hod/programs/${programId}/academic-years`);
    return response.data;
  },
  createAcademicYear: async (data) => {
    const response = await api.post('/hod/academic-years', data);
    return response.data;
  },
  updateAcademicYear: async (id, data) => {
    const response = await api.patch(`/hod/academic-years/${id}`, data);
    return response.data;
  },

  // Sections
  listSections: async (academicYearId) => {
    const response = await api.get(`/hod/academic-years/${academicYearId}/sections`);
    return response.data;
  },
  createSection: async (data) => {
    const response = await api.post('/hod/sections', data);
    return response.data;
  },
  updateSection: async (id, data) => {
    const response = await api.patch(`/hod/sections/${id}`, data);
    return response.data;
  },

  // Subjects
  listSubjects: async (params) => {
    const response = await api.get('/hod/subjects', { params });
    return response.data;
  },
  createSubject: async (data) => {
    const response = await api.post('/hod/subjects', data);
    return response.data;
  },
  updateSubject: async (id, data) => {
    const response = await api.patch(`/hod/subjects/${id}`, data);
    return response.data;
  },

  // Teachers
  listTeachers: async (params) => {
    const response = await api.get('/hod/teachers', { params });
    return response.data;
  },
  createTeacher: async (data) => {
    const response = await api.post('/hod/teachers', data);
    return response.data;
  },
  updateTeacherStatus: async (id, isActive) => {
    const response = await api.patch(`/hod/teachers/${id}/status`, { isActive });
    return response.data;
  },
  resetTeacherPassword: async (id) => {
    const response = await api.post(`/hod/teachers/${id}/reset-password`);
    return response.data;
  },

  // Teaching Assignments
  listAssignments: async (params) => {
    const response = await api.get('/hod/teaching-assignments', { params });
    return response.data;
  },
  createAssignment: async (data) => {
    const response = await api.post('/hod/teaching-assignments', data);
    return response.data;
  },
  updateAssignment: async (id, data) => {
    const response = await api.patch(`/hod/teaching-assignments/${id}`, data);
    return response.data;
  },
  deleteAssignment: async (id) => {
    const response = await api.delete(`/hod/teaching-assignments/${id}`);
    return response.data;
  },
  updateAssignmentStatus: async (id, isActive) => {
    const response = await api.patch(`/hod/teaching-assignments/${id}/status`, {
      status: isActive ? 'ACTIVE' : 'INACTIVE',
    });
    return response.data;
  },

  // Students
  listStudents: async (params) => {
    const response = await api.get('/hod/students', { params });
    return response.data;
  },

  // Attendance & Reports
  getAttendanceSummary: async (params) => {
    const response = await api.get('/hod/attendance/summary', { params });
    return response.data;
  },
  getProgramAttendance: async (params) => {
    const response = await api.get('/hod/attendance/programs', { params });
    return response.data;
  },
  getAcademicYearAttendance: async (params) => {
    const response = await api.get('/hod/attendance/academic-years', { params });
    return response.data;
  },
  getSectionAttendance: async (params) => {
    const response = await api.get('/hod/attendance/sections', { params });
    return response.data;
  },
  getSubjectAttendance: async (params) => {
    const response = await api.get('/hod/attendance/subjects', { params });
    return response.data;
  },
  getLowAttendance: async (params) => {
    const response = await api.get('/hod/attendance/low-attendance', { params });
    return response.data;
  },
  getReportsSummary: async (params) => {
    const response = await api.get('/hod/reports', { params });
    return response.data;
  },
};
