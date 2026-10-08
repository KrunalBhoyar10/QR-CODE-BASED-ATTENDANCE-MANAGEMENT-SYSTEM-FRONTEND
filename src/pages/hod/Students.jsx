import React, { useState, useEffect } from 'react';
import { GraduationCap, Search } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { hodService } from '../../services/hod.service';

const Students = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [sections, setSections] = useState([]);

  const [filters, setFilters] = useState({ search: '', sectionId: '', programId: '', academicYearId: '' });
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [studentsRes, programsRes] = await Promise.all([
        hodService.listStudents(),
        hodService.listPrograms()
      ]);
      setStudents(Array.isArray(studentsRes?.data) ? studentsRes.data : (studentsRes?.data?.students ?? []));
      setPrograms(Array.isArray(programsRes?.data) ? programsRes.data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async (params = {}) => {
    setLoading(true);
    try {
      const res = await hodService.listStudents(params);
      setStudents(Array.isArray(res?.data) ? res.data : (res?.data?.students ?? []));
    } catch (err) {
      setError(err.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleProgramChange = async (programId) => {
    const updated = { ...filters, programId, academicYearId: '', sectionId: '' };
    setFilters(updated);
    setAcademicYears([]);
    setSections([]);
    if (!programId) { fetchStudents({}); return; }
    setLoadingYears(true);
    try {
      const res = await hodService.listAcademicYears(programId);
      setAcademicYears(Array.isArray(res?.data) ? res.data : []);
    } catch { setAcademicYears([]); }
    finally { setLoadingYears(false); }
    fetchStudents({ programId });
  };

  const handleYearChange = async (academicYearId) => {
    const updated = { ...filters, academicYearId, sectionId: '' };
    setFilters(updated);
    setSections([]);
    if (!academicYearId) return;
    setLoadingSections(true);
    try {
      const res = await hodService.listSections(academicYearId);
      setSections(Array.isArray(res?.data) ? res.data : []);
    } catch { setSections([]); }
    finally { setLoadingSections(false); }
    fetchStudents({ programId: filters.programId, academicYearId });
  };

  const handleSectionChange = (sectionId) => {
    setFilters(prev => ({ ...prev, sectionId }));
    fetchStudents({ programId: filters.programId, academicYearId: filters.academicYearId, sectionId });
  };

  const filteredStudents = filters.search
    ? students.filter(s =>
        `${s.user.firstName} ${s.user.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.enrollmentNumber?.toLowerCase().includes(filters.search.toLowerCase())
      )
    : students;

  const columns = [
    {
      header: 'Student',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-xs">
            {row.user.firstName[0]}
          </div>
          <div>
            <div className="font-medium text-slate-900">{row.user.firstName} {row.user.lastName}</div>
            <div className="text-xs text-slate-500">{row.user.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Enrollment No.',
      render: (row) => <span className="font-mono text-sm">{row.enrollmentNumber || '—'}</span>
    },
    {
      header: 'Program → Section',
      render: (row) => {
        const prog = row.section?.academicYear?.program?.name;
        const sec = row.section?.name;
        return prog ? `${prog} / Section ${sec}` : '—';
      }
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.user.isActive ? 'success' : 'error'}>
          {row.user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    }
  ];

  if (loading && students.length === 0) return <Loader fullPage message="Loading students..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchInitialData} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Students</h1>
        <p className="text-slate-500 mt-1">View enrolled students across your department</p>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name or enrollment no..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            />
          </div>
          <div className="w-40">
            <Select
              value={filters.programId}
              onChange={(e) => handleProgramChange(e.target.value)}
              options={[
                { value: '', label: 'All Programs' },
                ...programs.map(p => ({ value: p.id, label: p.name }))
              ]}
            />
          </div>
          <div className="w-36">
            <Select
              value={filters.academicYearId}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={!filters.programId || loadingYears}
              options={[
                { value: '', label: loadingYears ? 'Loading...' : 'All Years' },
                ...academicYears.map(y => ({ value: y.id, label: `Year ${y.yearNumber ?? y.year}` }))
              ]}
            />
          </div>
          <div className="w-36">
            <Select
              value={filters.sectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              disabled={!filters.academicYearId || loadingSections}
              options={[
                { value: '', label: loadingSections ? 'Loading...' : 'All Sections' },
                ...sections.map(s => ({ value: s.id, label: `Section ${s.name}` }))
              ]}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={filteredStudents}
            emptyMessage={<EmptyState icon={GraduationCap} title="No students found" message="No students match the selected criteria." />}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Students;
