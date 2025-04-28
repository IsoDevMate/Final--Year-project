import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (phoneNumber: string) => void;
  amount: number;
  eventName: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  amount,
  eventName
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      setError('Phone number is required');
      return;
    }

    // Validate phone number format (assuming Kenyan format)
    const phoneRegex = /^(?:\+254|0)[0-9]{9}$/;
    if (!phoneRegex.test(phoneNumber)) {
      setError('Please enter a valid phone number in format: +254XXXXXXXXX or 0XXXXXXXXX');
      return;
    }

    onSubmit(phoneNumber);
  };

  return (
    <div className="fixed inset-0 bg-gray-300 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Complete Registration</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 mb-2">Event: <span className="font-medium">{eventName}</span></p>
          <p className="text-gray-700 mb-4">Amount: <span className="font-medium">KES {amount.toFixed(2)}</span></p>

          <p className="text-sm text-gray-600 mb-4">
            You will receive an M-Pesa prompt on your phone to complete the payment.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              M-Pesa Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => {
                setPhoneNumber(e.target.value);
                setError('');
              }}
              placeholder="254XXXXXXXXX"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Initiate Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
