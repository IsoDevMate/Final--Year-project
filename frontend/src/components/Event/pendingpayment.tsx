// // import React, { useEffect, useState } from 'react';
// // import { useLocation, useNavigate, Link } from 'react-router-dom';
// // import { Clock, Check, RefreshCw, AlertTriangle } from 'lucide-react';
// // import axios from 'axios';
// // import { useAuth } from '../../contexts/AuthContext';
// // import toast from 'react-hot-toast';

// // const PendingPaymentPage = () => {
// //   const location = useLocation();
// //   const navigate = useNavigate();
// //   const { user } = useAuth();
// //   const [isPolling, setIsPolling] = useState(false);
// //   const [paymentStatus, setPaymentStatus] = useState('pending');
// //   const [eventDetails, setEventDetails] = useState(null);
// //   const [timeElapsed, setTimeElapsed] = useState(0);

// //   // Extract eventId from location state
// //   const eventId = location.state?.eventId;
// //   const message = location.state?.message || 'Your payment is being processed. Please wait.';

// //   useEffect(() => {
// //     if (!eventId) {
// //       // Redirect to events page if no eventId is provided
// //       navigate('/dashboard/events');
// //       return;
// //     }

// //     // Fetch event details
// //     const fetchEventDetails = async () => {
// //       try {
// //         const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/v1/events/${eventId}`);
// //         if (response.data.success) {
// //           setEventDetails(response.data.data);
// //         }
// //       } catch (err) {
// //         console.error('Error fetching event details:', err);
// //         toast.error('Could not fetch event details');
// //       }
// //     };

// //     fetchEventDetails();

// //     // Start timer for UI feedback
// //     const timer = setInterval(() => {
// //       setTimeElapsed(prev => prev + 1);
// //     }, 1000);

// //     return () => clearInterval(timer);
// //   }, [eventId, navigate]);

// //   // Function to manually check payment status
// //   const checkPaymentStatus = async () => {
// //     if (!eventId || !user) return;

// //     setIsPolling(true);
// //     try {
// //       const token = localStorage.getItem('accessToken');
// //       if (!token) {
// //         toast.error('Authentication error. Please log in again.');
// //         navigate('/auth/login');
// //         return;
// //       }

// //       const statusResponse = await axios.get(
// //         `${import.meta.env.VITE_API_BASE_URL}/api/v1/mpesa/event/${eventId}`,
// //         {
// //           headers: {
// //             Authorization: `Bearer ${token}`
// //           }
// //         }
// //       );

// //       if (statusResponse.data.success) {
// //         const status = statusResponse.data.data.status;
// //         setPaymentStatus(status);

// //         if (status === 'completed') {
// //           toast.success('Payment confirmed! You are now registered for the event.');
// //           setTimeout(() => {
// //             navigate(`/dashboard/events/${eventId}/success`, {
// //               state: {
// //                 registrationSuccess: true,
// //                 eventId: eventId,
// //                 paymentStatus: 'completed'
// //               }
// //             });
// //           }, 2000);
// //         } else if (status === 'failed') {
// //           toast.error('Payment failed. Please try again.');
// //         } else {
// //           toast('Payment is still being processed. Please check back later.');
// //         }
// //       }
// //     } catch (err) {
// //       console.error('Error checking payment status:', err);
// //       toast.error('Could not check payment status. Please try again later.');
// //     } finally {
// //       setIsPolling(false);
// //     }
// //   };

// // const formatTime = (seconds: number): string => {
// //     const minutes = Math.floor(seconds / 60);
// //     const remainingSeconds = seconds % 60;
// //     return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
// // };

// //   return (
// //     <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm">
// //       <div className="text-center mb-8">
// //         <div className="bg-yellow-50 p-4 rounded-full inline-flex items-center justify-center mb-4">
// //           <Clock className="h-12 w-12 text-yellow-500" />
// //         </div>
// //         <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
// //         <p className="text-gray-600 mt-2">{message}</p>
// //       </div>

