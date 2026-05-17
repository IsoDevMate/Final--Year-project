import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { User, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
}

const ProfilePage: React.FC = () => {
    const { user, checkAuthStatus } = useAuth();
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || ''
            });
        }
    }, [user]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

   const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    const nameRegex = /^[A-Za-z\s'\-]+$/;
    if (formData.firstName.trim().length < 2) { setError('First name must be at least 2 characters'); return; }
    if (!nameRegex.test(formData.firstName.trim())) { setError('First name must contain letters only'); return; }
    if (formData.lastName.trim().length < 2) { setError('Last name must be at least 2 characters'); return; }
    if (!nameRegex.test(formData.lastName.trim())) { setError('Last name must contain letters only'); return; }
    if (formData.phoneNumber && !/^\+?[\d\s\-()]{7,15}$/.test(formData.phoneNumber)) {
      setError('Invalid phone number format'); return;
    }

    setLoading(true);
    setSuccess(false);

    try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/update-profile`,
          { firstName: formData.firstName.trim(), lastName: formData.lastName.trim(), phoneNumber: formData.phoneNumber },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
            await checkAuthStatus(); // refresh user state from server
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        }
        toast.success('Profile updated successfully!');
    } catch (err: any) {
        setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update profile');
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

                <div className="mb-8 flex flex-col items-center">
                    <div className="bg-tiffany-100 rounded-full p-6 mb-4 relative">
                        <User className="h-16 w-16 text-tiffany-600" />
                        <button className="absolute bottom-0 right-0 bg-tiffany-600 rounded-full p-2 text-white">
                            <Camera className="h-4 w-4" />
                        </button>
                    </div>
                    <h2 className="text-xl font-semibold">{user?.firstName} {user?.lastName}</h2>
                    <p className="text-gray-500">{user?.email}</p>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">
                        Profile updated successfully!
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                First Name
                            </label>
                            <input
                                type="text"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-tiffany-500 focus:border-tiffany-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name
                            </label>
                            <input
                                type="text"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-tiffany-500 focus:border-tiffany-500"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-tiffany-500 focus:border-tiffany-500 bg-gray-100"
                            disabled
                        />
                        <p className="text-xs text-gray-500 mt-1">Email address cannot be changed.</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-tiffany-500 focus:border-tiffany-500"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className={`bg-tiffany-600 text-white py-2 px-6 rounded-lg hover:bg-tiffany-700 transition duration-200 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
