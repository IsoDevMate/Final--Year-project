import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, User, UserPlus } from 'lucide-react';

// Schema matching your backend validation
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

type RegisterFormData = z.infer<typeof registerSchema>;

const SignupPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
    //   const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/register`, data);
       const response = await axios.post(`http://localhost:3000/api/v1/auth/register`, data);

      toast.success('Registration successful! Please sign in.');
      navigate('/auth/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLinkedInLogin = () => {
    // Make a request to get LinkedIn authorization URL
    axios.get(`${import.meta.env.VITE_API_URL}/api/v1/auth/linkedin`)
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
          <span className="flex items-center text-3xl font-bold">
            <div className="bg-white rounded-full p-2 mr-2">
              <span className="text-indigo-600 text-xl font-bold">C</span>
            </div>
            comfybase
          </span>
        </div>
        <div className="mt-auto">
          <h1 className="text-5xl font-bold mb-6">
            Unleash your inner<br />organizer today. 🚀
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full md:w-1/2 bg-gray-100 p-8 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-6">
            <span className="flex items-center text-2xl font-bold text-indigo-700">
              <div className="bg-indigo-700 rounded-full p-1 mr-2">
                <span className="text-white text-lg font-bold">C</span>
              </div>
              comfybase
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-2">Create Your Account.</h2>
          <p className="text-gray-600 mb-8">Join ComfyBase and start organizing amazing events.</p>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={20} className="text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={20} className="text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    className={`block w-full pl-10 pr-3 py-3 border rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
                    {...register('lastName')}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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
                  Sign Up <UserPlus size={20} className="ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Already have an account? <Link to="/auth/login" className="text-indigo-600 hover:text-indigo-800 font-medium">Sign In</Link>
            </p>
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

            <div className="mt-6 grid grid-cols-3 gap-3">
              <button
                type="button"
                 className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={handleLinkedInLogin}
              >
                <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .792 0 1.771v20.458C0 23.208.792 24 1.771 24h20.454c.979 0 1.771-.792 1.771-1.771V1.771C24 .792 23.208 0 22.225 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
