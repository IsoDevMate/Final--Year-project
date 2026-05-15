import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Shield, Mail, CreditCard, Globe, Key, Lock, ExternalLink, Zap } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = 'https://final-year-project-jy2j.onrender.com/api/v1';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

type TabType = 'account' | 'security' | 'notifications' | 'billing' | 'integrations';

interface NotificationSettings {
  events: boolean;
  reminders: boolean;
  updates: boolean;
  marketing: boolean;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  features: string[];
  current: boolean;
}

const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('account');
  const navigate = useNavigate();

  const renderContent = () => {
    switch (activeTab) {
      case 'account': return <AccountSettings navigate={navigate} />;
      case 'security': return <SecuritySettings />;
      case 'notifications': return <NotificationSettingsTab />;
      case 'billing': return <BillingSettings />;
      case 'integrations': return <IntegrationsSettings />;
      default: return <AccountSettings navigate={navigate} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-gray-50 p-4 border-r border-gray-200">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('account')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'account'
                    ? 'bg-tiffany-50 text-tiffany-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Mail className="mr-3 h-5 w-5" />
                Account
              </button>

               <button
                onClick={() => setActiveTab('security')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'security'
                    ? 'bg-tiffany-50 text-tiffany-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Shield className="mr-3 h-5 w-5" />
                Security
              </button>

               <button
                onClick={() => setActiveTab('notifications')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'notifications'
                    ? 'bg-tiffany-50 text-tiffany-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Bell className="mr-3 h-5 w-5" />
                Notifications
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'billing'
                    ? 'bg-tiffany-50 text-tiffany-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <CreditCard className="mr-3 h-5 w-5" />
                Billing
              </button>

              <button
                onClick={() => setActiveTab('integrations')}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md w-full text-left ${
                  activeTab === 'integrations'
                    ? 'bg-tiffany-50 text-tiffany-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Globe className="mr-3 h-5 w-5" />
                Integrations
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Account Settings Tab
const AccountSettings: React.FC<{ navigate: (path: string) => void }> = ({ navigate }) => {
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeactivate = async () => {
    if (!confirm('Deactivate your account? You can reactivate it by logging in again.')) return;
    setDeactivating(true);
    try {
      await axios.post(`${API}/auth/deactivate`, {}, { headers: authHeaders() });
      toast.success('Account deactivated');
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

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Email Preferences</h3>
              <p className="text-sm text-gray-500">Manage the emails you receive from us</p>
            </div>
            <button className="text-sm text-tiffany-600 hover:text-tiffany-500">Manage</button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Deactivate Account</h3>
              <p className="text-sm text-gray-500">Temporarily disable your account. You can reactivate it later.</p>
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

// Security Settings Tab
const SecuritySettings: React.FC = () => {
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
            <button className="text-sm text-tiffany-600 hover:text-tiffany-500 flex items-center">
              <Key className="mr-1 h-4 w-4" />
              Change
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
              <Lock className="mr-1 h-4 w-4" />
              Enable
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Active Sessions</h3>
              <p className="text-sm text-gray-500">Manage and logout from active devices</p>
            </div>
            <button className="text-sm text-tiffany-600 hover:text-tiffany-500">
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Settings Tab
const NotificationSettingsTab: React.FC = () => {
  const [emailNotifications, setEmailNotifications] = useState<NotificationSettings>({
    events: true,
    reminders: true,
    updates: false,
    marketing: false
  });

  const handleToggle = (key: keyof NotificationSettings) => {
    setEmailNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Notification Settings</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Email Notifications</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Event Updates</p>
                <p className="text-xs text-gray-500">Receive notifications about your events</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  name="event-toggle"
                  id="event-toggle"
                  checked={emailNotifications.events}
                  onChange={() => handleToggle('events')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="event-toggle"
                  className={`toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${emailNotifications.events ? 'bg-tiffany-600' : ''}`}
                ></label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Reminders</p>
                <p className="text-xs text-gray-500">Get reminders for upcoming events</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  name="reminder-toggle"
                  id="reminder-toggle"
                  checked={emailNotifications.reminders}
                  onChange={() => handleToggle('reminders')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="reminder-toggle"
                  className={`toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${emailNotifications.reminders ? 'bg-tiffany-600' : ''}`}
                ></label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Product Updates</p>
                <p className="text-xs text-gray-500">Stay updated with the latest features</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  name="update-toggle"
                  id="update-toggle"
                  checked={emailNotifications.updates}
                  onChange={() => handleToggle('updates')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="update-toggle"
                  className={`toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${emailNotifications.updates ? 'bg-tiffany-600' : ''}`}
                ></label>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">Marketing Emails</p>
                <p className="text-xs text-gray-500">Receive promotional emails from us</p>
              </div>
              <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input
                  type="checkbox"
                  name="marketing-toggle"
                  id="marketing-toggle"
                  checked={emailNotifications.marketing}
                  onChange={() => handleToggle('marketing')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label
                  htmlFor="marketing-toggle"
                  className={`toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer ${emailNotifications.marketing ? 'bg-tiffany-600' : ''}`}
                ></label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};



// Billing Settings Tab
const BillingSettings: React.FC = () => {
  const [plans] = useState<SubscriptionPlan[]>([
    {
      id: 'free',
      name: 'Free Plan',
      price: '$0',
      period: 'forever',
      features: ['Basic features', '1 project', '1 user'],
      current: false
    },
    {
      id: 'pro',
      name: 'Pro Plan',
      price: '$19',
      period: 'monthly',
      features: ['All features', 'Unlimited projects', 'Up to 5 users', 'Priority support'],
      current: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: '$99',
      period: 'monthly',
      features: ['All features', 'Unlimited projects', 'Unlimited users', 'Dedicated support', 'Custom integrations'],
      current: false
    }
  ]);

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Settings</h2>

      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Payment Info</h3>
              <p className="text-sm text-gray-500">check your payment method for billing</p>
            </div>
            <Link
              to="/dashboard/payments"
              className="text-sm text-tiffany-600 hover:text-tiffany-500 flex items-center"
            >
              <CreditCard className="mr-1 h-4 w-4" />
              Check
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Billing History</h3>
              <p className="text-sm text-gray-500">View your past invoices and transactions</p>
            </div>
            <Link
              to="/dashboard/billing/history"
              className="text-sm text-tiffany-600 hover:text-tiffany-500 flex items-center"
            >
              <ExternalLink className="mr-1 h-4 w-4" />
              View
            </Link>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex flex-col">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900">Subscription Plan</h3>
              <p className="text-sm text-gray-500">Manage your subscription plan</p>
            </div>

            <div className="space-y-4">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`border rounded-lg p-4 ${plan.current ? 'border-tiffany-500 bg-tiffany-50' : 'border-gray-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 flex items-center">
                        {plan.name}
                        {plan.current && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-tiffany-100 text-tiffany-800">
                            Current
                          </span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium text-gray-900">{plan.price}</span>
                        <span className="ml-1">{plan.period}</span>
                      </p>
                      <ul className="mt-2 space-y-1">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="text-xs text-gray-500 flex items-center">
                            <Zap className="h-3 w-3 text-tiffany-500 mr-1" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {!plan.current ? (
                      <button className="px-3 py-1 text-sm font-medium text-tiffany-600 border border-tiffany-600 rounded hover:bg-tiffany-50">
                        Upgrade
                      </button>
                    ) : (
                      <button className="px-3 py-1 text-sm font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-100">
                        Manage
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Integrations Settings Tab
const IntegrationsSettings: React.FC = () => {
  const [integrations] = useState([
    { id: 'slack', name: 'Slack', connected: true, icon: <Globe className="h-8 w-8 text-gray-400" /> },
    { id: 'github', name: 'GitHub', connected: true, icon: <Globe className="h-8 w-8 text-gray-400" /> },
    { id: 'google', name: 'Google Calendar', connected: false, icon: <Globe className="h-8 w-8 text-gray-400" /> },
    { id: 'dropbox', name: 'Dropbox', connected: false, icon: <Globe className="h-8 w-8 text-gray-400" /> }
  ]);

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Integrations</h2>

      <p className="text-sm text-gray-500 mb-6">
        Connect your account with these services to enhance your workflow
      </p>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <div key={integration.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              {integration.icon}
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-900">{integration.name}</h3>
                <p className="text-xs text-gray-500">
                  {integration.connected ? 'Connected' : 'Not connected'}
                </p>
              </div>
            </div>
            <button
              className={`px-3 py-1 text-sm font-medium rounded ${
                integration.connected
                  ? 'text-red-600 border border-red-600 hover:bg-red-50'
                  : 'text-tiffany-600 border border-tiffany-600 hover:bg-tiffany-50'
              }`}
            >
              {integration.connected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