// //       {eventDetails && (
// //         <div className="bg-gray-50 p-4 rounded-lg mb-6">
// //           <h2 className="font-semibold text-lg mb-2">Event Details</h2>
// //           <p className="font-medium">{eventDetails.title}</p>
// //           <div className="flex items-center text-sm text-gray-600 mt-1">
// //             <Clock className="h-4 w-4 mr-1" />
// //             {new Date(eventDetails.startDate).toLocaleDateString('en-US', {
// //               year: 'numeric',
// //               month: 'short',
// //               day: 'numeric',
// //               hour: '2-digit',
// //               minute: '2-digit'
// //             })}
// //           </div>
// //           {eventDetails.ticketPrice > 0 && (
// //             <p className="text-tiffany-600 font-medium mt-1">
// //               KES {eventDetails.ticketPrice.toFixed(2)}
// //             </p>
// //           )}
// //         </div>
// //       )}

// //       <div className="space-y-6">
// //         <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
// //           <div className="flex items-center">
// //             <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-3 ${
// //               paymentStatus === 'completed' ? 'bg-green-100' :
// //               paymentStatus === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
// //             }`}>
// //               {paymentStatus === 'completed' ? (
// //                 <Check className="h-6 w-6 text-green-600" />
// //               ) : paymentStatus === 'failed' ? (
// //                 <AlertTriangle className="h-6 w-6 text-red-600" />
// //               ) : (
// //                 <Clock className="h-6 w-6 text-yellow-600" />
// //               )}
// //             </div>
// //             <div>
// //               <h3 className="font-medium">Payment Status</h3>
// //               <p className="text-sm text-gray-600">
// //                 {paymentStatus === 'completed' ? 'Payment completed successfully' :
// //                  paymentStatus === 'failed' ? 'Payment failed' :
// //                  'Waiting for confirmation'}
// //               </p>
// //             </div>
// //           </div>
// //           <div className="text-sm text-gray-500">
// //             Elapsed: {formatTime(timeElapsed)}
// //           </div>
// //         </div>

// //         <div className="flex items-center justify-center">
// //           <button
// //             onClick={checkPaymentStatus}
// //             disabled={isPolling}
// //             className="flex items-center justify-center px-4 py-2 bg-tiffany-600 text-white rounded-lg hover:bg-tiffany-700 transition duration-200 disabled:bg-tiffany-300"
// //           >
// //             {isPolling ? (
// //               <>
// //                 <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
// //                 Checking...
// //               </>
// //             ) : (
// //               <>
// //                 <RefreshCw className="h-5 w-5 mr-2" />
// //                 Check Payment Status
// //               </>
// //             )}
// //           </button>
// //         </div>

// //         <div className="bg-gray-50 p-4 rounded-lg space-y-2">
// //           <h3 className="font-medium">What happens next?</h3>
// //           <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
// //             <li>Once your payment is confirmed, you'll be automatically registered for the event.</li>
// //             <li>You can check the status manually using the button above.</li>
// //             <li>You'll receive a confirmation email once the payment is complete.</li>
// //             <li>If you don't receive confirmation within 10 minutes, please contact support.</li>
// //           </ul>
// //         </div>

// //         <div className="mt-8 flex items-center justify-between border-t pt-4">
// //           <Link
// //             to="/dashboard/events"
// //             className="text-tiffany-600 hover:text-tiffany-800"
// //           >
// //             Back to Events
// //           </Link>

// //           <Link
// //             to="/dashboard/events"
// //             className="text-tiffany-600 hover:text-tiffany-800"
// //           >
// //             My Registered Events
// //           </Link>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // };

// // export default PendingPaymentPage;


// import { useEffect, useState } from 'react';
// import { useLocation, useNavigate, Link } from 'react-router-dom';
// import { Clock, Check, RefreshCw, AlertTriangle } from 'lucide-react';
// import axios from 'axios';
// import { useAuth } from '../../contexts/AuthContext';
// import toast from 'react-hot-toast';

// const API_URL = `${import.meta.env.VITE_API_BASE_URL}`;

// const PendingPaymentPage = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [isPolling, setIsPolling] = useState(false);
//   const [paymentStatus, setPaymentStatus] = useState('pending');
//   const [eventDetails, setEventDetails] = useState(null);
//   const [timeElapsed, setTimeElapsed] = useState(0);
//   const [retryCount, setRetryCount] = useState(0);

//   const eventId = location.state?.eventId;
//   const message = location.state?.message || 'Your payment is being processed. Please wait.';

//   const checkPaymentStatus = async () => {
//     if (!eventId || !user) return;

