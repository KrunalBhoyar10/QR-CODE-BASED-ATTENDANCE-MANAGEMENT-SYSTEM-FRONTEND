import React, { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  Hash,
  Lock,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { Button, Input, Select } from '../../components/ui';
import { authService } from '../../services/auth.service';
import registrationService from '../../services/registration.service';
import { getErrorMessage } from '../../utils/error';

// ─────────────────────────────────────────────────────────────────────────────
// Multi-step registration wizard
// Step 1: Personal info (name, email, USN, password)
// Step 2: Academic selection (program → year → section → subjects)
// Step 3: Success
// ─────────────────────────────────────────────────────────────────────────────

const STEPS = {
  PERSONAL: 1,
  ACADEMIC: 2,
  SUCCESS: 3,
};

const PASSWORD_MIN_LENGTH = 8;

// Validate password strength
const validatePassword = (password) => {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/\d/.test(password)) return 'Password must contain at least one number.';
  return null;
};

// ─── Allowed institutional email domain (from environment) ───────────────────
const ORG_DOMAIN = import.meta.env.VITE_ORGANIZATION_EMAIL_DOMAIN || 'abcuniversity.edu.in';

// Full email validation: correct format AND must end with the org domain
const isValidEmail = (email) => {
  if (!email || !email.includes('@')) return false;
  const lower = email.toLowerCase().trim();
  // Must match basic email syntax
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) return false;
  // Must end with the exact institutional domain
  return lower.endsWith(`@${ORG_DOMAIN}`);
};

// ─────────────────────────────────────────────────────────────────────────────

