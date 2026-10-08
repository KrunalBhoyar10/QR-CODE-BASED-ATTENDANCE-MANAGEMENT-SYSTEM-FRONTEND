/**
 * Organization Email Validation (Frontend)
 *
 * Matches backend validation. Rejects Gmail, Yahoo, other .edu.in domains, etc.
 * Only allows @abcuniversity.edu.in (or env-configured domain).
 */

// Read from env or fallback to default
const ORG_DOMAIN = import.meta.env.VITE_ORGANIZATION_EMAIL_DOMAIN || 'abcuniversity.edu.in';

/**
 * Returns true if email belongs to organization domain.
 */
export const isOrgEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase().endsWith(`@${ORG_DOMAIN.toLowerCase()}`);
};

/**
 * Returns error message if email doesn't match org domain, null if valid.
 */
export const validateOrgEmail = (email) => {
  if (!email || !email.trim()) {
    return 'Email is required';
  }

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email address format';
  }

  // Organization domain check
  if (!isOrgEmail(email)) {
    return `Email must belong to organization domain (@${ORG_DOMAIN})`;
  }

  return null; // Valid
};

/**
 * Returns the configured organization domain.
 */
export const getOrgDomain = () => ORG_DOMAIN;
