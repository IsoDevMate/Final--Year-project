import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Mail, User, UserPlus } from 'lucide-react';

const AUTH_ACTIONS_DISABLED = false;

// Schema matching your backend validation
const registerSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[a-z]/, 'Must contain a lowercase letter')
    .regex(/[0-9]/, 'Must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Must contain a special character'),
  role: z.enum(['attendee', 'organizer'], {
    errorMap: () => ({ message: 'Please select a role' })
  })
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Password strength checker
function getPasswordStrength(pw: string) {
  const checks = [
    { label: 'At least 8 characters', ok: pw.length >= 8 },
    { label: 'Uppercase letter (A-Z)', ok: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter (a-z)', ok: /[a-z]/.test(pw) },
    { label: 'Number (0-9)', ok: /[0-9]/.test(pw) },
    { label: 'Special character (!@#$…)', ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter(c => c.ok).length;
  return { checks, score };
}

const strengthLabels = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
const strengthColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#0ABAB5'];

function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const { checks, score } = getPasswordStrength(password);
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? strengthColors[score] : '#e5e7eb' }} />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: strengthColors[score] }}>
        {strengthLabels[score]}
      </p>
      <ul className="space-y-0.5">
        {checks.map(c => (
          <li key={c.label} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-green-600' : 'text-gray-400'}`}>
            <span>{c.ok ? '✓' : '○'}</span> {c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

const SignupPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
     defaultValues: {
      role: 'attendee' // Default to attendee
    }
  });

  const passwordValue = watch('password', '');

  const onSubmit = async (data: RegisterFormData) => {
    if (AUTH_ACTIONS_DISABLED) {
      toast.error('Sign up is currently disabled.');
      return;
    }
    setIsLoading(true);
    try {
    //   const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/auth/register`, data);
       const response = await axios.post(`https://final-year-project-jy2j.onrender.com/api/v1/auth/register`, data);

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
    if (AUTH_ACTIONS_DISABLED) {
      toast.error('LinkedIn sign in is currently disabled.');
      return;
    }
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Left side */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <img
          src="/image copy.png"
          alt="Event"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-tiffany-700/60" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <Link to="/" className="flex items-center text-3xl font-bold">
            <div className="bg-white rounded-full p-2 mr-2">
              <span className="text-tiffany-600 text-xl font-bold">C</span>
            </div>
            eventbase
          </Link>
          <h1 className="text-5xl font-bold mb-6">
            Unleash your inner<br />organizer today. 🚀
          </h1>
        </div>
      </div>

      {/* Right side */}
      <div className="w-full md:w-1/2 bg-gray-100 p-8 md:p-12 flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="md:hidden mb-6">
            <span className="flex items-center text-2xl font-bold text-tiffany-700">
              <div className="bg-tiffany-700 rounded-full p-1 mr-2">
                <span className="text-white text-lg font-bold">C</span>
              </div>
              eventbase
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-bold mb-2">Create Your Account.</h2>
          <p className="text-gray-600 mb-8">Join EventBase and start organizing amazing events.</p>

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
                    className={`block w-full pl-10 pr-3 py-3 border rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`}
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
                    className={`block w-full pl-10 pr-3 py-3 border rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`}
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
                  className={`block w-full pl-10 pr-3 py-3 border rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

                  <div className="mb-4">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Select Your Role
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="attendee"
                    {...register('role')}
                    className="form-radio text-tiffany-600"
                  />
                  <span className="ml-2">Attendee</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    value="organizer"
                    {...register('role')}
                    className="form-radio text-tiffany-600"
                  />
                  <span className="ml-2">Organizer</span>
                </label>
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
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
                  className={`block w-full pl-10 pr-10 py-3 border rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-tiffany-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
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
              <PasswordStrengthMeter password={passwordValue} />
            </div>

            <button
              type="submit"
              disabled={AUTH_ACTIONS_DISABLED || isLoading}
              className={`w-full py-3 px-4 rounded-full text-white font-medium focus:outline-none focus:ring-2 focus:ring-tiffany-500 focus:ring-offset-2 flex items-center justify-center ${
                AUTH_ACTIONS_DISABLED
                  ? 'bg-tiffany-400 opacity-60 cursor-not-allowed'
                  : 'bg-tiffany-600 hover:bg-tiffany-700'
              }`}
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
              Already have an account?{' '}
              <Link to="/auth/login" className="font-medium text-tiffany-600 hover:text-tiffany-800">
                Sign In
              </Link>
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
                disabled={AUTH_ACTIONS_DISABLED}
                aria-disabled={AUTH_ACTIONS_DISABLED}
                className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm bg-white text-sm font-medium text-gray-700 ${
                  AUTH_ACTIONS_DISABLED ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-50'
                }`}
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
