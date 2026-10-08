import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Power, PowerOff, KeyRound,
  MessageCircle, Eye, EyeOff, Copy, CheckCheck,
} from 'lucide-react';
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

const emptyForm = { firstName: '', lastName: '', email: '', employeeId: '', phoneNumber: '' };

const Teachers = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teachers, setTeachers] = useState([]);

  // ── Modals ──────────────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCredOpen, setIsCredOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);

  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState('');

  // ── Form ────────────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const res = await hodService.listTeachers();
      const data = res?.data;
      setTeachers(Array.isArray(data) ? data : (data?.teachers ?? []));
    } catch (err) {
      setError(err.message || 'Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');
    try {
      const res = await hodService.createTeacher(formData);

      const tempPassword =
        res?.data?.temporaryPassword ||
        res?.temporaryPassword ||
        res?.data?.teacher?.temporaryPassword ||
        null;

      const teacherEmail =
        res?.data?.teacher?.user?.email ||
        res?.data?.user?.email ||
        formData.email;

      setIsCreateModalOpen(false);
      setFormData(emptyForm);
      fetchTeachers();

      if (tempPassword) {
        setSelectedTeacher({
          user: { firstName: formData.firstName, email: teacherEmail },
          phoneNumber: formData.phoneNumber,
        });
        setCredentials({ email: teacherEmail, password: tempPassword });
        setShowPassword(false);
        setCopied('');
        setIsCredOpen(true);
      }
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

  // ── Reset Password ──────────────────────────────────────────────────────────
  const handleResetPasswordConfirm = async () => {
    setFormLoading(true);
    try {
      const res = await hodService.resetTeacherPassword(selectedTeacher.id);

      const tempPassword =
        res?.data?.temporaryPassword ||
        res?.temporaryPassword ||
        null;

      setIsResetPasswordOpen(false);

      if (tempPassword) {
        const email = selectedTeacher?.user?.email || '';
        setCredentials({ email, password: tempPassword });
        setShowPassword(false);
        setCopied('');
        setIsCredOpen(true);
      } else {
        alert('Password reset done. Email sent to teacher.');
      }
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setFormLoading(false);
    }
  };

  // ── WhatsApp Send ───────────────────────────────────────────────────────────
  const sendWhatsApp = () => {
    const phone = selectedTeacher?.phoneNumber || selectedTeacher?.user?.phoneNumber || '';
    const clean = phone.replace(/\D/g, '');
    const name = selectedTeacher?.user?.firstName || selectedTeacher?.firstName || 'Teacher';
    const msg = encodeURIComponent(
      `Hello ${name},\n\nYour QR Attendance account credentials:\n\nEmail: ${credentials.email}\nTemporary Password: ${credentials.password}\n\nPlease login and change your password immediately.\n\nThank you.`
    );
    window.open(`https://wa.me/${clean}?text=${msg}`, '_blank');
  };

  // ── Copy helper ─────────────────────────────────────────────────────────────
  const copyToClipboard = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const columns = [
    {
      header: 'Teacher',
      render: (row) => (
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
      render: (row) => (
        <span className="font-mono text-sm text-slate-600">{row.employeeId || '—'}</span>
      )
    },
    {
      header: 'Assignments',
      render: (row) => row._count?.teachingAssignments ?? '—'
    },
    {
      header: 'Status',
      render: (row) => (
        <Badge variant={row.user.isActive ? 'success' : 'error'}>
          {row.user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleToggleStatus(row)}
            title={row.user.isActive ? 'Deactivate' : 'Activate'}
            className={`p-1.5 rounded-lg transition-colors ${
              row.user.isActive
                ? 'text-amber-500 hover:bg-amber-50 hover:text-amber-700'
                : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            {row.user.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
          </button>
          <button
            onClick={() => { setSelectedTeacher(row); setFormLoading(false); setIsResetPasswordOpen(true); }}
            title="Reset Password"
            className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <KeyRound className="w-4 h-4" />
          </button>
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
        <Button
          onClick={() => { setFormData(emptyForm); setFormError(''); setIsCreateModalOpen(true); }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
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

      {/* ── Create Teacher Modal ──────────────────────────────────────────── */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !formLoading && setIsCreateModalOpen(false)}
        title="Add New Teacher"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-lg border border-rose-100">{formError}</div>
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Employee ID"
              required
              placeholder="e.g. EMP001"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            />
            <Input
              label="WhatsApp / Phone Number"
              type="tel"
              placeholder="e.g. +919876543210"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={formLoading}>
              Cancel
            </Button>
            <Button type="submit" isLoading={formLoading}>Create Teacher</Button>
          </div>
        </form>
      </Modal>

      {/* ── Credentials Modal (after create / reset password) ──────────────── */}
      <Modal
        isOpen={isCredOpen}
        onClose={() => setIsCredOpen(false)}
        title="Teacher Account Credentials"
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

      {/* ── Reset Password Confirm ──────────────────────────────────────────── */}
      {selectedTeacher && (
        <ConfirmDialog
          isOpen={isResetPasswordOpen}
          onClose={() => setIsResetPasswordOpen(false)}
          onConfirm={handleResetPasswordConfirm}
          title="Reset Teacher Password"
          message={`Reset password for ${selectedTeacher.user?.firstName} ${selectedTeacher.user?.lastName}? A new temporary password will be generated.`}
          confirmText="Reset Password"
          isDestructive
          isLoading={formLoading}
        />
      )}
    </div>
  );
};

export default Teachers;
