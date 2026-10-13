/**
 * Application Constants
 */

export const ROLES = Object.freeze({
  PRINCIPAL: 'PRINCIPAL',
  HOD: 'HOD',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
});

export const ROLE_LABELS = Object.freeze({
  [ROLES.PRINCIPAL]: 'Principal',
  [ROLES.HOD]: 'Head of Department',
  [ROLES.TEACHER]: 'Teacher / Faculty',
  [ROLES.STUDENT]: 'Student',
});

export const ROLE_DASHBOARDS = Object.freeze({
  [ROLES.PRINCIPAL]: '/principal/dashboard',
  [ROLES.HOD]: '/hod/department',
  [ROLES.TEACHER]: '/teacher/dashboard',
  [ROLES.STUDENT]: '/student/scan',
});

export const STORAGE_KEYS = Object.freeze({
  ACCESS_TOKEN: 'qr_attendance_access_token',
  REFRESH_TOKEN: 'qr_attendance_refresh_token',
  USER: 'qr_attendance_user',
});
