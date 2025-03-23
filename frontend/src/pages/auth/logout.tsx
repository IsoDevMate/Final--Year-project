import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

const LogoutPage: React.FC = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Progress animation effect
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return prev + 10;
            });
        }, 150);

        const performLogout = async () => {
            if (!isLoggingOut) {
                setIsLoggingOut(true);

                try {
                    // Wait a bit before logout to show the progress bar
                    await new Promise(resolve => setTimeout(resolve, 1200));
                    await logout();
                    toast.success('You have been logged out successfully');

                    // Allow toast to be visible and progress bar to complete
                    setTimeout(() => navigate('/auth/login'), 800);
                } catch (error) {
                    console.error('Logout error:', error);
                    toast.error('There was an error logging out');

                    // Even on error, redirect after a delay
                    setTimeout(() => navigate('/auth/login'), 800);
                }
            }
        };

        performLogout();

        return () => clearInterval(progressInterval);
    }, [logout, navigate, isLoggingOut]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-center w-full max-w-md">
                <div className="animate-spin h-12 w-12 border-4 border-indigo-500 rounded-full border-t-transparent mx-auto mb-6"></div>
                <h2 className="text-2xl font-medium text-gray-700 mb-4">Logging you out...</h2>
                <p className="text-gray-500 mb-4">Please wait while we complete the process.</p>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <p className="text-sm text-gray-400">Cleaning up your session data</p>
            </div>
        </div>
    );
};

export default LogoutPage;
