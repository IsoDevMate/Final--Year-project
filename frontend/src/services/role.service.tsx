import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RoleProtectedRouteProps {
  allowedRoles: string[];
  redirectPath?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  allowedRoles,
  redirectPath = '/dashboard'
}) => {
  const { user } = useAuth();

  // Check if the user exists and has the required role
  const hasRequiredRole = user && allowedRoles.includes(user.role);

  if (!hasRequiredRole) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
