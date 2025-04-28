
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Filter, Search, Plus, Trash2, Edit, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import MyEventsPage from './eventsregistered';
 import PaymentModal from './registerpayment';

interface Location {
  name: string;
  address: string;
  city: string;
  postalCode?: string;
  country: string;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  startDate: string;
  endDate: string;
  location: Location;
  capacity?: number;
  coverImage?: string;
  organizer: string | { _id: string; firstName: string; lastName: string; email: string };
  attendees: string[] | unknown
  isPublic: boolean;
  ticketPrice: number;
  createdAt: string;
  updatedAt: string;
}

const eventTypes = ['conference', 'workshop', 'meetup', 'webinar', 'training','expo', 'other'];
const eventStatuses = ['draft', 'published', 'cancelled', 'completed'];

const EventsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registeringEvents, setRegisteringEvents] = useState<Record<string, boolean>>({});

    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [paymentStatusPolling, setPaymentStatusPolling] = useState<Record<string, boolean>>({});


  const navigateToSessions = (eventId: string) => {
    navigate(`/dashboard/events/${eventId}/sessions`);
  };

  const navigateToCreateEvent = () => {
    navigate('/dashboard/events/create');
  }

  const navigateToEditEvent = (eventId: string) => {
    navigate(`/dashboard/events/${eventId}/edit`);
  }

  // Filter states
  const [filters, setFilters] = useState({
    title: '',
    type: '',
    status: '',
    city: '',
    startDate: '',
    endDate: ''
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // Fetch events data
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        if (filters.title) params.append('title', filters.title);
        if (filters.type) params.append('type', filters.type);
        if (filters.status) params.append('status', filters.status);
        if (filters.city) params.append('city', filters.city);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        const response = await axios.get(`https://final-year-project-56d5.onrender.com/api/v1/events?${params.toString()}`);

        if (response.data.success) {
          setEvents(response.data.data.events);
          setFilteredEvents(response.data.data.events);
          setTotal(response.data.data.total);
        } else {
          setError('Failed to fetch events');
        }
      } catch (err) {
        setError('An error occurred while fetching events');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [page, limit, filters]);

  // Set user ID when user data is available
  useEffect(() => {
    if (user) {
      setUserId(user.id);
    }
  }, [user]);

  // Handle filter changes
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // The useEffect will handle the API call when filters change
  };

