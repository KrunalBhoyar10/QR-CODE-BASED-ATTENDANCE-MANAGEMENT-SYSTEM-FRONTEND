import React, { useState, useEffect } from 'react';
import { Building2, ChevronRight, BookOpen, Layers, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { principalService } from '../../services/principal.service';
import { Badge } from '../../components/ui/Badge';

const Departments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [departments, setDepartments] = useState([]);
  
  // Drill-down states
  const [selectedDept, setSelectedDept] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);

  const [selectedProgram, setSelectedProgram] = useState(null);
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);

  const [selectedYear, setSelectedYear] = useState(null);
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await principalService.getDepartments();
      setDepartments(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDept = async (dept) => {
    setSelectedDept(dept);
    setSelectedProgram(null);
    setSelectedYear(null);
    setPrograms([]);
    setAcademicYears([]);
    setSections([]);

    setLoadingPrograms(true);
    try {
      const res = await principalService.getProgramsByDepartment(dept.id);
      setPrograms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const handleSelectProgram = async (program) => {
    setSelectedProgram(program);
    setSelectedYear(null);
    setAcademicYears([]);
    setSections([]);

    setLoadingYears(true);
    try {
      const res = await principalService.getAcademicYearsByProgram(program.id);
      setAcademicYears(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingYears(false);
    }
  };

  const handleSelectYear = async (year) => {
    setSelectedYear(year);
    setSections([]);

    setLoadingSections(true);
    try {
      const res = await principalService.getSectionsByAcademicYear(year.id);
      setSections(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSections(false);
    }
  };

  if (loading) return <Loader fullPage message="Loading academic structure..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchDepartments} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Hierarchy</h1>
        <p className="text-slate-500 mt-1">Browse departments, programs, and sections</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Departments Column */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Departments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            <div className="divide-y divide-slate-100">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => handleSelectDept(dept)}
                  className={`w-full text-left p-4 flex items-center justify-between transition-colors ${
                    selectedDept?.id === dept.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <p className={`font-medium ${selectedDept?.id === dept.id ? 'text-indigo-700' : 'text-slate-900'}`}>
                      {dept.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{dept.code}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 ${selectedDept?.id === dept.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                </button>
              ))}
              {departments.length === 0 && (
                <div className="p-4 text-sm text-slate-500 text-center">No departments found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Programs Column */}
        <Card className={`shadow-sm border-slate-200 ${!selectedDept && 'opacity-50 pointer-events-none'}`}>
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              Programs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            {loadingPrograms ? (
              <div className="p-8 flex justify-center"><Loader /></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {programs.map((prog) => (
                  <button
                    key={prog.id}
                    onClick={() => handleSelectProgram(prog)}
                    className={`w-full text-left p-4 flex items-center justify-between transition-colors ${
                      selectedProgram?.id === prog.id ? 'bg-emerald-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${selectedProgram?.id === prog.id ? 'text-emerald-700' : 'text-slate-900'}`}>
                        {prog.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{prog.code}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${selectedProgram?.id === prog.id ? 'text-emerald-500' : 'text-slate-400'}`} />
                  </button>
                ))}
                {programs.length === 0 && selectedDept && !loadingPrograms && (
                  <div className="p-4 text-sm text-slate-500 text-center">No programs found.</div>
                )}
                {!selectedDept && (
                  <div className="p-4 text-sm text-slate-400 text-center italic">Select a department first</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Academic Years Column */}
        <Card className={`shadow-sm border-slate-200 ${!selectedProgram && 'opacity-50 pointer-events-none'}`}>
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              Academic Years
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            {loadingYears ? (
              <div className="p-8 flex justify-center"><Loader /></div>
            ) : (
              <div className="divide-y divide-slate-100">
                {academicYears.map((year) => (
                  <button
                    key={year.id}
                    onClick={() => handleSelectYear(year)}
                    className={`w-full text-left p-4 flex items-center justify-between transition-colors ${
                      selectedYear?.id === year.id ? 'bg-amber-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className={`font-medium ${selectedYear?.id === year.id ? 'text-amber-700' : 'text-slate-900'}`}>
                        {year.year} Year
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Semesters: {year.semesterCount}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${selectedYear?.id === year.id ? 'text-amber-500' : 'text-slate-400'}`} />
                  </button>
                ))}
                {academicYears.length === 0 && selectedProgram && !loadingYears && (
                  <div className="p-4 text-sm text-slate-500 text-center">No academic years found.</div>
                )}
                {!selectedProgram && (
                  <div className="p-4 text-sm text-slate-400 text-center italic">Select a program first</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sections Column */}
        <Card className={`shadow-sm border-slate-200 ${!selectedYear && 'opacity-50 pointer-events-none'}`}>
          <CardHeader className="bg-slate-50 border-b border-slate-100 py-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              Sections
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 max-h-[600px] overflow-y-auto">
            {loadingSections ? (
              <div className="p-8 flex justify-center"><Loader /></div>
            ) : (
              <div className="divide-y divide-slate-100 p-2 space-y-2">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="p-3 border border-slate-100 rounded-lg bg-white shadow-sm flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-lg">Section {section.name}</span>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        Active
                      </Badge>
                    </div>
                    {section.teacher && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <Users className="w-3 h-3" />
                        Class Teacher: {section.teacher.user.firstName} {section.teacher.user.lastName}
                      </p>
                    )}
                  </div>
                ))}
                {sections.length === 0 && selectedYear && !loadingSections && (
                  <div className="p-4 text-sm text-slate-500 text-center">No sections found.</div>
                )}
                {!selectedYear && (
                  <div className="p-4 text-sm text-slate-400 text-center italic mt-2">Select a year first</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Departments;
