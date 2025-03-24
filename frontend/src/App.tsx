import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import ErrorBoundary from './ErroBoundary';
import ProtectedRoute from './config/protectedroute';
import PublicRoute from './config/publicroute';
import LoadingSpinner from './config/loadingSpinner';

const LoginPage = lazy(() => import('./pages/auth/login'));
const SignupPage = lazy(() => import('./pages/auth/signup'));
const DashboardLayout = lazy(() => import('./components/Common/Dashboardlayouts'));
const HomePage = lazy(() => import('./pages/home'));
const LinkedInCallback = lazy(() => import('./pages/auth/LinkediinCallback'));
const NotesPage = lazy(() => import('./components/Note/notes'));
const LogoutPage = lazy(() => import('./pages/auth/logout'));
const ResetPasswordPage = lazy(() => import('./pages/auth/resetpassword'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/forgotpassword'));
const ProfilePage = lazy(() => import('./pages/user/profile'));
const SettingsPage = lazy(() => import('./pages/user/settings'));
const EventsPage = lazy(() => import('./components/Event/events'));
const SessionsPage = lazy(() => import('./components/Session/session'));
const NotFoundPage = lazy(() => import('./config/notfound'));

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

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route
              path="/"
              element={
                <motion.div {...pageTransition}>
                  <HomePage />
                </motion.div>
              }
            />

            <Route element={<PublicRoute redirectPath="/dashboard" />}>
              <Route
                path="/auth/login"
                element={
                  <motion.div {...pageTransition}>
                    <LoginPage />
                  </motion.div>
                }
              />
              <Route
                path="/auth/signup"
                element={
                  <motion.div {...pageTransition}>
                    <SignupPage />
                  </motion.div>
                }
              />
              <Route
                path="/auth/reset-password"
                element={
                  <motion.div {...pageTransition}>
                    <ResetPasswordPage />
                  </motion.div>
                }
              />
              <Route
                path="/auth/forgot-password"
                element={
                  <motion.div {...pageTransition}>
                    <ForgotPasswordPage />
                  </motion.div>
                }
              />
            </Route>

            <Route
              path="/auth/linkedin/callback"
              element={
                <motion.div {...pageTransition}>
                  <LinkedInCallback />
                </motion.div>
              }
            />

            <Route element={<ProtectedRoute redirectPath="/auth/login" />}>
              <Route
                path="/dashboard"
                element={
                  <motion.div {...pageTransition}>
                    <DashboardLayout />
                  </motion.div>
                }
              >

                <Route index element={<div>Dashboard Home</div>} />
                <Route
                  path="events"
                  element={
                    <motion.div {...pageTransition}>
                      <EventsPage />
                    </motion.div>
                  }
                />
                <Route path="livestreams" element={<div>Livestreams</div>} />
                <Route
                  path="sessions"
                  element={
                    <motion.div {...pageTransition}>
                      <SessionsPage />
                    </motion.div>
                  }
                />
                <Route path="payments" element={<div>Payments</div>} />
                <Route
                  path="settings"
                  element={
                    <motion.div {...pageTransition}>
                      <SettingsPage />
                    </motion.div>
                  }
                />
                <Route
                  path="notes"
                  element={
                    <motion.div {...pageTransition}>
                      <NotesPage />
                    </motion.div>
                  }
                />
                <Route path="*" element={<div>404 Not Found</div>} />
                <Route
                  path="profile"
                  element={
                    <motion.div {...pageTransition}>
                      <ProfilePage />
                    </motion.div>
                  }
                />
              </Route>

               {/* Routes for event and session details */}
              {/* <Route path="events/:eventId/sessions" element={<SessionsPage />} /> */}
              {/* <Route path="events/:eventId" element={<EventDetails />} />
              <Route path="events/:eventId/sessions/create" element={<CreateSession /      >} />
              <Route path="sessions/:sessionId" element={<SessionDetails />} />
              <Route path="sessions/:sessionId/edit" element={<EditSession />} /> */}

              <Route
                path="/dashboard/events/:eventId/sessions"
                element={<SessionsPage />}
              />
              <Route
                path="/dashboard/livestreams/:livestreamId"
                element={<div>Livestream Details</div>}
              />
              <Route
                path="/dashboard/attendees/:attendeeId"
                element={<div>Attendee Details</div>}
              />
              <Route
                path="/dashboard/payments/:paymentId"
                element={<div>Payment Details</div>}
              />
              <Route
                path="/dashboard/settings/:settingId"
                element={<div>Settings Details</div>}
              />
              <Route
                path="/dashboard/notifications"
                element={<div>Notifications</div>}
              />
              <Route
                path="/dashboard/notes"
                element={
                  <motion.div {...pageTransition}>
                    <NotesPage />
                  </motion.div>
                }
              />
              <Route
                path="/dashboard/notes/:noteId"
                element={<div>Note Details</div>}
              />
              <Route
                path="/dashboard/profile"
                element={<div>Profile</div>}
              />
            </Route>

            <Route
              path="/auth/logout"
              element={
                <motion.div {...pageTransition}>
                  <LogoutPage />
                </motion.div>
              }
            />
            <Route path="*" element={
              <motion.div {...pageTransition}>
                <NotFoundPage />
              </motion.div>
            } />

          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};
