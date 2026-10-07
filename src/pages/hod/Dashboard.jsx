import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, UserCheck, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { hodService } from '../../services/hod.service';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [programAttendance, setProgramAttendance] = useState([]);
  const [lowAttendanceStats, setLowAttendanceStats] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [summary, programs, lowAttendance] = await Promise.all([
          hodService.getAttendanceSummary(),
          hodService.getProgramAttendance(),
          hodService.getLowAttendance({ threshold: 75 })
        ]);

        setStats(summary.data);
        setProgramAttendance(programs.data);
        setLowAttendanceStats(lowAttendance.data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <Loader fullPage message="Loading department statistics..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HOD Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your department's attendance and metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-indigo-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Students</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats?.totalStudents || 0}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-xl">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Overall Attendance</p>
                <p className="text-3xl font-bold text-emerald-600 mt-2">
                  {stats?.overallPercentage != null ? `${parseFloat(stats.overallPercentage).toFixed(2)}%` : '0%'}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Present Today</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats?.presentCount || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Programs</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{programAttendance?.length || 0}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program-wise Attendance */}
        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-500" />
              Program Attendance (Today)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            <div className="divide-y divide-slate-100">
              {programAttendance?.length > 0 ? (
                programAttendance.map((prog) => (
                  <div key={prog.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-900">{prog.name}</p>
                      <p className="text-sm text-slate-500">{prog.code}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${parseFloat(prog.attendancePercentage) < 75 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {parseFloat(prog.attendancePercentage).toFixed(1)}%
                      </p>
                      <p className="text-xs text-slate-400">
                        {prog.presentCount} / {prog.totalStudents} Present
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No attendance data available for today.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Low Attendance Alert */}
        <Card className="shadow-sm border border-amber-200">
          <CardHeader className="border-b border-amber-100 pb-4 bg-amber-50/50 rounded-t-xl">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-800">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Low Attendance Watchlist (&lt;75%)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-96 overflow-y-auto">
            <div className="divide-y divide-slate-100">
              {lowAttendanceStats?.students?.slice(0, 5).map((student) => (
                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900">{student.user.firstName} {student.user.lastName}</p>
                    <p className="text-xs text-slate-500">
                      {student.enrollmentNumber} • {student.section.program.name} ({student.section.academicYear.year})
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                      {parseFloat(student.attendancePercentage).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
              {(!lowAttendanceStats?.students || lowAttendanceStats.students.length === 0) && (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No students currently below the threshold. Excellent!
                </div>
              )}
              {lowAttendanceStats?.students?.length > 5 && (
                <div className="p-3 text-center border-t border-slate-100 bg-slate-50">
                  <span className="text-xs font-medium text-indigo-600 hover:text-indigo-700 cursor-pointer">
                    View all {lowAttendanceStats.totalStudents} students
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
