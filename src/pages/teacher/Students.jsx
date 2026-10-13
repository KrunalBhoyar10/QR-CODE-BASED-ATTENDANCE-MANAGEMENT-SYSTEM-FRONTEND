import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Trash2,
  AlertTriangle,
  Users,
  Grid,
  UserCheck,
  Mail,
  Phone,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { teacherService } from '../../services/teacher.service';
import { getErrorMessage } from '../../utils/error';

export const TeacherStudents = () => {
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState(null);

  // Assignments / Hierarchical Scopes
  const [sectionsList, setSectionsList] = useState([]);

  // Selected Scope Filters
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Students Data
  const [students, setStudents] = useState([]);
  // attendanceMap: { [studentId]: { attendancePercentage, presentCount, totalSessions } }
  const [attendanceMap, setAttendanceMap] = useState({});

  // Subject filter
  const [subjectsList, setSubjectsList] = useState([]); // subjects for selected section
  const [selectedSubjectId, setSelectedSubjectId] = useState(''); // '' = overall
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Initial Load ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await teacherService.getAssignments();
      const rawData = res?.data || res;

      // Extract all assigned unique sections
      const extractedSections = [];
      const seenSectionIds = new Set();
      // Map: sectionId → [{ id, name, code }]
      const sectionSubjectsMap = {};

      if (rawData?.assignments && Array.isArray(rawData.assignments)) {
        rawData.assignments.forEach((a) => {
          if (a.section && !seenSectionIds.has(a.section.id)) {
            seenSectionIds.add(a.section.id);
            extractedSections.push({
              id: a.section.id,
              name: a.section.name,
              program: a.program,
              academicYear: a.academicYear,
              programId: a.program?.id,
              academicYearId: a.academicYear?.id,
            });
          }
          // Collect subjects per section
          if (a.section?.id && a.subject?.id) {
            if (!sectionSubjectsMap[a.section.id]) sectionSubjectsMap[a.section.id] = [];
            const already = sectionSubjectsMap[a.section.id].some(s => s.id === a.subject.id);
            if (!already) {
              sectionSubjectsMap[a.section.id].push({
                id: a.subject.id,
                name: a.subject.name,
                code: a.subject.code,
              });
            }
          }
        });
      } else if (rawData?.tree && Array.isArray(rawData.tree)) {
        rawData.tree.forEach((prog) => {
          prog.academicYears?.forEach((yr) => {
            yr.sections?.forEach((sec) => {
              const secId = sec.sectionId || sec.id;
              if (secId && !seenSectionIds.has(secId)) {
                seenSectionIds.add(secId);
                extractedSections.push({
                  id: secId,
                  name: sec.sectionName || sec.name,
                  program: { id: prog.programId, name: prog.programName, code: prog.programCode },
                  academicYear: { id: yr.academicYearId, yearNumber: yr.yearNumber, label: yr.label },
                  programId: prog.programId,
                  academicYearId: yr.academicYearId,
                });
              }
            });
          });
        });
      }

      setSectionsList(extractedSections);
      // Store map in a ref so section changes can update subjects dropdown
      fetchAssignments._subjectsMap = sectionSubjectsMap;

      // Auto-select first available section if present
      if (extractedSections.length > 0) {
        const firstSec = extractedSections[0];
        setSelectedSectionId(firstSec.id);
        if (firstSec.programId) setSelectedProgramId(firstSec.programId);
        const subs = sectionSubjectsMap[firstSec.id] || [];
        setSubjectsList(subs);
        setSelectedSubjectId('');
        await loadSectionStudents(firstSec.id);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load teacher assignments'));
    } finally {
      setLoading(false);
    }
  };

  const loadSectionStudents = async (sectionId) => {
    if (!sectionId) {
      setStudents([]);
      setAttendanceMap({});
      return;
    }
    setLoadingStudents(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        teacherService.getSectionStudents(sectionId),
        teacherService.getSectionStudentsAttendance(sectionId).catch(() => ({ data: {} })),
      ]);
      const studentData = Array.isArray(studentsRes?.data) ? studentsRes.data : (studentsRes?.data?.students || []);
      setStudents(studentData);
      setAttendanceMap(attendanceRes?.data || {});
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load students for selected section'));
      setStudents([]);
      setAttendanceMap({});
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSectionChange = async (e) => {
    const sectionId = e.target.value;
    setSelectedSectionId(sectionId);
    setSelectedSubjectId(''); // reset subject filter
    const sec = sectionsList.find((s) => s.id === sectionId);
    if (sec && sec.programId) setSelectedProgramId(sec.programId);
    // Update subjects dropdown for this section
    const subs = (fetchAssignments._subjectsMap || {})[sectionId] || [];
    setSubjectsList(subs);
    await loadSectionStudents(sectionId);
  };

  const handleProgramFilterChange = (e) => {
    const programId = e.target.value;
    setSelectedProgramId(programId);
    const availableSections = programId
      ? sectionsList.filter((s) => s.programId === programId)
      : sectionsList;

    if (availableSections.length > 0) {
      const firstSecId = availableSections[0].id;
      setSelectedSectionId(firstSecId);
      setSelectedSubjectId('');
      const subs = (fetchAssignments._subjectsMap || {})[firstSecId] || [];
      setSubjectsList(subs);
      loadSectionStudents(firstSecId);
    } else {
      setSelectedSectionId('');
      setStudents([]);
    }
  };

  // ── Subject filter change ───────────────────────────────────────────────────
  const handleSubjectChange = async (e) => {
    const subjectId = e.target.value;
    setSelectedSubjectId(subjectId);
    if (!selectedSectionId) return;
    setLoadingAttendance(true);
    try {
      if (!subjectId) {
        // Back to overall attendance
        const res = await teacherService.getSectionStudentsAttendance(selectedSectionId).catch(() => ({ data: {} }));
        setAttendanceMap(res?.data || {});
      } else {
        const res = await teacherService.getSectionStudentsSubjectAttendance(selectedSectionId, subjectId).catch(() => ({ data: {} }));
        setAttendanceMap(res?.data || {});
      }
    } catch {
      // silent
    } finally {
      setLoadingAttendance(false);
    }
  };

  // ── Delete Student ──────────────────────────────────────────────────────────
  const openDeleteModal = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setStudentToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    setDeleting(true);
    try {
      await teacherService.deleteStudent(studentToDelete.id);
      toast.success(
        `Student ${studentToDelete.user?.firstName || ''} ${studentToDelete.user?.lastName || ''} deleted successfully.`
      );
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete.id));
      closeDeleteModal();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete student'));
    } finally {
      setDeleting(false);
    }
  };

  // ── Unique Programs List for Filter Dropdown ────────────────────────────────
  const uniquePrograms = useMemo(() => {
    const map = new Map();
    sectionsList.forEach((s) => {
      if (s.program && !map.has(s.program.id)) {
        map.set(s.program.id, s.program);
      }
    });
    return Array.from(map.values());
  }, [sectionsList]);

  // ── Filtered Sections based on selected program ───────────────────────────
  const filteredSections = useMemo(() => {
    if (!selectedProgramId) return sectionsList;
    return sectionsList.filter((s) => s.programId === selectedProgramId);
  }, [sectionsList, selectedProgramId]);

  // ── Current Selected Section Metadata ───────────────────────────────────────
  const currentSectionMeta = useMemo(() => {
    return sectionsList.find((s) => s.id === selectedSectionId) || null;
  }, [sectionsList, selectedSectionId]);

  // ── Filtered Students by Search Query ───────────────────────────────────────
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    const q = searchQuery.toLowerCase().trim();
    return students.filter((s) => {
      const fullName = `${s.user?.firstName || ''} ${s.user?.lastName || ''}`.toLowerCase();
      const enroll = (s.enrollmentNumber || '').toLowerCase();
      const email = (s.user?.email || '').toLowerCase();
      const phone = (s.user?.phoneNumber || '').toLowerCase();
      return (
        fullName.includes(q) ||
        enroll.includes(q) ||
        email.includes(q) ||
        phone.includes(q)
      );
    });
  }, [students, searchQuery]);

  // ── Table Columns ───────────────────────────────────────────────────────────
  const columns = [
    {
      header: 'Student',
      key: 'student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
            {row.user?.firstName?.[0]?.toUpperCase() || 'S'}
          </div>
          <div>
            <div className="font-semibold text-slate-900">
              {row.user?.firstName} {row.user?.lastName}
            </div>
            <div className="text-xs text-slate-500">{row.user?.email || '—'}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Enrollment No.',
      key: 'enrollmentNumber',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">
          {row.enrollmentNumber || '—'}
        </span>
      ),
    },
    {
      header: 'Program → Section',
      key: 'section',
      render: (row) => {
        const prog = row.program?.code || currentSectionMeta?.program?.code || '—';
        const sec = row.section?.name || currentSectionMeta?.name || '—';
        return (
          <div className="text-xs">
            <span className="font-medium text-slate-800">{prog}</span>
            <span className="text-slate-400 mx-1.5">•</span>
            <span className="text-indigo-600 font-medium">Section {sec}</span>
          </div>
        );
      },
    },
    {
      header: selectedSubjectId
        ? `Attendance — ${subjectsList.find(s => s.id === selectedSubjectId)?.name || 'Subject'}`
        : 'Status & Attendance',
      key: 'status',
      render: (row) => {
        const isActive = row.user?.isActive !== false;
        const att = attendanceMap[row.id];
        const pct = att?.attendancePercentage ?? null;
        const pctColor = pct === null ? 'text-slate-400'
          : pct >= 75 ? 'text-emerald-600'
          : pct >= 50 ? 'text-amber-600'
          : 'text-rose-600';
        return (
          <div className="flex flex-col gap-1.5">
            <Badge variant={isActive ? 'success' : 'error'}>
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
            {loadingAttendance ? (
              <span className="text-[11px] text-slate-400 animate-pulse">Loading…</span>
            ) : pct !== null ? (
              <div className={`flex items-center gap-1 text-xs font-bold ${pctColor}`}>
                <span>{pct.toFixed(1)}%</span>
                <span className="text-slate-400 font-normal">
                  ({att.presentCount}/{att.totalSessions})
                </span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">—%</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <Button
            variant="danger"
            size="sm"
            onClick={() => openDeleteModal(row)}
            className="flex items-center gap-1.5 text-xs py-1.5 px-3"
            title="Delete Student"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <Loader fullPage message="Loading Students..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={fetchAssignments} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Enrolled Students</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            View, search, and manage students enrolled in your assigned sections
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadSectionStudents(selectedSectionId)}
          disabled={loadingStudents || !selectedSectionId}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loadingStudents ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* ── Metric Summary Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
              Enrolled in Section
            </p>
            <p className="text-2xl font-bold text-indigo-900 mt-1">{students.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Active Students
            </p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">
              {students.filter((s) => s.user?.isActive !== false).length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">
              Selected Section
            </p>
            <p className="text-lg font-bold text-purple-900 mt-1 truncate">
              {currentSectionMeta
                ? `${currentSectionMeta.program?.code || ''} - Sec ${currentSectionMeta.name}`
                : 'None'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-purple-600">
            <Grid className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Main Students Filter & Table Card ─────────────────────────────────── */}
      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[220px]">
            <Input
              placeholder="Search by name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="w-56">
            <Select
              value={selectedProgramId}
              onChange={handleProgramFilterChange}
              options={[
                { value: '', label: 'All Programs' },
                ...uniquePrograms.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.code})`,
                })),
              ]}
            />
          </div>
          <div className="w-56">
            <Select
              value={selectedSectionId}
              onChange={handleSectionChange}
              disabled={filteredSections.length === 0}
              options={filteredSections.map((s) => ({
                value: s.id,
                label: `Section ${s.name} (${s.program?.code || ''})`,
              }))}
            />
          </div>
          {/* Subject filter — only shown when section is selected */}
          {selectedSectionId && subjectsList.length > 0 && (
            <div className="w-64 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
              <Select
                value={selectedSubjectId}
                onChange={handleSubjectChange}
                disabled={loadingAttendance}
                options={[
                  { value: '', label: 'All Subjects (Overall)' },
                  ...subjectsList.map((s) => ({
                    value: s.id,
                    label: `${s.name}${s.code ? ` (${s.code})` : ''}`,
                  })),
                ]}
              />
            </div>
          )}
        </div>

        <CardContent className="p-0">
          <Table
            columns={columns}
            data={filteredStudents}
            isLoading={loadingStudents}
            emptyMessage={
              searchQuery
                ? `No students matched your search "${searchQuery}".`
                : sectionsList.length === 0
                ? 'No teaching assignments found.'
                : 'No students enrolled in this section.'
            }
          />
        </CardContent>
      </Card>

      {/* ── Delete Confirmation Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirm Student Deletion"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
            <div className="text-sm">
              <p className="font-bold text-rose-900">Permanent Action Warning</p>
              <p className="text-xs mt-0.5 text-rose-700">
                Deleting this student will permanently remove their enrollment record, login account,
                and attendance history from the system.
              </p>
            </div>
          </div>

          {studentToDelete && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Student Name:</span>
                <span className="font-bold text-slate-900">
                  {studentToDelete.user?.firstName} {studentToDelete.user?.lastName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Enrollment Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  {studentToDelete.enrollmentNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Enrollment No:</span>
                <span className="font-mono text-slate-700">
                  {studentToDelete.enrollmentNumber || '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Email:</span>
                <span className="text-slate-700">
                  {studentToDelete.user?.email || '—'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={closeDeleteModal}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              isLoading={deleting}
              className="flex items-center gap-1.5 shadow-sm font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Student</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeacherStudents;