//     setIsPolling(true);
//     try {
//       const token = localStorage.getItem('accessToken');
//       if (!token) {
//         toast.error('Authentication error. Please log in again.');
//         navigate('/auth/login');
//         return;
//       }

//       const statusResponse = await axios.get(
//         `${API_URL}/api/v1/mpesa/event/${eventId}`,
//         {
//           headers: {
//             Authorization: `Bearer ${token}`
//           }
//         }
//       );

//       if (statusResponse.data.success) {
//         const status = statusResponse.data.data.status;
//         setPaymentStatus(status);

//         if (status === 'completed') {
//           toast.success('Payment confirmed! You are now registered for the event.');
//           setTimeout(() => {
//             navigate(`/dashboard/events/${eventId}/success`, {
//               state: {
//                 registrationSuccess: true,
//                 eventId: eventId,
//                 paymentStatus: 'completed'
//               }
//             });
//           }, 2000);
//         } else if (status === 'failed') {
//           toast.error('Payment failed. Please try again.');
//         } else {
//           toast('Payment is still being processed. Please check back later.');
//         }
//         setRetryCount(0); // Reset retry count on success
//       }
//     } catch (err) {
//       console.error('Error checking payment status:', err);
//       if (retryCount < 5) {
//         const backoffTime = Math.min(1000 * 2 ** retryCount, 30000); // Exponential backoff with max 30 seconds
//         setTimeout(() => {
//           setRetryCount(retryCount + 1);
//           checkPaymentStatus();
//         }, backoffTime);
//       } else {
//         toast.error('Could not check payment status. Please try again later.');
//       }
//     } finally {
//       setIsPolling(false);
//     }
//   };

//   useEffect(() => {
//     if (!eventId) {
//       navigate('/dashboard/events');
//       return;
//     }

//     const fetchEventDetails = async () => {
//       try {
//         const response = await axios.get(`${API_URL}/api/v1/events/${eventId}`);
//         if (response.data.success) {
//           setEventDetails(response.data.data);
//         }
//       } catch (err) {
//         console.error('Error fetching event details:', err);
//         toast.error('Could not fetch event details');
//       }
//     };

//     fetchEventDetails();

//     const timer = setInterval(() => {
//       setTimeElapsed(prev => prev + 1);
//     }, 1000);

//     const statusPollInterval = setInterval(() => {
//       checkPaymentStatus();
//     }, 10000);

//     return () => {
//       clearInterval(timer);
//       clearInterval(statusPollInterval);
//     };
//   }, [eventId, navigate]);

//   const formatTime = (seconds: number): string => {
//     const minutes = Math.floor(seconds / 60);
//     const remainingSeconds = seconds % 60;
//     return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
//   };

//   return (
//     <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm">
//       <div className="text-center mb-8">
//         <div className="bg-yellow-50 p-4 rounded-full inline-flex items-center justify-center mb-4">
//           <Clock className="h-12 w-12 text-yellow-500" />
//         </div>
//         <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
//         <p className="text-gray-600 mt-2">{message}</p>
//       </div>

//       {eventDetails && (
//         <div className="bg-gray-50 p-4 rounded-lg mb-6">
//           <h2 className="font-semibold text-lg mb-2">Event Details</h2>
//           <p className="font-medium">{eventDetails.title}</p>
//           <div className="flex items-center text-sm text-gray-600 mt-1">
//             <Clock className="h-4 w-4 mr-1" />
//             {new Date(eventDetails.startDate).toLocaleDateString('en-US', {
//               year: 'numeric',
//               month: 'short',
//               day: 'numeric',
//               hour: '2-digit',
//               minute: '2-digit'
//             })}
//           </div>
//           {eventDetails.ticketPrice > 0 && (
//             <p className="text-tiffany-600 font-medium mt-1">
//               KES {eventDetails.ticketPrice.toFixed(2)}
//             </p>
//           )}
//         </div>
//       )}

