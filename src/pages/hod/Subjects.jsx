import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { hodService } from '../../services/hod.service';
import registrationService from '../../services/registration.service';
import { getErrorMessage } from '../../utils/error';
import { filterActiveSubjects } from '../../utils/subjects';

const SUBJECT_TYPES = {
  COMMON: 'COMMON',
  ELECTIVE: 'ELECTIVE',
};

const SUBJECT_TYPE_OPTIONS = [
  { value: SUBJECT_TYPES.COMMON, label: 'Common (Mandatory)' },
  { value: SUBJECT_TYPES.ELECTIVE, label: 'Elective (Student Choice)' },
];

const getSubjectType = (subject) => {
  if (subject?.subjectType) return subject.subjectType;
  if (subject?.isCompulsory === true) return SUBJECT_TYPES.COMMON;
  if (subject?.isElective === true) return SUBJECT_TYPES.ELECTIVE;
  return SUBJECT_TYPES.COMMON;
};

const getSubjectAcademicYearId = (subject) => {
  return (
    subject?.academicYearId ||
    subject?.academicYear?.id ||
    subject?.academic_year_id ||
    (Array.isArray(subject?.sections) && subject.sections[0]?.academicYearId) ||
    (Array.isArray(subject?.sections) && subject.sections[0]?.academicYear?.id) ||
    null
  );
};

const getSubjectProgramId = (subject) => {
  return (
    subject?.programId ||
    subject?.program?.id ||
    subject?.program_id ||
    subject?.academicYear?.programId ||
    subject?.academicYear?.program?.id ||
    (Array.isArray(subject?.sections) && subject.sections[0]?.academicYear?.programId) ||
    (Array.isArray(subject?.sections) && subject.sections[0]?.academicYear?.program?.id) ||
    null
  );
};

