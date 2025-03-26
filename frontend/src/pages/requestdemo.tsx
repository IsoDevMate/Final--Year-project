import React, { useState } from 'react';
import {
  MapPin,
  Phone,
  Mail,
  Linkedin,
  Twitter,
  Facebook
} from 'lucide-react';

const RequestDemoPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Implement form submission logic
    console.log('Form submitted:', formData);
    alert('Thank you for your request. We will contact you soon!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="bg-indigo-700 text-white p-8 rounded-xl">
          <a href="/" className="text-3xl font-bold mb-6 hover:underline">Contact ComfyBase</a>
          <p className="text-indigo-100 mb-8">
            Ready to transform your event experience? Fill out the form, and our team will reach out to you shortly.
          </p>

          <div className="space-y-6">
            <div className="flex items-center">
              <MapPin className="h-6 w-6 mr-4" />
              <span>123 Tech Lane, San Francisco, CA 94105</span>
            </div>
            <div className="flex items-center">
              <Phone className="h-6 w-6 mr-4" />
              <span>+1 (415) 555-COMFY</span>
            </div>
            <div className="flex items-center">
              <Mail className="h-6 w-6 mr-4" />
              <span>support@comfybase.com</span>
            </div>
          </div>

          <div className="mt-12">
            <h3 className="text-xl font-semibold mb-4">Connect with Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-indigo-200">
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="#" className="text-white hover:text-indigo-200">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-white hover:text-indigo-200">
                <Facebook className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Request Demo Form */}
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Request a Demo</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="name"
                id="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Work Email</label>
              <input
                type="email"
                name="email"
                id="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                name="company"
                id="company"
                value={formData.company}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">How can we help you?</label>
              <textarea
                name="message"
                id="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Request Demo
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RequestDemoPage;
