import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Grid,
  BookOpen,
  Filter,
  RefreshCw,
  Award,
  Calendar,
  Layers,
  ChevronRight,
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

// Attendance Percentage color helper
const getAttendanceBadgeVariant = (pct) => {
  if (pct >= 75) return 'success';
  if (pct >= 50) return 'warning';
  return 'error';
};

export const AttendanceSummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sessions List
  const [sessions, setSessions] = useState([]);
  const [assignmentsData, setAssignmentsData] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');

  // Selected Session Detail Modal
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [sectionStudents, setSectionStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('present'); // 'present' | 'absent'

  // ── Initial Fetch ───────────────────────────────────────────────────────────
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sessionsRes, assignRes] = await Promise.all([
        teacherService.getSessions({ limit: 100 }),
        teacherService.getAssignments().catch(() => null),
      ]);

      const sessList = sessionsRes?.data?.sessions || (Array.isArray(sessionsRes?.data) ? sessionsRes.data : []);
      setSessions(sessList);

      if (assignRes?.data) {
        setAssignmentsData(assignRes.data);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load attendance session summaries'));
    } finally {
      setLoading(false);
    }
  };

  // ── Open Session Detail Modal ───────────────────────────────────────────────
  const openSessionDetail = async (session) => {
    setSelectedSessionId(session.id);
    setIsDetailModalOpen(true);
    setLoadingDetail(true);
    setSessionDetail(null);
    setAttendanceRecords([]);
    setAttendanceSummary(null);
    setSectionStudents([]);
    setActiveTab('present');

    try {
      const [detailRes, attRes] = await Promise.all([
        teacherService.getSessionById(session.id),
        teacherService.getSessionAttendance(session.id, { limit: 100 }),
      ]);

      // teacherService returns response.data directly (the JSON body)
      // Backend shape: { success, data: { session, attendanceSummary } }
      // Fall back to the session row from the table if nested path missing
      const detail =
        detailRes?.data?.session ||
        detailRes?.session ||
        detailRes?.data ||
        session;

      const records =
        Array.isArray(attRes?.data) ? attRes.data :
        Array.isArray(attRes?.records) ? attRes.records :
        Array.isArray(attRes) ? attRes : [];

      const summary =
        detailRes?.data?.attendanceSummary ||
        detailRes?.attendanceSummary ||
        attRes?.pagination?.summary ||
        attRes?.summary ||
        null;

      console.log('[ViewSummary] detailRes:', detailRes);
      console.log('[ViewSummary] attRes:', attRes);
      console.log('[ViewSummary] resolved detail:', detail);
      console.log('[ViewSummary] resolved records:', records);
      console.log('[ViewSummary] resolved summary:', summary);

      setSessionDetail(detail);
      setAttendanceSummary(summary);
      setAttendanceRecords(records);

      // Fetch all enrolled students for the section to build the absent list
      const sectionId = detail?.section?.id || session?.section?.id;
      if (sectionId) {
        try {
          const studentsRes = await teacherService.getSectionStudents(sectionId);
          const allStudents =
            studentsRes?.data?.students ||
            studentsRes?.students ||
            (Array.isArray(studentsRes?.data) ? studentsRes.data : []);
          setSectionStudents(allStudents);
        } catch {
          // Non-critical — absent list will be empty if this fails
        }
      }
    } catch (err) {
      console.error('View Summary error:', err);
      // Still show the session data we already have from the table row
      setSessionDetail(session);
      toast.error(getErrorMessage(err, 'Failed to fetch full session details'));
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeSessionDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedSessionId(null);
    setSessionDetail(null);
    setAttendanceRecords([]);
    setAttendanceSummary(null);
    setSectionStudents([]);
    setActiveTab('present');
  };

  // ── Programs List for Filter Dropdown ───────────────────────────────────────
  const uniquePrograms = useMemo(() => {
    const map = new Map();
    sessions.forEach((s) => {
      if (s.program && !map.has(s.program.id)) {
        map.set(s.program.id, s.program);
      }
    });
    return Array.from(map.values());
  }, [sessions]);

  // ── Filtered Sessions ───────────────────────────────────────────────────────
  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Status filter
      if (statusFilter && s.status !== statusFilter) return false;
      // Program filter
      if (programFilter && s.program?.id !== programFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const subName = (s.subject?.name || '').toLowerCase();
        const subCode = (s.subject?.code || '').toLowerCase();
        const secName = (s.section?.name || '').toLowerCase();
        const progName = (s.program?.name || '').toLowerCase();
        return (
          subName.includes(q) ||
          subCode.includes(q) ||
          secName.includes(q) ||
          progName.includes(q)
        );
      }
      return true;
    });
  }, [sessions, statusFilter, programFilter, searchQuery]);

  // ── High-Level Statistics ───────────────────────────────────────────────────
  const totalSessions = sessions.length;
  const completedSessions = sessions.filter((s) => s.status === 'COMPLETED').length;
  const totalMarkedRecords = sessions.reduce(
    (acc, curr) => acc + (curr.totalAttendanceMarked || 0),
    0
  );

  // ── Main Sessions Table Columns ─────────────────────────────────────────────
  const sessionColumns = [
    {
      header: 'Date & Time',
      key: 'date',
      render: (row) => {
        const dt = new Date(row.sessionDate || row.startTime || row.createdAt);
        return (
          <div className="text-xs">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              {dt.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
            <div className="text-slate-500 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              {dt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Subject',
      key: 'subject',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.subject?.name || '—'}</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">
            {row.subject?.code || '—'} • {row.sessionType || 'REGULAR'}
          </div>
        </div>
      ),
    },
    {
      header: 'Program & Section',
      key: 'section',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{row.program?.code || '—'}</span>
          <span className="text-slate-400 mx-1.5">•</span>
          <Badge variant="primary" className="font-medium text-xs">
            Section {row.section?.name || 'A'}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge
          variant={
            row.status === 'COMPLETED'
              ? 'success'
              : row.status === 'ACTIVE'
              ? 'indigo'
              : 'error'
          }
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: 'Attendance Marked',
      key: 'marked',
      render: (row) => (
        <span className="font-bold text-slate-900 text-sm">
          {row.totalAttendanceMarked ?? 0} Students
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSessionDetail(row)}
            className="flex items-center gap-1.5 text-xs py-1.5 px-3"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            <span>View Summary</span>
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return <Loader fullPage message="Loading Attendance Summary & Logs..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={fetchInitialData} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <CalendarCheck className="w-6 h-6 text-indigo-600" />
            Attendance Summary
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Review completed attendance sessions, student attendance statistics, and session logs
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInitialData}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* ── Top Metric KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-500">
              Total Sessions Conducted
            </p>
            <p className="text-2xl font-bold text-indigo-900 mt-1">{totalSessions}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-indigo-600">
            <CalendarCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
              Completed Sessions
            </p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{completedSessions}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4.5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-500">
              Total Present Marked
            </p>
            <p className="text-2xl font-bold text-purple-900 mt-1">{totalMarkedRecords}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-purple-600">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Main Filter & Sessions Table Card ─────────────────────────────────── */}
      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[220px]">
            <Input
              placeholder="Search by subject or section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="w-52">
            <Select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              options={[
                { value: '', label: 'All Programs' },
                ...uniquePrograms.map((p) => ({
                  value: p.id,
                  label: `${p.name} (${p.code})`,
                })),
              ]}
            />
          </div>

          <div className="w-44">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'ACTIVE', label: 'Active (Live)' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
            />
          </div>
        </div>

        <CardContent className="p-0">
          <Table
            columns={sessionColumns}
            data={filteredSessions}
            emptyMessage={
              searchQuery || statusFilter || programFilter
                ? 'No attendance sessions matched your filters.'
                : 'No attendance sessions recorded yet. Start a session from the Dashboard.'
            }
          />
        </CardContent>
      </Card>

      {/* ── Detailed Session Attendance Modal ─────────────────────────────────── */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={closeSessionDetail}
        title="Session Attendance Summary"
        size="xl"
      >
        {loadingDetail ? (
          <div className="p-8">
            <Loader message="Loading session attendance logs..." />
          </div>
        ) : sessionDetail ? (
          <div className="space-y-5">
            {/* Session Info Header */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {sessionDetail.subject?.name || '—'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {sessionDetail.program?.name} ({sessionDetail.program?.code}) • Section{' '}
                    {sessionDetail.section?.name} • Year {sessionDetail.academicYear?.yearNumber}
                  </p>
                </div>
                <Badge
                  variant={
                    sessionDetail.status === 'COMPLETED'
                      ? 'success'
                      : sessionDetail.status === 'ACTIVE'
                      ? 'indigo'
                      : 'error'
                  }
                >
                  {sessionDetail.status}
                </Badge>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400">Date: </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(sessionDetail.sessionDate || sessionDetail.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Type: </span>
                  <span className="font-semibold text-slate-800">{sessionDetail.sessionType || 'REGULAR'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Start Time: </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(sessionDetail.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">End Time: </span>
                  <span className="font-semibold text-slate-800">
                    {new Date(sessionDetail.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Attendance Summary Stat Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg text-center">
                <p className="text-[11px] font-semibold text-indigo-500 uppercase">Total Enrolled</p>
                <p className="text-xl font-bold text-indigo-900 mt-0.5">
                  {attendanceSummary?.totalStudents ?? '—'}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-center">
                <p className="text-[11px] font-semibold text-emerald-500 uppercase">Present Marked</p>
                <p className="text-xl font-bold text-emerald-900 mt-0.5">
                  {attendanceSummary?.presentCount ?? attendanceRecords.length}
                </p>
              </div>
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg text-center">
                <p className="text-[11px] font-semibold text-rose-500 uppercase">Absent</p>
                <p className="text-xl font-bold text-rose-900 mt-0.5">
                  {attendanceSummary?.absentCount ??
                    Math.max(
                      0,
                      (attendanceSummary?.totalStudents || 0) - attendanceRecords.length
                    )}
                </p>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg text-center">
                <p className="text-[11px] font-semibold text-purple-500 uppercase">Attendance %</p>
                <p className="text-xl font-bold text-purple-900 mt-0.5">
                  {attendanceSummary?.attendancePercentage != null
                    ? `${attendanceSummary.attendancePercentage}%`
                    : '—'}
                </p>
              </div>
            </div>

            {/* Present / Absent Tabs */}
            {(() => {
              // Build sets for quick lookup
              const presentStudentIds = new Set(
                attendanceRecords.map((r) => r.studentId)
              );

              const absentStudents = sectionStudents.filter(
                (s) => !presentStudentIds.has(s.id)
              );

              const presentCount = attendanceRecords.length;
              const absentCount = absentStudents.length;

              return (
                <div>
                  {/* Tab Headers */}
                  <div className="flex border-b border-slate-200 mb-3">
                    <button
                      onClick={() => setActiveTab('present')}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'present'
                          ? 'border-emerald-500 text-emerald-700'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Present
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        activeTab === 'present' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {presentCount}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('absent')}
                      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                        activeTab === 'absent'
                          ? 'border-rose-500 text-rose-700'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      Absent
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                        activeTab === 'absent' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {absentCount}
                      </span>
                    </button>
                  </div>

                  {/* Present List */}
                  {activeTab === 'present' && (
                    <div className="border border-emerald-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                      {attendanceRecords.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-sm">
                          No students marked present in this session.
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-emerald-50 sticky top-0">
                            <tr>
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide">Enrollment No</th>
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide">Student</th>
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-emerald-700 uppercase tracking-wide">Marked At</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {attendanceRecords.map((row, idx) => (
                              <tr key={row.id || idx} className="hover:bg-emerald-50/40 transition-colors">
                                <td className="px-4 py-3 text-xs font-mono font-semibold text-slate-700">{row.enrollmentNumber || '—'}</td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                                      {(row.studentName || row.student?.user?.firstName || 'S')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-slate-900 text-xs">
                                        {row.studentName || `${row.student?.user?.firstName || ''} ${row.student?.user?.lastName || ''}`.trim() || 'Unknown'}
                                      </div>
                                      <div className="text-[11px] text-slate-400">
                                        {row.email || row.student?.user?.email || ''}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-600 font-medium">
                                  {row.markedAt
                                    ? new Date(row.markedAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                      })
                                    : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {/* Absent List */}
                  {activeTab === 'absent' && (
                    <div className="border border-rose-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                      {absentStudents.length === 0 && sectionStudents.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-sm">
                          Enrolled student data not available.
                        </div>
                      ) : absentStudents.length === 0 ? (
                        <div className="py-10 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                          All enrolled students were present!
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-rose-50 sticky top-0">
                            <tr>
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-rose-700 uppercase tracking-wide">Enrollment No</th>
                              <th className="text-left px-4 py-2.5 text-xs font-semibold text-rose-700 uppercase tracking-wide">Student</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {absentStudents.map((student, idx) => {
                              const user = student.user || {};
                              const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || student.name || 'Unknown';
                              const email = user.email || student.email || '';
                              const initial = name[0]?.toUpperCase() || 'S';
                              const enrollmentNo = student.enrollmentNumber || '—';
                              return (
                                <tr key={student.id || idx} className="hover:bg-rose-50/40 transition-colors">
                                  <td className="px-4 py-3 text-xs font-mono font-semibold text-slate-700">{enrollmentNo}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs shrink-0">
                                        {initial}
                                      </div>
                                      <div>
                                        <div className="font-semibold text-slate-900 text-xs">{name}</div>
                                        <div className="text-[11px] text-slate-400">{email}</div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={closeSessionDetail}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};

export default AttendanceSummary;
