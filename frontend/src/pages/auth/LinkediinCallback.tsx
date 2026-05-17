import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const LinkedInCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { checkAuthStatus } = useAuth();

useEffect(() => {
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');
  const linkedinConnected = searchParams.get('linkedinConnected');
  const error = searchParams.get('error');

  const handleAuthentication = async () => {
    if (error) {
      toast.error(error);
      navigate('/auth/login');
      return;
    }

    if (!accessToken) {
      toast.error('Invalid authentication response');
      navigate('/auth/login');
      return;
    }

    try {
      // Check if this was a "link" flow — the token is the user's existing token
      const currentToken = localStorage.getItem('accessToken');
      const isLinkFlow = linkedinConnected === 'true' && currentToken && accessToken === currentToken;

      if (isLinkFlow) {
        // Just refresh auth status to pick up the new LinkedIn connection
        await checkAuthStatus();
        toast.success('LinkedIn account connected successfully!');
        navigate('/dashboard/notes');
        return;
      }

      // Login/register flow — store new tokens
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      await checkAuthStatus();
      toast.success('LinkedIn sign-in successful!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Error processing LinkedIn callback:', err);
      toast.error('Authentication error');
      navigate('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  const delay = setTimeout(handleAuthentication, 300);
  return () => clearTimeout(delay);
}, [searchParams, navigate, checkAuthStatus]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin h-10 w-10 border-4 border-tiffany-500 rounded-full border-t-transparent mx-auto mb-4"></div>
        <h2 className="text-xl font-medium text-gray-700">Completing your sign-in...</h2>
        <p className="text-gray-500 mt-2">Please wait while we authenticate your LinkedIn account.</p>
        {isLoading && (
          <p className="text-gray-500 mt-2">Redirecting...</p>
        )}
      </div>
    </div>
  );
};

export default LinkedInCallback;
