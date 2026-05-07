import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-sm p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-tiffany-100 rounded-full p-4">
            <AlertTriangle className="h-12 w-12 text-tiffany-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 bg-tiffany-600 text-white py-2 px-6 rounded-lg hover:bg-tiffany-700 transition duration-200"
          >
            <Home className="h-5 w-5" />
            <span>Go to Dashboard</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 border border-gray-300 bg-white text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-50 transition duration-200"
          >
            Go Back
          </button>
        </div>
      </div>

      <div className="mt-8 text-center">
        <div className="flex items-center justify-center mb-2">
          <div className="bg-white rounded-full p-1 mr-2">
            <span className="text-tiffany-700 text-md font-bold">C</span>
          </div>
          <span className="text-lg font-bold text-tiffany-700">eventbase</span>
        </div>
        <p className="text-gray-500 text-sm">
          Need help? Contact our support team.
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