const Subjects = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [loadingYears, setLoadingYears] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '', code: '', credits: '', programId: '', academicYearId: '', subjectType: SUBJECT_TYPES.COMMON
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgramId) {
      setSelectedYearId('');
      setAcademicYears([]);
      setSubjects([]);
      fetchAcademicYears(selectedProgramId);
    } else {
      setAcademicYears([]);
      setSelectedYearId('');
      setSubjects([]);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    if (selectedYearId) {
      fetchSubjects(selectedYearId);
    } else {
      setSubjects([]);
    }
  }, [selectedYearId]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await hodService.listPrograms();
      const list = Array.isArray(res?.data) ? res.data : [];
      setPrograms(list);
      if (list.length > 0) setSelectedProgramId(list[0].id);
    } catch (err) {
      setError(err.message || 'Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYears = async (progId) => {
    setLoadingYears(true);
    try {
      const res = await hodService.listAcademicYears(progId);
      const list = Array.isArray(res?.data) ? res.data : [];
      setAcademicYears(list);
      if (list.length > 0) setSelectedYearId(list[0].id);
    } catch (err) {
      setError(err.message || 'Failed to fetch academic years');
    } finally {
      setLoadingYears(false);
    }
  };

  const fetchSubjects = async (yearId) => {
    setLoadingSubjects(true);
    try {
      let list;
      if (yearId) {
        const res = await hodService.listSubjectsByYear(selectedProgramId, yearId);
        list = Array.isArray(res?.data) ? res.data : [];
      } else {
        const params = {};
        if (selectedProgramId) params.programId = selectedProgramId;
        const res = await hodService.listSubjects(params);
        list = Array.isArray(res?.data) ? res.data : [];
      }
      // Client-side filtering as a safety net: the backend may return all
      // program subjects regardless of the academicYearId query param.
      let filtered = filterActiveSubjects(list);
      if (selectedProgramId) {
        filtered = filtered.filter((s) => {
          const sProgId = getSubjectProgramId(s);
          return !sProgId || sProgId === selectedProgramId;
        });
      }
      if (yearId) {
        filtered = filtered.filter((s) => {
          const sYearId = getSubjectAcademicYearId(s);
          return !sYearId || sYearId === yearId;
        });
      }
      setSubjects(filtered);
    } catch (err) {
      setError(err.message || 'Failed to fetch subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleOpenModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        code: subject.code,
        credits: subject.credits ?? '',
        programId: subject.programId || subject.academicYear?.programId || selectedProgramId,
        academicYearId: subject.academicYearId || selectedYearId,
        subjectType: getSubjectType(subject),
      });
    } else {
      setEditingSubject(null);
      setFormData({
        name: '',
        code: '',
        credits: '',
        programId: selectedProgramId,
        academicYearId: selectedYearId,
        subjectType: SUBJECT_TYPES.COMMON,
      });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        credits: formData.credits ? parseInt(formData.credits, 10) : undefined,
        programId: formData.programId,
        academicYearId: formData.academicYearId || undefined,
        subjectType: formData.subjectType,
      };
      if (editingSubject) {
        await hodService.updateSubject(editingSubject.id, payload);
        toast.success('Subject updated successfully');
      } else {
        await hodService.createSubject(payload);
        toast.success('Subject created successfully');
      }
      setIsModalOpen(false);
      fetchSubjects(formData.academicYearId || selectedYearId);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await hodService.deleteSubject(subjectToDelete.id);
      toast.success(`Subject '${subjectToDelete.name}' deleted permanently`);
      setSubjectToDelete(null);
      fetchSubjects(selectedYearId);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete subject'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Subject Name',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500 font-mono">{row.code}</div>
        </div>
      )
    },
    {
      header: 'Type',
      render: (row) => {
        const type = getSubjectType(row);
        return (
          <Badge variant={type === SUBJECT_TYPES.ELECTIVE ? 'sky' : 'emerald'} size="sm">
            {type === SUBJECT_TYPES.ELECTIVE ? 'Elective' : 'Common'}
          </Badge>
        );
      }
    },
    {
      header: 'Credits',
      render: (row) => (
        <Badge variant="outline">{row.credits ?? '—'} Credits</Badge>
      )
    },
    {
      header: 'Year',
      render: (row) => {
        const yearId = getSubjectAcademicYearId(row);
        const yearInfo = row.academicYear || academicYears.find((y) => y.id === yearId);
        if (yearInfo) {
          return `Year ${yearInfo.yearNumber ?? yearInfo.year ?? '—'}`;
        }
        return <Badge variant="amber">Not Assigned</Badge>;
      }
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.isActive !== false ? 'success' : 'error'}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(row)}
            className="text-indigo-600 hover:bg-indigo-50 p-1.5"
            title="Edit Subject"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSubjectToDelete(row)}
            className="text-rose-500 hover:bg-rose-50 hover:text-rose-700 p-1.5"
            title="Delete Subject"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <Loader fullPage message="Loading subjects..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchPrograms} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-slate-500 mt-1">Manage subjects offered in your department</p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={!selectedYearId}
        >
          Add Subject
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <Select
              label="Program"
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              options={[
                { value: '', label: '-- Select Program --' },
                ...programs.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <Select
              label="Academic Year"
              value={selectedYearId}
              onChange={(e) => setSelectedYearId(e.target.value)}
              disabled={!selectedProgramId || loadingYears}
              options={[
                { value: '', label: loadingYears ? 'Loading...' : '-- Select Year --' },
                ...academicYears.map((y) => ({
                  value: y.id,
                  label: `Year ${y.yearNumber ?? y.year}`,
                })),
              ]}
            />
          </div>
        </div>
        <CardContent className="p-0">
          {loadingSubjects ? (
            <Loader message="Loading subjects..." className="py-12" />
          ) : !selectedYearId ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Select a program and year to view subjects.
            </div>
          ) : (
            <Table
              columns={columns}
              data={subjects}
              emptyMessage={
                <EmptyState
                  icon={BookOpen}
                  title="No subjects found"
                  message="Create the first subject for this year."
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Create Subject'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="Subject Name" required value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Data Structures" />
            <Input label="Subject Code" required value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. CS201" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Credits" type="number" min="1" max="10" value={formData.credits}
              onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
              placeholder="e.g. 4" />
            <Select
              label="Subject Type"
              required
              value={formData.subjectType}
              onChange={(e) => setFormData({ ...formData, subjectType: e.target.value })}
              options={SUBJECT_TYPE_OPTIONS}
            />
          </div>
          <Select
            label="Program"
            value={formData.programId || ''}
            onChange={(e) => setFormData({ ...formData, programId: e.target.value, academicYearId: '' })}
            options={[
              { value: '', label: '-- Select Program --' },
              ...programs.map(p => ({ value: p.id, label: p.name }))
            ]}
          />
          <Select
            label="Academic Year"
            required
            value={formData.academicYearId}
            onChange={(e) => setFormData({ ...formData, academicYearId: e.target.value })}
            disabled={!formData.programId}
            options={[
              { value: '', label: '-- Select Year --' },
              ...academicYears.map(y => ({ value: y.id, label: `Year ${y.yearNumber ?? y.year}` }))
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button type="submit" isLoading={formLoading}>{editingSubject ? 'Save Changes' : 'Create Subject'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!subjectToDelete}
        onClose={() => !isDeleting && setSubjectToDelete(null)}
        onConfirm={handleDeleteSubject}
        title={`Delete Subject?`}
        message={`Are you sure you want to delete '${subjectToDelete?.name || ''}' (${subjectToDelete?.code || ''})? This action cannot be undone.`}
        confirmText="Delete Subject"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Subjects;
