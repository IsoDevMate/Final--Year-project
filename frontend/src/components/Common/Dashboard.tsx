import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, DollarSign, Clock, ArrowRight, FileText, Plus } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

// ── Attendee dashboard ────────────────────────────────────────────────────────
const AttendeeDashboard: React.FC<{ firstName: string }> = ({ firstName }) => {
  const [notes, setNotes] = useState<any[]>([]);
  const [registeredEvents, setRegisteredEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [notesRes, eventsRes] = await Promise.allSettled([
          axios.get(`${API}/notes`, { headers: authHeaders() }),
          axios.get(`${API}/events/registered`, { headers: authHeaders() }),
        ]);
        if (notesRes.status === 'fulfilled') setNotes(notesRes.value.data.data?.notes || notesRes.value.data.data || []);
        if (eventsRes.status === 'fulfilled') setRegisteredEvents(eventsRes.value.data.data || []);
      } catch { /* leave empty */ }
      finally { setLoading(false); }
    };
    load();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiffany-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}!</h1>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/dashboard/events" className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
          <div className="bg-tiffany-100 rounded-full p-3 mr-4"><Calendar className="h-6 w-6 text-tiffany-600" /></div>
          <div>
            <p className="font-semibold text-gray-800">Browse Events</p>
            <p className="text-sm text-gray-500">Discover and register for events</p>
          </div>
        </Link>
        <Link to="/dashboard/notes" className="flex items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100">
          <div className="bg-blue-100 rounded-full p-3 mr-4"><FileText className="h-6 w-6 text-blue-600" /></div>
          <div>
            <p className="font-semibold text-gray-800">My Notes</p>
            <p className="text-sm text-gray-500">View, edit and manage your notes</p>
          </div>
        </Link>
      </div>

      {/* My Notes */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Notes</h2>
          <Link to="/dashboard/notes" className="text-sm text-tiffany-600 hover:text-tiffany-800 flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {notes.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>No notes yet.</p>
            <Link to="/dashboard/events" className="mt-2 inline-block text-sm text-tiffany-600 hover:underline">
              Register for an event to start taking notes
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notes.slice(0, 5).map((note: any) => (
              <li key={note._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{note.title}</p>
                  <p className="text-xs text-gray-400">{note.event?.title || 'No event'} · {new Date(note.updatedAt || note.createdAt).toLocaleDateString()}</p>
                </div>
                <Link to="/dashboard/notes" className="ml-4 text-xs text-tiffany-600 hover:underline shrink-0">Open</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Registered Events */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">My Registered Events</h2>
          <Link to="/dashboard/events" className="text-sm text-tiffany-600 hover:text-tiffany-800 flex items-center gap-1">
            Browse more <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {registeredEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>You haven't registered for any events yet.</p>
            <Link to="/dashboard/events" className="mt-2 inline-block text-sm text-tiffany-600 hover:underline">Browse Events</Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {registeredEvents.slice(0, 5).map((event: any) => (
              <li key={event._id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{event.title}</p>
                  <p className="text-xs text-gray-400">{new Date(event.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} · {event.location?.city}</p>
                </div>
                <Link to={`/dashboard/events/${event._id}`} className="ml-4 text-xs text-tiffany-600 hover:underline shrink-0">Details</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [statsData, setStatsData] = useState({ totalEvents: 0, totalAttendees: 0, totalRevenue: 0, upcomingEvents: 0 });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOrganizer = user?.role === 'organizer' || user?.role === 'admin';

  useEffect(() => {
    if (!isOrganizer) {
      setIsLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        const r = await axios.get(`${API}/events/organizer/events`, { headers: authHeaders() });
        const events = r.data.data || [];
        const now = new Date();
        setStatsData({
          totalEvents: events.length,
          totalAttendees: events.reduce((s: number, e: any) => s + (e.attendees?.length ?? 0), 0),
          totalRevenue: events.reduce((s: number, e: any) => s + ((e.ticketPrice ?? 0) * (e.attendees?.length ?? 0)), 0),
          upcomingEvents: events.filter((e: any) => new Date(e.startDate) > now).length,
        });
        setRecentEvents(events.slice(0, 5));
      } catch {
        // no events yet — leave zeros
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isOrganizer]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-blue-100 text-blue-800';
      case 'ongoing': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOrganizer) {
    return <AttendeeDashboard firstName={user?.firstName || 'there'} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link to="/dashboard/events/create" className="bg-tiffany-600 text-white py-2 px-4 rounded-lg hover:bg-tiffany-700 transition duration-200">
          Create Event
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-tiffany-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Events', value: statsData.totalEvents, icon: <Calendar className="h-6 w-6 text-tiffany-600" />, bg: 'bg-tiffany-100' },
              { label: 'Total Attendees', value: statsData.totalAttendees, icon: <Users className="h-6 w-6 text-green-600" />, bg: 'bg-green-100' },
              { label: 'Total Revenue', value: `KES ${statsData.totalRevenue.toLocaleString()}`, icon: <DollarSign className="h-6 w-6 text-blue-600" />, bg: 'bg-blue-100' },
              { label: 'Upcoming Events', value: statsData.upcomingEvents, icon: <Clock className="h-6 w-6 text-tiffany-600" />, bg: 'bg-tiffany-100' },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className={`${c.bg} rounded-full p-3`}>{c.icon}</div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-500">{c.label}</h3>
                    <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Events</h2>
              <Link to="/dashboard/events" className="text-tiffany-600 hover:text-tiffany-800 text-sm font-medium flex items-center">
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Event</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Attendees</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentEvents.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No events yet. <Link to="/dashboard/events/create" className="text-tiffany-600 hover:underline">Create your first event</Link></td></tr>
                  ) : recentEvents.map((event) => (
                    <tr key={event._id}>
                      <td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
                      <td className="px-6 py-4 text-gray-500">{new Date(event.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-6 py-4 text-gray-500">{event.attendees?.length ?? 0}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(event.status)}`}>
                          {event.status?.charAt(0).toUpperCase() + event.status?.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <Link to={`/dashboard/events/${event._id}`} className="text-tiffany-600 hover:text-tiffany-900">Details</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
