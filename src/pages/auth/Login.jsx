import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Shield,
  GraduationCap,
  Users,
  BookOpen,
  UserPlus,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/ui';
import { getErrorMessage } from '../../utils/error';
import { ROLE_DASHBOARDS } from '../../utils/constants';
import StudentRegister from './StudentRegister';

// ─── Role configuration for the selector ──────────────────────────────────────
const ROLE_OPTIONS = [
  {
    id: 'PRINCIPAL',
    label: 'Principal',
    description: 'Institutional administrator',
    icon: Shield,
    color: 'indigo',
  },
  {
    id: 'HOD',
    label: 'HOD',
    description: 'Head of Department',
    icon: Users,
    color: 'violet',
  },
  {
    id: 'TEACHER',
    label: 'Teacher',
    description: 'Faculty / Instructor',
    icon: BookOpen,
    color: 'sky',
  },
  {
    id: 'STUDENT',
    label: 'Student',
    description: 'Registered student',
    icon: GraduationCap,
    color: 'emerald',
  },
];

// Tailwind colour map (needs to stay static so Tailwind JIT can detect them)
const colorMap = {
  indigo: {
    ring: 'ring-indigo-400',
    bg: 'bg-indigo-50',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    border: 'border-indigo-300',
    label: 'text-indigo-700',
  },
  violet: {
    ring: 'ring-violet-400',
    bg: 'bg-violet-50',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    border: 'border-violet-300',
    label: 'text-violet-700',
  },
  sky: {
    ring: 'ring-sky-400',
    bg: 'bg-sky-50',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    border: 'border-sky-300',
    label: 'text-sky-700',
  },
  emerald: {
    ring: 'ring-emerald-400',
    bg: 'bg-emerald-50',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    border: 'border-emerald-300',
    label: 'text-emerald-700',
  },
};

// ─── View state machine ─────────────────────────────────────────────────────
// 'select'    → Role selection screen (initial)
// 'login'     → Standard email/password sign-in (Principal, HOD, Teacher, Student)
// 'register'  → Student self-registration wizard

const VIEW = {
  SELECT: 'select',
  LOGIN: 'login',
  REGISTER: 'register',
};

// ─── Root Login component ────────────────────────────────────────────────────
export const Login = () => {
  const [view, setView] = useState(VIEW.SELECT);
  const [selectedRole, setSelectedRole] = useState(null);

  // ─── Role selection view ───────────────────────────────────────────────
  if (view === VIEW.SELECT) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Sign In to Portal
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Select your role to continue.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {ROLE_OPTIONS.map((role) => {
            const colors = colorMap[role.color];
            const Icon = role.icon;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => {
                  setSelectedRole(role.id);
                  setView(VIEW.LOGIN);
                }}
                className={`group flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all duration-150 hover:shadow-md focus:outline-none focus-visible:ring-2 ${colors.ring} focus-visible:ring-offset-2 border-slate-200 hover:${colors.border} hover:${colors.bg} active:scale-[0.97]`}
              >
                <div className={`p-2 rounded-lg ${colors.iconBg} ${colors.iconColor} transition-colors`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className={`text-sm font-semibold text-slate-800 group-hover:${colors.label} transition-colors`}>
                    {role.label}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                    {role.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Student registration view ─────────────────────────────────────────
  if (view === VIEW.REGISTER) {
    return (
      <StudentRegister
        onBackToLogin={() => {
          setView(VIEW.SELECT);
          setSelectedRole(null);
        }}
      />
    );
  }

  // ─── Login form view ───────────────────────────────────────────────────
  return (
    <LoginForm
      role={selectedRole}
      onBack={() => { setView(VIEW.SELECT); setSelectedRole(null); }}
      onRegister={() => setView(VIEW.REGISTER)}
    />
  );
};

// ─── LoginForm — the actual email+password form (reused for all roles) ────────
const LoginForm = ({ role, onBack, onRegister }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const from = location.state?.from?.pathname;

  const roleOption = ROLE_OPTIONS.find((r) => r.id === role);
  const colors = roleOption ? colorMap[roleOption.color] : colorMap.indigo;
  const Icon = roleOption?.icon || Shield;

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
      const mustChange = payload.user?.mustChangePassword;

      if (mustChange) {
        navigate('/change-password', { replace: true });
        return;
      }

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
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 mb-3 transition-colors"
          aria-label="Back to role selection"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          All roles
        </button>

        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${colors.iconBg} ${colors.iconColor} flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">
              Sign In as {roleOption?.label || role}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your university credentials to continue.
            </p>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200/80 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-200"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span className="font-medium leading-relaxed">{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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

        <div className="pt-1">
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

      {/* Student register option */}
      {role === 'STUDENT' && (
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 mb-2">New student? Create your account.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-center"
            onClick={onRegister}
            leftIcon={<UserPlus className="w-3.5 h-3.5" />}
          >
            Register as Student
          </Button>
        </div>
      )}
    </div>
  );
};

export default Login;
