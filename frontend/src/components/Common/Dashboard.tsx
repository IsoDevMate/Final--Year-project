import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, DollarSign, TrendingUp, Clock, Video, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const [statsData, setStatsData] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    totalRevenue: 0,
    upcomingEvents: 0,
  });

  const [recentEvents, setRecentEvents] = useState<{ id: string; title: string; date: string; attendees: number; status: string; isLivestream: boolean; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from your API
    // This is just placeholder data
    setTimeout(() => {
      setStatsData({
        totalEvents: 12,
        totalAttendees: 842,
        totalRevenue: 15680,
        upcomingEvents: 3,
      });

      setRecentEvents([
        {
          id: '1',
          title: 'Tech Conference 2023',
          date: '2023-10-15',
          attendees: 120,
          status: 'upcoming',
          isLivestream: true
        },
        {
          id: '2',
          title: 'Product Launch Workshop',
          date: '2023-09-28',
          attendees: 85,
          status: 'completed',
          isLivestream: false
        },
        {
          id: '3',
          title: 'Design Thinking Masterclass',
          date: '2023-10-05',
          attendees: 64,
          status: 'ongoing',
          isLivestream: true
        },
      ]);

      setIsLoading(false);
    }, 1000);
  }, []);

  // Helper function to format dates
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'canceled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/dashboard/events/create"
          className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition duration-200"
        >
          Create Event
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-indigo-100 rounded-full p-3">
                  <Calendar className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Events</h3>
                  <p className="text-2xl font-bold text-gray-900">{statsData.totalEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-green-100 rounded-full p-3">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Attendees</h3>
                  <p className="text-2xl font-bold text-gray-900">{statsData.totalAttendees}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-blue-100 rounded-full p-3">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                  <p className="text-2xl font-bold text-gray-900">${statsData.totalRevenue}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center">
                <div className="bg-purple-100 rounded-full p-3">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500">Upcoming Events</h3>
                  <p className="text-2xl font-bold text-gray-900">{statsData.upcomingEvents}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Events */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Recent Events</h2>
              <Link
                to="/dashboard/events"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3">Event Name</th>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Attendees</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Livestream</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{event.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{formatDate(event.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-500">{event.attendees}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(event.status)}`}>
                          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {event.isLivestream ? (
                          <span className="flex items-center text-green-600">
                            <Video className="h-4 w-4 mr-1" />
                            Available
                          </span>
                        ) : (
                          <span className="text-gray-400">Not available</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/dashboard/events/${event.id}`} className="text-indigo-600 hover:text-indigo-900">
                          Details
                        </Link>
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
}
export default Dashboard;
