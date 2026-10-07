import React, { useState, useEffect } from 'react';
import { CalendarCheck, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { principalService } from '../../services/principal.service';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

const Attendance = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('departments');
  const [data, setData] = useState([]);
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchAttendanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      let res;
      switch (activeTab) {
        case 'departments':
          res = await principalService.getDepartmentWiseAttendance(params);
          break;
        case 'programs':
          res = await principalService.getProgramWiseAttendance(params);
          break;
        case 'low-attendance':
          res = await principalService.getLowAttendance({ ...params, threshold: 75 });
          break;
        default:
          res = { data: [] };
      }
      // Depending on the endpoint, it might return an array directly or an object with array inside.
      setData(res.data?.students || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [activeTab]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchAttendanceData();
  };

  const getColumns = () => {
    if (activeTab === 'departments') {
      return [
        { header: 'Department', accessor: (row) => row.name },
        { header: 'Code', accessor: (row) => row.code },
        { header: 'Total Students', accessor: (row) => row.totalStudents },
        { header: 'Present', accessor: (row) => row.presentCount },
        { 
          header: 'Percentage', 
          accessor: (row) => (
            <Badge variant={parseFloat(row.attendancePercentage) >= 75 ? 'success' : 'warning'}>
              {parseFloat(row.attendancePercentage).toFixed(2)}%
            </Badge>
          ) 
        },
      ];
    }
    if (activeTab === 'programs') {
      return [
        { header: 'Program', accessor: (row) => row.name },
        { header: 'Code', accessor: (row) => row.code },
        { header: 'Department', accessor: (row) => row.department?.name || 'N/A' },
        { header: 'Total Students', accessor: (row) => row.totalStudents },
        { 
          header: 'Percentage', 
          accessor: (row) => (
            <Badge variant={parseFloat(row.attendancePercentage) >= 75 ? 'success' : 'warning'}>
              {parseFloat(row.attendancePercentage).toFixed(2)}%
            </Badge>
          ) 
        },
      ];
    }
    if (activeTab === 'low-attendance') {
      return [
        { 
          header: 'Student', 
          accessor: (row) => `${row.user.firstName} ${row.user.lastName}` 
        },
        { header: 'Enrollment', accessor: (row) => row.enrollmentNumber },
        { header: 'Section', accessor: (row) => `${row.section.program.name} - ${row.section.name}` },
        { 
          header: 'Percentage', 
          accessor: (row) => (
            <Badge variant="error">
              {parseFloat(row.attendancePercentage).toFixed(2)}%
            </Badge>
          ) 
        },
      ];
    }
    return [];
  };

  const tabs = [
    { id: 'departments', label: 'Department-wise' },
    { id: 'programs', label: 'Program-wise' },
    { id: 'low-attendance', label: 'Low Attendance (< 75%)', icon: AlertTriangle },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Explorer</h1>
        <p className="text-slate-500 mt-1">Detailed attendance breakdowns across the institution</p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <form onSubmit={handleApplyFilters} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Input
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button type="submit" leftIcon={<CalendarCheck className="w-4 h-4" />}>
              Filter
            </Button>
            <Button type="button" variant="outline" onClick={() => { setStartDate(''); setEndDate(''); fetchAttendanceData(); }}>
              Clear
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="border-b border-slate-200">
          <nav className="flex -mb-px px-4 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
        
        <CardContent className="p-0">
          {loading ? (
            <Loader message="Loading attendance data..." className="py-12" />
          ) : error ? (
            <ErrorState message={error} onRetry={fetchAttendanceData} className="py-12" />
          ) : (
            <Table
              columns={getColumns()}
              data={Array.isArray(data) ? data : []}
              emptyMessage={
                <div className="p-8 text-center text-slate-500">
                  No attendance records found for the selected criteria.
                </div>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Attendance;
