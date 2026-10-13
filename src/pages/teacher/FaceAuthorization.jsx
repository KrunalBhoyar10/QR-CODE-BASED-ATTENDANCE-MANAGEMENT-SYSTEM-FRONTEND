/**
 * FaceAuthorization.jsx — Teacher page
 *
 * Toggle switch per student:
 *   OFF → student cannot change face photo beyond their limit
 *   ON  → student is authorized for 1 additional face photo change
 *
 * When backend face endpoints are not yet implemented (404):
 *   - Toggle works locally in component state
 *   - API call is silently skipped
 *   - Student face-change page reads the same localStorage key as fallback
 */
import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Search, AlertTriangle,
  RefreshCw, Info, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../../components/ui/Card';
import { Button }    from '../../components/ui/Button';
import { Input }     from '../../components/ui/Input';
import { Select }    from '../../components/ui/Select';
import { Loader }    from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { teacherService } from '../../services/teacher.service';
import { getErrorMessage } from '../../utils/error';

// ── localStorage helpers (fallback when backend is not ready) ───────────────
const LS_KEY = 'face_auth_overrides'; // { [studentId]: boolean }

const readOverrides = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); }
  catch { return {}; }
};
const writeOverride = (studentId, value) => {
  const current = readOverrides();
  if (value) current[studentId] = true;
  else delete current[studentId];
  localStorage.setItem(LS_KEY, JSON.stringify(current));
};

