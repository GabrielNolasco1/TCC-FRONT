import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ValidationStatus } from '../types/api';

export function ProtectedRoute() {
  const { token, user } = useAuthStore();

  if (!token) return <Navigate to="/login" replace />;

  if (user && user.valid !== ValidationStatus.VALID) {
    return <Navigate to="/verify" replace />;
  }

  return <Outlet />;
}