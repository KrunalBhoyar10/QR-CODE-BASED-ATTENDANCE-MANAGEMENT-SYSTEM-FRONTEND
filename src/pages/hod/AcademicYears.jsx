import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2 } from 'lucide-react';
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

const AcademicYears = () => {
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [error, setError] = useState(null);
  
  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  
  const [academicYears, setAcademicYears] = useState([]);
  const [loadingYears, setLoadingYears] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);

  // Form
  const [formData, setFormData] = useState({ year: '', semesterCount: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgramId) {
      fetchAcademicYears(selectedProgramId);
    } else {
      setAcademicYears([]);
    }
  }, [selectedProgramId]);

  const fetchPrograms = async () => {
    setLoadingPrograms(true);
    try {
      const res = await hodService.listPrograms();
      setPrograms(res.data);
      if (res.data.length > 0) {
        setSelectedProgramId(res.data[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch programs');
    } finally {
      setLoadingPrograms(false);
    }
  };

  const fetchAcademicYears = async (progId) => {
    setLoadingYears(true);
    try {
      const res = await hodService.listAcademicYears(progId);
      setAcademicYears(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch academic years');
    } finally {
      setLoadingYears(false);
    }
  };

  const handleOpenModal = (year = null) => {
    if (year) {
      setEditingYear(year);
      setFormData({ year: year.year, semesterCount: year.semesterCount });
    } else {
      setEditingYear(null);
      setFormData({ year: '', semesterCount: '' });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (editingYear) {
        await hodService.updateAcademicYear(editingYear.id, formData);
      } else {
        await hodService.createAcademicYear({ ...formData, programId: selectedProgramId });
      }
      setIsModalOpen(false);
      fetchAcademicYears(selectedProgramId);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Academic Year',
      accessor: (row) => (
        <div className="font-medium text-slate-900">{row.year} Year</div>
      )
    },
    {
      header: 'Semesters',
      accessor: (row) => (
        <div className="text-slate-600">{row.semesterCount} Semesters</div>
      )
    },
    {
      header: 'Sections',
      accessor: (row) => row._count?.sections || 0
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleOpenModal(row)}
          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      )
    }
  ];

  if (loadingPrograms) return <Loader fullPage message="Loading academic years..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchPrograms} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Academic Years</h1>
          <p className="text-slate-500 mt-1">Manage years and semesters for programs</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={!selectedProgramId}
        >
          Add Academic Year
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="max-w-sm">
            <Select
              label="Select Program"
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              options={[
                { value: '', label: '-- Select Program --' },
                ...programs.map(p => ({ value: p.id, label: p.name }))
              ]}
            />
          </div>
        </div>
        <CardContent className="p-0">
          {loadingYears ? (
            <Loader message="Fetching years..." className="py-12" />
          ) : !selectedProgramId ? (
            <div className="py-12 text-center text-slate-500">Please select a program above to view its academic years.</div>
          ) : (
            <Table
              columns={columns}
              data={academicYears}
              emptyMessage={
                <EmptyState
                  icon={Layers}
                  title="No Academic Years found"
                  message="Add your first academic year for this program."
                />
              }
            />
          )}
        </CardContent>
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={editingYear ? 'Edit Academic Year' : 'Create Academic Year'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
              {formError}
            </div>
          )}
          
          <Input
            label="Year Number"
            type="number"
            min="1"
            max="6"
            required
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) || '' })}
            placeholder="e.g. 1"
          />
          <Input
            label="Number of Semesters"
            type="number"
            min="1"
            max="3"
            required
            value={formData.semesterCount}
            onChange={(e) => setFormData({ ...formData, semesterCount: parseInt(e.target.value, 10) || '' })}
            placeholder="e.g. 2"
          />

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={formLoading}>
              {editingYear ? 'Save Changes' : 'Create Year'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AcademicYears;
