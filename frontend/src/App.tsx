import { Routes, Route, BrowserRouter, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/login';
import SignupPage from './pages/auth/signup';
import DashboardLayout from './components/Common/Dashboardlayouts';
import HomePage from './pages/home';
import axios from 'axios';
import LinkedInCallback from './pages/auth/LinkediinCallback';
import { NotesPage } from './components/Note/notes';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './config/protectedroute';
import PublicRoute from './config/publicroute';
import LogoutPage from './pages/auth/logout';


axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public home page - accessible to all */}
          <Route path="/" element={<HomePage />} />

          {/* Auth routes - redirect to dashboard if already logged in */}
          <Route element={<PublicRoute redirectPath="/dashboard" />}>
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
          </Route>

          {/* Auth callback route - special case, not protected */}
          <Route path="/auth/linkedin/callback" element={<LinkedInCallback />} />

          {/* Protected dashboard routes - require authentication */}
          <Route element={<ProtectedRoute redirectPath="/auth/login" />}>
            {/* Dashboard layout with nested routes */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<div>Dashboard Home</div>} />
              <Route path="events" element={<div>Events</div>} />
              <Route path="livestreams" element={<div>Livestreams</div>} />
              <Route path="attendees" element={<div>Attendees</div>} />
              <Route path="payments" element={<div>Payments</div>} />
              <Route path="settings" element={<div>Settings</div>} />
              <Route path="*" element={<div>404 Not Found</div>} />
            </Route>

            {/* Other protected routes outside the dashboard layout */}
            <Route path="/dashboard/events/:eventId" element={<div>Event Details</div>} />
            <Route path="/dashboard/livestreams/:livestreamId" element={<div>Livestream Details</div>} />
            <Route path="/dashboard/attendees/:attendeeId" element={<div>Attendee Details</div>} />
            <Route path="/dashboard/payments/:paymentId" element={<div>Payment Details</div>} />
            <Route path="/dashboard/settings/:settingId" element={<div>Settings Details</div>} />
            <Route path="/dashboard/notifications" element={<div>Notifications</div>} />
            <Route path="/dashboard/notes" element={<NotesPage />} />
            <Route path="/dashboard/notes/:noteId" element={<div>Note Details</div>} />
            <Route path="/dashboard/profile" element={<div>Profile</div>} />
          </Route>

          {/* Logout route with automatic redirection */}
          <Route path="/auth/logout" element={<LogoutPage />} />
          {/* Catch-all route for 404 */}
          <Route path="*" element={<div>404 Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
