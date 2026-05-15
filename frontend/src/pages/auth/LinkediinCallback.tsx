import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const LinkedInCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const { checkAuthStatus } = useAuth();

useEffect(() => {
  const accessToken = searchParams.get('accessToken');
  const refreshToken = searchParams.get('refreshToken');

  const error = searchParams.get('error');

  const handleAuthentication = async () => {
    if (error) {
      toast.error(error);
      navigate('/auth/login');
      return;
    }

    if (!accessToken || !refreshToken) {
      toast.error('Invalid authentication response');
      navigate('/auth/login');
      return;
    }

    try {
      // Store tokens in localStorage
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (response.data && response.data.data) {
          localStorage.setItem('user', JSON.stringify(response.data.data));
        } else {
          throw new Error('Invalid user data format');
        }
      } catch (fetchError) {
        console.error('Error fetching user data:', fetchError);
        toast.error('Error loading user profile');
        navigate('/auth/login');
        return;
      }

      // Update auth context
      await checkAuthStatus();

      toast.success('LinkedIn sign-in successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error processing LinkedIn callback:', error);
      toast.error('Authentication error');
      navigate('/auth/login');
    } finally {
      setIsLoading(false);
    }
  };

  // Reduced delay to improve user experience
  const delay = setTimeout(handleAuthentication, 500);
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
