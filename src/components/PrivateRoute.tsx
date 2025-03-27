import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Prevents redirect while checking auth state
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  return <>{children}</>;
} 