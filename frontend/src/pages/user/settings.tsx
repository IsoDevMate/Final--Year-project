import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield, Mail, CreditCard, Key, Lock, Zap, X, Eye, EyeOff, Monitor, Smartphone, LogOut } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

type TabType = 'account' | 'security' | 'billing';

interface NotificationSettings {
  events: boolean;
  reminders: boolean;
  updates: boolean;
  marketing: boolean;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case 'account': return <AccountSettings navigate={navigate} />;
      case 'security': return <SecuritySettings />;
      case 'billing': return <BillingSettings />;
      default: return <AccountSettings navigate={navigate} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-64 bg-gray-50 p-4 border-r border-gray-200">
            <nav className="space-y-1">
              {([
                { key: 'account', icon: <Mail className="mr-3 h-5 w-5" />, label: 'Account' },
                { key: 'security', icon: <Shield className="mr-3 h-5 w-5" />, label: 'Security' },
                { key: 'billing', icon: <CreditCard className="mr-3 h-5 w-5" />, label: 'Billing' },
              ] as const).map(({ key, icon, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                    activeTab === key ? 'bg-tiffany-50 text-tiffany-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}>
                  {icon}{label}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex-1 p-6">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

// ── Account Settings ──────────────────────────────────────────────────────────
const AccountSettings: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeactivate = async () => {
    if (!confirm('Deactivate your account? You will be logged out and cannot use the platform until you reactivate.')) return;
    setDeactivating(true);
    try {
      await axios.post(`${API}/auth/deactivate`, {}, { headers: authHeaders() });
      toast.success('Account deactivated. You have been logged out.');
      localStorage.clear();
      navigate('/auth/login');
    } catch {
      toast.error('Failed to deactivate account');
    } finally { setDeactivating(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Permanently delete your account? This will remove all your data and cannot be undone.')) return;
    if (!confirm('Are you absolutely sure? All your events, notes, and payments will be deleted.')) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/auth/account`, { headers: authHeaders() });
      toast.success('Account deleted');
      localStorage.clear();
      navigate('/');
    } catch {
      toast.error('Failed to delete account');
    } finally { setDeleting(false); }
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Account Settings</h2>
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Profile Information</h3>
              <p className="text-sm text-gray-500">Update your name, email, and other personal details</p>
            </div>
            <Link to="/dashboard/profile" className="text-sm text-tiffany-600 hover:text-tiffany-500">Update</Link>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Deactivate Account</h3>
              <p className="text-sm text-gray-500">Temporarily disable your account. You can reactivate it by contacting support.</p>
            </div>
            <button onClick={handleDeactivate} disabled={deactivating}
              className="text-sm text-yellow-700 border border-yellow-400 px-3 py-1 rounded hover:bg-yellow-100 disabled:opacity-50">
              {deactivating ? 'Deactivating...' : 'Deactivate'}
            </button>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Delete Account</h3>
              <p className="text-sm text-gray-500">Permanently delete your account and all associated data. This cannot be undone.</p>
            </div>
            <button onClick={handleDelete} disabled={deleting}
              className="text-sm text-red-600 border border-red-400 px-3 py-1 rounded hover:bg-red-100 disabled:opacity-50">
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Change Password Modal ─────────────────────────────────────────────────────
const ChangePasswordModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('New passwords do not match'); return; }
    if (form.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/auth/change-password`,
        { currentPassword: form.currentPassword, newPassword: form.newPassword },
        { headers: authHeaders() }
      );
      toast.success('Password changed successfully');
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally { setSaving(false); }
  };

  const Field = ({ label, field, placeholder }: { label: string; field: keyof typeof form; placeholder: string }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <input type={show[field as keyof typeof show] ? 'text' : 'password'} value={form[field]}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-tiffany-500 focus:border-tiffany-500" />
        <button type="button" onClick={() => setShow(p => ({ ...p, [field]: !p[field as keyof typeof show] }))}
          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
          {show[field as keyof typeof show] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Change Password</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Current Password" field="currentPassword" placeholder="Enter current password" />
          <Field label="New Password" field="newPassword" placeholder="At least 8 characters" />
          <Field label="Confirm New Password" field="confirmPassword" placeholder="Repeat new password" />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 text-sm bg-tiffany-600 text-white rounded-lg hover:bg-tiffany-700 disabled:opacity-60">
              {saving ? 'Saving...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Active Sessions Panel ─────────────────────────────────────────────────────
const ActiveSessionsPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    axios.get(`${API}/auth/sessions`, { headers: authHeaders() })
      .then(r => setSessions(r.data.data || []))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setLoading(false));
  }, []);

  const revokeSession = async (tokenId: string) => {
    setRevoking(tokenId);
    try {
      await axios.delete(`${API}/auth/sessions/${tokenId}`, { headers: authHeaders() });
      setSessions(p => p.filter(s => s._id !== tokenId));
      toast.success('Session revoked');
    } catch { toast.error('Failed to revoke session'); }
    finally { setRevoking(null); }
  };

  const revokeAll = async () => {
    if (!confirm('Revoke all other sessions? You will remain logged in on this device.')) return;
    try {
      await axios.delete(`${API}/auth/sessions`, { headers: authHeaders() });
      // Keep only current session (the one matching current token)
      const currentToken = localStorage.getItem('accessToken');
      setSessions(p => p.filter(s => s.isCurrent));
      toast.success('All other sessions revoked');
    } catch { toast.error('Failed to revoke sessions'); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Active Sessions</h3>
          <button onClick={onClose}><X className="h-5 w-5 text-gray-500" /></button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-2 border-tiffany-600 border-t-transparent rounded-full" /></div>
        ) : sessions.length === 0 ? (
          <p className="text-gray-500 text-sm py-4">No active sessions found.</p>
        ) : (
          <>
            <div className="overflow-y-auto flex-1 space-y-3 mb-4">
              {sessions.map(s => (
                <div key={s._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {s.userAgent?.includes('Mobile') ? <Smartphone className="h-5 w-5 text-gray-400" /> : <Monitor className="h-5 w-5 text-gray-400" />}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.isCurrent ? 'This device (current)' : (s.userAgent || 'Unknown device')}</p>
                      <p className="text-xs text-gray-500">{s.createdAt ? new Date(s.createdAt).toLocaleString() : ''}</p>
                    </div>
                  </div>
                  {!s.isCurrent && (
                    <button onClick={() => revokeSession(s._id)} disabled={revoking === s._id}
                      className="text-xs text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50 flex items-center gap-1">
                      <LogOut className="h-3 w-3" />{revoking === s._id ? '...' : 'Revoke'}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {sessions.filter(s => !s.isCurrent).length > 0 && (
              <button onClick={revokeAll} className="w-full py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50">
                Revoke All Other Sessions
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ── Security Settings Tab ─────────────────────────────────────────────────────
const SecuritySettings: React.FC = () => {
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h2>
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Change Password</h3>
              <p className="text-sm text-gray-500">Update your password for enhanced security</p>
            </div>
            <button onClick={() => setShowChangePassword(true)}
              className="text-sm text-tiffany-600 hover:text-tiffany-500 flex items-center">
              <Key className="mr-1 h-4 w-4" /> Change
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <button className="text-sm text-tiffany-600 hover:text-tiffany-500 flex items-center">
              <Lock className="mr-1 h-4 w-4" /> Enable
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Active Sessions</h3>
              <p className="text-sm text-gray-500">Manage and logout from active devices</p>
            </div>
            <button onClick={() => setShowSessions(true)}
              className="text-sm text-tiffany-600 hover:text-tiffany-500">
              Manage
            </button>
          </div>
        </div>
      </div>

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
      {showSessions && <ActiveSessionsPanel onClose={() => setShowSessions(false)} />}
    </div>
  );
};

// ── Notification Settings Tab ─────────────────────────────────────────────────
const NotificationSettingsTab: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState<NotificationSettings>({
    events: true, reminders: true, updates: false, marketing: false
  });

  const Toggle = ({ id, checked, onChange, label, desc }: { id: string; checked: boolean; onChange: () => void; label: string; desc: string }) => (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <p className="text-xs text-gray-500">{desc}</p>
      </div>
      <button onClick={onChange} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-tiffany-600' : 'bg-gray-300'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>
      <div className="space-y-4">
        <Toggle id="events" checked={emailNotifications.events} onChange={() => setEmailNotifications(p => ({ ...p, events: !p.events }))} label="Event Updates" desc="Receive notifications about your events" />
        <Toggle id="reminders" checked={emailNotifications.reminders} onChange={() => setEmailNotifications(p => ({ ...p, reminders: !p.reminders }))} label="Reminders" desc="Get reminders for upcoming events" />
        <Toggle id="updates" checked={emailNotifications.updates} onChange={() => setEmailNotifications(p => ({ ...p, updates: !p.updates }))} label="Product Updates" desc="Stay updated with the latest features" />
        <Toggle id="marketing" checked={emailNotifications.marketing} onChange={() => setEmailNotifications(p => ({ ...p, marketing: !p.marketing }))} label="Marketing Emails" desc="Receive promotional emails from us" />
      </div>
    </div>
  );
};

// ── Billing Settings Tab ──────────────────────────────────────────────────────
const BillingSettings: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/mpesa/my-payments`, { headers: authHeaders() })
      .then(r => setPayments(r.data.data || []))
      .catch(() => {/* silently fail — endpoint may not exist yet */})
      .finally(() => setLoading(false));
  }, []);

  const statusColor = (s: string) =>
    s === 'completed' ? 'text-green-700 bg-green-100' :
    s === 'failed' ? 'text-red-700 bg-red-100' :
    'text-yellow-700 bg-yellow-100';

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Settings</h2>
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Payment Info</h3>
              <p className="text-sm text-gray-500">M-Pesa payments are processed via Safaricom STK Push</p>
            </div>
            <span className="text-sm text-tiffany-600 flex items-center">
              <CreditCard className="mr-1 h-4 w-4" /> M-Pesa
            </span>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Payment History (M-Pesa)</h3>
          {loading ? (
            <div className="flex justify-center py-4"><div className="animate-spin h-6 w-6 border-2 border-tiffany-600 border-t-transparent rounded-full" /></div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-gray-500 py-2">No payment history found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b">
                    <th className="text-left py-2 pr-4">Date</th>
                    <th className="text-left py-2 pr-4">Event</th>
                    <th className="text-left py-2 pr-4">Amount</th>
                    <th className="text-left py-2 pr-4">Phone</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((p: any) => (
                    <tr key={p._id}>
                      <td className="py-2 pr-4 text-gray-600">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="py-2 pr-4 font-medium">{p.eventId?.title || 'N/A'}</td>
                      <td className="py-2 pr-4">KES {p.amount?.toLocaleString()}</td>
                      <td className="py-2 pr-4 text-gray-600">{p.phoneNumber}</td>
                      <td className="py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subscription Plans */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Subscription Plan</h3>
          <div className="space-y-3">
            {[
              { id: 'free', name: 'Free Plan', price: '$0', period: 'forever', features: ['Basic features', '1 project', '1 user'], current: false },
              { id: 'pro', name: 'Pro Plan', price: '$19', period: 'monthly', features: ['All features', 'Unlimited projects', 'Up to 5 users', 'Priority support'], current: true },
              { id: 'enterprise', name: 'Enterprise', price: '$99', period: 'monthly', features: ['All features', 'Unlimited projects', 'Unlimited users', 'Dedicated support'], current: false },
            ].map(plan => (
              <div key={plan.id} className={`border rounded-lg p-4 ${plan.current ? 'border-tiffany-500 bg-tiffany-50' : 'border-gray-200 bg-white'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      {plan.name}
                      {plan.current && <span className="px-2 py-0.5 rounded-full text-xs bg-tiffany-100 text-tiffany-800">Current</span>}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1"><span className="font-medium text-gray-900">{plan.price}</span> {plan.period}</p>
                    <ul className="mt-2 space-y-1">
                      {plan.features.map(f => (
                        <li key={f} className="text-xs text-gray-500 flex items-center"><Zap className="h-3 w-3 text-tiffany-500 mr-1" />{f}</li>
                      ))}
                    </ul>
                  </div>
                  <button className={`px-3 py-1 text-sm font-medium rounded ${plan.current ? 'text-gray-600 border border-gray-300 hover:bg-gray-100' : 'text-tiffany-600 border border-tiffany-600 hover:bg-tiffany-50'}`}>
                    {plan.current ? 'Manage' : 'Upgrade'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Integrations Settings Tab ─────────────────────────────────────────────────
const IntegrationsSettings: React.FC = () => {
  const [integrations] = useState([
    { id: 'slack', name: 'Slack', connected: true },
    { id: 'github', name: 'GitHub', connected: true },
    { id: 'google', name: 'Google Calendar', connected: false },
    { id: 'dropbox', name: 'Dropbox', connected: false },
  ]);

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Integrations</h2>
      <p className="text-sm text-gray-500 mb-6">Connect your account with these services to enhance your workflow</p>
      <div className="space-y-4">
        {integrations.map(i => (
          <div key={i.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-gray-400" />
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">{i.name}</h3>
                <p className="text-xs text-gray-500">{i.connected ? 'Connected' : 'Not connected'}</p>
              </div>
            </div>
            <button className={`px-3 py-1 text-sm font-medium rounded ${i.connected ? 'text-red-600 border border-red-600 hover:bg-red-50' : 'text-tiffany-600 border border-tiffany-600 hover:bg-tiffany-50'}`}>
              {i.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
