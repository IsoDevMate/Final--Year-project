
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import LoginPage from './pages/auth/login';
import SignupPage from './pages/auth/signup';
// import ProtectedRoute from './protected';
// import { Profile } from './componnents/profile';
import Dashboard from './components/Dashboard';
import HomePage from './pages/home';
import axios from 'axios';

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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/signup" element={<SignupPage />} />
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
