import React, { useState, useEffect } from 'react';
import { Users, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { hodService } from '../../services/hod.service';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programList, setProgramList] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const progListRes = await hodService.listPrograms({ limit: 100 });
        const rawProgs = Array.isArray(progListRes?.data?.programs) ? progListRes.data.programs
          : Array.isArray(progListRes?.data) ? progListRes.data
          : Array.isArray(progListRes?.programs) ? progListRes.programs
          : Array.isArray(progListRes) ? progListRes : [];
        setProgramList(rawProgs);
      } catch (err) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) return <Loader fullPage message="Loading students data..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={() => window.location.reload()} /></div>;

  // Calculate total students across all programs
  const totalStudents = programList.reduce((acc, p) => acc + (p._count?.students || 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HOD Dashboard</h1>
        <p className="text-slate-500 mt-1">Student Strength Overview</p>
      </div>

      {/* 1. Total Students (All Programs) */}
      <Card className="border-l-4 border-l-indigo-600 shadow-sm">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Total Students (All Programs)</p>
              <p className="text-4xl font-black text-slate-900 mt-2">{totalStudents}</p>
              <p className="text-xs text-indigo-600 font-semibold mt-1">Total Enrolled Students Across All Programs</p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-2xl">
              <Users className="w-8 h-8 text-indigo-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Program-wise Total Students */}
      <Card className="shadow-sm border border-slate-200">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Program-wise Total Students
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programList.length > 0 ? (
              programList.map((prog, idx) => {
                const count = prog._count?.students ?? 0;
                return (
                  <div
                    key={prog.id || idx}
                    className="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-base">{prog.name}</h3>
                        {prog.code && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {prog.code}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Program</p>
                    </div>

                    <div className="text-right">
                      <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="text-xl font-black text-indigo-900">{count}</span>
                        <span className="text-xs font-bold text-indigo-700">Students</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center text-slate-400 py-6 text-sm">
                No programs found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
