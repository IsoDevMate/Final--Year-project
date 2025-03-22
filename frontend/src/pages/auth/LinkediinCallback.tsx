import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const LinkedInCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const error = searchParams.get('error');

    const handleAuthentication = () => {
      if (error) {
        toast.error(error);
        navigate('/auth/login');
        return;
      }

      if (accessToken && refreshToken) {
        // Store tokens in localStorage
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Optionally fetch user data
        toast.success('LinkedIn sign-in successful!');
        navigate('/dashboard');
      } else {
        // Handle case where tokens are missing
        toast.error('LinkedIn authentication failed');
        navigate('/auth/login');
      }

      setIsLoading(false);
    };

    // Add a delay before handling authentication
    const delay = setTimeout(handleAuthentication, 3000); // 3 seconds delay

    return () => clearTimeout(delay);
  }, [searchParams, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 rounded-full border-t-transparent mx-auto mb-4"></div>
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
