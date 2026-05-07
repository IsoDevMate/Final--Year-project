import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, FileText, Loader, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// List of countries and their major cities
const countries = [
  {
    name: 'Kenya',
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Nyeri', 'Kakamega', 'Nyakach']
  },
  {
    name: 'Uganda',
    cities: ['Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Mbarara']
  },
  {
    name: 'Tanzania',
    cities: ['Dar es Salaam', 'Dodoma', 'Zanzibar', 'Arusha', 'Mwanza']
  },
  {
    name: 'Nigeria',
    cities: ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt']
  },
  {
    name: 'South Africa',
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Bloemfontein']
  },
  {
    name: 'Egypt',
    cities: ['Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan']
  },
  {
    name: 'Ethiopia',
    cities: ['Addis Ababa', 'Dire Dawa', 'Mek\'ele', 'Gondar', 'Bahir Dar']
  },
  {
    name: 'Morocco',
    cities: ['Casablanca', 'Rabat', 'Marrakesh', 'Fez', 'Tangier']
  },
  {
    name: 'Ghana',
    cities: ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Cape Coast']
  },
  {
    name: 'Other',
    cities: ['Other']
  }
];

interface Location {
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface EventData {
  _id?: string;
  title: string;
  description: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  location: Location;
  capacity: number;
  ticketPrice: number;
  coverImage?: string;
  attendees?: string[];
}

const UpdateEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [originalEvent, setOriginalEvent] = useState<EventData | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [eventData, setEventData] = useState<EventData>({
    title: '',
    description: '',
    type: '',
    status: 'published',
    startDate: '',
    endDate: '',
    location: {
      name: '',
      address: '',
      city: '',
      country: '',
      postalCode: '',
      coordinates: {
        latitude: 0,
        longitude: 0
      }
    },
    capacity: 0,
    ticketPrice: 0
  });

  // Update event types to match backend enum
  const eventTypes = [
    'conference',
    'seminar',
    'workshop',
    'meetup',
    'webinar',
    'training',
    'expo',
    'other'
  ];

  const eventStatuses = ['draft', 'published', 'cancelled', 'completed'];

  // Check if user has permission to update event
  const canUpdateEvent = user &&
    (user.role === 'organizer' || user.role === 'admin');

  // Format datetime string for input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Fetch event data
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const response = await axios.get(`https://final-year-project-jy2j.onrender.com/api/v1/events/${id}`);

