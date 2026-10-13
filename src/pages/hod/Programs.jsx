import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { hodService } from '../../services/hod.service';
import { getErrorMessage } from '../../utils/error';

const Programs = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [programs, setPrograms] = useState([]);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Form
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const res = await hodService.listPrograms();
      const list = Array.isArray(res?.data) ? res.data : (res?.data?.programs ?? res?.programs ?? []);
      setPrograms(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (prog = null) => {
    if (prog) {
      setEditingProgram(prog);
      setFormData({ name: prog.name, code: prog.code });
    } else {
      setEditingProgram(null);
      setFormData({ name: '', code: '' });
    }
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (editingProgram) {
        await hodService.updateProgram(editingProgram.id, formData);
        toast.success('Program updated successfully');
      } else {
        await hodService.createProgram(formData);
        toast.success('Program created successfully');
      }
      setIsModalOpen(false);
      fetchPrograms();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenDeleteModal = (prog) => {
    setProgramToDelete(prog);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!programToDelete) return;
    setDeleteLoading(true);
    try {
      await hodService.deleteProgram(programToDelete.id);
      toast.success(`Program '${programToDelete.name}' deleted successfully`);
      setIsDeleteModalOpen(false);
      setProgramToDelete(null);
      fetchPrograms();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete program'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      header: 'Program Name',
      render: (row) => (
        <div className="font-medium text-slate-900">{row.name}</div>
      )
    },
    {
      header: 'Program Code',
      render: (row) => (
        <div className="text-sm font-mono bg-slate-100 px-2 py-1 rounded inline-block text-slate-700">
          {row.code}
        </div>
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
            title="Edit Program"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenDeleteModal(row)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2 h-8 w-8"
            title="Delete Program"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <Loader fullPage message="Loading programs..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchPrograms} /></div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Programs</h1>
          <p className="text-slate-500 mt-1">Manage degree programs within your department</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<Plus className="w-4 h-4" />}>
          Add Program
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={programs}
            emptyMessage={
              <EmptyState
                icon={BookOpen}
                title="No programs found"
                message="Add your first academic program to get started."
              />
            }
          />
        </CardContent>
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={editingProgram ? 'Edit Program' : 'Create New Program'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
              {formError}
            </div>
          )}
          
          <Input
            label="Program Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g. Bachelor of Computer Applications"
          />
          <Input
            label="Program Code"
            required
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            placeholder="e.g. BCA"
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
              {editingProgram ? 'Save Changes' : 'Create Program'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !deleteLoading && setIsDeleteModalOpen(false)}
        title="Delete Program"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-700">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-rose-900">Are you sure you want to delete this program?</p>
              <p>
                <strong>{programToDelete?.name}</strong> ({programToDelete?.code}) will be permanently deleted.
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
              Delete Program
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Programs;