export const StudentRegister = ({ onBackToLogin }) => {
  const [step, setStep] = useState(STEPS.PERSONAL);

  // ── Step 1: Personal fields ──────────────────────────────────────────────
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Step 2: Academic fields ──────────────────────────────────────────────
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]); // array of subject ids

  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // ── Step 3: OTP verification (reserved for future use) ──────────────────
  // (No OTP step: backend activates accounts immediately on registration)

  // ── General state ────────────────────────────────────────────────────────
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // ─── Load programs on Academic step entry ─────────────────────────────────
  const loadPrograms = useCallback(() => {
    setLoadingPrograms(true);
    setErrorMessage('');
    registrationService
      .getPrograms()
      .then((data) => {
        if (data.length === 0) {
          setErrorMessage(
            'No programs are available for registration. Please contact the college administrator.'
          );
        }
        setPrograms(data);
      })
      .catch((err) => {
        const msg = getErrorMessage(err, 'Failed to load programs.');
        // Provide a developer-friendly hint if the route is missing (404)
        const is404 =
          err?.response?.status === 404 ||
          (typeof msg === 'string' && msg.toLowerCase().includes('not found'));
        setErrorMessage(
          is404
            ? 'Registration data could not be loaded (API route not found). The backend needs to implement GET /register/programs. Contact the administrator.'
            : msg + ' Please try again.'
        );
      })
      .finally(() => setLoadingPrograms(false));
  }, []);

  useEffect(() => {
    if (step === STEPS.ACADEMIC && programs.length === 0) {
      loadPrograms();
    }
  }, [step, programs.length, loadPrograms]);

  // ─── Cascade: program → academic years ────────────────────────────────────
  useEffect(() => {
    if (!selectedProgram) {
      setAcademicYears([]);
      setSelectedAcademicYear('');
      return;
    }
    setLoadingYears(true);
    setAcademicYears([]);
    setSelectedAcademicYear('');
    setSections([]);
    setSelectedSection('');
    setSubjects([]);
    setSelectedSubjects([]);
    registrationService
      .getAcademicYears(selectedProgram)
      .then((data) => setAcademicYears(data))
      .catch((err) => setErrorMessage(getErrorMessage(err, 'Failed to load academic years.')))
      .finally(() => setLoadingYears(false));
  }, [selectedProgram]);

  // ─── Cascade: academic year → sections ────────────────────────────────────
  useEffect(() => {
    if (!selectedAcademicYear) {
      setSections([]);
      setSelectedSection('');
      return;
    }
    setLoadingSections(true);
    setSections([]);
    setSelectedSection('');
    setSubjects([]);
    setSelectedSubjects([]);
    registrationService
      .getSections(selectedAcademicYear)
      .then((data) => setSections(data))
      .catch((err) => setErrorMessage(getErrorMessage(err, 'Failed to load sections.')))
      .finally(() => setLoadingSections(false));
  }, [selectedAcademicYear]);

  // ─── Cascade: section → subjects ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedSection) {
      setSubjects([]);
      setSelectedSubjects([]);
      return;
    }
    setLoadingSubjects(true);
    setSubjects([]);
    setSelectedSubjects([]);
    registrationService
      .getSubjects(selectedSection)
      .then((data) => {
        setSubjects(data);
        // Auto-select all compulsory subjects
        const compulsory = data
          .filter((s) => s.isCompulsory || s.subjectType === 'COMPULSORY')
          .map((s) => s.id);
        setSelectedSubjects(compulsory);
      })
      .catch((err) => setErrorMessage(getErrorMessage(err, 'Failed to load subjects.')))
      .finally(() => setLoadingSubjects(false));
  }, [selectedSection]);

  // ─── OTP countdown timer — removed (no OTP step) ─────────────────────────

  // ─── Step 1 validation ────────────────────────────────────────────────────
  const validatePersonalStep = () => {
    const errs = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name (at least 2 characters).';
    }

    if (!email.trim() || !isValidEmail(email.trim())) {
      errs.email = `Only institutional emails ending with @${ORG_DOMAIN} are accepted.`;
    }

    if (!usn.trim()) {
      errs.usn = 'USN / University Student Number is required.';
    } else if (!/^[A-Za-z0-9]+$/.test(usn.trim())) {
      errs.usn = 'USN must contain only letters and numbers.';
    }

    const pwErr = validatePassword(password);
    if (pwErr) errs.password = pwErr;

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Step 2 validation ────────────────────────────────────────────────────
  const validateAcademicStep = () => {
    const errs = {};

    if (!selectedProgram) errs.program = 'Please select a program.';
    if (!selectedAcademicYear) errs.academicYear = 'Please select an academic year.';
    if (!selectedSection) errs.section = 'Please select a section.';

    const compulsoryIds = subjects
      .filter((s) => s.isCompulsory || s.subjectType === 'COMPULSORY')
      .map((s) => s.id);
    const missingCompulsory = compulsoryIds.filter((id) => !selectedSubjects.includes(id));
    if (missingCompulsory.length > 0) {
      errs.subjects = 'All compulsory subjects must be selected.';
    }

    const electiveSubjects = subjects.filter(
      (s) => !s.isCompulsory && s.subjectType !== 'COMPULSORY'
    );
    const selectedElectiveCount = selectedSubjects.filter((id) =>
      electiveSubjects.some((s) => s.id === id)
    ).length;

    if (electiveSubjects.length > 0 && selectedElectiveCount === 0) {
      errs.subjects = (errs.subjects ? errs.subjects + ' ' : '') + 'Please select at least one elective.';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Submit registration (Step 2 → 3) ─────────────────────────────────────
  const handleRegisterSubmit = async () => {
    if (!validateAcademicStep()) return;
    setErrorMessage('');
    setIsLoading(true);

    try {
      await authService.registerStudent({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        usn: usn.trim().toUpperCase(),
        programId: selectedProgram,
        academicYearId: selectedAcademicYear,
        sectionId: selectedSection,
        subjectIds: selectedSubjects,
        password,
      });

      // Registration is complete — account is active immediately (no OTP step).
      setStep(STEPS.SUCCESS);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Registration failed. Please check your details and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Subject toggle ────────────────────────────────────────────────────────
  const toggleSubject = (subjectId) => {
    const subject = subjects.find((s) => s.id === subjectId);
    if (!subject) return;

    // Compulsory subjects cannot be deselected
    if (subject.isCompulsory || subject.subjectType === 'COMPULSORY') return;

    setSelectedSubjects((prev) =>
      prev.includes(subjectId)
        ? prev.filter((id) => id !== subjectId)
        : [...prev, subjectId]
    );
    // Clear subject error on any toggle
    if (fieldErrors.subjects) {
      setFieldErrors((prev) => ({ ...prev, subjects: undefined }));
    }
  };

  // ─── Render helpers ────────────────────────────────────────────────────────
  const ErrorBanner = ({ message, onRetry }) =>
    message ? (
      <div
        role="alert"
        className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in duration-200"
      >
        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-medium leading-relaxed">{message}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-2 underline font-semibold hover:text-rose-900 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    ) : null;

  const FieldError = ({ msg }) =>
    msg ? <p className="mt-1 text-xs text-rose-600 font-medium">{msg}</p> : null;

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {[STEPS.PERSONAL, STEPS.ACADEMIC].map((s) => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            s === step
              ? 'w-8 bg-indigo-600'
              : s < step
              ? 'w-4 bg-indigo-400'
              : 'w-4 bg-slate-200'
          }`}
        />
      ))}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Personal Information
  // ─────────────────────────────────────────────────────────────────────────
  if (step === STEPS.PERSONAL) {
    const handleNext = (e) => {
      e.preventDefault();
      if (validatePersonalStep()) {
        setErrorMessage('');
        setStep(STEPS.ACADEMIC);
      }
    };

    return (
      <div>
        <div className="mb-5">
          <button
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to sign in
          </button>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Create Student Account
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Register with your institutional email to access attendance records.
          </p>
        </div>

        <StepIndicator />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Step 1 of 2 — Personal Information
        </p>

        <ErrorBanner message={errorMessage} />

        <form onSubmit={handleNext} noValidate className="space-y-3.5">
          <div>
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Arjun Sharma"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName)
                  setFieldErrors((p) => ({ ...p, fullName: undefined }));
              }}
              leftIcon={<User className="w-4 h-4" />}
              error={fieldErrors.fullName}
              disabled={isLoading}
            />
          </div>

          <div>
            <Input
              label="Institutional College Email"
              type="email"
              placeholder={`name@${ORG_DOMAIN}`}
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email)
                  setFieldErrors((p) => ({ ...p, email: undefined }));
              }}
              leftIcon={<Mail className="w-4 h-4" />}
              error={fieldErrors.email}
              helperText={!fieldErrors.email ? `Must end with @${ORG_DOMAIN}` : undefined}
              disabled={isLoading}
            />
          </div>

          <div>
            <Input
              label="USN / University Student Number"
              type="text"
              placeholder="e.g. 1AB22CS001"
              required
              autoComplete="off"
              value={usn}
              onChange={(e) => {
                setUsn(e.target.value);
                if (fieldErrors.usn)
                  setFieldErrors((p) => ({ ...p, usn: undefined }));
              }}
              leftIcon={<Hash className="w-4 h-4" />}
              error={fieldErrors.usn}
              disabled={isLoading}
            />
          </div>

          <div>
            <Input
              label="Password"
              isPassword
              required
              autoComplete="new-password"
              placeholder="Min. 8 characters with uppercase, number"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password)
                  setFieldErrors((p) => ({ ...p, password: undefined }));
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              error={fieldErrors.password}
              disabled={isLoading}
            />
          </div>

          <div>
            <Input
              label="Confirm Password"
              isPassword
              required
              autoComplete="new-password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (fieldErrors.confirmPassword)
                  setFieldErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
              leftIcon={<Lock className="w-4 h-4" />}
              error={fieldErrors.confirmPassword}
              disabled={isLoading}
            />
          </div>

          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center py-2.5"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Continue
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Academic Selection
  // ─────────────────────────────────────────────────────────────────────────
  if (step === STEPS.ACADEMIC) {
    const compulsorySubjects = subjects.filter(
      (s) => s.isCompulsory || s.subjectType === 'COMPULSORY'
    );
    const electiveSubjects = subjects.filter(
      (s) => !s.isCompulsory && s.subjectType !== 'COMPULSORY'
    );

    const programOptions = programs.map((p) => ({
      value: p.id,
      label: p.name + (p.code ? ` (${p.code})` : ''),
    }));
    const yearOptions = academicYears.map((y) => ({
      value: y.id,
      label: y.label || y.year || String(y.yearNumber || y.id),
    }));
    const sectionOptions = sections.map((s) => ({
      value: s.id,
      label: s.name,
    }));

    return (
      <div>
        <div className="mb-5">
          <button
            onClick={() => { setStep(STEPS.PERSONAL); setErrorMessage(''); }}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Academic Selection
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Choose your program, year, section and subjects.
          </p>
        </div>

        <StepIndicator />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Step 2 of 2 — Academic Details
        </p>

        <ErrorBanner
          message={errorMessage}
          onRetry={
            // Show retry only when programs failed to load and list is still empty
            programs.length === 0 && errorMessage ? loadPrograms : undefined
          }
        />

        <div className="space-y-3.5">
          {/* Program */}
          <div>
            {loadingPrograms ? (
              <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading programs…
              </div>
            ) : (
              <Select
                label="Program"
                placeholder="Select a program"
                required
                options={programOptions}
                value={selectedProgram}
                onChange={(e) => {
                  setSelectedProgram(e.target.value);
                  if (fieldErrors.program)
                    setFieldErrors((p) => ({ ...p, program: undefined }));
                }}
                error={fieldErrors.program}
                disabled={loadingPrograms || isLoading}
              />
            )}
            <FieldError msg={fieldErrors.program} />
          </div>

          {/* Academic Year */}
          <div>
            {loadingYears ? (
              <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading academic years…
              </div>
            ) : (
              <Select
                label="Academic Year"
                placeholder={selectedProgram ? 'Select an academic year' : 'Select a program first'}
                required
                options={yearOptions}
                value={selectedAcademicYear}
                onChange={(e) => {
                  setSelectedAcademicYear(e.target.value);
                  if (fieldErrors.academicYear)
                    setFieldErrors((p) => ({ ...p, academicYear: undefined }));
                }}
                error={fieldErrors.academicYear}
                disabled={!selectedProgram || loadingYears || isLoading}
              />
            )}
            <FieldError msg={fieldErrors.academicYear} />
          </div>

          {/* Section */}
          <div>
            {loadingSections ? (
              <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Loading sections…
              </div>
            ) : (
              <Select
                label="Section"
                placeholder={selectedAcademicYear ? 'Select a section' : 'Select an academic year first'}
                required
                options={sectionOptions}
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  if (fieldErrors.section)
                    setFieldErrors((p) => ({ ...p, section: undefined }));
                }}
                error={fieldErrors.section}
                disabled={!selectedAcademicYear || loadingSections || isLoading}
              />
            )}
            <FieldError msg={fieldErrors.section} />
          </div>

          {/* Subjects */}
          {loadingSubjects ? (
            <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading subjects…
            </div>
          ) : subjects.length > 0 ? (
            <div>
              <p className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Subjects
                <span className="text-rose-500 ml-1">*</span>
              </p>

              {/* Compulsory subjects */}
              {compulsorySubjects.length > 0 && (
                <div className="mb-2">
                  <p className="text-[10px] font-semibold uppercase text-emerald-700 mb-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Compulsory ({compulsorySubjects.length})
                  </p>
                  <div className="space-y-1">
                    {compulsorySubjects.map((subject) => (
                      <label
                        key={subject.id}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 cursor-default"
                      >
                        <input
                          type="checkbox"
                          checked
                          readOnly
                          className="w-3.5 h-3.5 accent-emerald-600"
                          aria-label={`${subject.name} (compulsory, cannot deselect)`}
                        />
                        <span className="text-xs text-slate-700 font-medium flex-1">
                          {subject.name}
                          {subject.code && (
                            <span className="ml-1.5 text-slate-400 font-normal">
                              ({subject.code})
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">
                          Compulsory
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Elective subjects */}
              {electiveSubjects.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase text-indigo-700 mb-1.5 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    Electives — select applicable ({electiveSubjects.length} available)
                  </p>
                  <div className="space-y-1">
                    {electiveSubjects.map((subject) => {
                      const isSelected = selectedSubjects.includes(subject.id);
                      return (
                        <label
                          key={subject.id}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'border-indigo-300 bg-indigo-50'
                              : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSubject(subject.id)}
                            className="w-3.5 h-3.5 accent-indigo-600"
                            aria-label={subject.name}
                          />
                          <span className="text-xs text-slate-700 font-medium flex-1">
                            {subject.name}
                            {subject.code && (
                              <span className="ml-1.5 text-slate-400 font-normal">
                                ({subject.code})
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                            Elective
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {fieldErrors.subjects && (
                <p className="mt-1.5 text-xs text-rose-600 font-medium">{fieldErrors.subjects}</p>
              )}
            </div>
          ) : selectedSection ? (
            <p className="text-xs text-slate-500 italic py-1">
              No subjects found for the selected section.
            </p>
          ) : null}

          <div className="pt-1">
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full justify-center py-2.5 shadow-md shadow-indigo-200"
              isLoading={isLoading}
              rightIcon={!isLoading && <ArrowRight className="w-4 h-4" />}
              onClick={handleRegisterSubmit}
              disabled={isLoading || loadingPrograms || loadingYears || loadingSections || loadingSubjects}
            >
              {isLoading ? 'Registering…' : 'Submit Registration'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Success
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
        <CheckCircle2 className="w-9 h-9 text-emerald-600" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 mb-2">Account Created!</h2>
      <p className="text-sm text-slate-600 mb-1">
        Your student account has been successfully registered.
      </p>
      <p className="text-xs text-slate-500 mb-6">
        You can now sign in with your institutional email and the password you set.
      </p>
      <Button
        type="button"
        variant="primary"
        size="md"
        className="w-full justify-center py-2.5 shadow-md shadow-indigo-200"
        onClick={onBackToLogin}
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Go to Sign In
      </Button>
    </div>
  );
};

export default StudentRegister;
