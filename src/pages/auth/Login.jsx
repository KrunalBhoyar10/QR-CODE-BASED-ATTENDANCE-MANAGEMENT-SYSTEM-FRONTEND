import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/ui';
import { getErrorMessage } from '../../utils/error';
import { ROLE_DASHBOARDS } from '../../utils/constants';

export const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Target destination after successful login
  const from = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = await login({ email: email.trim(), password });
      const userRole = payload.user?.role;

      // Role-based redirect or original target if matching
      const targetDestination = from || (userRole ? ROLE_DASHBOARDS[userRole] : '/');
      navigate(targetDestination, { replace: true });
    } catch (err) {
      setErrorMessage(getErrorMessage(err, 'Authentication failed. Please verify your credentials.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Sign In to Portal
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Enter your university credentials to access attendance & academic records.
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{errorMessage}</span>
        </div>
      )}

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

        <div>
          <Input
            label="Password"
            isPassword
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4" />}
            disabled={isLoading}
          />
          <div className="mt-2 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full justify-center py-2.5 shadow-md shadow-indigo-200"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Sign In
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Login;
