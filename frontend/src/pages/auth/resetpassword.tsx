import React, { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Lock, Check, ArrowLeft } from 'lucide-react';

const ResetPasswordPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState<string>('');
    const [newPassword, setNewPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [tokenError, setTokenError] = useState<boolean>(false);

    useEffect(() => {
        // Extract token from URL
        const searchParams = new URLSearchParams(location.search);
        const urlToken = searchParams.get('token');

        if (!urlToken) {
            setTokenError(true);
        } else {
            setToken(urlToken);
        }
    }, [location]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password length
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/v1/auth/reset-password', {
                token,
                newPassword
            });

            if (response.data.success) {
                setSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    navigate('/auth/login');
                }, 3000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. The link may be expired or invalid.');
        } finally {
            setLoading(false);
        }
    };

    // If token is missing
    if (tokenError) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                <Lock className="h-6 w-6 text-red-600" />
                            </div>
                            <h2 className="text-lg font-medium text-gray-900 mb-2">Invalid Reset Link</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                The password reset link is invalid or has expired. Please request a new link.
                            </p>
                            <Link
                                to="/auth/forgot-password"
                                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                            >
                                Request a new password reset link
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If reset is successful
    if (success) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <Check className="h-6 w-6 text-green-600" />
                            </div>
                            <h2 className="text-lg font-medium text-gray-900 mb-2">Password Reset Successful</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Your password has been reset successfully. You will be redirected to the login page.
                            </p>
                            <Link
                                to="/auth/login"
                                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center justify-center"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Main reset password form
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex items-center justify-center">
                    <div className="bg-white rounded-full p-2">
                        <span className="text-indigo-700 text-xl font-bold">C</span>
                    </div>
                    <span className="text-2xl font-bold ml-2">comfybase</span>
                </div>
                <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Create new password</h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Your new password must be at least 8 characters
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                                New Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="new-password"
                                    name="new-password"
                                    type="password"
                                    required
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                Confirm New Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? 'Resetting...' : 'Reset Password'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="flex items-center justify-center">
                            <Link
                                to="/auth/login"
                                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center"
                            >
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
