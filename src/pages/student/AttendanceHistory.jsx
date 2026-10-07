import React, { useEffect, useState, useCallback } from 'react';
import {
  Clock, Filter, Search, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, MapPin, QrCode,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import studentService from '../../services/student.service';
import { getErrorMessage } from '../../utils/error';

const STATUS_META = {
  PRESENT: { color: 'emerald', icon: CheckCircle2, label: 'Present' },
  ABSENT:  { color: 'rose',    icon: XCircle,      label: 'Absent'  },
  LATE:    { color: 'amber',   icon: Clock,        label: 'Late'    },
  EXCUSED: { color: 'sky',     icon: CheckCircle2, label: 'Excused' },
};

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '–';
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '–';

export default function AttendanceHistory() {
  const [records,    setRecords]    = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalCount: 0, totalPages: 1 });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  const [filters, setFilters] = useState({
    status:    '',
    startDate: '',
    endDate:   '',
    search:    '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const fetch = useCallback((p = 1, f = filters) => {
    setLoading(true);
    setError(null);
    const params = { page: p, limit: 20 };
    if (f.status)    params.status    = f.status;
    if (f.startDate) params.startDate = f.startDate;
    if (f.endDate)   params.endDate   = f.endDate;

    studentService.getAttendanceHistory(params)
      .then(({ records: r, pagination: pg }) => {
        let filtered = r;
        if (f.search) {
          const q = f.search.toLowerCase();
          filtered = r.filter((rec) =>
            rec.session?.subject?.name?.toLowerCase().includes(q) ||
            rec.session?.section?.name?.toLowerCase().includes(q)
          );
        }
        setRecords(filtered);
        setPagination(pg || { page: p, limit: 20, totalCount: filtered.length, totalPages: 1 });
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(1); }, []);

  const handleFilterApply = () => { setPage(1); fetch(1, filters); setShowFilters(false); };
  const handleFilterReset = () => {
    const blank = { status: '', startDate: '', endDate: '', search: '' };
    setFilters(blank);
    setPage(1);
    fetch(1, blank);
    setShowFilters(false);
  };
  const goPage = (p) => { setPage(p); fetch(p); };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Attendance History</h1>
          <p className="text-sm text-slate-500 mt-1">Complete record of all your attendance entries.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          leftIcon={<Filter className="w-4 h-4" />}
        >
          Filters
        </Button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <Card>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Search</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Subject or section…"
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="">All statuses</option>
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="LATE">Late</option>
                  <option value="EXCUSED">Excused</option>
                </select>
              </div>

              {/* Start date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">From date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.startDate}
                  onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>

              {/* End date */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">To date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={filters.endDate}
                  onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleFilterApply}>Apply</Button>
              <Button size="sm" variant="secondary" onClick={handleFilterReset}>Reset</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <Loader message="Loading history…" />
      ) : records.length === 0 ? (
        <EmptyState icon={Clock} title="No records found" description="No attendance history matches your current filters." />
      ) : (
        <>
          {/* Table card */}
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {['Date', 'Subject', 'Program / Year', 'Section', 'Status', 'Marked Via', 'Time'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {records.map((rec) => {
                    const meta  = STATUS_META[rec.status] || STATUS_META.ABSENT;
                    const Icon  = meta.icon;
                    return (
                      <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-700 font-medium">
                          {fmt(rec.session?.sessionDate)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs font-semibold text-slate-900">{rec.session?.subject?.name ?? '–'}</p>
                          {rec.session?.subject?.code && (
                            <p className="text-[10px] text-slate-400">{rec.session.subject.code}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                          {rec.session?.program?.name ?? '–'}
                          {rec.session?.academicYear?.label && (
                            <span className="ml-1 text-slate-400">· {rec.session.academicYear.label}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                          {rec.session?.section?.name ?? '–'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium`}>
                            <Icon className={`w-3.5 h-3.5 text-${meta.color}-500`} />
                            <Badge variant={meta.color} size="sm">{meta.label}</Badge>
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            {rec.markedVia === 'QR_SCAN' && <QrCode className="w-3.5 h-3.5 text-indigo-400" />}
                            {rec.markedVia === 'QR_SCAN' ? 'QR Scan' : rec.markedVia ?? '–'}
                          </span>
                          {rec.locationLatitude && rec.locationLongitude && (
                            <span className="ml-1 text-slate-400">
                              <MapPin className="w-3 h-3 inline" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                          {fmtTime(rec.markedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  {(page - 1) * pagination.limit + 1}–{Math.min(page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary" size="sm"
                    disabled={page <= 1}
                    onClick={() => goPage(page - 1)}
                    leftIcon={<ChevronLeft className="w-4 h-4" />}
                  >
                    Prev
                  </Button>
                  <Button
                    variant="secondary" size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => goPage(page + 1)}
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
