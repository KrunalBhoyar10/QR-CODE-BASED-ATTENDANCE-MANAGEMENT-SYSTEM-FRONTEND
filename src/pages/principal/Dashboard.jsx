import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { principalService } from '../../services/principal.service';
import { getErrorMessage } from '../../utils/error';
import {
  DepartmentDetail,
  ProgramDetail,
  YearDetail,
  SectionDetail,
} from './Departments';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [deptAttendance, setDeptAttendance] = useState([]);

  // Drill-down view states for departments directly on Dashboard: 'list' | 'dept' | 'program' | 'year' | 'section'
  const [view, setView] = useState('list');
  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, deptsAttendanceRes, deptsListRes] =
        await Promise.all([
          principalService.getAttendanceSummary().catch(() => ({ data: null })),
          principalService.getDepartmentWiseAttendance().catch(() => ({ data: [] })),
          principalService.getDepartments().catch(() => ({ data: [] })),
        ]);

      setStats(summaryRes?.data || null);
      setDeptAttendance(Array.isArray(deptsAttendanceRes?.data) ? deptsAttendanceRes.data : []);
      setDepartments(Array.isArray(deptsListRes?.data) ? deptsListRes.data : []);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const goToDept = (dept) => {
    setSelectedDept(dept);
    setSelectedProgram(null);
    setSelectedYear(null);
    setSelectedSection(null);
    setView('dept');
  };

  const goToProgram = (prog) => {
    setSelectedProgram(prog);
    setSelectedYear(null);
    setSelectedSection(null);
    setView('program');
  };

  const goToYear = (year) => {
    setSelectedYear(year);
    setSelectedSection(null);
    setView('year');
  };

  const goToSection = (sec) => {
    setSelectedSection(sec);
    setView('section');
  };

  const goToList = () => {
    setView('list');
    setSelectedDept(null);
    setSelectedProgram(null);
    setSelectedYear(null);
    setSelectedSection(null);
  };

  const goBackToDept = () => {
    setSelectedProgram(null);
    setSelectedYear(null);
    setSelectedSection(null);
    setView('dept');
  };

  const goBackToProgram = () => {
    setSelectedYear(null);
    setSelectedSection(null);
    setView('program');
  };

  const goBackToYear = () => {
    setSelectedSection(null);
    setView('year');
  };

  if (loading) {
    return <Loader fullPage message="Loading dashboard statistics & departments..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState title="Dashboard Error" message={error} onRetry={fetchDashboardData} />
      </div>
    );
  }

  const totalDeptsCount = departments.length || deptAttendance.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Principal Dashboard</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Overview of institutional attendance, academic departments, and metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {view !== 'list' && (
            <Button variant="outline" size="sm" onClick={goToList}>
              ← Back to Overview
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={fetchDashboardData} className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Top Metric KPI Cards (2 Cards) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Students */}
        <Card className="bg-white border-l-4 border-l-indigo-500 shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1.5">
                  {stats?.totalStudents || 0}
                </p>
              </div>
              <div className="p-2.5 bg-indigo-50 rounded-xl">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Departments */}
        <Card className="bg-white border-l-4 border-l-purple-500 shadow-sm">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Departments</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-purple-700 mt-1.5">
                  {totalDeptsCount}
                </p>
              </div>
              <div className="p-2.5 bg-purple-50 rounded-xl">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── INTERACTIVE DEPARTMENT EXPLORER ON DASHBOARD ──────────────────────── */}
      {view === 'list' ? (
        <Card className="shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Academic Departments
              </CardTitle>
              <Badge variant="indigo" className="text-xs">
                {totalDeptsCount} Departments
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            {departments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Building2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No departments found.</p>
                <p className="text-xs mt-1">Departments will appear once configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => {
                  const att = deptAttendance.find(
                    (a) => a.id === dept.id || a.code === dept.code || a.name === dept.name
                  );
                  const programsCount = dept._count?.programs ?? 0;
                  const studentsCount = dept._count?.students ?? att?.totalStudents ?? 0;
                  const teachersCount = dept._count?.teachers ?? 0;

                  return (
                    <button
                      key={dept.id}
                      onClick={() => goToDept(dept)}
                      className="text-left p-5 bg-white border border-slate-200/90 rounded-xl hover:border-indigo-400 hover:shadow-md transition-all group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
                          <Building2 className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md uppercase tracking-wide">
                            {dept.code}
                          </span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors leading-snug">
                        {dept.name}
                      </h3>

                      {dept.hod ? (
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <span className="text-slate-400">HOD:</span>
                          <span className="font-medium text-slate-700">
                            {dept.hod.firstName} {dept.hod.lastName}
                          </span>
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600 mt-1 font-medium">
                          No HOD assigned
                        </p>
                      )}

                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 text-[11px] text-slate-500 text-center">
                        <div className="bg-slate-50 rounded-lg p-1.5">
                          <p className="font-bold text-slate-800 text-xs">{programsCount}</p>
                          <p className="text-[10px] text-slate-400">Programs</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-1.5">
                          <p className="font-bold text-slate-800 text-xs">{studentsCount}</p>
                          <p className="text-[10px] text-slate-400">Students</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-1.5">
                          <p className="font-bold text-slate-800 text-xs">{teachersCount}</p>
                          <p className="text-[10px] text-slate-400">Faculty</p>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                        <span>Explore Department</span>
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : view === 'dept' && selectedDept ? (
        <Card className="shadow-sm p-6">
          <DepartmentDetail
            dept={selectedDept}
            onBack={goToList}
            onSelectProgram={goToProgram}
          />
        </Card>
      ) : view === 'program' && selectedProgram && selectedDept ? (
        <Card className="shadow-sm p-6">
          <ProgramDetail
            program={selectedProgram}
            dept={selectedDept}
            deptAttendance={deptAttendance}
            onBack={goBackToDept}
            onSelectYear={goToYear}
          />
        </Card>
      ) : view === 'year' && selectedYear && selectedProgram && selectedDept ? (
        <Card className="shadow-sm p-6">
          <YearDetail
            year={selectedYear}
            program={selectedProgram}
            dept={selectedDept}
            onBack={goToList}
            onBackToProgram={goBackToDept}
            onSelectSection={goToSection}
          />
        </Card>
      ) : view === 'section' && selectedSection && selectedYear && selectedProgram && selectedDept ? (
        <Card className="shadow-sm p-6">
          <SectionDetail
            section={selectedSection}
            year={selectedYear}
            program={selectedProgram}
            dept={selectedDept}
            onBackToList={goToList}
            onBackToDept={goBackToDept}
            onBackToProgram={goBackToProgram}
            onBackToYear={goBackToYear}
          />
        </Card>
      ) : null}

    </div>
  );
};

export default Dashboard;
