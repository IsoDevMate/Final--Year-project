import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, ArrowLeft, User, DollarSign, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
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
  attendees: string[] | unknown;
  isPublic: boolean;
  ticketPrice: number;
  createdAt: string;
  updatedAt: string;
}

const EventDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [isUserRegistered, setIsUserRegistered] = useState(false);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentStatusPolling, setPaymentStatusPolling] = useState(false);

  // Fetch event data
  useEffect(() => {
    const fetchEventDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(`http://localhost:3000/api/v1/events/${id}`);

        if (response.data.success) {
          setEvent(response.data.data);

          // Check if current user is registered
        //   if (user && Array.isArray(response.data.data.attendees)) {
        //     setIsUserRegistered(response.data.data.attendees.includes(user.id));
        //   }
        } else {
          setError('Failed to fetch event details');
        }
      } catch (err) {
        setError('An error occurred while fetching event details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchEventDetails();
    }
  }, [id, user]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate event duration
  const getEventDuration = () => {
    if (!event) return '';

    const start = new Date(event.startDate);
    const end = new Date(event.endDate);

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}${diffHours > 0 ? `, ${diffHours} hour${diffHours > 1 ? 's' : ''}` : ''}`;
    } else {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
    }
  };

  // Get organizer name
  const getOrganizerName = () => {
    if (!event) return '';

    if (typeof event.organizer === 'object' && event.organizer !== null) {
      return `${event.organizer.firstName} ${event.organizer.lastName}`;
    }

    return 'Event Organizer';
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

  // Start registration process
  const startRegistration = () => {
    // Check if user is authenticated
    if (!user) {
      navigate('/auth/login');
      return;
    }

    // Check if user is already registered
    if (isUserRegistered) {
      toast.error('You are already registered for this event.');
      return;
    }

    // If the event has a price, show payment modal
    if (event?.ticketPrice && event.ticketPrice > 0) {
      setPaymentModalOpen(true);
    } else {
      // For free events, proceed with direct registration
      registerForEvent();
    }
  };

  // Handle free event registration
  const registerForEvent = async () => {
    if (!event) return;

    try {
      setRegistering(true);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('You need to be logged in to register for an event.');
        return;
      }

      const response = await axios.post(
        `http://localhost:3000/api/v1/events/register/${event._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setIsUserRegistered(true);
        toast.success('Successfully registered for the event!');
        navigate(`/dashboard/events/${event._id}/success`, {
          state: {
            registrationSuccess: true,
            eventId: event._id
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
      setRegistering(false);
    }
  };

  // Handle unregistration
  const unregisterFromEvent = async () => {
    if (!event) return;

    if (window.confirm('Are you sure you want to cancel your registration for this event?')) {
      try {
        setRegistering(true);

        const token = localStorage.getItem('accessToken');
        if (!token) {
          toast.error('You need to be logged in to unregister from an event.');
          return;
        }

        const response = await axios.delete(
          `http://localhost:3000/api/v1/events/register/${event._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          setIsUserRegistered(false);
          toast.success('Successfully unregistered from the event!');
        } else {
          toast.error(response.data.message || 'Failed to unregister from the event');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'An error occurred while unregistering from the event';
        toast.error(errorMessage);
        console.error(err);
      } finally {
        setRegistering(false);
      }
    }
  };

  // Handle paid event registration with M-Pesa
  const handlePaymentSubmit = async (phoneNumber: string) => {
    if (!event) return;

    try {
      setRegistering(true);
      setPaymentModalOpen(false);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('You need to be logged in to register for an event.');
        return;
      }

      // Initiate M-Pesa payment
      const paymentResponse = await axios.post(
        `http://localhost:3000/api/v1/mpesa/event/${event._id}`,
        {
          phoneNumber: phoneNumber,
          amount: event.ticketPrice
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
        setPaymentStatusPolling(true);

        let attempts = 0;
        const maxAttempts = 12; // Check for 1 minute (5s * 12)
        const pollInterval = setInterval(async () => {
          attempts++;

          try {
            const statusResponse = await axios.get(
              `http://localhost:3000/api/v1/mpesa/event/${event._id}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              }
            );

            if (statusResponse.data.success &&
                statusResponse.data.data.status === 'completed') {

              clearInterval(pollInterval);
              setPaymentStatusPolling(false);
              setIsUserRegistered(true);
              setRegistering(false);

              // Navigate to success page
              navigate(`/dashboard/events/${event._id}/success`, {
                state: {
                  registrationSuccess: true,
                  eventId: event._id,
                  paymentStatus: 'completed'
                }
              });

              return;
            }

            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setPaymentStatusPolling(false);
              setRegistering(false);

              // If we've reached max attempts, direct user to check their status later
              navigate(`/dashboard/events/${event._id}/pending-payment`, {
                state: {
                  eventId: event._id,
                  message: 'Your payment is being processed. You will be notified once completed.'
                }
              });
            }
          } catch (err) {
            console.error('Error checking payment status:', err);
            if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setPaymentStatusPolling(false);
              setRegistering(false);
            }
          }
        }, 5000); // Check every 5 seconds

      } else {
        toast.error(paymentResponse.data.message || 'Failed to initiate payment');
        setRegistering(false);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'An error occurred while initiating payment';
      toast.error(errorMessage);
      console.error(err);
      setRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-sm p-8 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{error || "We couldn't find the event you're looking for."}</p>
          <Link
            to="/dashboard/events"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to="/dashboard/events"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Events
        </Link>
      </div>

      {/* Event Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        {event.coverImage ? (
          <div className="h-64 w-full bg-cover bg-center" style={{ backgroundImage: `url(${event.coverImage})` }}></div>
        ) : (
          <div className="h-64 w-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-white">{event.title}</h1>
          </div>
        )}

        <div className="p-8">
          <div className="flex flex-wrap items-start justify-between">
            <div className="flex-1 min-w-0 mr-6">
              <div className="flex items-center mb-4">
                <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeColor(event.status)}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
                <span className="ml-3 text-sm font-medium text-gray-500 uppercase">
                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                </span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">{event.title}</h1>
              <div className="flex flex-wrap text-gray-500 text-sm mb-4">
                <div className="flex items-center mr-6 mb-2">
                  <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
                  <span>
                    <span className="font-medium">Start:</span> {formatDate(event.startDate)}
                  </span>
                </div>
                <div className="flex items-center mr-6 mb-2">
                  <Clock className="h-5 w-5 mr-2 text-indigo-600" />
                  <span>
                    <span className="font-medium">Duration:</span> {getEventDuration()}
                  </span>
                </div>
                <div className="flex items-center mr-6 mb-2">
                  <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
                  <span>
                    <span className="font-medium">Location:</span> {event.location.name}, {event.location.address}, {event.location.city}, {event.location.country}
                  </span>
                </div>
                <div className="flex items-center mr-6 mb-2">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  <span>
                    <span className="font-medium">Capacity:</span> {Array.isArray(event.attendees) ? event.attendees.length : '0'} / {event.capacity || '∞'} attendees
                  </span>
                </div>
                <div className="flex items-center mb-2">
                  <User className="h-5 w-5 mr-2 text-indigo-600" />
                  <span>
                    <span className="font-medium">Organizer:</span> {getOrganizerName()}
                  </span>
                </div>
                {event.ticketPrice > 0 && (
                  <div className="flex items-center mb-2 ml-6">
                    <DollarSign className="h-5 w-5 mr-2 text-indigo-600" />
                    <span>
                      <span className="font-medium">Price:</span> KES {event.ticketPrice.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full md:w-auto mt-4 md:mt-0">
              {isUserRegistered ? (
                <button
                  onClick={unregisterFromEvent}
                  disabled={registering || paymentStatusPolling}
                  className="w-full md:w-auto px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition duration-200 disabled:opacity-50"
                >
                  {registering ? 'Processing...' : 'Cancel Registration'}
                </button>
              ) : (
                <button
                  onClick={startRegistration}
                  disabled={
                    registering ||
                    paymentStatusPolling ||
                    event.status !== 'published' ||
                    (event.capacity && Array.isArray(event.attendees) && event.attendees.length >= event.capacity)
                  }
                  className="w-full md:w-auto px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition duration-200 disabled:opacity-50"
                >
                  {registering ? 'Processing...' : paymentStatusPolling ? 'Processing Payment...' :
                   event.status !== 'published' ? 'Registration Unavailable' :
                   (event.capacity && Array.isArray(event.attendees) && event.attendees.length >= event.capacity) ? 'Event Full' :
                   (event.ticketPrice > 0 ? `Register • KES ${event.ticketPrice.toFixed(2)}` : 'Register for Free')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Event Details Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Event Description */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About This Event</h2>
            <div className="prose max-w-none text-gray-700">
              {event.description.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-4">{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Additional Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Event Details</h3>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Date & Time</h4>
                <p className="text-gray-900">
                  {formatDate(event.startDate)} - {formatDate(event.endDate)}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500">Location</h4>
                <p className="text-gray-900">{event.location.name}</p>
                <p className="text-gray-700">{event.location.address}</p>
                <p className="text-gray-700">{event.location.city}, {event.location.postalCode && `${event.location.postalCode}, `}{event.location.country}</p>
              </div>

              {event.capacity && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Capacity</h4>
                  <p className="text-gray-900">{event.capacity} attendees</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-500">Event Type</h4>
                <p className="text-gray-900">{event.type.charAt(0).toUpperCase() + event.type.slice(1)}</p>
              </div>

              {event.ticketPrice > 0 ? (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Ticket Price</h4>
                  <p className="text-gray-900">KES {event.ticketPrice.toFixed(2)}</p>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Ticket Price</h4>
                  <p className="text-gray-900">Free</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Share This Event</h3>
            <div className="flex space-x-4">
              <button className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button className="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.13 1.196 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
              <button className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 3H4a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1zM8.5 6.5h7a1 1 0 110 2h-7a1 1 0 010-2zm0 4h7a1 1 0 110 2h-7a1 1 0 010-2zm0 4h7a1 1 0 110 2h-7a1 1 0 010-2z"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions Link */}
      <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Event Sessions</h2>
          <Link
            to={`/dashboard/events/${event._id}/sessions`}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            View All Sessions
          </Link>
        </div>
      </div>

      {/* Payment Modal */}
      {event && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          onSubmit={handlePaymentSubmit}
          amount={event.ticketPrice || 0}
          eventName={event.title}
        />
      )}
    </div>
  );
};

export default EventDetailsPage;
