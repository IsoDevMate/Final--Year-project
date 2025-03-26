import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, FileText, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Event type options matching backend
const eventTypes = ['conference', 'workshop', 'meetup', 'webinar', 'training', 'expo', 'other'];

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    type: '',
    startDate: '',
    endDate: '',
    location: {
      name: '',
      address: '',
      city: '',
      postalCode: '',
      country: ''
    },
    capacity: 0,
    isPublic: true,
    price: 0
  });

  // Check if user has permission to create event
  const canCreateEvent = user &&
    (user.role === 'ORGANIZER' || user.role === 'ADMIN');

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Handle nested location fields
    if (name.startsWith('location.')) {
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
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check permissions
    if (!canCreateEvent) {
      toast.error('You do not have permission to create events');
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post('http://localhost:3000/api/v1/events', eventData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Event created successfully!');
        navigate('/dashboard/events'); // Redirect to events list
      } else {
        toast.error(response.data.message || 'Failed to create event');
      }
    } catch (error: any) {
      console.error('Event creation error:', error);
      toast.error(error.response?.data?.message || 'An error occurred while creating the event');
    } finally {
      setIsLoading(false);
    }
  };

  // If user doesn't have permission, show unauthorized message
  if (!canCreateEvent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Unauthorized Access</h2>
          <p className="text-gray-600">
            Only Organizers and Administrators can create events.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
        {/* Basic Event Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="title" className="block mb-2 font-semibold">
              <FileText className="inline-block mr-2" /> Event Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              required
              className="w-full p-2 border rounded"
              value={eventData.title}
              onChange={handleChange}
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label htmlFor="type" className="block mb-2 font-semibold">
              <Calendar className="inline-block mr-2" /> Event Type
            </label>
            <select
              id="type"
              name="type"
              required
              className="w-full p-2 border rounded"
              value={eventData.type}
              onChange={handleChange}
            >
              <option value="">Select Event Type</option>
              {eventTypes.map(type => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date and Capacity */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block mb-2 font-semibold">
              <Calendar className="inline-block mr-2" /> Start Date
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              required
              className="w-full p-2 border rounded"
              value={eventData.startDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="endDate" className="block mb-2 font-semibold">
              <Calendar className="inline-block mr-2" /> End Date
            </label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              required
              className="w-full p-2 border rounded"
              value={eventData.endDate}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Location Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location.name" className="block mb-2 font-semibold">
              <MapPin className="inline-block mr-2" /> Venue Name
            </label>
            <input
              type="text"
              id="location.name"
              name="location.name"
              className="w-full p-2 border rounded"
              value={eventData.location.name}
              onChange={handleChange}
              placeholder="Enter venue name"
            />
          </div>

          <div>
            <label htmlFor="location.city" className="block mb-2 font-semibold">
              <MapPin className="inline-block mr-2" /> City
            </label>
            <input
              type="text"
              id="location.city"
              name="location.city"
              required
              className="w-full p-2 border rounded"
              value={eventData.location.city}
              onChange={handleChange}
              placeholder="Enter city"
            />
          </div>
        </div>

        {/* Full Address and Postal Code */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="location.address" className="block mb-2 font-semibold">
              <MapPin className="inline-block mr-2" /> Full Address
            </label>
            <input
              type="text"
              id="location.address"
              name="location.address"
              required
              className="w-full p-2 border rounded"
              value={eventData.location.address}
              onChange={handleChange}
              placeholder="Enter full address"
            />
          </div>

          <div>
            <label htmlFor="location.postalCode" className="block mb-2 font-semibold">
              <MapPin className="inline-block mr-2" /> Postal Code
            </label>
            <input
              type="text"
              id="location.postalCode"
              name="location.postalCode"
              className="w-full p-2 border rounded"
              value={eventData.location.postalCode}
              onChange={handleChange}
              placeholder="Enter postal code"
            />
          </div>
        </div>

        {/* Country */}
        <div>
          <label htmlFor="location.country" className="block mb-2 font-semibold">
            <MapPin className="inline-block mr-2" /> Country
          </label>
          <input
            type="text"
            id="location.country"
            name="location.country"
            required
            className="w-full p-2 border rounded"
            value={eventData.location.country}
            onChange={handleChange}
            placeholder="Enter country"
          />
        </div>

        {/* Additional Event Details */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="capacity" className="block mb-2 font-semibold">
              <Users className="inline-block mr-2" /> Event Capacity
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              min="0"
              className="w-full p-2 border rounded"
              value={eventData.capacity}
              onChange={handleChange}
              placeholder="Maximum number of attendees"
            />
          </div>

          <div>
            <label htmlFor="price" className="block mb-2 font-semibold">
              <DollarSign className="inline-block mr-2" /> Ticket Price
            </label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              className="w-full p-2 border rounded"
              value={eventData.price}
              onChange={handleChange}
              placeholder="Ticket price (optional)"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block mb-2 font-semibold">
            <FileText className="inline-block mr-2" /> Event Description
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            className="w-full p-2 border rounded"
            value={eventData.description}
            onChange={handleChange}
            placeholder="Provide a detailed description of the event"
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700 transition-colors flex items-center"
          >
            {isLoading ? (
              <>
                <span className="mr-2">Creating Event...</span>
                <Loader className="animate-spin" />
              </>
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEventPage;
