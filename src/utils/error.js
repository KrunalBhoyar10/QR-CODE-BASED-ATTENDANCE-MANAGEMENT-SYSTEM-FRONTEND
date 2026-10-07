/**
 * User-friendly API error parser.
 * Avoids exposing raw backend stack traces or internal server error structures.
 */
export const getErrorMessage = (error, defaultMessage = 'An unexpected error occurred. Please try again.') => {
  if (!error) return defaultMessage;

  // Axios response error from backend
  if (error.response) {
    const data = error.response.data;

    // Backend error structure: { success: false, message: "...", error: ... }
    if (data?.message && typeof data.message === 'string') {
      return data.message;
    }

    if (data?.error?.message && typeof data.error.message === 'string') {
      return data.error.message;
    }

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      return data.errors.map((e) => e.message || e.msg || e).join(', ');
    }

    // Status code fallbacks
    switch (error.response.status) {
      case 400:
        return 'Invalid request details provided.';
      case 401:
        return 'Session expired or invalid credentials. Please log in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'Conflict detected with existing data.';
      case 422:
        return 'Validation error. Please verify the submitted information.';
      case 429:
        return 'Too many requests. Please slow down and try again later.';
      case 500:
      case 502:
      case 503:
      case 504:
        return 'Server is temporarily unavailable. Please try again later.';
      default:
        return defaultMessage;
    }
  }

  // Network connection error
  if (error.request) {
    return 'Unable to connect to the backend server. Please check your network connection.';
  }

  // Client side message
  if (error.message && typeof error.message === 'string') {
    return error.message;
  }

  return defaultMessage;
};
