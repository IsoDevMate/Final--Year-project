import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Download, FileText, Users, Calendar, ChevronDown,
  Filter, ArrowUpDown, RefreshCcw
} from 'lucide-react';

interface Report {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  format: string;
}

interface EventSummary {
  id: string;
  title: string;
  attendeeCount: number;
  date: string;
  type: string;
  location: string;
}

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'attendees' | 'saved'>('overview');
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    if (activeTab === 'events' || activeTab === 'overview') {
      fetchEvents();
    }
  }, [activeTab]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/v1/events/organizer/events', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
        console.log(response.data.data);

      const formattedEvents = response.data.data.map((event: any) => ({
        id: event._id,
        title: event.title,
        attendeeCount: event.attendees ? event.attendees.length : 0,
        date: new Date(event.startDate).toLocaleDateString(),
        type: event.type,
        location: event.location?.city || 'N/A'
      }));

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Failed to fetch events', error);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAttendeeReport = async (eventId: string) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/events/${eventId}/attendees`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        responseType: 'blob'
      });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;

      // Get the event title for the filename
      const event = events.find(e => e.id === eventId);
      const filename = `${event?.title || 'event'}-attendees-${new Date().toISOString().split('T')[0]}.csv`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download report', error);
      alert('Failed to download report');
    }
  };

  const downloadEventSummaryReport = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/v1/reports/events/summary', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `events-summary-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download summary report', error);
      alert('Failed to download summary report');
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reports</h1>
          <button
            onClick={() => fetchEvents()}
            className="flex items-center px-3 py-2 text-sm bg-white border rounded-md shadow-sm hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh Data
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'overview' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'events' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('events')}
          >
            Event Reports
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'attendees' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('attendees')}
          >
            Attendee Reports
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'saved' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('saved')}
          >
            Saved Reports
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium">Total Events</h3>
                <p className="text-3xl font-bold text-indigo-600">{events.length}</p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium">Total Attendees</h3>
                <p className="text-3xl font-bold text-indigo-600">
                  {events.reduce((sum, event) => sum + event.attendeeCount, 0)}
                </p>
              </div>
              <div className="p-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-medium">Active Events</h3>
                <p className="text-3xl font-bold text-indigo-600">
                  {events.filter(event => new Date(event.date) >= new Date()).length}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Recent Events</h3>
                <button
                  onClick={downloadEventSummaryReport}
                  className="flex items-center px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Summary
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.slice(0, 5).map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{event.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{event.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{event.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{event.attendeeCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => downloadAttendeeReport(event.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Download Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Events Reports Tab */}
        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-2 md:space-y-0">
              <h2 className="text-xl font-semibold">Event Reports</h2>
              <div className="flex space-x-2">
                <button
                  onClick={downloadEventSummaryReport}
                  className="flex items-center px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download All Events
                </button>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendees</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{event.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{event.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{event.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{event.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{event.attendeeCount}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            onClick={() => downloadAttendeeReport(event.id)}
                            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Attendees
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {events.length === 0 && !isLoading && (
                <div className="py-12 text-center text-gray-500">
                  No events found. Create an event to generate reports.
                </div>
              )}
              {isLoading && (
                <div className="py-12 text-center text-gray-500">
                  Loading events...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Attendee Reports Tab */}
        {activeTab === 'attendees' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Generate Attendee Report</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Event
                  </label>
                  <select
                    value={selectedEvent || ''}
                    onChange={(e) => setSelectedEvent(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">-- Select an event --</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.title} ({event.date})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => selectedEvent && downloadAttendeeReport(selectedEvent)}
                    disabled={!selectedEvent}
                    className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                      selectedEvent ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Saved Reports Tab */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-4">Saved Reports</h3>
              <p className="text-gray-500">
                Your downloaded reports will appear here. This feature is coming soon.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
