
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import LoginPage from './pages/auth/login';
import SignupPage from './pages/auth/signup';
// import ProtectedRoute from './protected';
// import { Profile } from './componnents/profile';
import Dashboard from './components/Common/Dashboard';
import DashboardLayout from './components/Common/Dashboardlayouts';
import HomePage from './pages/home';
import axios from 'axios';
import LinkedInCallback from './pages/auth/LinkediinCallback';

axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route path="events" element={<div>Events</div>} />
          <Route path="livestreams" element={<div>Livestreams</div>} />
          <Route path="attendees" element={<div>Attendees</div>} />
          <Route path="payments" element={<div>Payments</div>} />
          <Route path="settings" element={<div>Settings</div>} />
          <Route path="*" element={<div>404 Not Found</div>} />
        </Route>


        <Route path="/dashboard/events/:eventId" element={<div>Event Details</div>} />
        <Route path="/dashboard/livestreams/:livestreamId" element={<div>Livestream Details</div>} />
        <Route path="/dashboard/attendees/:attendeeId" element={<div>Attendee Details</div>} />
        <Route path="/dashboard/payments/:paymentId" element={<div>Payment Details</div>} />
        <Route path="/dashboard/settings/:settingId" element={<div>Settings Details</div>} />
        <Route path="/dashboard/notifications" element={<div>Notifications</div>} />
        <Route path="/dashboard/profile" element={<div>Profile</div>} />


        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
        <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />

        
        {/* <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} /> */}
        {/* <Route path="/auth/linkedin" element={<LinkedInLogin />} /> */}
        {/* <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} /> */}
      {/* <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/connect-linkedin" element={
          <ProtectedRoute requiresLinkedIn={true}>

        </ProtectedRoute>
      } /> */}
    </Routes>
    </BrowserRouter>
  );
};
