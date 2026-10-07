import React, { useEffect, useState } from 'react';
import {
  User, Mail, Phone, Hash, Building2, GraduationCap,
  KeyRound, Save, X, Eye, EyeOff, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Loader } from '../../components/ui/Loader';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';
import studentService from '../../services/student.service';
import { getErrorMessage } from '../../utils/error';

const Field = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-slate-900 mt-0.5 break-all">{value || '–'}</p>
    </div>
  </div>
);

export default function StudentProfile() {
  const { refreshProfile } = useAuth();
  const [profile,  setProfile]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // Edit profile
  const [editing,  setEditing]  = useState(false);
  const [form,     setForm]     = useState({ firstName: '', lastName: '', phoneNumber: '' });
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState(null);

  // Change password
  const [pwdOpen,  setPwdOpen]  = useState(false);
  const [pwd,      setPwd]      = useState({ current: '', next: '', confirm: '' });
  const [pwdShow,  setPwdShow]  = useState({ current: false, next: false, confirm: false });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg,   setPwdMsg]  = useState(null);

  useEffect(() => {
    studentService.getProfile()
      .then((p) => {
        setProfile(p);
        setForm({ firstName: p.firstName || '', lastName: p.lastName || '', phoneNumber: p.phoneNumber || '' });
      })
      .catch((e) => setError(getErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await studentService.updateProfile(form);
      setProfile((prev) => ({ ...prev, ...updated }));
      await refreshProfile();
      setEditing(false);
      setSaveMsg({ type: 'success', text: 'Profile updated successfully.' });
    } catch (e) {
      setSaveMsg({ type: 'error', text: getErrorMessage(e) });
    } finally {
      setSaving(false);
    }
  };

  const handlePwdChange = async (e) => {
    e.preventDefault();
    setPwdMsg(null);
    if (pwd.next !== pwd.confirm) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (pwd.next.length < 8) {
      setPwdMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    setPwdSaving(true);
    try {
      await studentService.changePassword({ currentPassword: pwd.current, newPassword: pwd.next });
      setPwdMsg({ type: 'success', text: 'Password changed successfully. Please use your new password next time.' });
      setPwd({ current: '', next: '', confirm: '' });
    } catch (e) {
      setPwdMsg({ type: 'error', text: getErrorMessage(e) });
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) return <Loader message="Loading profile…" />;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">View and update your student account information.</p>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {saveMsg && (
        <div className={`text-sm rounded-xl px-4 py-3 flex items-center gap-2 ${saveMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
          {saveMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
          {saveMsg.text}
        </div>
      )}

      {profile && (
        <>
          {/* Avatar + header */}
          <Card>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-2xl font-bold shrink-0">
                  {profile.firstName?.[0]?.toUpperCase() || 'S'}
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    {profile.firstName} {profile.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{profile.email}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge role="STUDENT" size="sm">Student</Badge>
                    {profile.isActive
                      ? <Badge variant="emerald" size="sm">Active</Badge>
                      : <Badge variant="rose"    size="sm">Inactive</Badge>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Identity info */}
          <Card title="Academic Identity">
            <CardContent className="py-0 px-6">
              <Field icon={Hash}        label="Roll Number"       value={profile.rollNumber} />
              <Field icon={Hash}        label="Enrollment Number" value={profile.enrollmentNumber} />
              <Field icon={Building2}   label="Department"        value={profile.department ? `${profile.department.name} (${profile.department.code})` : null} />
              <Field icon={GraduationCap} label="Program"        value={profile.program ? `${profile.program.name} (${profile.program.code})` : null} />
              <Field icon={GraduationCap} label="Academic Year"  value={profile.academicYear?.label} />
              <Field icon={User}         label="Section"          value={profile.section?.name} />
            </CardContent>
          </Card>

          {/* Editable personal info */}
          <Card
            title="Personal Information"
            action={
              !editing
                ? <Button variant="ghost" size="sm" onClick={() => setEditing(true)} leftIcon={<User className="w-3.5 h-3.5" />}>Edit</Button>
                : null
            }
          >
            <CardContent>
              {!editing ? (
                <div className="py-0 -mx-0">
                  <Field icon={User}  label="First Name"    value={profile.firstName} />
                  <Field icon={User}  label="Last Name"     value={profile.lastName} />
                  <Field icon={Mail}  label="Email"         value={profile.email} />
                  <Field icon={Phone} label="Phone Number"  value={profile.phoneNumber} />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={form.firstName}
                      onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={form.lastName}
                      onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="Phone Number"
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" onClick={handleSave} isLoading={saving} leftIcon={<Save className="w-3.5 h-3.5" />}>
                      Save Changes
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => { setEditing(false); setSaveMsg(null); }} leftIcon={<X className="w-3.5 h-3.5" />}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Change Password */}
          <Card
            title="Change Password"
            action={
              <Button variant="ghost" size="sm" onClick={() => { setPwdOpen(!pwdOpen); setPwdMsg(null); }} leftIcon={<KeyRound className="w-3.5 h-3.5" />}>
                {pwdOpen ? 'Cancel' : 'Change'}
              </Button>
            }
          >
            {pwdOpen && (
              <CardContent>
                {pwdMsg && (
                  <div className={`text-xs rounded-lg px-3 py-2 mb-4 flex items-center gap-2 ${pwdMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
                    {pwdMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                    {pwdMsg.text}
                  </div>
                )}
                <form onSubmit={handlePwdChange} className="space-y-4">
                  <Input label="Current Password" isPassword required value={pwd.current} onChange={(e) => setPwd((p) => ({ ...p, current: e.target.value }))} placeholder="••••••••" />
                  <Input label="New Password"     isPassword required helperText="Min. 8 chars, uppercase, lowercase, number" value={pwd.next} onChange={(e) => setPwd((p) => ({ ...p, next: e.target.value }))} placeholder="••••••••" />
                  <Input label="Confirm New Password" isPassword required value={pwd.confirm} onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))} placeholder="••••••••" />
                  <Button type="submit" size="sm" isLoading={pwdSaving} leftIcon={<KeyRound className="w-3.5 h-3.5" />}>
                    Update Password
                  </Button>
                </form>
              </CardContent>
            )}
            {!pwdOpen && (
              <CardContent>
                <p className="text-xs text-slate-500">Change your account password. All other sessions will be invalidated for security.</p>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
