import React, { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { hodService } from '../../services/hod.service';

const Attendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('programs');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      let res;
      switch (activeTab) {
        case 'programs': res = await hodService.getProgramAttendance(params); break;
        case 'years': res = await hodService.getAcademicYearAttendance(params); break;
        case 'sections': res = await hodService.getSectionAttendance(params); break;
        case 'subjects': res = await hodService.getSubjectAttendance(params); break;
        case 'low': res = await hodService.getLowAttendance({ ...params, threshold: 75 }); break;
        default: res = { data: [] };
      }
      setData(res.data?.students || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const getColumns = () => {
    if (activeTab === 'programs') {
      return [
        { header: 'Program', accessor: r => r.name },
        { header: 'Code', accessor: r => r.code },
        { header: 'Students', accessor: r => r.totalStudents ?? '—' },
        { header: 'Attendance %', accessor: r => <Badge variant={parseFloat(r.attendancePercentage) >= 75 ? 'success' : 'warning'}>{parseFloat(r.attendancePercentage || 0).toFixed(2)}%</Badge> }
      ];
    }
    if (activeTab === 'years') {
      return [
        { header: 'Program', accessor: r => r.program?.name ?? '—' },
        { header: 'Year', accessor: r => `Year ${r.year}` },
        { header: 'Students', accessor: r => r.totalStudents ?? '—' },
        { header: 'Attendance %', accessor: r => <Badge variant={parseFloat(r.attendancePercentage) >= 75 ? 'success' : 'warning'}>{parseFloat(r.attendancePercentage || 0).toFixed(2)}%</Badge> }
      ];
    }
    if (activeTab === 'sections') {
      return [
        { header: 'Section', accessor: r => `Section ${r.name}` },
        { header: 'Year / Program', accessor: r => `${r.academicYear?.program?.name ?? ''} – Year ${r.academicYear?.year ?? ''}` },
        { header: 'Students', accessor: r => r.totalStudents ?? '—' },
        { header: 'Attendance %', accessor: r => <Badge variant={parseFloat(r.attendancePercentage) >= 75 ? 'success' : 'warning'}>{parseFloat(r.attendancePercentage || 0).toFixed(2)}%</Badge> }
      ];
    }
    if (activeTab === 'subjects') {
      return [
        { header: 'Subject', accessor: r => r.name },
        { header: 'Code', accessor: r => r.code },
        { header: 'Attendance %', accessor: r => <Badge variant={parseFloat(r.attendancePercentage) >= 75 ? 'success' : 'warning'}>{parseFloat(r.attendancePercentage || 0).toFixed(2)}%</Badge> }
      ];
    }
    if (activeTab === 'low') {
      return [
        { header: 'Student', accessor: r => `${r.user.firstName} ${r.user.lastName}` },
        { header: 'Enrollment', accessor: r => r.enrollmentNumber },
        { header: 'Section', accessor: r => `${r.section?.academicYear?.program?.name ?? ''} / Section ${r.section?.name ?? ''}` },
        { header: 'Attendance %', accessor: r => <Badge variant="error">{parseFloat(r.attendancePercentage || 0).toFixed(2)}%</Badge> }
      ];
    }
    return [];
  };

  const tabs = [
    { id: 'programs', label: 'Programs' },
    { id: 'years', label: 'Academic Years' },
    { id: 'sections', label: 'Sections' },
    { id: 'subjects', label: 'Subjects' },
    { id: 'low', label: 'Low Attendance (<75%)', icon: AlertTriangle }
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Explorer</h1>
        <p className="text-slate-500 mt-1">Detailed attendance view across your department</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); fetchData(); }}
            className="flex flex-wrap gap-4 items-end"
          >
            <div className="flex-1 min-w-[180px]">
              <Input type="date" label="Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1 min-w-[180px]">
              <Input type="date" label="End Date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <Button type="submit" leftIcon={<CalendarCheck className="w-4 h-4" />}>Filter</Button>
            <Button type="button" variant="outline" onClick={() => { setStartDate(''); setEndDate(''); }}>Clear</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px px-4 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-5 border-b-2 font-medium text-sm flex items-center gap-1.5 transition-colors ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        <CardContent className="p-0">
          {loading
            ? <Loader message="Loading..." className="py-12" />
            : error
              ? <ErrorState message={error} onRetry={fetchData} className="py-12" />
              : <Table columns={getColumns()} data={Array.isArray(data) ? data : []}
                  emptyMessage={<div className="p-8 text-center text-slate-500 text-sm">No data for the selected filter.</div>} />
          }
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
