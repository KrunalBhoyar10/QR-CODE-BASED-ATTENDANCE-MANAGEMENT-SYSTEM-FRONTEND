import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { hodService } from '../../services/hod.service';
import { getErrorMessage } from '../../utils/error';

const Subjects = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '', code: '', creditHours: '', academicYearId: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [subjectsRes, programsRes] = await Promise.all([
        hodService.listSubjects(),
        hodService.listPrograms()
      ]);
      setSubjects(subjectsRes.data);
      setPrograms(programsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch subjects');
    } finally {
      setLoading(false);
    }
  };

  const handleProgramChange = async (programId) => {
    setFormData(prev => ({ ...prev, programId, academicYearId: '' }));
    if (!programId) { setAcademicYears([]); return; }
    setLoadingYears(true);
    try {
      const res = await hodService.listAcademicYears(programId);
      setAcademicYears(res.data);
    } catch { setAcademicYears([]); }
    finally { setLoadingYears(false); }
  };

  const handleOpenModal = (subject = null) => {
    if (subject) {
      setEditingSubject(subject);
      setFormData({
        name: subject.name,
        code: subject.code,
        creditHours: subject.creditHours,
        academicYearId: subject.academicYearId || ''
      });
    } else {
      setEditingSubject(null);
      setFormData({ name: '', code: '', creditHours: '', academicYearId: '' });
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
        creditHours: parseInt(formData.creditHours, 10),
        academicYearId: formData.academicYearId
      };
      if (editingSubject) {
        await hodService.updateSubject(editingSubject.id, payload);
      } else {
        await hodService.createSubject(payload);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Subject Name',
      accessor: (row) => (
        <div>
          <div className="font-medium text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-500 font-mono">{row.code}</div>
        </div>
      )
    },
    {
      header: 'Credit Hours',
      accessor: (row) => (
        <Badge variant="outline">{row.creditHours} Hrs</Badge>
      )
    },
    {
      header: 'Year',
      accessor: (row) => row.academicYear
        ? `${row.academicYear.program.name} – Year ${row.academicYear.year}`
        : '—'
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.isActive !== false ? 'success' : 'error'}>
          {row.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <Button variant="ghost" size="sm" onClick={() => handleOpenModal(row)}
          className="text-indigo-600 hover:bg-indigo-50">
          <Edit2 className="w-4 h-4" />
        </Button>
      )
    }
  ];

  if (loading) return <Loader fullPage message="Loading subjects..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchData} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subjects</h1>
          <p className="text-slate-500 mt-1">Manage subjects offered in your department</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
          Add Subject
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table columns={columns} data={subjects}
            emptyMessage={<EmptyState icon={BookOpen} title="No subjects found" message="Create the first subject for your department." />}
          />
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => !formLoading && setIsModalOpen(false)}
        title={editingSubject ? 'Edit Subject' : 'Create Subject'} size="md">
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
          <Input label="Credit Hours" type="number" min="1" required value={formData.creditHours}
            onChange={(e) => setFormData({ ...formData, creditHours: e.target.value })}
            placeholder="e.g. 3" />
          <Select
            label="Program"
            value={formData.programId || ''}
            onChange={(e) => handleProgramChange(e.target.value)}
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
            disabled={loadingYears || !formData.programId}
            options={[
              { value: '', label: loadingYears ? 'Loading...' : '-- Select Year --' },
              ...academicYears.map(y => ({ value: y.id, label: `Year ${y.year}` }))
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button type="submit" isLoading={formLoading}>{editingSubject ? 'Save Changes' : 'Create Subject'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Subjects;
