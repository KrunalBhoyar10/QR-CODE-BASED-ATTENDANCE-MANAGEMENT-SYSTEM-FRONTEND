import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { getErrorMessage } from '../../utils/error';
import { ROLE_DASHBOARDS } from '../../utils/constants';

const rules = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { label: 'One lowercase letter (a-z)', test: (v) => /[a-z]/.test(v) },
  { label: 'One number (0-9)', test: (v) => /[0-9]/.test(v) },
];

const ForceChangePassword = () => {
  const { user, changePassword, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const allRulesPassed = rules.every((r) => r.test(newPassword));
  const passwordsMatch = newPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('Password does not meet all requirements.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      // Refresh profile so mustChangePassword flag is updated
      const updated = await refreshProfile();
      const role = updated?.role || user?.role;
      navigate(ROLE_DASHBOARDS[role] || '/', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          {/* Icon + Title */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-4">
              <ShieldCheck className="w-7 h-7 text-indigo-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Set New Password</h1>
            <p className="text-sm text-slate-500 mt-1 text-center">
              Your account requires a password change before you can continue.
            </p>
          </div>

          {/* User info */}
          {user && (
            <div className="mb-5 px-4 py-3 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-600">
              Logged in as <span className="font-semibold text-slate-800">{user.firstName} {user.lastName}</span>
              <span className="mx-1 text-slate-300">•</span>
              <span className="text-indigo-600">{user.email}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current (Temp) Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Temporary Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your temporary password"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password rules */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  {rules.map((rule) => (
                    <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.test(newPassword) ? 'text-emerald-600' : 'text-slate-400'}`}>
                      <CheckCircle2 className={`w-3.5 h-3.5 ${rule.test(newPassword) ? 'text-emerald-500' : 'text-slate-300'}`} />
                      {rule.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className={`w-full pl-9 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
                    confirmPassword && !passwordsMatch ? 'border-rose-300 bg-rose-50' : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-rose-500">Passwords do not match</p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full justify-center py-2.5"
                isLoading={isLoading}
                disabled={!allRulesPassed || !passwordsMatch || !currentPassword}
              >
                Set New Password & Continue
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForceChangePassword;
