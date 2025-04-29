import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

// Types based on the existing Session interface
interface Speaker {
  userId?: string;
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  photoUrl?: string;
}

interface Material {
  type: 'presentation' | 'document' | 'video' | 'other';
  title: string;
  url: string;
  description?: string;
  isPublic: boolean;
}

interface CreateSessionForm {
  title: string;
  description: string;
  eventId: string;
  startTime: string;
  endTime: string;
  location?: string;
  capacity?: number;
  speaker?: Speaker;
  tags?: string[];
  materials?: Material[];
  isLiveStreamed?: boolean;
  streamUrl?: string;
}

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
  price?: number;
  createdAt: string;
  updatedAt: string;
}

const CreateSessionPage: React.FC = () => {
  const navigate = useNavigate();
//   const { eventId } = useParams<{ eventId: string }>();

    const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>('');

    const cancreatesession = user &&
    (user.role === 'organizer' || user.role === 'admin');


  // Form state
  const [formData, setFormData] = useState<CreateSessionForm>({
    title: '',
    description: '',
    eventId: '',
    startTime: '',
    endTime: '',
    location: '',
    capacity: undefined,
    speaker: {
      name: '',
      title: '',
      company: ''
    },
    tags: [],
    materials: [],
    isLiveStreamed: false,
    streamUrl: ''
  });

  // Tag input state
  const [currentTag, setCurrentTag] = useState('');

    useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Assuming you have an endpoint to fetch events
        const response = await axios.get('https://final-year-project-56d5.onrender.com/api/v1/events');
        if (response.data.success) {
        setEvents(response.data.data.events);
        }
      } catch (error) {
        console.error('Failed to fetch events', error);
      }
    };

    fetchEvents();
    }, []);

      useEffect(() => {
    setFormData(prev => ({
      ...prev,
      eventId: selectedEvent
    }));
      }, [selectedEvent]);

  // Material input state
  const [currentMaterial, setCurrentMaterial] = useState<Material>({
    type: 'document',
    title: '',
    url: '',
    description: '',
    isPublic: true
  });

  // Error handling
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title) newErrors.title = 'Session title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';

    // Validate end time is after start time
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle speaker input changes
  const handleSpeakerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      speaker: {
        ...prev.speaker,
        [name]: value || ''
      }
    }));
  };

  // Add tag
  const addTag = () => {
    if (currentTag && !formData.tags?.includes(currentTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), currentTag]
      }));
      setCurrentTag('');
    }
  };

  // Remove tag
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove)
    }));
  };

  // Modify addMaterial function
  const addMaterial = () => {
    if (currentMaterial.title && currentMaterial.url) {
      // Ensure materials is an array
      const updatedMaterials = formData.materials ? [...formData.materials] : [];

      updatedMaterials.push({
        type: currentMaterial.type,
        title: currentMaterial.title,
        url: currentMaterial.url,
        description: currentMaterial.description || '',
        isPublic: currentMaterial.isPublic
      });

      setFormData(prev => ({
        ...prev,
        materials: updatedMaterials
      }));

      // Reset material input
      setCurrentMaterial({
        type: 'document',
        title: '',
        url: '',
        description: '',
        isPublic: true
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Prepare data for submission
    const submissionData = {
      ...formData,

      materials: formData.materials?.map(material => ({
        type: material.type,
        title: material.title,
        url: material.url,
        description: material.description || '',
        isPublic: material.isPublic ?? true
      })) || []
    };

    try {
      const response = await axios.post('https://final-year-project-56d5.onrender.com/api/v1/sessions/create', submissionData);

      if (response.data.success) {
        navigate(`/dashboard/events/${selectedEvent}/sessions`);
        toast.success('Session created successfully!');
      }
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Failed to create session. Please try again.');
    }
  };

  // Remove material
  const removeMaterial = (materialToRemove: Material) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials?.filter(material =>
        material.url !== materialToRemove.url
      )
    }));
  };



    if (!cancreatesession) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold mb-4">Unauthorized Access</h2>
          <p className="text-gray-600">
            Only Organizers can create Sessions. Please create an account as an  organizer and Login to proceed.
          </p>
          {/* naigate to events page  */}
          <button
            onClick={() => navigate('/dashboard/events')}
            className="mt-4 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Create New Session</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

              {/* Event Selection Dropdown */}
        <div>
          <label htmlFor="eventSelect" className="block text-sm font-medium text-gray-700">
            Select Event
          </label>
          <select
            id="eventSelect"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
          >
            <option value="">Select an Event</option>
            {events.map(event => (
              <option key={event._id} value={event._id}>
                {event.title}
              </option>
            ))}
          </select>
              </div>

        {/* Basic Session Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Session Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              } shadow-sm py-2 px-3`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            value={formData.description}
            onChange={handleInputChange}
            className={`mt-1 block w-full rounded-md border ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            } shadow-sm py-2 px-3`}
          />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
        </div>

        {/* Time and Capacity */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
              Start Time
            </label>
            <input
              type="datetime-local"
              id="startTime"
              name="startTime"
              value={formData.startTime}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.startTime ? 'border-red-500' : 'border-gray-300'
              } shadow-sm py-2 px-3`}
            />
            {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>}
          </div>

          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
              End Time
            </label>
            <input
              type="datetime-local"
              id="endTime"
              name="endTime"
              value={formData.endTime}
              onChange={handleInputChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.endTime ? 'border-red-500' : 'border-gray-300'
              } shadow-sm py-2 px-3`}
            />
            {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>}
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
              Capacity
            </label>
            <input
              type="number"
              id="capacity"
              name="capacity"
              value={formData.capacity || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
            />
          </div>
        </div>

        {/* Speaker Details */}
        <div className="grid md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="speakerName" className="block text-sm font-medium text-gray-700">
              Speaker Name
            </label>
            <input
              type="text"
              id="speakerName"
              name="name"
              value={formData.speaker?.name || ''}
              onChange={handleSpeakerChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label htmlFor="speakerTitle" className="block text-sm font-medium text-gray-700">
              Speaker Title
            </label>
            <input
              type="text"
              id="speakerTitle"
              name="title"
              value={formData.speaker?.title || ''}
              onChange={handleSpeakerChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label htmlFor="speakerCompany" className="block text-sm font-medium text-gray-700">
              Speaker Company
            </label>
            <input
              type="text"
              id="speakerCompany"
              name="company"
              value={formData.speaker?.company || ''}
              onChange={handleSpeakerChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Tags
          </label>
          <div className="flex items-center mt-1">
            <input
              type="text"
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              placeholder="Add a tag"
              className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 mr-2"
            />
            <button
              type="button"
              onClick={addTag}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {formData.tags && formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-indigo-400 hover:text-indigo-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Materials */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Session Materials
          </label>
          <div className="grid md:grid-cols-3 gap-4 mt-1">
            <div>
              <label htmlFor="materialType" className="block text-xs text-gray-600">Type</label>
              <select
                id="materialType"
                value={currentMaterial.type}
                onChange={(e) => setCurrentMaterial(prev => ({
                  ...prev,
                  type: e.target.value as Material['type']
                }))}
                className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
              >
                <option value="document">Document</option>
                <option value="presentation">Presentation</option>
                <option value="video">Video</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label htmlFor="materialTitle" className="block text-xs text-gray-600">Title</label>
              <input
                type="text"
                id="materialTitle"
                value={currentMaterial.title}
                onChange={(e) => setCurrentMaterial(prev => ({
                  ...prev,
                  title: e.target.value
                }))}
                placeholder="Material title"
                className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
              />
            </div>
            <div>
              <label htmlFor="materialUrl" className="block text-xs text-gray-600">URL</label>
              <input
                type="url"
                id="materialUrl"
                value={currentMaterial.url}
                onChange={(e) => setCurrentMaterial(prev => ({
                  ...prev,
                  url: e.target.value
                }))}
                placeholder="Material URL"
                className="block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={addMaterial}
            className="mt-2 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" /> Add Material
          </button>

          {formData.materials && formData.materials.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.materials.map((material, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-100 p-3 rounded-md"
                >
                  <div>
                    <span className="font-medium">{material.title}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({material.type})
                    </span>
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-600 ml-2 hover:underline"
                    >
                      View
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeMaterial(material)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Stream Option */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isLiveStreamed"
            checked={formData.isLiveStreamed}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              isLiveStreamed: e.target.checked
            }))}
            className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
          />
          <label htmlFor="isLiveStreamed" className="ml-2 block text-sm text-gray-900">
            Enable Live Streaming
          </label>
        </div>

        {formData.isLiveStreamed && (
          <div>
            <label htmlFor="streamUrl" className="block text-sm font-medium text-gray-700">
              Stream URL
            </label>
            <input
              type="url"
              id="streamUrl"
              name="streamUrl"
              value={formData.streamUrl || ''}
              onChange={handleInputChange}
              placeholder="Enter stream URL"
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3"
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 transition duration-200"
          >
            Create Session
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSessionPage;
