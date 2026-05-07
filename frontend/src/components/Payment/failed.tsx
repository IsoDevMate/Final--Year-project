import React from 'react';
import { XCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const PaymentFailurePage: React.FC = () => {
  const location = useLocation();
  const errorMessage = location.state?.errorMessage || 'An unexpected error occurred during payment.';

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white shadow-xl rounded-xl p-10 text-center">
        <XCircle className="h-20 w-20 text-red-500 mx-auto" />
        <h1 className="text-3xl font-extrabold text-gray-900">
          Payment Failed
        </h1>

        <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">
            {errorMessage}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            to="/dashboard/payments"
            className="w-full inline-flex justify-center py-3 px-6
            border border-transparent rounded-md shadow-sm text-base
            font-medium text-white bg-red-600 hover:bg-red-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </Link>

          <Link
            to="/dashboard/subscriptions"
            className="w-full inline-flex justify-center py-3 px-6
            border border-gray-300 rounded-md shadow-sm text-base
            font-medium text-gray-700 bg-white hover:bg-gray-50
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tiffany-500"
          >
            View Subscriptions
          </Link>
        </div>

        <p className="mt-4 text-sm text-gray-600">
          If the problem persists, please contact our support team.
        </p>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
