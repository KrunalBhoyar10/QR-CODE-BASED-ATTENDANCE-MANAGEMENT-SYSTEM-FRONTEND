import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Power, PowerOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { hodService } from '../../services/hod.service';
import { getErrorMessage } from '../../utils/error';

const TeacherAssignments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);

  // For the create-assignment form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [formData, setFormData] = useState({
    teacherId: '',
    programId: '',
    academicYearId: '',
    sectionId: '',
    subjectId: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [loadingYears, setLoadingYears] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assignmentsRes, teachersRes, programsRes, subjectsRes] = await Promise.all([
        hodService.listAssignments(),
        hodService.listTeachers(),
        hodService.listPrograms(),
        hodService.listSubjects()
      ]);
      setAssignments(assignmentsRes.data);
      setTeachers(teachersRes.data);
      setPrograms(programsRes.data);
      setSubjects(subjectsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  // Cascade: When program changes, load academic years
  const handleProgramChange = async (programId) => {
    setFormData(prev => ({ ...prev, programId, academicYearId: '', sectionId: '' }));
    setAcademicYears([]);
    setSections([]);
    if (!programId) return;
    setLoadingYears(true);
    try {
      const res = await hodService.listAcademicYears(programId);
      setAcademicYears(res.data);
    } catch { setAcademicYears([]); }
    finally { setLoadingYears(false); }
  };

  // Cascade: When year changes, load sections
  const handleYearChange = async (yearId) => {
    setFormData(prev => ({ ...prev, academicYearId: yearId, sectionId: '' }));
    setSections([]);
    if (!yearId) return;
    setLoadingSections(true);
    try {
      const res = await hodService.listSections(yearId);
      setSections(res.data);
    } catch { setSections([]); }
    finally { setLoadingSections(false); }
  };

  const handleOpenModal = () => {
    setFormData({ teacherId: '', programId: '', academicYearId: '', sectionId: '', subjectId: '' });
    setFormError('');
    setAcademicYears([]);
    setSections([]);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        teacherId: formData.teacherId,
        sectionId: formData.sectionId,
        subjectId: formData.subjectId
      };
      await hodService.createAssignment(payload);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (assignment) => {
    try {
      await hodService.updateAssignmentStatus(assignment.id, !assignment.isActive);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const columns = [
    {
      header: 'Teacher',
      accessor: (row) => (
        <div>
          <div className="font-medium text-slate-900">
            {row.teacher?.user.firstName} {row.teacher?.user.lastName}
          </div>
          <div className="text-xs text-slate-500">{row.teacher?.user.email}</div>
        </div>
      )
    },
    {
      header: 'Program → Year → Section',
      accessor: (row) => {
        const prog = row.section?.academicYear?.program?.name || '—';
        const year = row.section?.academicYear?.year;
        const sec = row.section?.name;
        return (
          <div className="text-sm text-slate-700">
            <span className="font-medium">{prog}</span>
            {year && <span className="text-slate-400"> → Year {year}</span>}
            {sec && <span className="text-slate-400"> → Section {sec}</span>}
          </div>
        );
      }
    },
    {
      header: 'Subject',
      accessor: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.subject?.name}</div>
          <div className="text-xs font-mono text-slate-500">{row.subject?.code}</div>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.isActive ? 'success' : 'error'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <Button variant="ghost" size="sm"
          onClick={() => handleToggleStatus(row)}
          className={row.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}>
          {row.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
        </Button>
      )
    }
  ];

  if (loading) return <Loader fullPage message="Loading teaching assignments..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchData} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teaching Assignments</h1>
          <p className="text-slate-500 mt-1">Assign teachers to specific programs, years, sections and subjects</p>
        </div>
        <Button onClick={handleOpenModal} leftIcon={<Plus className="w-4 h-4" />}>
          New Assignment
        </Button>
      </div>

      {/* Info card explaining the assignment model */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
        <strong>Note:</strong> Each assignment maps a Teacher to a specific <strong>Section</strong> and <strong>Subject</strong>.
        Access is controlled at this level — a teacher only accesses sessions they are explicitly assigned to.
      </div>

      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={assignments}
            emptyMessage={
              <EmptyState icon={Briefcase} title="No assignments yet"
                message="Create an assignment to link a teacher to a section and subject." />
            }
          />
        </CardContent>
      </Card>

      {/* Create Assignment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => !formLoading && setIsModalOpen(false)}
        title="Create Teaching Assignment" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{formError}</div>
          )}

          <Select
            label="Teacher"
            required
            value={formData.teacherId}
            onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
            options={[
              { value: '', label: '-- Select Teacher --' },
              ...teachers.filter(t => t.user.isActive).map(t => ({
                value: t.id,
                label: `${t.user.firstName} ${t.user.lastName}`
              }))
            ]}
          />

          <div className="grid grid-cols-3 gap-3">
            <Select
              label="Program"
              required
              value={formData.programId}
              onChange={(e) => handleProgramChange(e.target.value)}
              options={[
                { value: '', label: '-- Program --' },
                ...programs.map(p => ({ value: p.id, label: p.name }))
              ]}
            />
            <Select
              label="Academic Year"
              required
              value={formData.academicYearId}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={!formData.programId || loadingYears}
              options={[
                { value: '', label: loadingYears ? 'Loading...' : '-- Year --' },
                ...academicYears.map(y => ({ value: y.id, label: `Year ${y.year}` }))
              ]}
            />
            <Select
              label="Section"
              required
              value={formData.sectionId}
              onChange={(e) => setFormData(prev => ({ ...prev, sectionId: e.target.value }))}
              disabled={!formData.academicYearId || loadingSections}
              options={[
                { value: '', label: loadingSections ? 'Loading...' : '-- Section --' },
                ...sections.map(s => ({ value: s.id, label: `Section ${s.name}` }))
              ]}
            />
          </div>

          <Select
            label="Subject"
            required
            value={formData.subjectId}
            onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
            options={[
              { value: '', label: '-- Select Subject --' },
              ...subjects.map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button type="submit" isLoading={formLoading}>Create Assignment</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherAssignments;
