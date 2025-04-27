import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
   const { login,isAuthenticated,checkAuthStatus } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

const onSubmit = async (data: LoginFormData) => {
  setIsLoading(true);
  try {
    console.log('Attempting login with:', data.email);
    await login(data.email, data.password);

    // Debug after login
    console.log('Login completed, checking storage:');
    console.log('User:', localStorage.getItem('user'));
    console.log('Access Token:', localStorage.getItem('accessToken'));
    console.log('isAuthenticated state:', isAuthenticated);
   await checkAuthStatus();
    toast.success('Login successful!');
    navigate('/dashboard');
  } catch (error: unknown) {
    console.error('Login error:', error);
    if (axios.isAxiosError(error) && error.response?.data?.error) {
      toast.error(error.response.data.error);
    } else {
      toast.error('Login failed. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleLinkedInLogin = () => {
    // Make a request to get LinkedIn authorization URL
    axios.get(`https://final-year-project-77pa.onrender.com/api/v1/auth/linkedin`)
      .then(response => {
        // Redirect to LinkedIn authorization page
        window.location.href = response.data.data.url;
      })
      .catch(error => {
        console.error('LinkedIn auth error:', error);
        toast.error('Failed to initiate LinkedIn login');
      });
  };


  return (
    <div className="flex min-h-screen bg-gradient-to-b from-indigo-700 to-indigo-400">
      {/* Left side */}
      <div className="hidden md:flex md:w-1/2 flex-col items-center justify-center p-12 text-white">
        <div className="mb-12">
          <Link to="/" className="flex items-center text-3xl font-bold">
            <div className="bg-white rounded-full p-2 mr-2">
              <span className="text-indigo-600 text-xl font-bold">C</span>
            </div>
            comfybase
          </Link>
        </div>
        <div className="mt-auto">
          <h1 className="text-5xl font-bold mb-6">
            Unleash your inner<br />organizer today. 🚀
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full md:w-1/2 bg-white p-8 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-6">
            <span className="flex items-center text-2xl font-bold text-indigo-700">
              <div className="bg-indigo-700 rounded-full p-1 mr-2">
                <span className="text-white text-lg font-bold">C</span>
              </div>
              comfybase
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-2">Sign In To Your Account.</h2>
          <p className="text-gray-600 mb-8">Let's sign in to your account and get started.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  className={`block w-full pl-10 pr-3 py-3 border rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••••"
                  className={`block w-full pl-10 pr-10 py-3 border rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('password')}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 py-3 px-4 rounded-full text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center justify-center"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 mr-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  Sign In <LogIn size={20} className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account? <Link to="/auth/signup" className="text-indigo-600 hover:text-indigo-800 font-medium">Sign Up</Link>
            </p>
            <Link to="/auth/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Forgot Password
            </Link>
          </div>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-cream-100 text-gray-500">OR</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 justify-centre">
              <button
                type="button"
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => window.location.href = "https://final-year-project-77pa.onrender.com/api/v1/auth/linkedin"}
              >
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
