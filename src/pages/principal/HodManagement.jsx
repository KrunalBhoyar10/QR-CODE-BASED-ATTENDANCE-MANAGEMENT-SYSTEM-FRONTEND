import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, Search, MoreVertical, Edit2, KeyRound, Power, PowerOff } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Modal } from '../../components/ui/Modal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Select } from '../../components/ui/Select';
import { principalService } from '../../services/principal.service';
import { getErrorMessage } from '../../utils/error';

const HodManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hods, setHods] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedHod, setSelectedHod] = useState(null);
  const [resetTokenInfo, setResetTokenInfo] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    departmentId: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hodsRes, deptsRes] = await Promise.all([
        principalService.listHods(),
        principalService.getDepartments()
      ]);
      setHods(hodsRes.data);
      setDepartments(deptsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load HOD data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await principalService.createHod(formData);
      setIsCreateModalOpen(false);
      setFormData({ firstName: '', lastName: '', email: '', departmentId: '' });
      fetchData(); // Refresh
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleStatus = async (hod) => {
    try {
      await principalService.updateHodStatus(hod.id, !hod.user.isActive);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleResetPasswordConfirm = async () => {
    setFormLoading(true);
    try {
      const res = await principalService.resetHodPassword(selectedHod.id);
      // In development, we show the reset token immediately
      if (res.data?.resetToken) {
        setResetTokenInfo(res.data.resetToken);
      } else {
        alert('Password reset link has been sent to the HOD\'s email.');
        setIsResetPasswordModalOpen(false);
      }
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  const columns = [
    {
      header: 'HOD Name',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
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
      header: 'Department',
      accessor: (row) => row.department?.name || 'N/A'
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(row)}
            title={row.user.isActive ? "Deactivate" : "Activate"}
            className={row.user.isActive ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'}
          >
            {row.user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedHod(row);
              setResetTokenInfo(null);
              setIsResetPasswordModalOpen(true);
            }}
            title="Reset Password"
            className="text-slate-500 hover:text-indigo-600"
          >
            <KeyRound className="w-4 h-4" />
          </Button>
        </div>
      )
    }
  ];

  if (loading) return <Loader fullPage message="Loading HODs..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchData} /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HOD Management</h1>
          <p className="text-slate-500 mt-1">Manage Heads of Departments across the institution</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Add New HOD
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table
            columns={columns}
            data={hods}
            emptyMessage={
              <EmptyState
                icon={Users}
                title="No HODs found"
                message="Get started by adding a Head of Department."
              />
            }
          />
        </CardContent>
      </Card>

      {/* Create HOD Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !formLoading && setIsCreateModalOpen(false)}
        title="Add New Head of Department"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
              {formError}
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            />
          </div>
          
          <Input
            label="Email Address"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Select
            label="Assign Department"
            required
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            options={[
              { value: '', label: '-- Select Department --' },
              ...departments.map(d => ({ value: d.id, label: d.name }))
            ]}
          />

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={formLoading}>
              Create HOD
            </Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Confirm Dialog & Token View */}
      {selectedHod && (
        <ConfirmDialog
          isOpen={isResetPasswordModalOpen && !resetTokenInfo}
          onClose={() => setIsResetPasswordModalOpen(false)}
          onConfirm={handleResetPasswordConfirm}
          title="Reset HOD Password"
          message={`Are you sure you want to reset the password for ${selectedHod.user.firstName} ${selectedHod.user.lastName}? An email will be sent to ${selectedHod.user.email} with instructions.`}
          confirmText="Send Reset Link"
          isDestructive={true}
          isLoading={formLoading}
        />
      )}

      {/* Dev Mode Token Viewer */}
      {resetTokenInfo && (
        <Modal
          isOpen={true}
          onClose={() => {
            setResetTokenInfo(null);
            setIsResetPasswordModalOpen(false);
          }}
          title="Development Mode: Reset Token Generated"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              In production, an email would be sent. For development purposes, here is the generated reset token for <strong>{selectedHod?.user.firstName}</strong>:
            </p>
            <div className="p-3 bg-slate-100 text-slate-800 font-mono text-sm rounded-lg break-all select-all border border-slate-200">
              {resetTokenInfo}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => {
                setResetTokenInfo(null);
                setIsResetPasswordModalOpen(false);
              }}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};

export default HodManagement;
