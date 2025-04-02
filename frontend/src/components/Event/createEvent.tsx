// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Calendar, MapPin, Users, DollarSign, FileText, Loader } from 'lucide-react';
// import axios from 'axios';
// import { useAuth } from '../../contexts/AuthContext';
// import toast from 'react-hot-toast'


// const CreateEventPage: React.FC = () => {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [isLoading, setIsLoading] = useState(false);
//  const [eventData, setEventData] = useState({
//   title: '',
//   description: '',
//   type: '',
//   status: 'published',
//   startDate: '',
//   endDate: '',
//   location: {
//     name: '',
//     address: '',
//     city: '',
//     country: '', // Add country (required by backend)
//     coordinates: { // Optional, but add structure
//       latitude: 0,
//       longitude: 0
//     }
//   },
//   capacity: 0,
//   ticketPrice: 0 // Change from price to ticketPrice
// });

// // Update event types to match backend enum
// const eventTypes = [
//   'conference',
//   'seminar',
//   'workshop',
//   'expo',
//   'other'
// ];



//   // Check if user has permission to create event
//   const canCreateEvent = user &&
//     (user.role === 'organizer' || user.role === 'admin');



//    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;

//     // Handle nested location fields
//     if (name.startsWith('location.')) {
//       const locationField = name.split('.')[1];
//       setEventData(prev => ({
//         ...prev,
//         location: {
//           ...prev.location,
//           [locationField]: value
//         }
//       }));
//     } else {
//       // Convert numeric inputs to numbers
//       const numericFields = ['capacity', 'ticketPrice'];
//       const processedValue = numericFields.includes(name)
//         ? (value === '' ? 0 : Number(value))
//         : value;

//       setEventData(prev => ({
//         ...prev,
//         [name]: processedValue
//       }));
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     // Validate and format dates to ISO string
//     const formattedEventData = {
//       ...eventData,
//       startDate: new Date(eventData.startDate).toISOString(),
//       endDate: new Date(eventData.endDate).toISOString(),
//       location: {
//         ...eventData.location,
//         coordinates: eventData.location.coordinates || undefined
//       }
//     };

//     try {
//       const token = localStorage.getItem('accessToken');
//       const response = await axios.post('http://localhost:3000/api/v1/events', formattedEventData, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (response.data.success) {
//         toast.success('Event created successfully!');
//         navigate('/dashboard/events');
//       } else {
//         toast.error(response.data.message || 'Failed to create event');
//       }
//     } catch (error: any) {
//       console.error('Event creation error:', error.response?.data);
//       toast.error(error.response?.data?.message || 'An error occurred while creating the event');
//     }
//   };



//   // If user doesn't have permission, show unauthorized message
//   if (!canCreateEvent) {
//     return (
//       <div className="flex items-center justify-center min-h-screen bg-gray-100">
//         <div className="bg-white p-8 rounded-lg shadow-md text-center">
//           <h2 className="text-2xl font-bold mb-4">Unauthorized Access</h2>
//           <p className="text-gray-600">
//             Only Organizers and Administrators can create events.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-3xl font-bold mb-6">Create New Event</h1>

//       <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-md">
//         {/* Basic Event Details */}
//         <div className="grid md:grid-cols-2 gap-4">
//           <div>
//             <label htmlFor="title" className="block mb-2 font-semibold">
//               <FileText className="inline-block mr-2" /> Event Title
//             </label>
//             <input
//               type="text"
//               id="title"
//               name="title"
//               required
//               className="w-full p-2 border rounded"
//               value={eventData.title}
//               onChange={handleChange}
//               placeholder="Enter event title"
//             />
//           </div>

//           <div>
//             <label htmlFor="type" className="block mb-2 font-semibold">
//               <Calendar className="inline-block mr-2" /> Event Type
//             </label>
//             <select
//               id="type"
//               name="type"
//               required
//               className="w-full p-2 border rounded"
//               value={eventData.type}
//               onChange={handleChange}
//             >
//               <option value="">Select Event Type</option>
//               {eventTypes.map(type => (
//                 <option key={type} value={type}>
//                   {type.charAt(0).toUpperCase() + type.slice(1)}
//                 </option>
//               ))}
//             </select>
//           </div>
//         </div>

