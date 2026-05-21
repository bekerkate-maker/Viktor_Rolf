import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: JSX.Element;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
