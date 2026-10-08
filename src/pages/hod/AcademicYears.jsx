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
  const [formData, setFormData] = useState({ yearNumber: '', semesterCount: '2' });
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
      const list = Array.isArray(res?.data) ? res.data : [];
      setPrograms(list);
      if (list.length > 0) {
        setSelectedProgramId(list[0].id);
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
      const list = Array.isArray(res?.data) ? res.data : [];
      setAcademicYears(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch academic years');
    } finally {
      setLoadingYears(false);
    }
  };

  const handleOpenModal = (year = null) => {
    if (year) {
      setEditingYear(year);
      setFormData({ yearNumber: year.yearNumber ?? year.year, semesterCount: year.semesterCount ?? 2 });
    } else {
      setEditingYear(null);
      setFormData({ yearNumber: '', semesterCount: '2' });
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
        await hodService.updateAcademicYear(editingYear.id, {
          label: `Year ${formData.yearNumber}`,
        });
      } else {
        await hodService.createAcademicYear({
          programId: selectedProgramId,
          yearNumber: Number(formData.yearNumber),
          semesterCount: Number(formData.semesterCount),
          label: `Year ${formData.yearNumber}`,
        });
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
      render: (row) => (
        <div className="font-medium text-slate-900">Year {row.yearNumber ?? row.year}</div>
      )
    },
    {
      header: 'Semesters',
      render: (row) => (
        <div className="text-slate-600">{row.semesterCount ?? '—'} Semesters</div>
      )
    },
    {
      header: 'Sections',
      render: (row) => row._count?.sections ?? 0
    },
    {
      header: 'Actions',
      render: (row) => (
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
            max="10"
            required
            value={formData.yearNumber}
            onChange={(e) => setFormData({ ...formData, yearNumber: e.target.value })}
            placeholder="e.g. 1 for First Year, 2 for Second Year"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Number of Semesters <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.semesterCount}
              onChange={(e) => setFormData({ ...formData, semesterCount: e.target.value })}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-800"
            >
              {[1,2,3,4,5,6,7,8].map(n => (
                <option key={n} value={n}>{n} Semester{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

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
