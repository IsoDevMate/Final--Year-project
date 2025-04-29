// import React from 'react';
// import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
// import { CheckCircle, Calendar, Clock, MapPin, User, Download, Share2 } from 'lucide-react';
// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { useAuth } from '../../contexts/AuthContext';
// import toast from 'react-hot-toast';

// // Interface definitions (same as in other components)
// interface Location {
//   name: string;
//   address: string;
//   city: string;
//   postalCode?: string;
//   country: string;
// }

// interface Event {
//   _id: string;
//   title: string;
//   description: string;
//   type: string;
//   status: 'draft' | 'published' | 'cancelled' | 'completed';
//   startDate: string;
//   endDate: string;
//   location: Location;
//   capacity?: number;
//   coverImage?: string;
//   organizer: string | { _id: string; firstName: string; lastName: string; email: string };
//   attendees: string[] | unknown;
//   isPublic: boolean;
//   price?: number;
//   createdAt: string;
//   updatedAt: string;
// }

// const RegistrationSuccessPage = () => {
// const { eventId } = useParams<{ eventId: string }>();
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const [event, setEvent] = useState<Event | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);


//   useEffect(() => {
//     const fetchEventDetails = async () => {
//       // Add more robust logging
//       console.log('Registration Success Page - useEffect triggered');
//       console.log('Event ID:', eventId);
//       console.log('User:', user);

//       // Check if we have state from navigation
//       const registrationState = location.state as { registrationSuccess?: boolean };
//       console.log('Registration State:', registrationState);

//       if (!eventId || !user) {
//         console.log('Missing eventId or user, navigating away');
//         navigate('/dashboard/events');
//         toast.error('Invalid event or user information');
//         return;
//       }

//       try {
//         const token = localStorage.getItem('accessToken');
//         if (!token) {
//           console.log('No access token, setting error');
//           setError('Authentication required');
//           return;
//         }

//         // Get event details
//         const eventResponse = await axios.get(
//           `https://final-year-project-56d5.onrender.com/api/v1/events/${eventId}`,
//           {
//             headers: {
//               Authorization: `Bearer ${token}`
//             }
//           }
//         );

//         console.log('Event Response:', eventResponse.data);

//         if (eventResponse.data.success) {
//           const fetchedEvent = eventResponse.data.data;
//           setEvent(fetchedEvent);

//         // Enhanced logging for registration process
//             const isRegistered = Array.isArray(fetchedEvent.attendees) &&
//               fetchedEvent.attendees.some((attendee: { _id: string } | string) => {
//                 // Convert to string, handle different input types
//                 const attendeeId = typeof attendee === 'string'
//                   ? attendee
//                   : (attendee._id || attendee.toString());

//                 console.group('🔍 Registration Check');
//                 console.log('Attendee ID:', attendeeId);
//                 console.log('User ID:', user.id);
//                 console.log('Attendee Type:', typeof attendee);
//                 console.log('Exact Match:', attendeeId === user.id);
//                 console.log('Attendees Array:', fetchedEvent.attendees);
//                 console.groupEnd();

//                 return attendeeId === user.userId
//               });

//             console.group('📋 Registration Result');
//             console.log('Is Registered:', isRegistered);
//             console.log('Attendees Type:', typeof fetchedEvent.attendees);
//             console.log('Attendees Length:', fetchedEvent.attendees.length);
//             console.groupEnd();


//           console.log('Is Registered:', isRegistered);

//          if (!isRegistered) {
//                console.error('User is not registered for this event',              {
//                  eventId,
//                  userId: user.id,
//                  attendees: event ? event.attendees : []
//                });
//                toast.error('You are not registered for this event');
//                navigate('/dashboard/events');
//                return;
//              }

//           // Fetch QR code (optional)
//           try {
//             const qrResponse = await axios.get(
//               `https://final-year-project-56d5.onrender.com/api/v1/events/${eventId}/qrcode`,
//               {
//                 headers: {
//                   Authorization: `Bearer ${token}`
//                 }
//               }
//             );

//             console.log('QR Code Response:', qrResponse.data);

//             if (qrResponse.data.success && qrResponse.data.data.qrCodeUrl) {
//               setQrCodeUrl(qrResponse.data.data.qrCodeUrl);
//             }
//           } catch (qrError) {
//             console.error("Failed to fetch QR code:", qrError);
//           }
//         } else {
//           console.log('Failed to load event details');
//           setError('Failed to load event details');
//         }
//       } catch (err) {
//         console.error('Fetch Event Details Error:', err);
//         setError('An error occurred while loading the event');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchEventDetails();
//   }, [eventId, user, navigate, location.state]);

