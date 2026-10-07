import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button, Badge } from '../components/ui';
import { ROLE_DASHBOARDS, ROLE_LABELS } from '../utils/constants';

export const Unauthorized = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleReturnHome = () => {
    if (user?.role && ROLE_DASHBOARDS[user.role]) {
      navigate(ROLE_DASHBOARDS[user.role], { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-rose-100">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Access Restricted
        </h1>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed">
          Your current account role does not have authorization to view this section.
          The backend enforces strict access control policies for security.
        </p>

        {user && (
          <div className="mt-5 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-left flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">Logged in as:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-800">{user.email}</span>
              <Badge role={user.role} size="sm">
                {ROLE_LABELS[user.role] || user.role}
              </Badge>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto"
            onClick={handleReturnHome}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            My Dashboard
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto text-slate-600 border-slate-200"
            onClick={handleLogout}
            leftIcon={<LogOut className="w-4 h-4" />}
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
