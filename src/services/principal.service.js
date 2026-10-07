import api from './api';

export const principalService = {
  // Dashboard & Analytics
  getAttendanceSummary: async (params) => {
    const response = await api.get('/principal/attendance/summary', { params });
    return response.data;
  },
  
  getDepartmentWiseAttendance: async (params) => {
    const response = await api.get('/principal/attendance/departments', { params });
    return response.data;
  },

  getProgramWiseAttendance: async (params) => {
    const response = await api.get('/principal/attendance/programs', { params });
    return response.data;
  },

  getLowAttendance: async (params) => {
    const response = await api.get('/principal/attendance/low-attendance', { params });
    return response.data;
  },

  getReportsSummary: async (params) => {
    const response = await api.get('/principal/reports', { params });
    return response.data;
  },

  // HOD Management
  listHods: async (params) => {
    const response = await api.get('/principal/hods', { params });
    return response.data;
  },

  getHodById: async (id) => {
    const response = await api.get(`/principal/hods/${id}`);
    return response.data;
  },

  createHod: async (data) => {
    const response = await api.post('/principal/hods', data);
    return response.data;
  },

  updateHod: async (id, data) => {
    const response = await api.patch(`/principal/hods/${id}`, data);
    return response.data;
  },

  updateHodStatus: async (id, isActive) => {
    const response = await api.patch(`/principal/hods/${id}/status`, { isActive });
    return response.data;
  },

  resetHodPassword: async (id) => {
    const response = await api.post(`/principal/hods/${id}/reset-password`);
    return response.data;
  },

  // Departments Navigation
  getDepartments: async () => {
    const response = await api.get('/principal/departments');
    return response.data;
  },

  getProgramsByDepartment: async (deptId) => {
    const response = await api.get(`/principal/departments/${deptId}/programs`);
    return response.data;
  },

  getAcademicYearsByProgram: async (programId) => {
    const response = await api.get(`/principal/programs/${programId}/academic-years`);
    return response.data;
  },

  getSectionsByAcademicYear: async (academicYearId) => {
    const response = await api.get(`/principal/academic-years/${academicYearId}/sections`);
    return response.data;
  },
};
