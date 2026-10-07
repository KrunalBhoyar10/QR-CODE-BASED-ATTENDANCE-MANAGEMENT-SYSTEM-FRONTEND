import React, { useState, useEffect } from 'react';
import { Grid, Plus, Edit2 } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { hodService } from '../../services/hod.service';
import { getErrorMessage } from '../../utils/error';

const Sections = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgramId) {
      setSelectedYearId('');
      setAcademicYears([]);
      setSections([]);
      fetchAcademicYears(selectedProgramId);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    if (selectedYearId) {
      fetchSections(selectedYearId);
    } else {
      setSections([]);
    }
  }, [selectedYearId]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await hodService.listPrograms();
      setPrograms(res.data);
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
      setAcademicYears(res.data);
      if (res.data.length > 0) setSelectedYearId(res.data[0].id);
    } catch (err) {
      setError(err.message || 'Failed to fetch academic years');
    } finally {
      setLoadingYears(false);
    }
  };

  const fetchSections = async (yearId) => {
    setLoadingSections(true);
    try {
      const res = await hodService.listSections(yearId);
      setSections(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch sections');
    } finally {
      setLoadingSections(false);
    }
  };

  const handleOpenModal = (section = null) => {
    setEditingSection(section);
    setFormData({ name: section?.name || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (editingSection) {
        await hodService.updateSection(editingSection.id, formData);
      } else {
        await hodService.createSection({ name: formData.name, academicYearId: selectedYearId });
      }
      setIsModalOpen(false);
      fetchSections(selectedYearId);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Section Name',
      accessor: (row) => <div className="font-semibold text-slate-900">Section {row.name}</div>
    },
    {
      header: 'Students',
      accessor: (row) => row._count?.students ?? '—'
    },
    {
      header: 'Class Teacher',
      accessor: (row) => row.teacher
        ? `${row.teacher.user.firstName} ${row.teacher.user.lastName}`
        : <span className="text-slate-400 italic">Unassigned</span>
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

  if (loading) return <Loader fullPage message="Loading sections..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchPrograms} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sections</h1>
          <p className="text-slate-500 mt-1">Manage class sections within academic years</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}
          disabled={!selectedYearId}>
          Add Section
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
                ...programs.map(p => ({ value: p.id, label: p.name }))
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
                ...academicYears.map(y => ({ value: y.id, label: `Year ${y.year}` }))
              ]}
            />
          </div>
        </div>
        <CardContent className="p-0">
          {loadingSections ? (
            <Loader message="Loading sections..." className="py-12" />
          ) : !selectedYearId ? (
            <div className="py-12 text-center text-slate-500 text-sm">Select a program and year to view sections.</div>
          ) : (
            <Table columns={columns} data={sections}
              emptyMessage={<EmptyState icon={Grid} title="No sections found" message="Create the first section for this year." />}
            />
          )}
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => !formLoading && setIsModalOpen(false)}
        title={editingSection ? 'Edit Section' : 'Create Section'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{formError}</div>
          )}
          <Input label="Section Name" required value={formData.name}
            onChange={(e) => setFormData({ name: e.target.value })}
            placeholder="e.g. A" />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button type="submit" isLoading={formLoading}>{editingSection ? 'Save Changes' : 'Create Section'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sections;
