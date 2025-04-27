import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('https://final-year-project-56d5.onrender.com/api/v1/auth/forgot-password', { email });

            if (response.data.success) {
                setSuccess(true);
            }
        } catch (err) {
            setError('An error occurred. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                <Lock className="h-6 w-6 text-green-600" />
                            </div>
                            <h2 className="text-lg font-medium text-gray-900 mb-2">Check your email</h2>
                            <p className="text-sm text-gray-500 mb-6">
                                If an account exists with the email you provided, we've sent instructions to reset your password.
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

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex items-center justify-center">
                    <div className="bg-white rounded-full p-2">
                        <span className="text-indigo-700 text-xl font-bold">C</span>
                    </div>
                    <span className="text-2xl font-bold ml-2">comfybase</span>
                </div>
                <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">Reset your password</h2>
                <p className="mt-2 text-center text-sm text-gray-500">
                    Enter your email and we'll send you instructions to reset your password.
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
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                {loading ? 'Sending...' : 'Send Reset Link'}
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

export default ForgotPasswordPage;
