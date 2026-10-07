import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, KeyRound, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import authService from '../../services/auth.service';
import { Button, Input } from '../../components/ui';
import { getErrorMessage } from '../../utils/error';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const queryToken = searchParams.get('token');
    if (queryToken) {
      setToken(queryToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token.trim()) {
      setErrorMessage('Reset token is required.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({ token: token.trim(), newPassword });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2500);
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to reset password. The token may be expired or invalid.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </Link>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Reset Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Set a secure new password for your attendance account.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {isSuccess ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-3 text-center">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-emerald-900">
            Password Successfully Reset!
          </h4>
          <p className="text-emerald-700">
            Your password has been updated. Redirecting you to the login screen...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Reset Token"
            type="text"
            required
            placeholder="Paste your reset token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            leftIcon={<KeyRound className="w-4 h-4" />}
            disabled={isLoading}
          />

          <Input
            label="New Password"
            isPassword
            required
            helperText="At least 8 characters"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            disabled={isLoading}
          />

          <Input
            label="Confirm New Password"
            isPassword
            required
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            disabled={isLoading}
          />

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full justify-center shadow-md shadow-indigo-200"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Update Password
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ResetPassword;
