import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { hodService } from '../../services/hod.service';
import { getErrorMessage } from '../../utils/error';

const TeacherAssignments = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignments, setAssignments] = useState([]);

  // For the create/edit assignment form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
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
  const [loadingModalSections, setLoadingModalSections] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

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
      setAssignments(Array.isArray(assignmentsRes?.data) ? assignmentsRes.data : (assignmentsRes?.data?.assignments ?? []));
      setTeachers(Array.isArray(teachersRes?.data) ? teachersRes.data : (teachersRes?.data?.teachers ?? []));
      setPrograms(Array.isArray(programsRes?.data) ? programsRes.data : []);
      setSubjects(Array.isArray(subjectsRes?.data) ? subjectsRes.data : []);
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
      setAcademicYears(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setAcademicYears([]);
    } finally {
      setLoadingYears(false);
    }
  };

  // Cascade: When year changes, load sections
  const handleYearChange = async (yearId) => {
    setFormData(prev => ({ ...prev, academicYearId: yearId, sectionId: '' }));
    setSections([]);
    if (!yearId) return;
    setLoadingModalSections(true);
    try {
      const res = await hodService.listSections(yearId);
      setSections(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setSections([]);
    } finally {
      setLoadingModalSections(false);
    }
  };

  const handleOpenModal = async (assignment = null) => {
    setFormError('');
    setAcademicYears([]);
    setSections([]);

    if (assignment) {
      setEditingAssignment(assignment);
      const progId = assignment.programId || assignment.program?.id || assignment.section?.academicYear?.programId || '';
      const yearId = assignment.academicYearId || assignment.academicYear?.id || assignment.section?.academicYearId || '';
      const secId = assignment.sectionId || assignment.section?.id || '';
      const teachId = assignment.teacherId || assignment.teacher?.id || '';
      const subId = assignment.subjectId || assignment.subject?.id || '';

      setFormData({
        teacherId: teachId,
        programId: progId,
        academicYearId: yearId,
        sectionId: secId,
        subjectId: subId,
      });

      // Pre-load cascaded dropdowns
      if (progId) {
        setLoadingYears(true);
        try {
          const yRes = await hodService.listAcademicYears(progId);
          setAcademicYears(Array.isArray(yRes?.data) ? yRes.data : []);
        } catch {
          setAcademicYears([]);
        } finally {
          setLoadingYears(false);
        }
      }
      if (yearId) {
        setLoadingModalSections(true);
        try {
          const sRes = await hodService.listSections(yearId);
          setSections(Array.isArray(sRes?.data) ? sRes.data : []);
        } catch {
          setSections([]);
        } finally {
          setLoadingModalSections(false);
        }
      }
    } else {
      setEditingAssignment(null);
      setFormData({ teacherId: '', programId: '', academicYearId: '', sectionId: '', subjectId: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        teacherId: formData.teacherId,
        programId: formData.programId,
        academicYearId: formData.academicYearId,
        sectionId: formData.sectionId,
        subjectId: formData.subjectId,
      };

      if (editingAssignment) {
        await hodService.updateAssignment(editingAssignment.id, payload);
      } else {
        await hodService.createAssignment(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this teaching assignment? This cannot be undone.')) {
      return;
    }
    setDeletingId(assignmentId);
    try {
      await hodService.deleteAssignment(assignmentId);
      if (isModalOpen && editingAssignment?.id === assignmentId) {
        setIsModalOpen(false);
      }
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      header: 'Teacher',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">
            {row.teacher?.user?.firstName} {row.teacher?.user?.lastName}
          </div>
          <div className="text-xs text-slate-500">{row.teacher?.user?.email}</div>
        </div>
      )
    },
    {
      header: 'Program → Year → Section',
      render: (row) => {
        const prog = row.program?.name || row.section?.academicYear?.program?.name || '—';
        const year = row.academicYear?.yearNumber ?? row.section?.academicYear?.yearNumber ?? row.section?.academicYear?.year;
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
      render: (row) => (
        <div>
          <div className="font-medium text-slate-800">{row.subject?.name}</div>
          <div className="text-xs font-mono text-slate-500">{row.subject?.code}</div>
        </div>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenModal(row)}
            title="Edit Assignment"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteAssignment(row.id)}
            disabled={deletingId === row.id}
            title="Delete Assignment"
            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
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
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
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
              <EmptyState
                icon={Briefcase}
                title="No assignments yet"
                message="Create an assignment to link a teacher to a section and subject."
              />
            }
          />
        </CardContent>
      </Card>

      {/* Create / Edit Assignment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !formLoading && !deletingId && setIsModalOpen(false)}
        title={editingAssignment ? 'Edit Teaching Assignment' : 'Create Teaching Assignment'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
              {formError}
            </div>
          )}

          <Select
            label="Teacher"
            required
            value={formData.teacherId}
            onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
            options={[
              { value: '', label: '-- Select Teacher --' },
              ...teachers
                .filter(t => t.user?.isActive || t.id === formData.teacherId)
                .map(t => ({
                  value: t.id,
                  label: `${t.user?.firstName || ''} ${t.user?.lastName || ''} (${t.user?.email || ''})`
                }))
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                ...academicYears.map(y => ({
                  value: y.id,
                  label: y.label || `Year ${y.yearNumber ?? y.year}`
                }))
              ]}
            />
            <Select
              label="Section"
              required
              value={formData.sectionId}
              onChange={(e) => setFormData(prev => ({ ...prev, sectionId: e.target.value }))}
              disabled={!formData.academicYearId || loadingModalSections}
              options={[
                { value: '', label: loadingModalSections ? 'Loading...' : '-- Section --' },
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
              ...subjects
                .filter(s => !formData.programId || !s.programId || s.programId === formData.programId || s.id === formData.subjectId)
                .map(s => ({ value: s.id, label: `${s.name} (${s.code})` }))
            ]}
          />

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
            {editingAssignment ? (
              <>
                <Button
                  type="button"
                  variant="danger"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={() => handleDeleteAssignment(editingAssignment.id)}
                  isLoading={deletingId === editingAssignment.id}
                  disabled={formLoading}
                >
                  Delete Assignment
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                    disabled={formLoading || deletingId}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={formLoading} disabled={deletingId}>
                    Save Changes
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-end w-full gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" isLoading={formLoading}>
                  Create Assignment
                </Button>
              </div>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TeacherAssignments;
