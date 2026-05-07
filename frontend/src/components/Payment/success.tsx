import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const PaymentSuccessPage: React.FC = () => {
  const location = useLocation();
  const subscriptionDetails = location.state?.subscriptionDetails;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white shadow-xl rounded-xl p-10 text-center">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
        <h1 className="text-3xl font-extrabold text-gray-900">
          Payment Successful!
        </h1>

        {subscriptionDetails && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Subscription Details
            </h2>
            <p className="text-green-700">
              Plan: {subscriptionDetails.planType}
            </p>
            <p className="text-green-700">
              Price: ${subscriptionDetails.price}/month
            </p>
            <p className="text-green-700">
              Start Date: {new Date(subscriptionDetails.startDate).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="mt-8 space-y-4">
          <Link
            to="/dashboard/events"
            className="w-full inline-flex justify-center py-3 px-6
            border border-transparent rounded-md shadow-sm text-base
            font-medium text-white bg-tiffany-600 hover:bg-tiffany-700
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tiffany-500"
          >
            Go to Dashboard
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
          Thank you for your subscription! Enjoy your new features.
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
