import React, { useState, useEffect } from 'react';
import {
  Users, Plus, KeyRound, Power, PowerOff, Edit2, Trash2,
  MessageCircle, Eye, EyeOff, Copy, CheckCheck,
} from 'lucide-react';
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
import { principalService } from '../../services/principal.service';
import { getErrorMessage } from '../../utils/error';
import { validateOrgEmail } from '../../utils/emailValidation';

const emptyForm = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  departmentName: '',
  departmentCode: '',
};

const HodManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hods, setHods] = useState([]);

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isCredOpen, setIsCredOpen] = useState(false);   // show temp password after create/reset

  const [selectedHod, setSelectedHod] = useState(null);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState('');

  // ── Form ────────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formStep, setFormStep] = useState('');

  // ── Edit form (no dept fields) ───────────────────────────────────────────────
  const [editData, setEditData] = useState({
    firstName: '', lastName: '', email: '', phoneNumber: '',
  });

  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await principalService.listHods();
      // res = { success, message, data: [...hods], pagination }
      const list = Array.isArray(res?.data) 
        ? res.data 
        : Array.isArray(res?.data?.hods) 
          ? res.data.hods 
          : Array.isArray(res) 
            ? res 
            : [];
      setHods(list);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    // Frontend domain check
    const emailErr = validateOrgEmail(formData.email);
    if (emailErr) { setFormError(emailErr); setFormLoading(false); return; }

    try {
      // Step 1: create department
      setFormStep('creating_dept');
      const deptRes = await principalService.createDepartment({
        name: formData.departmentName,
        code: formData.departmentCode,
      });
      const departmentId = deptRes?.data?.id || deptRes?.id;
      if (!departmentId) throw new Error('Failed to get department ID.');

      // Step 2: create HOD
      setFormStep('creating_hod');
      const hodRes = await principalService.createHod({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber || undefined,
        departmentId,
      });

      const tempPassword = hodRes?.data?.temporaryPassword;
      const hodEmail = hodRes?.data?.hod?.email || formData.email;

      setIsCreateOpen(false);
      setFormData(emptyForm);
      setFormStep('');
      fetchData();

      // Show credentials modal
      if (tempPassword) {
        setCredentials({ email: hodEmail, password: tempPassword });
        setShowPassword(false);
        setCopied('');
        setIsCredOpen(true);
      }
    } catch (err) {
      setFormError(getErrorMessage(err));
      setFormStep('');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const openEdit = (hod) => {
    setSelectedHod(hod);
    setEditData({
      firstName: hod.firstName || hod.user?.firstName || '',
      lastName: hod.lastName || hod.user?.lastName || '',
      email: hod.email || hod.user?.email || '',
      phoneNumber: hod.phoneNumber || hod.user?.phoneNumber || '',
    });
    setFormError('');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      await principalService.updateHod(selectedHod.id, editData);
      setIsEditOpen(false);
      fetchData();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  // ── Toggle Status ───────────────────────────────────────────────────────────
  const handleToggleStatus = async (hod) => {
    const isActive = hod.isActive ?? hod.user?.isActive;
    try {
      await principalService.updateHodStatus(hod.id, !isActive);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // ── Reset Password ──────────────────────────────────────────────────────────
  const handleResetPasswordConfirm = async () => {
    setFormLoading(true);
    try {
      const res = await principalService.resetHodPassword(selectedHod.id);
      const tempPassword = res?.data?.temporaryPassword;
      setIsResetOpen(false);
      if (tempPassword) {
        const email = selectedHod.email || selectedHod.user?.email || '';
        setCredentials({ email, password: tempPassword });
        setShowPassword(false);
        setCopied('');
        setIsCredOpen(true);
      } else {
        alert('Password reset done. Email sent to HOD.');
      }
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setFormLoading(true);
    try {
      await principalService.deleteHod(selectedHod.id);
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  // ── WhatsApp Send ───────────────────────────────────────────────────────────
  const sendWhatsApp = () => {
    const phone = selectedHod?.phoneNumber || selectedHod?.user?.phoneNumber || '';
    // Remove non-digits, ensure country code present
    const clean = phone.replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Hello ${selectedHod?.firstName || selectedHod?.user?.firstName || 'HOD'},\n\nYour QR Attendance account credentials:\n\nEmail: ${credentials.email}\nTemporary Password: ${credentials.password}\n\nPlease login and change your password immediately.\n\nThank you.`
    );
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  };

  // ── Copy helper ─────────────────────────────────────────────────────────────
  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  // ── Normalize HOD row ────────────────────────────────────────────────────────
  const norm = (row) => ({
    id: row.id,
    firstName: row.firstName || row.user?.firstName || '',
    lastName: row.lastName || row.user?.lastName || '',
    email: row.email || row.user?.email || '',
    phoneNumber: row.phoneNumber || row.user?.phoneNumber || '',
    isActive: row.isActive ?? row.user?.isActive ?? false,
    department: row.headedDepartment || row.department || null,
  });

  // ── Table columns ───────────────────────────────────────────────────────────
  const columns = [
    {
      header: 'HOD Name',
      render: (row) => {
        const h = norm(row);
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
              {h.firstName[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="font-medium text-slate-900">{h.firstName} {h.lastName}</div>
              <div className="text-xs text-slate-500">{h.email}</div>
              {h.phoneNumber && (
                <div className="text-xs text-slate-400">{h.phoneNumber}</div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Department',
      render: (row) => {
        const h = norm(row);
        return h.department
          ? (
            <div>
              <div className="font-medium text-slate-800">{h.department.name}</div>
              {h.department.code && (
                <div className="text-xs text-slate-500 uppercase tracking-wide">{h.department.code}</div>
              )}
            </div>
          )
          : <span className="text-slate-400 italic text-sm">Not assigned</span>;
      },
    },
    {
      header: 'Status',
      render: (row) => {
        const h = norm(row);
        return (
          <Badge variant={h.isActive ? 'success' : 'error'}>
            {h.isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => {
        const h = norm(row);
        return (
          <div className="flex items-center gap-1">
            {/* Toggle Active/Inactive */}
            <button
              onClick={() => handleToggleStatus(row)}
              title={h.isActive ? 'Deactivate HOD' : 'Activate HOD'}
              className={`p-1.5 rounded-lg transition-colors ${
                h.isActive
                  ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-700'
                  : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
              }`}
            >
              {h.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
            </button>

            {/* Edit */}
            <button
              onClick={() => openEdit(row)}
              title="Edit HOD"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>

            {/* Reset Password */}
            <button
              onClick={() => { setSelectedHod(row); setFormLoading(false); setIsResetOpen(true); }}
              title="Reset Password"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Delete */}
            <button
              onClick={() => { setSelectedHod(row); setIsDeleteOpen(true); }}
              title="Delete HOD"
              className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  if (loading) return <Loader fullPage message="Loading HODs..." />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={fetchData} /></div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">HOD Management</h1>
          <p className="text-slate-500 mt-1">Manage Heads of Departments across the institution</p>
        </div>
        <Button onClick={() => { setFormData(emptyForm); setFormError(''); setIsCreateOpen(true); }} leftIcon={<Plus className="w-4 h-4" />}>
          Add New HOD
        </Button>
      </div>

      {/* Table */}
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

      {/* ── Create HOD Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => !formLoading && setIsCreateOpen(false)}
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

          <Input
            label="WhatsApp / Phone Number"
            type="tel"
            placeholder="e.g. +919876543210"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          />

          <div className="pt-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <span className="w-5 h-px bg-slate-200 inline-block" />
              New Department
              <span className="flex-1 h-px bg-slate-200 inline-block" />
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Department Name"
                required
                placeholder="e.g. Electronics & TC"
                value={formData.departmentName}
                onChange={(e) => setFormData({ ...formData, departmentName: e.target.value })}
              />
              <Input
                label="Department Code"
                required
                placeholder="e.g. ETC"
                value={formData.departmentCode}
                onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
              />
            </div>
          </div>

          {formLoading && formStep && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {formStep === 'creating_dept' ? 'Creating department...' : 'Creating HOD account...'}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={formLoading}>
              Create HOD
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit HOD Modal ───────────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !formLoading && setIsEditOpen(false)}
        title="Edit HOD Details"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              required
              value={editData.firstName}
              onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              value={editData.lastName}
              onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            required
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
          />

          <Input
            label="WhatsApp / Phone Number"
            type="tel"
            placeholder="e.g. +919876543210"
            value={editData.phoneNumber}
            onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={formLoading}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Credentials Modal (after create / reset password) ─────────────────── */}
      <Modal
        isOpen={isCredOpen}
        onClose={() => setIsCredOpen(false)}
        title="HOD Account Credentials"
        size="md"
      >
        <div className="space-y-5">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            Save these credentials now — the password will not be shown again.
          </div>

          {/* Email row */}
          <div>
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Email / Login ID</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-slate-100 rounded-lg font-mono text-sm text-slate-800 select-all break-all">
                {credentials.email}
              </div>
              <button
                onClick={() => copyToClipboard(credentials.email, 'email')}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Copy email"
              >
                {copied === 'email' ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password row */}
          <div>
            <p className="text-xs text-slate-500 mb-1 font-medium uppercase tracking-wide">Temporary Password</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-slate-100 rounded-lg font-mono text-sm text-slate-800 select-all break-all">
                {showPassword ? credentials.password : '•'.repeat(credentials.password.length)}
              </div>
              <button
                onClick={() => setShowPassword((v) => !v)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title={showPassword ? 'Hide' : 'Show'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={() => copyToClipboard(credentials.password, 'pass')}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                title="Copy password"
              >
                {copied === 'pass' ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100 gap-3">
            {/* Send via WhatsApp */}
            <button
              onClick={sendWhatsApp}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Send via WhatsApp
            </button>
            <Button onClick={() => setIsCredOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* ── Reset Password Confirm ───────────────────────────────────────────── */}
      {selectedHod && (
        <ConfirmDialog
          isOpen={isResetOpen}
          onClose={() => setIsResetOpen(false)}
          onConfirm={handleResetPasswordConfirm}
          title="Reset HOD Password"
          message={`Reset password for ${norm(selectedHod).firstName} ${norm(selectedHod).lastName}? A new temporary password will be generated.`}
          confirmText="Reset Password"
          isDestructive
          isLoading={formLoading}
        />
      )}

      {/* ── Delete Confirm ───────────────────────────────────────────────────── */}
      {selectedHod && (
        <ConfirmDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete HOD"
          message={`Permanently delete ${norm(selectedHod).firstName} ${norm(selectedHod).lastName}? This action cannot be undone.`}
          confirmText="Delete HOD"
          isDestructive
          isLoading={formLoading}
        />
      )}
    </div>
  );
};

export default HodManagement;
