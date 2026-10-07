import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader } from '../components/ui/Loader';

/**
 * Route wrapper enforcing role-based access for UX navigation
 */
export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loader fullPage message="Verifying role permissions..." />;
  }

  if (!user || (allowedRoles.length > 0 && !allowedRoles.includes(user.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
