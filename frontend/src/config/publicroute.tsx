import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PublicRouteProps {
  redirectPath?: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  redirectPath = '/dashboard'
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

  // Redirect if authenticated
  if (isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render child routes if not authenticated
  return <Outlet />;
};

export default PublicRoute;
