import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { CreditCard, Lock, CheckCircle, XCircle } from 'lucide-react';

// Types for subscription plans
enum SubscriptionPlan {
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

const CreatePaymentPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Subscription plan details
  const plans = [
    {
      type: SubscriptionPlan.BASIC,
      name: 'Basic Plan',
      price: 9.99,
      features: [
        'Livestreaming',
        'Up to 100 viewers',
        '60 minutes max duration',
      ]
    },
    {
      type: SubscriptionPlan.PREMIUM,
      name: 'Premium Plan',
      price: 19.99,
      features: [
        'Livestreaming',
        'Up to 500 viewers',
        '120 minutes max duration',
        'Analytics access'
      ]
    },
    {
      type: SubscriptionPlan.ENTERPRISE,
      name: 'Enterprise Plan',
      price: 49.99,
      features: [
        'Livestreaming',
        'Up to 2000 viewers',
        '240 minutes max duration',
        'Full analytics',
        'Priority support'
      ]
    }
  ];

  // Create checkout session
  const createCheckoutSession = async () => {
    if (!user) {
      toast.error('Please log in to proceed with subscription');
      navigate('/auth/login');
      return;
    }

    if (!selectedPlan) {
      toast.error('Please select a subscription plan');
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');

      const response = await axios.post(
        'https://final-year-project-77pa.onrender.com/api/v1/payments/checkout',
        {
          subscriptionPlan: selectedPlan,
          currency: 'usd'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Redirect to Stripe Checkout
      if (response.data.success) {
        const stripe = await loadStripe("pk_test_51PHRB206X2LgIaPORy5y9qsQyj1XwMFJGb6lAEIjJ1lohskzM3k0PWuORtRDXoRZf55gLDImqyPhdGXOoMmOnKJP00xC92Cajl"
);
        const { sessionId } = response.data.data
        console.log('Session ID:', sessionId);
        const result = await stripe?.redirectToCheckout({ sessionId });

        if (result?.error) {
          toast.error(result.error.message || 'Payment failed');
        }
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('An error occurred while processing your payment');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold text-center text-gray-900 mb-8">
          Choose Your Subscription Plan
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.type}
              onClick={() => setSelectedPlan(plan.type)}
              className={`
                border-2 rounded-xl p-6 cursor-pointer transition-all duration-300
                ${selectedPlan === plan.type
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                  : 'border-gray-200 hover:border-indigo-300'}
              `}
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">{plan.name}</h2>
              <p className="text-3xl font-extrabold text-indigo-600 mb-4">
                ${plan.price}<span className="text-sm text-gray-500">/month</span>
              </p>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <div className={`
                w-full py-3 text-center rounded-lg font-bold transition-colors
                ${selectedPlan === plan.type
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-600'}
              `}>
                {selectedPlan === plan.type ? 'Selected' : 'Select Plan'}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={createCheckoutSession}
            disabled={!selectedPlan || isLoading}
            className={`
              inline-flex items-center justify-center px-6 py-3
              border border-transparent text-base font-medium rounded-md
              text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              ${!selectedPlan || isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'}
            `}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5 mr-2" />
                Proceed to Checkout
              </>
            )}
          </button>
          <p className="mt-4 text-sm text-gray-600 flex items-center justify-center">
            <Lock className="h-4 w-4 mr-2" /> Secure checkout powered by Stripe
          </p>
        </div>
      </div>
    </div>
  );
};

export default CreatePaymentPage;
