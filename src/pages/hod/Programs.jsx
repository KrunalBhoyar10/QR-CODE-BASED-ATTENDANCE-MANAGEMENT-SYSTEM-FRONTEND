import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2 } from 'lucide-react';
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
      setPrograms(res.data);
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
      } else {
        await hodService.createProgram(formData);
      }
      setIsModalOpen(false);
      fetchPrograms();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Program Name',
      accessor: (row) => (
        <div className="font-medium text-slate-900">{row.name}</div>
      )
    },
    {
      header: 'Program Code',
      accessor: (row) => (
        <div className="text-sm font-mono bg-slate-100 px-2 py-1 rounded inline-block text-slate-700">
          {row.code}
        </div>
      )
    },
    {
      header: 'Academic Years',
      accessor: (row) => row._count?.academicYears || 0
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

  if (loading) return <Loader fullPage message="Loading programs..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchPrograms} /></div>;

  return (
    <div className="p-6 space-y-6">
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
    </div>
  );
};

export default Programs;