//   // Format date
//   const formatDate = (dateString: string | undefined) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     return date.toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   // Format time
//   const formatTime = (dateString: string | undefined) => {
//     if (!dateString) return '';
//     const date = new Date(dateString);
//     return date.toLocaleTimeString('en-US', {
//       hour: '2-digit',
//       minute: '2-digit'
//     });
//   };

//   // Calculate days remaining
//   const getDaysRemaining = (dateString: string | undefined) => {
//     if (!dateString) return '0';
//     const eventDate = new Date(dateString);
//     const today = new Date();
//     const diffTime = eventDate.getTime() - today.getTime();
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return diffDays > 0 ? diffDays.toString() : '0';
//   };

//   // Handle calendar download (iCal format)
//   const handleAddToCalendar = () => {
//     if (!event) return;

//     // Create iCal content
//     const startDate = new Date(event.startDate);
//     const endDate = new Date(event.endDate);

//     const formatICalDate = (date: Date) => {
//       return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1) + 'Z';
//     };

//     const iCalContent = [
//       'BEGIN:VCALENDAR',
//       'VERSION:2.0',
//       'PRODID:-//EventLite//EN',
//       'BEGIN:VEVENT',
//       `UID:${event._id}@eventlite.com`,
//       `DTSTAMP:${formatICalDate(new Date())}`,
//       `DTSTART:${formatICalDate(startDate)}`,
//       `DTEND:${formatICalDate(endDate)}`,
//       `SUMMARY:${event.title}`,
//       `DESCRIPTION:${event.description}`,
//       `LOCATION:${event.location.name}, ${event.location.address}, ${event.location.city}, ${event.location.country}`,
//       'END:VEVENT',
//       'END:VCALENDAR'
//     ].join('\r\n');

//     // Create and trigger download
//     const blob = new Blob([iCalContent], { type: 'text/calendar;charset=utf-8' });
//     const url = URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', `${event.title.replace(/\s+/g, '-')}.ics`);
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };

//   // Share event
//   const handleShareEvent = () => {
//     if (!event || !navigator.share) return;

//     navigator.share({
//       title: `I'm attending: ${event.title}`,
//       text: `Join me at ${event.title} on ${formatDate(event.startDate)}!`,
//       url: window.location.origin + `/events/${event._id}`
//     }).catch(console.error);
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-screen bg-gray-50">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
//       </div>
//     );
//   }

//   if (error || !event) {
//     return (
//       <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
//         <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
//           <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
//             <span className="text-red-600 text-xl">!</span>
//           </div>
//           <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
//           <p className="text-gray-600 mb-6">{error || 'Unable to load event details'}</p>
//           <div className="flex justify-center">
//             <Link
//               to="/events"
//               className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
//             >
//               Browse Events
//             </Link>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-4xl mx-auto">
//         {/* Success Card */}
//         <div className="bg-white rounded-xl shadow-lg overflow-hidden">
//           {/* Header with success message */}
//           <div className="bg-green-500 p-6 text-center">
//             <div className="rounded-full bg-white w-16 h-16 flex items-center justify-center mx-auto mb-4">
//               <CheckCircle className="h-10 w-10 text-green-500" />
//             </div>
//             <h2 className="text-2xl font-bold text-white mb-2">You're going!</h2>
//             <p className="text-white text-opacity-90">
//               Your registration for this event has been confirmed.
//             </p>
//           </div>

//           {/* Event Details */}
//           <div className="p-6">
//             <div className="flex flex-col md:flex-row gap-6">
//               {/* Event Cover Image */}
//               <div className="md:w-1/3">
//                 {event.coverImage ? (
//                   <img
//                     src={event.coverImage}
//                     alt={event.title}
//                     className="w-full h-48 object-cover rounded-lg"
//                   />
//                 ) : (
//                   <div className="w-full h-48 bg-indigo-100 rounded-lg flex items-center justify-center">
//                     <Calendar className="h-16 w-16 text-indigo-400" />
//                   </div>
//                 )}

//                 {/* QR Code if available */}
//                 {qrCodeUrl && (
//                   <div className="mt-4 p-4 border rounded-lg bg-gray-50 text-center">
//                     <h4 className="text-sm font-medium text-gray-700 mb-2">Your Entry Pass</h4>
//                     <img
//                       src={qrCodeUrl}
//                       alt="Entry QR Code"
//                       className="w-32 h-32 mx-auto"
//                     />
//                     <p className="text-xs text-gray-500 mt-2">
//                       Show this QR code at the event for entry
//                     </p>
//                   </div>
//                 )}
//               </div>

