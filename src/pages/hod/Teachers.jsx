import React, { useState, useEffect } from 'react';
import { Users, Plus, Power, PowerOff, KeyRound } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { hodService } from '../../services/hod.service';
import { getErrorMessage } from '../../utils/error';

const Teachers = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetTokenInfo, setResetTokenInfo] = useState(null);

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '' });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await hodService.listTeachers();
      setTeachers(res.data);
    } catch (err) {
      setError(err.message || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await hodService.createTeacher(formData);
      setIsCreateModalOpen(false);
      setFormData({ firstName: '', lastName: '', email: '' });
      fetchTeachers();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (teacher) => {
    try {
      await hodService.updateTeacherStatus(teacher.id, !teacher.user.isActive);
      fetchTeachers();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleResetPasswordConfirm = async () => {
    setFormLoading(true);
    try {
      const res = await hodService.resetTeacherPassword(selectedTeacher.id);
      if (res.data?.resetToken) {
        setResetTokenInfo(res.data.resetToken);
      } else {
        alert('Password reset email sent to teacher.');
        setIsResetPasswordOpen(false);
      }
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'Teacher',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
            {row.user.firstName[0]}
          </div>
          <div>
            <div className="font-medium text-slate-900">{row.user.firstName} {row.user.lastName}</div>
            <div className="text-xs text-slate-500">{row.user.email}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Employee ID',
      accessor: (row) => (
        <span className="font-mono text-sm text-slate-600">{row.employeeId || '—'}</span>
      )
    },
    {
      header: 'Assignments',
      accessor: (row) => row._count?.teachingAssignments ?? '—'
    },
    {
      header: 'Status',
      accessor: (row) => (
        <Badge variant={row.user.isActive ? 'success' : 'error'}>
          {row.user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm"
            onClick={() => handleToggleStatus(row)}
            title={row.user.isActive ? 'Deactivate' : 'Activate'}
            className={row.user.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}>
            {row.user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm"
            onClick={() => { setSelectedTeacher(row); setResetTokenInfo(null); setIsResetPasswordOpen(true); }}
            title="Reset Password"
            className="text-slate-500 hover:text-indigo-600 hover:bg-indigo-50">
            <KeyRound className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <Loader fullPage message="Loading teachers..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchTeachers} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Teachers</h1>
          <p className="text-slate-500 mt-1">Manage teaching staff in your department</p>
        </div>
        <Button onClick={() => { setFormData({ firstName: '', lastName: '', email: '' }); setFormError(''); setIsCreateModalOpen(true); }}
          leftIcon={<Plus className="w-4 h-4" />}>
          Add Teacher
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table columns={columns} data={teachers}
            emptyMessage={<EmptyState icon={Users} title="No teachers found" message="Add your first teacher to get started." />}
          />
        </CardContent>
      </Card>

      {/* Create Teacher Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => !formLoading && setIsCreateModalOpen(false)}
        title="Add New Teacher" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{formError}</div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" required value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
            <Input label="Last Name" value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
          </div>
          <Input label="Email Address" type="email" required value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={formLoading}>Cancel</Button>
            <Button type="submit" isLoading={formLoading}>Create Teacher</Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Confirm */}
      {selectedTeacher && (
        <ConfirmDialog
          isOpen={isResetPasswordOpen && !resetTokenInfo}
          onClose={() => setIsResetPasswordOpen(false)}
          onConfirm={handleResetPasswordConfirm}
          title="Reset Teacher Password"
          message={`Send password reset for ${selectedTeacher.user.firstName} ${selectedTeacher.user.lastName} (${selectedTeacher.user.email})?`}
          confirmText="Send Reset Link"
          isDestructive={true}
          isLoading={formLoading}
        />
      )}

      {/* Dev Mode Token Viewer */}
      {resetTokenInfo && (
        <Modal isOpen={true} onClose={() => { setResetTokenInfo(null); setIsResetPasswordOpen(false); }}
          title="Dev Mode: Reset Token">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Password reset token for <strong>{selectedTeacher?.user.firstName}</strong>:</p>
            <div className="p-3 bg-slate-100 text-slate-800 font-mono text-xs rounded-lg break-all select-all border">{resetTokenInfo}</div>
            <div className="flex justify-end">
              <Button onClick={() => { setResetTokenInfo(null); setIsResetPasswordOpen(false); }}>Close</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Teachers;