//         {/* Date and Capacity */}
//         <div className="grid md:grid-cols-2 gap-4">
//           <div>
//             <label htmlFor="startDate" className="block mb-2 font-semibold">
//               <Calendar className="inline-block mr-2" /> Start Date
//             </label>
//             <input
//               type="datetime-local"
//               id="startDate"
//               name="startDate"
//               required
//               className="w-full p-2 border rounded"
//               value={eventData.startDate}
//               onChange={handleChange}
//             />
//           </div>

//           <div>
//             <label htmlFor="endDate" className="block mb-2 font-semibold">
//               <Calendar className="inline-block mr-2" /> End Date
//             </label>
//             <input
//               type="datetime-local"
//               id="endDate"
//               name="endDate"
//               required
//               className="w-full p-2 border rounded"
//               value={eventData.endDate}
//               onChange={handleChange}
//             />
//           </div>
//         </div>

//         {/* Location Details */}
//         <div className="grid md:grid-cols-2 gap-4">
//           <div>
//             <label htmlFor="location.name" className="block mb-2 font-semibold">
//               <MapPin className="inline-block mr-2" /> Venue Name
//             </label>
//             <input
//               type="text"
//               id="location.name"
//               name="location.name"
//               className="w-full p-2 border rounded"
//               value={eventData.location.name}
//               onChange={handleChange}
//               placeholder="Enter venue name"
//             />
//           </div>

//           <div>
//             <label htmlFor="location.city" className="block mb-2 font-semibold">
//               <MapPin className="inline-block mr-2" /> City
//             </label>
//             <input
//               type="text"
//               id="location.city"
//               name="location.city"
//               required
//               className="w-full p-2 border rounded"
//               value={eventData.location.city}
//               onChange={handleChange}
//               placeholder="Enter city"
//             />
//           </div>
//         </div>

//         {/* Full Address and Postal Code */}
//         <div className="grid md:grid-cols-2 gap-4">
//           <div>
//             <label htmlFor="location.address" className="block mb-2 font-semibold">
//               <MapPin className="inline-block mr-2" /> Full Address
//             </label>
//             <input
//               type="text"
//               id="location.address"
//               name="location.address"
//               required
//               className="w-full p-2 border rounded"
//               value={eventData.location.address}
//               onChange={handleChange}
//               placeholder="Enter full address"
//             />
//           </div>

//           <div>
//             <label htmlFor="location.postalCode" className="block mb-2 font-semibold">
//               <MapPin className="inline-block mr-2" /> Postal Code
//             </label>
//             <input
//               type="text"
//               id="location.postalCode"
//               name="location.postalCode"
//               className="w-full p-2 border rounded"
//               value={eventData.location.postalCode}
//               onChange={handleChange}
//               placeholder="Enter postal code"
//             />
//           </div>
//         </div>

//         {/* Country */}
//         <div>
//           <label htmlFor="location.country" className="block mb-2 font-semibold">
//             <MapPin className="inline-block mr-2" /> Country
//           </label>
//           <input
//             type="text"
//             id="location.country"
//             name="location.country"
//             required
//             className="w-full p-2 border rounded"
//             value={eventData.location.country}
//             onChange={handleChange}
//             placeholder="Enter country"
//           />
//         </div>

//         {/* Additional Event Details */}
//         <div className="grid md:grid-cols-2 gap-4">
//           <div>
//             <label htmlFor="capacity" className="block mb-2 font-semibold">
//               <Users className="inline-block mr-2" /> Event Capacity
//             </label>
//             <input
//               type="number"
//               id="capacity"
//               name="capacity"
//               min="0"
//               className="w-full p-2 border rounded"
//               value={eventData.capacity}
//               onChange={handleChange}
//               placeholder="Maximum number of attendees"
//             />
//           </div>

//           <div>
//             <label htmlFor="price" className="block mb-2 font-semibold">
//               <DollarSign className="inline-block mr-2" /> Ticket Price
//             </label>


//       <input
//         type="number"
//         id="ticketPrice"  // Changed from 'price' to 'ticketPrice'
//         name="ticketPrice"  // Changed from 'price' to 'ticketPrice'
//         min="0"
//         step="0.01"
//         className="w-full p-2 border rounded"
//         value={eventData.ticketPrice}
//         onChange={handleChange}
//         placeholder="Ticket price (optional)"
//       />
//           </div>
//         </div>

//         {/* Description */}
//         <div>
//           <label htmlFor="description" className="block mb-2 font-semibold">
//             <FileText className="inline-block mr-2" /> Event Description
//           </label>
//           <textarea
//             id="description"
//             name="description"
//             required
//             rows={4}
//             className="w-full p-2 border rounded"
//             value={eventData.description}
//             onChange={handleChange}
//             placeholder="Provide a detailed description of the event"
//           />
//         </div>

