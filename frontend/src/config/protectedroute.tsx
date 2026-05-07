import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/auth/login'
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-10 w-10 border-4 border-tiffany-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
