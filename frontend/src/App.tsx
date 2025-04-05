import { Routes, Route, BrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import ErrorBoundary from './ErroBoundary';
import ProtectedRoute from './config/protectedroute';
import PublicRoute from './config/publicroute';
import LoadingSpinner from './config/loadingSpinner';
import RegistrationSuccessPage from './components/Event/eventsuccespage';
import CreateEventPage from './components/Event/createEvent';
import RequestDemoPage from './pages/requestdemo';
import PaymentSuccessPage from './components/Payment/success';
import PaymentFailurePage from './components/Payment/failed';
import CreatePaymentPage from './components/Payment/createpayment';
import CreateSessionPage from './components/Session/createsession';
import NotesListPage from './components/Note/noteslist';
import PendingPaymentPage from './components/Event/pendingpayment';
import ReportsPage from './components/rports';
import RoleProtectedRoute from './services/role.service';
import EventDetailsPage from './components/Event/eventsdetails';
import UpdateEventPage from './components/Event/updateEvent';
import { toast } from 'react-hot-toast';
// import LinkedInShareComponent from './components/Note/newlinkedin';

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

    if (error.response && error.response.status === 403) {
      toast.error('You do not have permission to access this resource.');
      window.location.href = '/dashboard';
    }
    if (error.response && error.response.status === 404) {
      toast.error('The requested resource was not found.');
      window.location.href = '/dashboard';
    }

    if (error.response && error.response.status === 500) {
      toast.error('An internal server error occurred. Please try again later.');
      window.location.href = '/dashboard';
    }
    if (error.response && error.response.status === 400) {
      toast.error('Bad request. Please check your input.');
      window.location.href = '/dashboard';
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
              path="/subscription/success"
              element={
                <motion.div {...pageTransition}>
                  <PaymentSuccessPage />
                </motion.div>
              }
            />

            <Route
              path="/subscription/cancel"
              element={
                <motion.div {...pageTransition}>
                  <PaymentFailurePage />
                </motion.div>
              }
            />


            <Route path="/dashboard/events/:eventId/pending-payment" element={<PendingPaymentPage />} />


            <Route
              path="/demo"
              element={
                <motion.div {...pageTransition}>
                  <RequestDemoPage  />
                </motion.div>
              }
            />

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

                <Route index element={<NotesListPage />} />
                <Route
                  path="events/:eventId/sessions/:sessionId"
                  element={<div>Session Details</div>}
                />

                <Route path="/dashboard/events/:eventId/edit " element={<UpdateEventPage />} />

                <Route element={<RoleProtectedRoute allowedRoles={['organizer']} />}>
                 <Route
                   path="/dashboard/reports"
                   element={
                     <motion.div {...pageTransition}>
                       <ReportsPage />
                     </motion.div>
                   }
                 />
               </Route>

                <Route path="/dashboard/notes/:noteId" element={<NotesPage />} />

                <Route
                  path="events/:eventId/sessions/:sessionId/edit"
                  element={<div>Edit Session</div>}
                />

                {/* <Route
                  path="linkedin"
                  element={<LinkedInShareComponent />}
                /> */}

                <Route
                  path="events"
                  element={
                    <motion.div {...pageTransition}>
                      <EventsPage />
                    </motion.div>
                  }
                />

                <Route path="payments" element={<CreatePaymentPage />}
                />

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
                <Route path="*" element={<NotFoundPage />} />
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
              {/*
              <Route path="events/:eventId/sessions/create" element={<CreateSession /      >} />
              <Route path="sessions/:sessionId" element={<SessionDetails />} />
              <Route path="sessions/:sessionId/edit" element={<EditSession />} /> */}

              <Route
                path="/dashboard/events/:eventId/sessions"
                element={<SessionsPage />}
              />

              <Route
                path="/dashboard/events/:eventId/success"
                element={<RegistrationSuccessPage />}
              />

              <Route
                path="/dashboard/events/:eventId/sessions/create"
                element={<CreateSessionPage />}
              />

              <Route
                path="/dashboard/events/create"
                element={<CreateEventPage />}
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
{/*
              <Route
                path="/dashboard/linkedin"
                element={<LinkedInShareComponent/>}
              /> */}
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
