import React, { useState, useEffect } from 'react';
import { Grid, Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { hodService } from '../../services/hod.service';
import { getErrorMessage } from '../../utils/error';

const COMMON_SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F'];

const Sections = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [programs, setPrograms] = useState([]);
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [formData, setFormData] = useState({ name: '', classTeacherId: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      const [progsRes, teachersRes] = await Promise.all([
        hodService.listPrograms(),
        hodService.listTeachers(),
      ]);
      const list = Array.isArray(progsRes?.data) ? progsRes.data : [];
      setPrograms(list);
      if (list.length > 0) setSelectedProgramId(list[0].id);
      setTeachers(Array.isArray(teachersRes?.data) ? teachersRes.data : []);
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

  const fetchSections = async (yearId) => {
    setLoadingSections(true);
    try {
      const res = await hodService.listSections(yearId);
      const list = Array.isArray(res?.data) ? res.data : [];
      setSections(list);
    } catch (err) {
      setError(err.message || 'Failed to fetch sections');
    } finally {
      setLoadingSections(false);
    }
  };

  const handleOpenModal = (section = null) => {
    setEditingSection(section);
    setFormData({
      name: section?.name || '',
      classTeacherId: section?.classTeacherId || section?.classTeacher?.id || section?.teacher?.id || '',
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      if (editingSection) {
        await hodService.updateSection(editingSection.id, {
          name: formData.name,
          classTeacherId: formData.classTeacherId || null,
        });
        toast.success(`Section ${formData.name.toUpperCase()} updated successfully`);
      } else {
        await hodService.createSection({
          name: formData.name,
          academicYearId: selectedYearId,
          classTeacherId: formData.classTeacherId || null,
        });
        toast.success(`Section ${formData.name.toUpperCase()} created successfully`);
      }
      setIsModalOpen(false);
      fetchSections(selectedYearId);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    setIsDeleting(true);
    try {
      await hodService.deleteSection(sectionToDelete.id);
      toast.success(`Section ${sectionToDelete.name} deleted successfully`);
      setSectionToDelete(null);
      fetchSections(selectedYearId);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Section Name',
      render: (row) => <div className="font-semibold text-slate-900">Section {row.name}</div>,
    },
    {
      header: 'Students',
      render: (row) => row._count?.students ?? '0',
    },
    {
      header: 'Class Teacher',
      render: (row) => {
        // Backend returns classTeacher relation; fallback to teacher or teachers array match
        const ct = row.classTeacher || row.teacher || teachers.find((t) => t.id === row.classTeacherId);
        if (ct?.user) {
          return (
            <div>
              <div className="font-medium text-slate-900">
                {ct.user.firstName} {ct.user.lastName}
              </div>
              {ct.user.email && (
                <div className="text-xs text-slate-400">{ct.user.email}</div>
              )}
            </div>
          );
        }
        return <span className="text-slate-400 italic">Unassigned</span>;
      },
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
            title="Edit Section"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSectionToDelete(row)}
            className="text-rose-500 hover:bg-rose-50 hover:text-rose-700 p-1.5"
            title="Delete Section"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
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
        <Button
          onClick={() => handleOpenModal()}
          leftIcon={<Plus className="w-4 h-4" />}
          disabled={!selectedYearId}
        >
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
          {loadingSections ? (
            <Loader message="Loading sections..." className="py-12" />
          ) : !selectedYearId ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Select a program and year to view sections.
            </div>
          ) : (
            <Table
              columns={columns}
              data={sections}
              emptyMessage={
                <EmptyState
                  icon={Grid}
                  title="No sections found"
                  message="Create the first section for this year."
                />
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Section Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !formLoading && setIsModalOpen(false)}
        title={editingSection ? 'Edit Section' : 'Create Section'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
              {formError}
            </div>
          )}

          <div>
            <Input
              label="Section Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. A"
              list="section-name-suggestions"
            />
            <datalist id="section-name-suggestions">
              {COMMON_SECTIONS.map((sec) => (
                <option key={sec} value={sec} />
              ))}
            </datalist>

            {/* Quick-pick suggestions while still allowing any custom typing */}
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-400 font-medium mr-1">Quick Select:</span>
              {COMMON_SECTIONS.map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setFormData({ ...formData, name: sec })}
                  className={`px-2 py-0.5 rounded text-xs font-semibold transition-colors ${
                    formData.name.toUpperCase() === sec
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>

          <SearchableSelect
            label="Class Teacher (Optional)"
            value={formData.classTeacherId}
            onChange={(e) => setFormData({ ...formData, classTeacherId: e.target.value })}
            placeholder="Search or select teacher..."
            options={[
              { value: '', label: '-- No Class Teacher --' },
              ...teachers
                .filter((t) => t.user?.isActive !== false)
                .map((t) => ({
                  value: t.id,
                  label: `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim(),
                  sublabel: t.user?.email,
                })),
            ]}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={formLoading}>
              {editingSection ? 'Save Changes' : 'Create Section'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!sectionToDelete}
        onClose={() => !isDeleting && setSectionToDelete(null)}
        onConfirm={handleDeleteSection}
        title={`Delete Section ${sectionToDelete?.name || ''}?`}
        message={`Are you sure you want to delete Section ${sectionToDelete?.name || ''}? This action cannot be undone.`}
        confirmText="Delete Section"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default Sections;