        if (response.data.success) {
          const eventData = response.data.data;
          setOriginalEvent(eventData);

          // Format dates for input fields
          const formattedEventData = {
            ...eventData,
            startDate: formatDateForInput(eventData.startDate),
            endDate: formatDateForInput(eventData.endDate)
          };

          setEventData(formattedEventData);

          // Set available cities based on country
          const selectedCountry = countries.find(c => c.name === eventData.location.country);
          if (selectedCountry) {
            setAvailableCities(selectedCountry.cities);
          }

          // If the city is not in our predefined list, add it for this instance
          if (selectedCountry && !selectedCountry.cities.includes(eventData.location.city)) {
            setAvailableCities(prev => [...prev, eventData.location.city]);
          }

          // Set image preview if coverImage exists
          if (eventData.coverImage) {
            setImagePreview(eventData.coverImage);
          }
        } else {
          toast.error('Failed to load event data');
          navigate('/dashboard/events');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Error loading event data');
        navigate('/dashboard/events');
      } finally {
        setIsFetching(false);
      }
    };

    if (id) {
      fetchEventData();
    }
  }, [id, navigate]);

  // Update available cities when country changes
  useEffect(() => {
    const selectedCountry = countries.find(c => c.name === eventData.location.country);
    if (selectedCountry) {
      setAvailableCities(selectedCountry.cities);

      // If currently selected city is not in the list and it's a valid city (from original data),
      // add it to available cities
      if (originalEvent && originalEvent.location.city &&
          originalEvent.location.country === eventData.location.country &&
          !selectedCountry.cities.includes(originalEvent.location.city)) {
        setAvailableCities(prev => [...prev, originalEvent.location.city]);
      }

      // Reset city if it's not in the new country's city list and it's not the original city
      if (!selectedCountry.cities.includes(eventData.location.city) &&
          !(originalEvent && originalEvent.location.city === eventData.location.city &&
          originalEvent.location.country === eventData.location.country)) {
        setEventData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            city: ''
          }
        }));
      }
    } else {
      setAvailableCities([]);
    }
  }, [eventData.location.country, originalEvent]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Handle nested location properties
    if (name.includes('location.')) {
      const locationField = name.split('.')[1];
      setEventData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          [locationField]: value
        }
      }));
    } else {
      setEventData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear any error for this field
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validate form
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!eventData.title.trim()) errors.title = 'Title is required';
    if (!eventData.description.trim()) errors.description = 'Description is required';
    if (!eventData.type) errors.type = 'Event type is required';
    if (!eventData.status) errors.status = 'Status is required';
    if (!eventData.startDate) errors.startDate = 'Start date is required';
    if (!eventData.endDate) errors.endDate = 'End date is required';

    // Location validation
    if (!eventData.location.name.trim()) errors['location.name'] = 'Venue name is required';
    if (!eventData.location.address.trim()) errors['location.address'] = 'Address is required';
    if (!eventData.location.city) errors['location.city'] = 'City is required';
    if (!eventData.location.country) errors['location.country'] = 'Country is required';

    // Capacity must be a positive number
    if (eventData.capacity <= 0) errors.capacity = 'Capacity must be greater than 0';

    // Ticket price must be 0 or positive
    if (eventData.ticketPrice < 0) errors.ticketPrice = 'Ticket price cannot be negative';

    // Check if end date is after start date
    if (eventData.startDate && eventData.endDate) {
      const startDate = new Date(eventData.startDate);
      const endDate = new Date(eventData.endDate);

      if (endDate < startDate) {
        errors.endDate = 'End date cannot be before start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Upload cover image
  const uploadCoverImage = async () => {
    if (!imageFile) return null;

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token = localStorage.getItem('accessToken');
      const response = await axios.post(
        `https://final-year-project-jy2j.onrender.com/api/v1/events/${id}/cover-image`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        return response.data.data.coverImage;
      } else {
        throw new Error(response.data.message || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canUpdateEvent) {
      toast.error('You do not have permission to update this event');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsLoading(true);

    try {
      // Upload image if selected
      let coverImageUrl = eventData.coverImage;

      if (imageFile) {
        try {
          coverImageUrl = await uploadCoverImage();
        } catch (error) {
          toast.error('Failed to upload cover image');
          // Continue with update even if image upload fails
        }
      }

      const token = localStorage.getItem('accessToken');
      const response = await axios.put(
        `https://final-year-project-jy2j.onrender.com/api/v1/events/${id}`,
        {
          ...eventData,
          coverImage: coverImageUrl
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success('Event updated successfully');
        navigate('/dashboard/events');
      } else {
        toast.error(response.data.message || 'Failed to update event');
      }
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error(error.response?.data?.message || 'An error occurred while updating the event');
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate back to events list
  const handleBack = () => {
    navigate('/dashboard/events');
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex justify-center items-center h-64">
          <Loader className="h-12 w-12 animate-spin text-tiffany-600" />
        </div>
      </div>
    );
  }

  if (!canUpdateEvent) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">Permission Denied</h1>
          <p className="mb-4">You do not have permission to update this event.</p>
          <button
            onClick={handleBack}
            className="inline-flex items-center px-4 py-2 bg-tiffany-600 text-white rounded-md hover:bg-tiffany-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold">Update Event</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Title
              </label>
              <input
                type="text"
                name="title"
                value={eventData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter event title"
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-500">{formErrors.title}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={eventData.description}
                onChange={handleInputChange}
                rows={4}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter event description"
              />
              {formErrors.description && (
                <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                name="type"
                value={eventData.type}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select event type</option>
                {eventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
              {formErrors.type && (
                <p className="mt-1 text-sm text-red-500">{formErrors.type}</p>
              )}
            </div>

            {/* Event Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                name="status"
                value={eventData.status}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.status ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {eventStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              {formErrors.status && (
                <p className="mt-1 text-sm text-red-500">{formErrors.status}</p>
              )}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                name="startDate"
                value={eventData.startDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.startDate && (
                <p className="mt-1 text-sm text-red-500">{formErrors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                name="endDate"
                value={eventData.endDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {formErrors.endDate && (
                <p className="mt-1 text-sm text-red-500">{formErrors.endDate}</p>
              )}
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-gray-700 mb-3">
                Location Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Venue Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Name
                  </label>
                  <input
                    type="text"
                    name="location.name"
                    value={eventData.location.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors['location.name'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter venue name"
                  />
                  {formErrors['location.name'] && (
                    <p className="mt-1 text-sm text-red-500">{formErrors['location.name']}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    name="location.address"
                    value={eventData.location.address}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors['location.address'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter address"
                  />
                  {formErrors['location.address'] && (
                    <p className="mt-1 text-sm text-red-500">{formErrors['location.address']}</p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    name="location.country"
                    value={eventData.location.country}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors['location.country'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select country</option>
                    {countries.map((country) => (
                      <option key={country.name} value={country.name}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  {formErrors['location.country'] && (
                    <p className="mt-1 text-sm text-red-500">{formErrors['location.country']}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <select
                    name="location.city"
                    value={eventData.location.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md ${
                      formErrors['location.city'] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={!eventData.location.country}
                  >
                    <option value="">Select city</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  {formErrors['location.city'] && (
                    <p className="mt-1 text-sm text-red-500">{formErrors['location.city']}</p>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    name="location.postalCode"
                    value={eventData.location.postalCode || ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Enter postal code (optional)"
                  />
                </div>
              </div>
            </div>

            {/* Capacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  Capacity
                </div>
              </label>
              <input
                type="number"
                name="capacity"
                value={eventData.capacity}
                onChange={handleInputChange}
                min="0"
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.capacity ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter maximum attendees"
              />
              {formErrors.capacity && (
                <p className="mt-1 text-sm text-red-500">{formErrors.capacity}</p>
              )}
            </div>

            {/* Ticket Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  Ticket Price (KES)
                </div>
              </label>
              <input
                type="number"
                name="ticketPrice"
                value={eventData.ticketPrice}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md ${
                  formErrors.ticketPrice ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter ticket price (0 for free events)"
              />
              {formErrors.ticketPrice && (
                <p className="mt-1 text-sm text-red-500">{formErrors.ticketPrice}</p>
              )}
            </div>

            {/* Cover Image */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image
              </label>
              <div className="mt-1 flex items-center">
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Event cover"
                      className="h-24 w-40 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFile(null);
                      }}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <span className="inline-block h-24 w-40 rounded-md overflow-hidden bg-gray-100">
                    <svg
                      className="h-full w-full text-gray-300"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </span>
                )}
                <label
                  htmlFor="file-upload"
                  className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  <span>Upload image</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                JPG, PNG, GIF up to 10MB
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={handleBack}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-tiffany-600 hover:bg-tiffany-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tiffany-500 flex items-center"
            >
              {isLoading && <Loader className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />}
              {isLoading ? 'Updating...' : 'Update Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateEventPage;