const handleDeleteEvent = async (eventId: string) => {
  if (window.confirm('Are you sure you want to delete this event?')) {
    try {
      const token = localStorage.getItem('accessToken');
      console.log('Using token for delete:', token?.substring(0, 10) + '...');

      const response = await axios.delete(`https://final-year-project-56d5.onrender.com/api/v1/events/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        // Remove from local state
        setEvents(prev => prev.filter(event => event._id !== eventId));
        setFilteredEvents(prev => prev.filter(event => event._id !== eventId));
        toast.success('Event deleted successfully');
      } else {
        console.error('Delete failed with response:', response.data);
        setError('Failed to delete event');
        toast.error('Failed to delete event');
      }
    } catch (err: any) {
      console.error('Delete error details:', err?.response?.data || err);
      console.error('Auth state after error:', localStorage.getItem('accessToken') ? 'Token exists' : 'No token');

      // Check if we're still authenticated after the error
      const isStillAuthenticated = !!localStorage.getItem('accessToken');

      setError('An error occurred while deleting the event');
      toast.error(`Error: ${err?.response?.data?.message || err?.message || 'Unknown error'}`);
    }
  }
};

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const startRegistration = (event: Event) => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const isRegistered = Array.isArray(event.attendees) && event.attendees.includes(userId);

    if (isRegistered) {
      toast.error('You are already registered for this event.');
      return;
    }

    // If the event has a price, show payment modal
    if (event.ticketPrice && event.ticketPrice > 0) {
      setSelectedEvent(event);
      setPaymentModalOpen(true);
    } else {
      // For free events, proceed with direct registration
      registerFreeEvent(event._id);
    }
  };

  // Handle free event registration
  const registerFreeEvent = async (eventId: string) => {
    try {
      setRegisteringEvents(prev => ({ ...prev, [eventId]: true }));

      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('You need to be logged in to register for an event.');
        return;
      }

      const response = await axios.post(
        `https://final-year-project-56d5.onrender.com/api/v1/events/register/${eventId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Update the local state
        setEvents(prevEvents =>
          prevEvents.map(e =>
            e._id === eventId
              ? {
                  ...e,
                  attendees: [
                    ...(Array.isArray(e.attendees) ? e.attendees : []),
                    userId
                  ]
                }
              : e
          )
        );

        toast.success('Successfully registered for the event!');
        navigate(`/dashboard/events/${eventId}/success`, {
          state: {
            registrationSuccess: true,
            eventId: eventId
          }
        });
      } else {
        toast.error(response.data.message || 'Failed to register for the event');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred while registering for the event';
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setRegisteringEvents(prev => ({ ...prev, [eventId]: false }));
    }
  };

  // Handle paid event registration with M-Pesa
  const handlePaymentSubmit = async (phoneNumber: string) => {
    if (!selectedEvent) return;

    const eventId = selectedEvent._id;

    try {
      setRegisteringEvents(prev => ({ ...prev, [eventId]: true }));
      setPaymentModalOpen(false);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('You need to be logged in to register for an event.');
        return;
      }

      // Initiate M-Pesa payment
      const paymentResponse = await axios.post(
        `https://final-year-project-56d5.onrender.com/api/v1/mpesa/event/${eventId}`,
        {
          phoneNumber: phoneNumber,
          amount: selectedEvent.ticketPrice
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (paymentResponse.data.success) {
        toast.success('Payment initiated. Please complete the payment on your phone.');

        // Start polling for payment status
        setPaymentStatusPolling(prev => ({ ...prev, [eventId]: true }));

        let attempts = 0;
        const maxAttempts = 12; // Check for 1 minute (5s * 12)
        const pollInterval = setInterval(async () => {
          attempts++;

          try {
            const statusResponse = await axios.get(
              `https://final-year-project-56d5.onrender.com/api/v1/mpesa/event/${eventId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (statusResponse.data.success &&
                statusResponse.data.data.status === 'completed') {

              clearInterval(pollInterval);
              setPaymentStatusPolling(prev => ({ ...prev, [eventId]: false }));

              // Update the local events state to reflect registration
              setEvents(prevEvents =>
                prevEvents.map(e =>
                  e._id === eventId
                    ? {
                        ...e,
                        attendees: [
                          ...(Array.isArray(e.attendees) ? e.attendees : []),
                          userId
                        ]
                      }
                    : e
                )
              );

              setRegisteringEvents(prev => ({ ...prev, [eventId]: false }));

              // Navigate to success page
              navigate(`/dashboard/events/${eventId}/success`, {
                state: {
                  registrationSuccess: true,
                  eventId: eventId,
                  paymentStatus: 'completed'
                }
              });

              return;
            }

            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setPaymentStatusPolling(prev => ({ ...prev, [eventId]: false }));
              setRegisteringEvents(prev => ({ ...prev, [eventId]: false }));

              // If we've reached max attempts, direct user to check their status later
              navigate(`/dashboard/events/${eventId}/pending-payment`, {
                state: {
                  eventId: eventId,
                  message: 'Your payment is being processed. You will be notified once completed.'
                }
              });
            }
          } catch (err) {
            console.error('Error checking payment status:', err);
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setPaymentStatusPolling(prev => ({ ...prev, [eventId]: false }));
              setRegisteringEvents(prev => ({ ...prev, [eventId]: false }));
            }
          }
        }, 5000); // Check every 5 seconds

      } else {
        toast.error(paymentResponse.data.message || 'Failed to initiate payment');
        setRegisteringEvents(prev => ({ ...prev, [eventId]: false }));
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred while initiating payment';
      toast.error(errorMessage);
      console.error(err);
      setRegisteringEvents(prev => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
        <button
          onClick={navigateToCreateEvent}
          className="flex items-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Title search */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Event Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={filters.title}
                  onChange={handleFilterChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Search by title"
                />
                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Event type */}
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Types</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Event status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Statuses</option>
                {eventStatuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={filters.city}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Filter by city"
              />
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setFilters({
                title: '',
                type: '',
                status: '',
                city: '',
                startDate: '',
                endDate: ''
              })}
              className="mr-3 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Clear Filters
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* Events List */}
      <div className="bg-white rounded-xl shadow-sm">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Try Again
            </button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <p>No events found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Location
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacity
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredEvents.map((event) => (
                    <tr key={event._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            {event.coverImage ? (
                              <img className="h-10 w-10 rounded-full object-cover" src={event.coverImage} alt={event.title} />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">
                             <Link to={`/dashboard/events/${event._id}`} className="hover:text-indigo-600">
                             {event.title}
                           </Link>
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {event.description.length > 60
                                ? `${event.description.substring(0, 60)}...`
                                : event.description}
                            </div>
                             {event.ticketPrice && event.ticketPrice > 0 && (
                              <div className="text-sm font-medium text-indigo-600 mt-1">
                                KES {event.ticketPrice.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center mb-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatDate(event.startDate)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {event.location.city}, {event.location.country}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          {event.attendees.length as number} / {event.capacity || '∞'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(event.status)}`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => startRegistration(event)}
                          className="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md mr-4 flex items-center justify-center min-w-24"
                          disabled={
                            (Array.isArray(event.attendees) && event.attendees.includes(userId)) ||
                            registeringEvents[event._id] ||
                            paymentStatusPolling[event._id]
                          }
                        >
                          {registeringEvents[event._id] || paymentStatusPolling[event._id] ? (
                            <>
                              <Loader className="h-4 w-4 mr-2 animate-spin" />
                              {paymentStatusPolling[event._id] ? 'Processing...' : 'Registering...'}
                            </>
                          ) : Array.isArray(event.attendees) && event.attendees.includes(userId) ? (
                            'Registered'
                          ) : (
                            <>
                              {event.ticketPrice && event.ticketPrice > 0 ? `Pay KES ${event.ticketPrice}` : 'Register'}
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => navigateToSessions(event._id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          <Users className="h-4 w-4 inline mr-1" />
                          Sessions
                        </button>
                        {(event.organizer === userId || (typeof event.organizer === 'object' && event.organizer?._id === userId)) && (
                          <>
                            <button
                              onClick={() => navigateToEditEvent(event._id)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              <Edit className="h-4 w-4 inline" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4 inline" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Myeventspge */}
             <MyEventsPage />
            {/* Pagination */}
            <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(page > 1 ? page - 1 : 1)}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * limit >= total}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    page * limit >= total ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((page - 1) * limit) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * limit, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPage(page > 1 ? page - 1 : 1)}
                      disabled={page === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                        page === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    {/* Page numbers would go here in a more complete implementation */}
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page * limit >= total}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                        page * limit >= total ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Payment Modal */}
      {selectedEvent && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSubmit={handlePaymentSubmit}
          amount={selectedEvent.ticketPrice || 0}
          eventName={selectedEvent.title}
        />
      )}
    </div>
  );
};

export default EventsPage;

