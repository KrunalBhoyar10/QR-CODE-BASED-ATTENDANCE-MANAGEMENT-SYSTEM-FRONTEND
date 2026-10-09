import api from './api';

/**
 * Registration helper service — loads academic structure for the student
 * self-registration form.
 *
 * These endpoints are PUBLIC (no auth required). The backend should expose
 * them under /api/v1/register/* or /api/v1/public/*. Update
 * REGISTRATION_BASE below if the backend uses a different prefix.
 *
 * Expected backend routes:
 *   GET /register/programs
 *   GET /register/programs/:id/academic-years
 *   GET /register/academic-years/:id/sections
 *   GET /register/sections/:id/subjects
 *
 * Response shape expected from the backend for all list endpoints:
 *   { success: true, data: [ ...items ] }
 */
const REGISTRATION_BASE = '/register';

const registrationService = {
  /**
   * Load all active programs for the registration dropdown.
   * @returns {Promise<Array>} Array of { id, name, code, ... }
   */
  getPrograms: async () => {
    const response = await api.get(`${REGISTRATION_BASE}/programs`);
    return response.data?.data || [];
  },

  /**
   * Load academic years for a given program.
   * @param {string} programId
   * @returns {Promise<Array>} Array of { id, year, label, yearNumber, ... }
   */
  getAcademicYears: async (programId) => {
    const response = await api.get(
      `${REGISTRATION_BASE}/programs/${programId}/academic-years`
    );
    return response.data?.data || [];
  },

  /**
   * Load sections for a given academic year.
   * @param {string} academicYearId
   * @returns {Promise<Array>} Array of { id, name, ... }
   */
  getSections: async (academicYearId) => {
    const response = await api.get(
      `${REGISTRATION_BASE}/academic-years/${academicYearId}/sections`
    );
    return response.data?.data || [];
  },

  /**
   * Load subjects for a given section.
   * Each subject should include isCompulsory / subjectType flags.
   * @param {string} sectionId
   * @returns {Promise<Array>} Array of { id, name, code, subjectType, isCompulsory, isElective }
   */
  getSubjects: async (sectionId) => {
    const response = await api.get(
      `${REGISTRATION_BASE}/sections/${sectionId}/subjects`
    );
    return response.data?.data || [];
  },
};

export default registrationService;
