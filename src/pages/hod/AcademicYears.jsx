import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
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

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [yearToDelete, setYearToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
          yearNumber: Number(formData.yearNumber),
          semesterCount: Number(formData.semesterCount),
          label: `Year ${formData.yearNumber}`,
        });
        toast.success(`Academic Year ${formData.yearNumber} updated successfully`);
      } else {
        await hodService.createAcademicYear({
          programId: selectedProgramId,
          yearNumber: Number(formData.yearNumber),
          semesterCount: Number(formData.semesterCount),
          label: `Year ${formData.yearNumber}`,
        });
        toast.success(`Academic Year ${formData.yearNumber} created successfully`);
      }
      setIsModalOpen(false);
      fetchAcademicYears(selectedProgramId);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenDeleteModal = (year) => {
    setYearToDelete(year);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!yearToDelete) return;
    setDeleteLoading(true);
    try {
      await hodService.deleteAcademicYear(yearToDelete.id);
      toast.success(`Academic Year ${yearToDelete.yearNumber ?? yearToDelete.year} deleted successfully`);
      setIsDeleteModalOpen(false);
      setYearToDelete(null);
      fetchAcademicYears(selectedProgramId);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete academic year'));
    } finally {
      setDeleteLoading(false);
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
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(row)}
            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-2 h-8 w-8"
            title="Edit Academic Year"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDeleteModal(row)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2 h-8 w-8"
            title="Delete Academic Year"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !deleteLoading && setIsDeleteModalOpen(false)}
        title="Delete Academic Year"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-rose-900">Are you sure you want to delete this academic year?</p>
              <p>
                <strong>Year {yearToDelete?.yearNumber ?? yearToDelete?.year}</strong> ({yearToDelete?.semesterCount ?? 2} Semesters) will be permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleDeleteConfirm}
              isLoading={deleteLoading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
            >
              Delete Academic Year
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AcademicYears;