//               {/* Event Information */}
//               <div className="md:w-2/3">
//                 <h3 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h3>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
//                   <div className="flex items-start">
//                     <Calendar className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
//                     <div>
//                       <p className="text-sm font-medium text-gray-900">Date & Time</p>
//                       <p className="text-sm text-gray-600">{formatDate(event.startDate)}</p>
//                       <p className="text-sm text-gray-600">
//                         {formatTime(event.startDate)} - {formatTime(event.endDate)}
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex items-start">
//                     <MapPin className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
//                     <div>
//                       <p className="text-sm font-medium text-gray-900">Location</p>
//                       <p className="text-sm text-gray-600">{event.location.name}</p>
//                       <p className="text-sm text-gray-600">
//                         {event.location.address}, {event.location.city}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Countdown */}
//                 <div className="bg-indigo-50 rounded-lg p-4 mb-6">
//                   <div className="grid grid-cols-3 gap-2 text-center">
//                     <div>
//                       <p className="text-2xl font-bold text-indigo-600">
//                         {getDaysRemaining(event.startDate)}
//                       </p>
//                       <p className="text-xs text-gray-600">Days Left</p>
//                     </div>
//                     <div>
//                       <p className="text-2xl font-bold text-indigo-600">
//                         {typeof event.attendees === 'object' && Array.isArray(event.attendees)
//                           ? event.attendees.length
//                           : '0'}
//                       </p>
//                       <p className="text-xs text-gray-600">Attendees</p>
//                     </div>
//                     <div>
//                       <p className="text-2xl font-bold text-indigo-600">
//                         {event.type.slice(0, 1).toUpperCase() + event.type.slice(1)}
//                       </p>
//                       <p className="text-xs text-gray-600">Event Type</p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Action Buttons */}
//                 <div className="flex flex-wrap gap-4">
//                   <button
//                     onClick={handleAddToCalendar}
//                     className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
//                   >
//                     <Calendar className="h-4 w-4 mr-2" />
//                     Add to Calendar
//                   </button>

//                   {navigator.share && (
//                     <button
//                       onClick={handleShareEvent}
//                       className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
//                     >
//                       <Share2 className="h-4 w-4 mr-2" />
//                       Share Event
//                     </button>
//                   )}

//                   <Link
//                     to="/dashboard/events"
//                     className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
//                   >
//                     <User className="h-4 w-4 mr-2" />
//                     My Events
//                   </Link>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Description */}
//           <div className="border-t p-6">
//             <h4 className="text-lg font-medium text-gray-900 mb-2">About the Event</h4>
//             <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RegistrationSuccessPage;




import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, User, Download, Share2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Interface definitions (same as in other components)
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
  price?: number;
  createdAt: string;
  updatedAt: string;
}

const RegistrationSuccessPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetails = async () => {
      // Add more robust logging
      console.log('Registration Success Page - useEffect triggered');
      console.log('Event ID:', eventId);
      console.log('User:', user);

      // Check if we have state from navigation
      const registrationState = location.state as { registrationSuccess?: boolean };
      console.log('Registration State:', registrationState);

      // If we don't have registration success in state, don't redirect automatically
      // This allows users to manually navigate to this page for events they're already registered for

      if (!eventId || !user) {
        console.log('Missing eventId or user, navigating away');
        navigate('/dashboard/events');
        toast.error('Invalid event or user information');
        return;
      }

      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          console.log('No access token, setting error');
          setError('Authentication required');
          return;
        }

        // Get event details
        const eventResponse = await axios.get(
          `https://final-year-project-56d5.onrender.com/api/v1/events/${eventId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        console.log('Event Response:', eventResponse.data);

        if (eventResponse.data.success) {
          const fetchedEvent = eventResponse.data.data;
          setEvent(fetchedEvent);

          // Enhanced logging for registration process
          const isRegistered = Array.isArray(fetchedEvent.attendees) &&
            fetchedEvent.attendees.some((attendee: { _id: string } | string) => {
              // Convert to string, handle different input types
              const attendeeId = typeof attendee === 'string'
                ? attendee
                : (attendee._id || attendee.toString());

              console.group('🔍 Registration Check');
              console.log('Attendee ID:', attendeeId);
              console.log('User ID:', user.id);
              console.log('Attendee Type:', typeof attendee);
              console.log('Exact Match:', attendeeId === user.id);
              console.log('Attendees Array:', fetchedEvent.attendees);
              console.groupEnd();

              // FIX: Use user.id consistently instead of user.userId
              return attendeeId === user.id;
            });

          console.group('📋 Registration Result');
          console.log('Is Registered:', isRegistered);
          console.log('Attendees Type:', typeof fetchedEvent.attendees);
          console.log('Attendees Length:', Array.isArray(fetchedEvent.attendees) ? fetchedEvent.attendees.length : 0);
          console.groupEnd();

          // Only check registration if we came directly from a successful registration flow
          // If registrationSuccess is true in the state, we know we just registered
          // If it's not, we're probably just viewing an event we already registered for
          if (registrationState?.registrationSuccess && !isRegistered) {
            console.error('User is not registered for this event', {
              eventId,
              userId: user.id,
              attendees: fetchedEvent.attendees
            });
            toast.error('You are not registered for this event');
            navigate('/dashboard/events');
            return;
          }

          // Fetch QR code (optional)
          // try {
          //   const qrResponse = await axios.get(
          //     `https://final-year-project-56d5.onrender.com/api/v1/events/${eventId}/qrcode`,
          //     {
          //       headers: {
          //         Authorization: `Bearer ${token}`
          //       }
          //     }
          //   );

          //   console.log('QR Code Response:', qrResponse.data);

          //   if (qrResponse.data.success && qrResponse.data.data.qrCodeUrl) {
          //     setQrCodeUrl(qrResponse.data.data.qrCodeUrl);
          //   }
          // } catch (qrError) {
          //   console.error("Failed to fetch QR code:", qrError);
          // }
        } else {
          console.log('Failed to load event details');
          setError('Failed to load event details');
        }
      } catch (err) {
        console.error('Fetch Event Details Error:', err);
        setError('An error occurred while loading the event');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, user, navigate, location.state]);

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format time
  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days remaining
  const getDaysRemaining = (dateString: string | undefined) => {
    if (!dateString) return '0';
    const eventDate = new Date(dateString);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays.toString() : '0';
  };

  // Handle calendar download (iCal format)
  const handleAddToCalendar = () => {
    if (!event) return;

    // Create iCal content
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    const formatICalDate = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '').slice(0, -1) + 'Z';
    };

    const iCalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//EventLite//EN',
      'BEGIN:VEVENT',
      `UID:${event._id}@eventlite.com`,
      `DTSTAMP:${formatICalDate(new Date())}`,
      `DTSTART:${formatICalDate(startDate)}`,
      `DTEND:${formatICalDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location.name}, ${event.location.address}, ${event.location.city}, ${event.location.country}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    // Create and trigger download
    const blob = new Blob([iCalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '-')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Share event
  const handleShareEvent = () => {
    if (!event || !navigator.share) return;

    navigator.share({
      title: `I'm attending: ${event.title}`,
      text: `Join me at ${event.title} on ${formatDate(event.startDate)}!`,
      url: window.location.origin + `/events/${event._id}`
    }).catch(console.error);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
          <div className="rounded-full bg-red-100 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">!</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error || 'Unable to load event details'}</p>
          <div className="flex justify-center">
            <Link
              to="/dashboard/events"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Success Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with success message */}
          <div className="bg-green-500 p-6 text-center">
            <div className="rounded-full bg-white w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You're going!</h2>
            <p className="text-white text-opacity-90">
              Your registration for this event has been confirmed.
            </p>
          </div>

          {/* Event Details */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Event Cover Image */}
              <div className="md:w-1/3">
                {event.coverImage ? (
                  <img
                    src={event.coverImage}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-16 w-16 text-indigo-400" />
                  </div>
                )}

                {/* QR Code if available */}
                {qrCodeUrl && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50 text-center">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Your Entry Pass</h4>
                    <img
                      src={qrCodeUrl}
                      alt="Entry QR Code"
                      className="w-32 h-32 mx-auto"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Show this QR code at the event for entry
                    </p>
                  </div>
                )}
              </div>

              {/* Event Information */}
              <div className="md:w-2/3">
                <h3 className="text-xl font-bold text-gray-900 mb-4">{event.title}</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date & Time</p>
                      <p className="text-sm text-gray-600">{formatDate(event.startDate)}</p>
                      <p className="text-sm text-gray-600">
                        {formatTime(event.startDate)} - {formatTime(event.endDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-indigo-500 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Location</p>
                      <p className="text-sm text-gray-600">{event.location.name}</p>
                      <p className="text-sm text-gray-600">
                        {event.location.address}, {event.location.city}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Countdown */}
                <div className="bg-indigo-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-2xl font-bold text-indigo-600">
                        {getDaysRemaining(event.startDate)}
                      </p>
                      <p className="text-xs text-gray-600">Days Left</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-indigo-600">
                        {typeof event.attendees === 'object' && Array.isArray(event.attendees)
                          ? event.attendees.length
                          : '0'}
                      </p>
                      <p className="text-xs text-gray-600">Attendees</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-indigo-600">
                        {event.type.slice(0, 1).toUpperCase() + event.type.slice(1)}
                      </p>
                      <p className="text-xs text-gray-600">Event Type</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleAddToCalendar}
                    className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </button>

                  {navigator.share && (
                    <button
                      onClick={handleShareEvent}
                      className="flex items-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Event
                    </button>
                  )}

                  <Link
                    to="/dashboard/events"
                    className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    <User className="h-4 w-4 mr-2" />
                    My Events
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="border-t p-6">
            <h4 className="text-lg font-medium text-gray-900 mb-2">About the Event</h4>
            <p className="text-gray-600 whitespace-pre-line">{event.description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationSuccessPage;
