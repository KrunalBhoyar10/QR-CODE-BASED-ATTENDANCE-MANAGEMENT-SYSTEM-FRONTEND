import api from './api';
import { filterActiveSubjects } from '../utils/subjects';

const filterSubjectListResponse = (payload) => {
  if (!payload) return payload;
  if (Array.isArray(payload)) return filterActiveSubjects(payload);
  if (Array.isArray(payload.data)) {
    return { ...payload, data: filterActiveSubjects(payload.data) };
  }
  return payload;
};

export const hodService = {
  // Departments
  getMyDepartment: async () => {
    const response = await api.get('/hod/my-department');
    return response.data;
  },
  getDepartments: async () => {
    const response = await api.get('/hod/departments');
    return response.data;
  },
  getProgramsByDepartment: async (deptId) => {
    const response = await api.get(`/hod/departments/${deptId}/programs`);
    return response.data;
  },

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
  deleteProgram: async (id) => {
    const response = await api.delete(`/hod/programs/${id}`);
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
  deleteAcademicYear: async (id) => {
    const response = await api.delete(`/hod/academic-years/${id}`);
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
  deleteSection: async (id) => {
    const response = await api.delete(`/hod/sections/${id}`);
    return response.data;
  },

  // Subjects
  listSubjects: async (params = {}) => {
    const response = await api.get('/hod/subjects', {
      params: { activeOnly: true, ...params },
    });
    return filterSubjectListResponse(response.data);
  },
  listSubjectsByYear: async (programId, academicYearId, extraParams = {}) => {
    const params = { activeOnly: true, ...extraParams };
    if (programId) {
      params.programId = programId;
      params.program_id = programId;
    }
    if (academicYearId) {
      params.academicYearId = academicYearId;
      params.academic_year_id = academicYearId;
      params.yearId = academicYearId;
    }
    const response = await api.get('/hod/subjects', { params });
    return filterSubjectListResponse(response.data);
  },
  createSubject: async (data) => {
    const response = await api.post('/hod/subjects', data);
    return response.data;
  },
  updateSubject: async (id, data) => {
    const response = await api.patch(`/hod/subjects/${id}`, data);
    return response.data;
  },
  deleteSubject: async (id) => {
    const response = await api.delete(`/hod/subjects/${id}`);
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
  deleteTeacher: async (id) => {
    const response = await api.delete(`/hod/teachers/${id}`);
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
  listStudents: async (params = {}) => {
    const query = { ...params };
    if (params.programId) {
      query.program_id = params.programId;
    }
    if (params.academicYearId) {
      query.academic_year_id = params.academicYearId;
      query.yearId = params.academicYearId;
    }
    if (params.sectionId) {
      query.section_id = params.sectionId;
    }
    const response = await api.get('/hod/students', { params: query });
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
  getSectionStudentsSubjectAttendance: async (sectionId, subjectId, params = {}) => {
    const response = await api.get(`/hod/sections/${sectionId}/students/attendance/${subjectId}`, { params });
    return response.data;
  },
};