//       <div className="space-y-6">
//         <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg"></div>
//           <div className="flex items-center">
//             <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-3 ${
//               paymentStatus === 'completed' ? 'bg-green-100' :
//               paymentStatus === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
//             }`}>
//               {paymentStatus === 'completed' ? (
//                 <Check className="h-6 w-6 text-green-600" />
//               ) : paymentStatus === 'failed' ? (
//                 <AlertTriangle className="h-6 w-6 text-red-600" />
//               ) : (
//                 <Clock className="h-6 w-6 text-yellow-600" />
//               )}
//             </div>
//             <div>
//               <h3 className="font-medium">Payment Status</h3>
//               <p className="text-sm text-gray-600">
//                 {paymentStatus === 'completed' ? 'Payment completed successfully' :
//                  paymentStatus === 'failed' ? 'Payment failed' :
//                  'Waiting for confirmation'}
//               </p>
//             </div>
//           </div>
//           <div className="text-sm text-gray-500">
//             Elapsed: {formatTime(timeElapsed)}
//           </div>
//         </div>

//         <div className="flex items-center justify-center">
//           <button
//             onClick={checkPaymentStatus}
//             disabled={isPolling}
//             className="flex items-center justify-center px-4 py-2 bg-tiffany-600 text-white rounded-lg hover:bg-tiffany-700 transition duration-200 disabled:bg-tiffany-300"
//           >
//             {isPolling ? (
//               <>
//                 <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
//                 Checking...
//               </>
//             ) : (
//               <>
//                 <RefreshCw className="h-5 w-5 mr-2" />
//                 Check Payment Status
//               </>
//             )}
//           </button>
//         </div>

//         <div className="bg-gray-50 p-4 rounded-lg space-y-2">
//           <h3 className="font-medium">What happens next?</h3>
//           <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
//             <li>Once your payment is confirmed, you'll be automatically registered for the event.</li>
//             <li>You can check the status manually using the button above.</li>
//             <li>You'll receive a confirmation email once the payment is complete.</li>
//             <li>If you don't receive confirmation within 10 minutes, please contact support.</li>
//           </ul>
//         </div>

//         <div className="mt-8 flex items-center justify-between border-t pt-4">
//           <Link
//             to="/dashboard/events"
//             className="text-tiffany-600 hover:text-tiffany-800"
//           >
//             Back to Events
//           </Link>

//           <Link
//             to="/dashboard/events"
//             className="text-tiffany-600 hover:text-tiffany-800"
//           >
//             My Registered Events
//           </Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PendingPaymentPage;