// ── Toggle Switch UI ─────────────────────────────────────────────────────────
function ToggleSwitch({ enabled, onChange, loading }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => !loading && onChange(!enabled)}
      disabled={loading}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2
        focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        ${enabled ? 'bg-indigo-600' : 'bg-slate-200'}
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md
          transform transition-transform duration-200 ease-in-out
          ${enabled ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-3 h-3 text-white animate-spin" />
        </span>
      )}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function FaceAuthorization() {
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [assignmentsError,   setAssignmentsError]   = useState('');
  const [sections,    setSections]    = useState([]);
  const [selectedSection, setSelectedSection] = useState('');

  const [studentsLoading, setStudentsLoading] = useState(false);
  const [students,  setStudents]  = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // authorizedIds: Set of studentIds currently toggled ON
  const [authorizedIds, setAuthorizedIds] = useState(new Set());
  // togglingId: which student is currently having its toggle processed
  const [togglingId,   setTogglingId]   = useState(null);
  // whether backend face API is available
  const [backendAvailable, setBackendAvailable] = useState(null); // null=unknown, true, false

  // ── Load initial localStorage state ────────────────────────────────────────
  useEffect(() => {
    const overrides = readOverrides();
    setAuthorizedIds(new Set(Object.keys(overrides)));
  }, []);

  // ── Load sections ──────────────────────────────────────────────────────────
  useEffect(() => { loadSections(); }, []);

  const loadSections = async () => {
    setAssignmentsLoading(true);
    setAssignmentsError('');
    try {
      const res     = await teacherService.getAssignments();
      const rawData = res?.data || res;
      const seen    = new Set();
      const list    = [];

      const processAssignment = (a) => {
        if (a.section && !seen.has(a.section.id)) {
          seen.add(a.section.id);
          list.push({
            id:    a.section.id,
            label: `${a.program?.code || '?'} — ${a.section.name}`,
          });
        }
      };

      if (rawData?.assignments) rawData.assignments.forEach(processAssignment);
      else if (rawData?.tree) {
        rawData.tree.forEach((prog) =>
          prog.academicYears?.forEach((yr) =>
            yr.sections?.forEach((sec) =>
              processAssignment({ section: sec, program: prog })
            )
          )
        );
      }
      setSections(list);
    } catch (err) {
      setAssignmentsError(getErrorMessage(err, 'Failed to load sections.'));
    } finally {
      setAssignmentsLoading(false);
    }
  };

  // ── Load students when section changes ─────────────────────────────────────
  useEffect(() => {
    if (!selectedSection) { setStudents([]); return; }
    loadStudents(selectedSection);
  }, [selectedSection]);

  const loadStudents = async (sectionId) => {
    setStudentsLoading(true);
    try {
      const res  = await teacherService.getSectionStudents(sectionId);
      const list = res?.data?.students || res?.students || (Array.isArray(res?.data) ? res.data : []);
      setStudents(list);

      // Try to fetch backend face statuses; determine availability from first result
      if (list.length > 0) {
        try {
          const statusRes = await teacherService.getStudentFaceStatus(list[0].id);
          setBackendAvailable(true);
          // Seed authorizedIds from backend data
          const ids = new Set();
          await Promise.allSettled(list.map(async (s) => {
            try {
              const r = s.id === list[0].id ? statusRes : await teacherService.getStudentFaceStatus(s.id);
              const d = r?.data || r;
              if (d?.teacherAuthorized) ids.add(s.id);
            } catch {}
          }));
          setAuthorizedIds(ids);
        } catch (e) {
          if (e?.response?.status === 404 || e?.response?.status === 501) {
            setBackendAvailable(false);
            // Use localStorage overrides as source of truth
            const overrides = readOverrides();
            setAuthorizedIds(new Set(Object.keys(overrides)));
          }
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load students.'));
      setStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // ── Toggle handler ─────────────────────────────────────────────────────────
  const handleToggle = async (student, newValue) => {
    setTogglingId(student.id);

    // Optimistically update UI
    setAuthorizedIds((prev) => {
      const next = new Set(prev);
      if (newValue) next.add(student.id);
      else next.delete(student.id);
      return next;
    });

    // Always persist to localStorage as fallback
    writeOverride(student.id, newValue);

    if (backendAvailable) {
      // Try backend API
      try {
        if (newValue) {
          await teacherService.authorizeStudentFaceChange(student.id);
          toast.success(`Authorized ${getName(student)} to change their face photo.`);
        } else {
          await teacherService.revokeStudentFaceAuthorization(student.id);
          toast.success(`Revoked face change authorization for ${getName(student)}.`);
        }
      } catch (err) {
        // Roll back on failure
        setAuthorizedIds((prev) => {
          const next = new Set(prev);
          if (newValue) next.delete(student.id);
          else next.add(student.id);
          return next;
        });
        writeOverride(student.id, !newValue);
        toast.error(getErrorMessage(err, 'Failed to update authorization.'));
      }
    } else {
      // Backend not available — localStorage only, show confirmation
      const name = getName(student);
      if (newValue) {
        toast.success(`${name} can now change their face photo once.`);
      } else {
        toast(`Removed authorization for ${name}.`);
      }
    }

    setTogglingId(null);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getName = (s) => {
    const u = s.user || {};
    return `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unknown';
  };

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase();
    return students.filter((s) => {
      const name  = getName(s).toLowerCase();
      const email = (s.user?.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [students, searchQuery]);

  const authorizedCount = students.filter((s) => authorizedIds.has(s.id)).length;

  // ── Render ─────────────────────────────────────────────────────────────────
  if (assignmentsLoading) return <Loader fullPage message="Loading sections…" />;
  if (assignmentsError)   return <div className="p-6"><ErrorState message={assignmentsError} onRetry={loadSections} /></div>;

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Face Photo Authorization
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Toggle authorization to let a specific student update their face photo.
          </p>
        </div>
        <Button
          variant="outline" size="sm"
          onClick={() => selectedSection && loadStudents(selectedSection)}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Refresh
        </Button>
      </div>

      {/* Info callout */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <p className="font-semibold text-slate-800">How it works</p>
          <ul className="space-y-0.5 list-disc list-inside text-slate-600">
            <li>Each student can change their face photo a maximum of <strong>2 times</strong> on their own.</li>
            <li><strong>Toggle ON</strong> to authorize a specific student for 1 additional change.</li>
            <li><strong>Toggle OFF</strong> to revoke the authorization before they use it.</li>
            <li>Authorization is automatically consumed after the student's next successful update.</li>
          </ul>
        </div>
      </div>

      {/* Backend unavailable notice */}
      {backendAvailable === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-semibold">Backend face API not yet implemented</p>
            <p className="mt-0.5 text-amber-700">
              Authorizations are saved locally on this browser for now.
              They will sync to the backend once the face endpoints are added.
            </p>
          </div>
        </div>
      )}

      {/* Section + search */}
      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Select Section
              </label>
              <Select
                value={selectedSection}
                onChange={(e) => { setSelectedSection(e.target.value); setSearchQuery(''); }}
                options={[
                  { value: '', label: '— Choose a section —' },
                  ...sections.map((s) => ({ value: s.id, label: s.label })),
                ]}
              />
            </div>
            {selectedSection && (
              <div className="flex-1 min-w-0">
                <Input
                  placeholder="Search students…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      {selectedSection && students.length > 0 && (
        <div className="flex gap-4">
          <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wide">Total Students</p>
              <p className="text-lg font-bold text-slate-900">{students.length}</p>
            </div>
          </div>
          <div className="bg-white border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-[11px] text-indigo-500 uppercase font-semibold tracking-wide">Authorized</p>
              <p className="text-lg font-bold text-indigo-700">{authorizedCount}</p>
            </div>
          </div>
        </div>
      )}

      {/* Student list */}
      {selectedSection && (
        <Card>
          {studentsLoading ? (
            <CardContent className="py-12 flex justify-center">
              <Loader message="Loading students…" />
            </CardContent>
          ) : filteredStudents.length === 0 ? (
            <CardContent className="py-12 text-center text-slate-400 text-sm">
              {students.length === 0 ? 'No students in this section.' : 'No students match your search.'}
            </CardContent>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredStudents.map((student) => {
                const name      = getName(student);
                const email     = student.user?.email || '';
                const initial   = name[0]?.toUpperCase() || 'S';
                const isAuth    = authorizedIds.has(student.id);
                const isToggling = togglingId === student.id;

                return (
                  <div
                    key={student.id}
                    className={`flex items-center justify-between gap-4 px-5 py-4 transition-colors ${
                      isAuth ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60'
                    }`}
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                        isAuth ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{name}</p>
                        <p className="text-xs text-slate-400 truncate">{email}</p>
                      </div>
                    </div>

                    {/* Status label + toggle */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-semibold transition-colors ${
                        isAuth ? 'text-indigo-600' : 'text-slate-400'
                      }`}>
                        {isAuth ? 'Authorized' : 'Not authorized'}
                      </span>
                      <ToggleSwitch
                        enabled={isAuth}
                        onChange={(val) => handleToggle(student, val)}
                        loading={isToggling}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