//         {/* Submit Button */}
//         <div className="flex justify-end">
//           <button
//             type="submit"
//             disabled={isLoading}
//             className="bg-indigo-500 text-white px-6 py-2 rounded hover:bg-indigo-500 transition-colors flex items-center"
//           >
//             {isLoading ? (
//               <>
//                 <span className="mr-2">Creating Event...</span>
//                 <Loader className="animate-spin" />
//               </>
//             ) : (
//               'Create Event'
//             )}
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// export default CreateEventPage;


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, DollarSign, FileText, Loader } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [eventData, setEventData] = useState({
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
    'expo',
    'other'
  ];

  // Check if user has permission to create event
  const canCreateEvent = user &&
    (user.role === 'organizer' || user.role === 'admin');

  // Format today's date for the datetime input min attribute
  const getTodayDatetime = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const validateField = (name: string, value: any): string | null => {
    switch (name) {
      case 'title':
        return value.trim().length < 5 ? 'Title must be at least 5 characters' : null;

      case 'description':
        return value.trim().length < 20 ? 'Description must be at least 20 characters' : null;

      case 'type':
        return !value ? 'Please select an event type' : null;

      case 'startDate':
        const startDateObj = new Date(value);
        const now = new Date();
        return startDateObj < now ? 'Start date cannot be in the past' : null;

      case 'endDate':
        if (!value) return 'End date is required';
        const endDateObj = new Date(value);
        const startDateValue = eventData.startDate;

        if (!startDateValue) return 'Please set a start date first';

        const startDateForComparison = new Date(startDateValue);
        return endDateObj <= startDateForComparison
          ? 'End date must be after start date'
          : null;

      case 'capacity':
        const capacityNum = Number(value);
        if (isNaN(capacityNum)) return 'Capacity must be a number';
        if (capacityNum < 30) return 'Capacity must be at least 30';
        if (capacityNum > 5000) return 'Capacity cannot exceed 5000';
        return null;

      case 'ticketPrice':
        const priceNum = Number(value);
        if (isNaN(priceNum)) return 'Price must be a number';
        if (priceNum < 0) return 'Price cannot be negative';
        return null;

      case 'location.name':
        return !value.trim() ? 'Venue name is required' : null;

      case 'location.address':
        return !value.trim() ? 'Address is required' : null;

      case 'location.city':
        return !value.trim() ? 'City is required' : null;

      case 'location.country':
        return !value.trim() ? 'Country is required' : null;

      default:
        return null;
    }
  };

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
      // Convert numeric inputs to numbers
      const numericFields = ['capacity', 'ticketPrice'];
      const processedValue = numericFields.includes(name)
        ? (value === '' ? 0 : Number(value))
        : value;

      setEventData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }

    // Validate the field as it changes
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error || ''
    }));

    // Special case for endDate when startDate changes
    if (name === 'startDate' && eventData.endDate) {
      const endDateError = validateField('endDate', eventData.endDate);
      setFormErrors(prev => ({
        ...prev,
        endDate: endDateError || ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Validate each field
    for (const [key, value] of Object.entries(eventData)) {
      if (key === 'location') {
        // Handle nested location fields
        for (const [locKey, locValue] of Object.entries(eventData.location)) {
          if (locKey !== 'coordinates' && locKey !== 'postalCode') {
            const locError = validateField(`location.${locKey}`, locValue);
            if (locError) {
              newErrors[`location.${locKey}`] = locError;
              isValid = false;
            }
          }
        }
      } else {
        const error = validateField(key, value);
        if (error) {
          newErrors[key] = error;
          isValid = false;
        }
      }
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting');
      return;
    }

    setIsLoading(true);

    // Validate and format dates to ISO string
    const formattedEventData = {
      ...eventData,
      startDate: new Date(eventData.startDate).toISOString(),
      endDate: new Date(eventData.endDate).toISOString(),
      location: {
        ...eventData.location,
        coordinates: eventData.location.coordinates || undefined
      }
    };

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post('http://localhost:3000/api/v1/events', formattedEventData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success('Event created successfully!');
        navigate('/dashboard/events');
      } else {
        toast.error(response.data.message || 'Failed to create event');
      }
    } catch (error: any) {
      console.error('Event creation error:', error.response?.data);
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
              className={`w-full p-2 border rounded ${formErrors.title ? 'border-red-500' : ''}`}
              value={eventData.title}
              onChange={handleChange}
              placeholder="Enter event title"
              minLength={5}
            />
            {formErrors.title && (
              <p className="text-red-500 text-sm mt-1">{formErrors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="type" className="block mb-2 font-semibold">
              <Calendar className="inline-block mr-2" /> Event Type
            </label>
            <select
              id="type"
              name="type"
              required
              className={`w-full p-2 border rounded ${formErrors.type ? 'border-red-500' : ''}`}
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
            {formErrors.type && (
              <p className="text-red-500 text-sm mt-1">{formErrors.type}</p>
            )}
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
              min={getTodayDatetime()}
              className={`w-full p-2 border rounded ${formErrors.startDate ? 'border-red-500' : ''}`}
              value={eventData.startDate}
              onChange={handleChange}
            />
            {formErrors.startDate && (
              <p className="text-red-500 text-sm mt-1">{formErrors.startDate}</p>
            )}
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
              min={eventData.startDate || getTodayDatetime()}
              className={`w-full p-2 border rounded ${formErrors.endDate ? 'border-red-500' : ''}`}
              value={eventData.endDate}
              onChange={handleChange}
            />
            {formErrors.endDate && (
              <p className="text-red-500 text-sm mt-1">{formErrors.endDate}</p>
            )}
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
              required
              className={`w-full p-2 border rounded ${formErrors['location.name'] ? 'border-red-500' : ''}`}
              value={eventData.location.name}
              onChange={handleChange}
              placeholder="Enter venue name"
            />
            {formErrors['location.name'] && (
              <p className="text-red-500 text-sm mt-1">{formErrors['location.name']}</p>
            )}
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
              className={`w-full p-2 border rounded ${formErrors['location.city'] ? 'border-red-500' : ''}`}
              value={eventData.location.city}
              onChange={handleChange}
              placeholder="Enter city"
            />
            {formErrors['location.city'] && (
              <p className="text-red-500 text-sm mt-1">{formErrors['location.city']}</p>
            )}
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
              className={`w-full p-2 border rounded ${formErrors['location.address'] ? 'border-red-500' : ''}`}
              value={eventData.location.address}
              onChange={handleChange}
              placeholder="Enter full address"
            />
            {formErrors['location.address'] && (
              <p className="text-red-500 text-sm mt-1">{formErrors['location.address']}</p>
            )}
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
            className={`w-full p-2 border rounded ${formErrors['location.country'] ? 'border-red-500' : ''}`}
            value={eventData.location.country}
            onChange={handleChange}
            placeholder="Enter country"
          />
          {formErrors['location.country'] && (
            <p className="text-red-500 text-sm mt-1">{formErrors['location.country']}</p>
          )}
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
              min="30"
              max="5000"
              className={`w-full p-2 border rounded ${formErrors.capacity ? 'border-red-500' : ''}`}
              value={eventData.capacity || ''}
              onChange={handleChange}
              placeholder="Maximum number of attendees (30-5000)"
            />
            {formErrors.capacity && (
              <p className="text-red-500 text-sm mt-1">{formErrors.capacity}</p>
            )}
          </div>

          <div>
            <label htmlFor="ticketPrice" className="block mb-2 font-semibold">
              <DollarSign className="inline-block mr-2" /> Ticket Price
            </label>
            <input
              type="number"
              id="ticketPrice"
              name="ticketPrice"
              min="0"
              step="0.01"
              className={`w-full p-2 border rounded ${formErrors.ticketPrice ? 'border-red-500' : ''}`}
              value={eventData.ticketPrice || ''}
              onChange={handleChange}
              placeholder="Ticket price (optional)"
            />
            {formErrors.ticketPrice && (
              <p className="text-red-500 text-sm mt-1">{formErrors.ticketPrice}</p>
            )}
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
            className={`w-full p-2 border rounded ${formErrors.description ? 'border-red-500' : ''}`}
            value={eventData.description}
            onChange={handleChange}
            placeholder="Provide a detailed description of the event (minimum 20 characters)"
            minLength={20}
          />
          {formErrors.description && (
            <p className="text-red-500 text-sm mt-1">{formErrors.description}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-500 text-white px-6 py-2 rounded hover:bg-indigo-600 transition-colors flex items-center disabled:bg-indigo-300"
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
