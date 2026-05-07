import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Edit2, Check, X, Users, Calendar, ShieldCheck, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API = 'https://final-year-project-jy2j.onrender.com/api/v1';
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

interface UserRow { _id: string; firstName: string; lastName: string; email: string; role: string; isVerified: boolean; createdAt: string; }
interface EventRow { _id: string; title: string; status: string; type: string; startDate: string; organizer: { firstName: string; lastName: string; email: string } | null; attendees: string[]; }
interface Stats { totalUsers: number; totalEvents: number; totalOrganizers: number; totalAttendees: number; }

export default function AdminDashboard() {
  const [tab, setTab] = useState<'overview' | 'users' | 'events'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { fetchStats(); }, []);
  useEffect(() => { if (tab === 'users') fetchUsers(); if (tab === 'events') fetchEvents(); }, [tab]);

  const fetchStats = async () => {
    try { const r = await axios.get(`${API}/admin/stats`, { headers: headers() }); setStats(r.data.data); }
    catch { toast.error('Failed to load stats'); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/admin/users`, { headers: headers() }); setUsers(r.data.data); }
    catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/admin/events`, { headers: headers() }); setEvents(r.data.data); }
    catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await axios.delete(`${API}/admin/users/${id}`, { headers: headers() });
      setUsers(u => u.filter(x => x._id !== id));
      toast.success('User deleted');
      fetchStats();
    } catch { toast.error('Failed to delete user'); }
  };

  const saveUser = async () => {
    if (!editUser) return;
    try {
      await axios.put(`${API}/admin/users/${editUser._id}`, { role: editUser.role, firstName: editUser.firstName, lastName: editUser.lastName }, { headers: headers() });
      setUsers(u => u.map(x => x._id === editUser._id ? editUser : x));
      setEditUser(null);
      toast.success('User updated');
    } catch { toast.error('Failed to update user'); }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm('Delete this event?')) return;
    try {
      await axios.delete(`${API}/admin/events/${id}`, { headers: headers() });
      setEvents(e => e.filter(x => x._id !== id));
      toast.success('Event deleted');
      fetchStats();
    } catch { toast.error('Failed to delete event'); }
  };

  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: <Users className="w-6 h-6 text-tiffany-600" />, bg: 'bg-tiffany-50' },
    { label: 'Total Events', value: stats.totalEvents, icon: <Calendar className="w-6 h-6 text-tiffany-600" />, bg: 'bg-tiffany-50' },
    { label: 'Organizers', value: stats.totalOrganizers, icon: <ShieldCheck className="w-6 h-6 text-tiffany-600" />, bg: 'bg-tiffany-50' },
    { label: 'Attendees', value: stats.totalAttendees, icon: <UserCheck className="w-6 h-6 text-tiffany-600" />, bg: 'bg-tiffany-50' },
  ] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex border-b">
        {(['overview', 'users', 'events'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 font-medium capitalize ${tab === t ? 'text-tiffany-600 border-b-2 border-tiffany-600' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(c => (
            <div key={c.label} className={`${c.bg} rounded-xl p-5 flex items-center gap-4 shadow-sm`}>
              <div className="bg-white rounded-full p-3 shadow-sm">{c.icon}</div>
              <div>
                <p className="text-sm text-gray-500">{c.label}</p>
                <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-800">All Users ({users.length})</h2>
          </div>
          {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Role</th>
                    <th className="px-4 py-3 text-left">Verified</th>
                    <th className="px-4 py-3 text-left">Joined</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      {editUser?._id === u._id ? (
                        <>
                          <td className="px-4 py-2">
                            <input className="border rounded px-2 py-1 w-24 mr-1" value={editUser.firstName} onChange={e => setEditUser({ ...editUser, firstName: e.target.value })} />
                            <input className="border rounded px-2 py-1 w-24" value={editUser.lastName} onChange={e => setEditUser({ ...editUser, lastName: e.target.value })} />
                          </td>
                          <td className="px-4 py-2 text-gray-500">{u.email}</td>
                          <td className="px-4 py-2">
                            <select className="border rounded px-2 py-1" value={editUser.role} onChange={e => setEditUser({ ...editUser, role: e.target.value })}>
                              <option value="attendee">Attendee</option>
                              <option value="organizer">Organizer</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">{u.isVerified ? '✓' : '✗'}</td>
                          <td className="px-4 py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-right space-x-2">
                            <button onClick={saveUser} className="text-tiffany-600 hover:text-tiffany-800"><Check className="w-4 h-4 inline" /></button>
                            <button onClick={() => setEditUser(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4 inline" /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium text-gray-900">{u.firstName} {u.lastName}</td>
                          <td className="px-4 py-3 text-gray-500">{u.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-red-100 text-red-700' : u.role === 'organizer' ? 'bg-tiffany-100 text-tiffany-700' : 'bg-gray-100 text-gray-600'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 py-3">{u.isVerified ? <span className="text-green-600">✓</span> : <span className="text-gray-400">✗</span>}</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-right space-x-3">
                            <button onClick={() => setEditUser(u)} className="text-tiffany-600 hover:text-tiffany-800"><Edit2 className="w-4 h-4 inline" /></button>
                            <button onClick={() => deleteUser(u._id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline" /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div className="p-8 text-center text-gray-400">No users found.</div>}
            </div>
          )}
        </div>
      )}

      {/* Events */}
      {tab === 'events' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">All Events ({events.length})</h2>
          </div>
          {loading ? <div className="p-8 text-center text-gray-400">Loading...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Title</th>
                    <th className="px-4 py-3 text-left">Organizer</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Attendees</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {events.map(e => (
                    <tr key={e._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{e.title}</td>
                      <td className="px-4 py-3 text-gray-500">{e.organizer ? `${e.organizer.firstName} ${e.organizer.lastName}` : 'N/A'}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(e.startDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${e.status === 'published' ? 'bg-green-100 text-green-700' : e.status === 'ongoing' ? 'bg-tiffany-100 text-tiffany-700' : e.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{e.type}</td>
                      <td className="px-4 py-3 text-gray-500">{e.attendees?.length ?? 0}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => deleteEvent(e._id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {events.length === 0 && <div className="p-8 text-center text-gray-400">No events found.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