import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Clock, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}`;

const PendingPaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isPolling, setIsPolling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [eventDetails, setEventDetails] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Backoff strategy state variables
  const [retryCount, setRetryCount] = useState(0);
  const [backoffTime, setBackoffTime] = useState(2000); // Start with 2 seconds
  const maxBackoff = 60000; // Max backoff of 1 minute
  const backoffFactor = 1.5; // Exponential factor
  const backoffTimerRef = useRef(null);

  // Extract eventId from location state
  const eventId = location.state?.eventId;
  const message = location.state?.message || 'Your payment is being processed. Please wait.';

  // Function to check payment status with exponential backoff
  const checkPaymentStatus = async (isManualCheck = false) => {
    if (!eventId || !user) return;

    setIsPolling(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Authentication error. Please log in again.');
        navigate('/auth/login');
        return;
      }

      const statusResponse = await axios.get(
        `${API_URL}/api/v1/mpesa/event/${eventId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (statusResponse.data.success) {
        const status = statusResponse.data.data.status;
        setPaymentStatus(status);

        if (status === 'completed') {
          toast.success('Payment confirmed! You are now registered for the event.');
          // Clear any pending backoff timers
          if (backoffTimerRef.current) {
            clearTimeout(backoffTimerRef.current);
          }

          setTimeout(() => {
            navigate(`/dashboard/events/${eventId}/success`, {
              state: {
                registrationSuccess: true,
                eventId: eventId,
                paymentStatus: 'completed'
              }
            });
          }, 2000);
          return;
        } else if (status === 'failed') {
          toast.error('Payment failed. Please try again.');
          // Clear any pending backoff timers
          if (backoffTimerRef.current) {
            clearTimeout(backoffTimerRef.current);
          }
          return;
        } else if (isManualCheck) {
          toast('Payment is still being processed. Please check back later.');
        }

        // If still pending, schedule next retry with backoff
        if (!isManualCheck) {
          scheduleNextRetry();
        }
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      if (isManualCheck) {
        toast.error('Could not check payment status. Please try again later.');
      }
      // On error, still schedule next retry with backoff
      if (!isManualCheck) {
        scheduleNextRetry();
      }
    } finally {
      setIsPolling(false);
    }
  };

  // Schedule next retry with exponential backoff
  const scheduleNextRetry = () => {
    // Calculate next backoff time with jitter (randomness to avoid thundering herd)
    const jitter = Math.random() * 0.3 + 0.85; // Random factor between 0.85 and 1.15
    const nextBackoff = Math.min(backoffTime * backoffFactor * jitter, maxBackoff);

    // Clear any existing timer
    if (backoffTimerRef.current) {
      clearTimeout(backoffTimerRef.current);
    }

    // Set new timer for next retry
    backoffTimerRef.current = setTimeout(() => {
      setRetryCount(prevCount => prevCount + 1);
      setBackoffTime(nextBackoff);
      checkPaymentStatus(false);
    }, backoffTime);
  };

  // Manual check initiated by user
  const manualCheckStatus = () => {
    // Reset backoff when user manually checks
    setRetryCount(0);
    setBackoffTime(2000);
    checkPaymentStatus(true);
  };

  useEffect(() => {
    if (!eventId) {
      // Redirect to events page if no eventId is provided
      navigate('/dashboard/events');
      return;
    }

    // Fetch event details
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/v1/events/${eventId}`);
        if (response.data.success) {
          setEventDetails(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching event details:', err);
        toast.error('Could not fetch event details');
      }
    };

    fetchEventDetails();

    // Start timer for UI feedback
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Initial check with immediate execution
    checkPaymentStatus(false);

    return () => {
      clearInterval(timer);
      if (backoffTimerRef.current) {
        clearTimeout(backoffTimerRef.current);
      }
    };
  }, [eventId, navigate]);

  interface FormatTimeProps {
    seconds: number;
  }

  const formatTime = (seconds: FormatTimeProps['seconds']): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-xl shadow-sm">
      <div className="text-center mb-8">
        <div className="bg-yellow-50 p-4 rounded-full inline-flex items-center justify-center mb-4">
          <Clock className="h-12 w-12 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
        <p className="text-gray-600 mt-2">{message}</p>
      </div>

      {eventDetails && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h2 className="font-semibold text-lg mb-2">Event Details</h2>
          <p className="font-medium">{eventDetails.title}</p>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <Clock className="h-4 w-4 mr-1" />
            {new Date(eventDetails.startDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
          {eventDetails.ticketPrice > 0 && (
            <p className="text-tiffany-600 font-medium mt-1">
              KES {eventDetails.ticketPrice.toFixed(2)}
            </p>
          )}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <div className={`rounded-full w-10 h-10 flex items-center justify-center mr-3 ${
              paymentStatus === 'completed' ? 'bg-green-100' :
              paymentStatus === 'failed' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              {paymentStatus === 'completed' ? (
                <Check className="h-6 w-6 text-green-600" />
              ) : paymentStatus === 'failed' ? (
                <AlertTriangle className="h-6 w-6 text-red-600" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-600" />
              )}
            </div>
            <div>
              <h3 className="font-medium">Payment Status</h3>
              <p className="text-sm text-gray-600">
                {paymentStatus === 'completed' ? 'Payment completed successfully' :
                 paymentStatus === 'failed' ? 'Payment failed' :
                 'Waiting for confirmation'}
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Elapsed: {formatTime(timeElapsed)}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={manualCheckStatus}
            disabled={isPolling}
            className="flex items-center justify-center px-4 py-2 bg-tiffany-600 text-white rounded-lg hover:bg-tiffany-700 transition duration-200 disabled:bg-tiffany-300"
          >
            {isPolling ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5 mr-2" />
                Check Payment Status
              </>
            )}
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <h3 className="font-medium">What happens next?</h3>
          <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
            <li>Once your payment is confirmed, you'll be automatically registered for the event.</li>
            <li>You can check the status manually using the button above.</li>
            <li>You'll receive a confirmation email once the payment is complete.</li>
            <li>If you don't receive confirmation within 10 minutes, please contact support.</li>
          </ul>
        </div>

        <div className="mt-8 flex items-center justify-between border-t pt-4">
          <Link
            to="/dashboard/events"
            className="text-tiffany-600 hover:text-tiffany-800"
          >
            Back to Events
          </Link>

          <Link
            to="/dashboard/events"
            className="text-tiffany-600 hover:text-tiffany-800"
          >
            My Registered Events
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PendingPaymentPage;
