import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import authService from '../../services/auth.service';
import { Button, Input } from '../../components/ui';
import { getErrorMessage } from '../../utils/error';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessInfo(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your registered institutional email.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.forgotPassword({ email: email.trim() });
      setSuccessInfo(response.data || { success: true });
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Failed to request password reset. Please try again.'));
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
          Forgot Password
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your registered institutional email to receive a password reset token.
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

      {successInfo ? (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Reset Instructions Dispatched</span>
            </div>
            <p className="leading-relaxed">
              If an active account exists for <span className="font-semibold">{email}</span>, password reset instructions have been generated.
            </p>
          </div>

          {/* Development / Testing mode token detection */}
          {successInfo.resetToken && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
              <p className="text-[11px] font-semibold text-amber-800">
                Development Token Generated:
              </p>
              <div className="p-2 bg-white rounded border border-amber-200 font-mono text-[11px] text-slate-700 break-all select-all">
                {successInfo.resetToken}
              </div>
              <Button
                variant="primary"
                size="sm"
                className="w-full mt-2"
                onClick={() => navigate(`/reset-password?token=${encodeURIComponent(successInfo.resetToken)}`)}
                leftIcon={<KeyRound className="w-4 h-4" />}
              >
                Proceed to Reset Password
              </Button>
            </div>
          )}

          {!successInfo.resetToken && (
            <Link to="/reset-password">
              <Button variant="outline" size="md" className="w-full mt-3">
                I Have a Reset Token
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Institutional Email"
            type="email"
            placeholder="name@university.edu"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4" />}
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
              Request Reset Token
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
