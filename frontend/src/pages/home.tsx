import React, { Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, NotebookPen, Video, Award, ChevronRight } from 'lucide-react';
import ErrorBoundary from '../ErroBoundary';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-24">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    <p className="ml-3 text-indigo-600 font-medium">Loading...</p>
  </div>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
    <div className="bg-indigo-100 rounded-full p-3 w-14 h-14 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

// Pricing Card Component
const PricingCard = ({
  title,
  price,
  features,
  highlighted = false
}: {
  title: string,
  price: string,
  features: string[],
  highlighted?: boolean
}) => (
  <div className={`${highlighted ? 'bg-indigo-900 text-white' : 'bg-gray-900 text-white'} p-8 rounded-xl ${highlighted ? 'border-2 border-indigo-500' : ''}`}>
    <h3 className="text-3xl mb-4">{title}</h3>
    {highlighted && <div className="text-xs font-semibold bg-indigo-600 text-white rounded-full px-2 py-1 mb-2 w-fit">POPULAR</div>}
    <p className="text-2xl font-bold mb-6">{price} <span className="text-sm font-normal">per two days</span></p>
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <span className="mr-2">•</span>
          {feature}
        </li>
      ))}
    </ul>
    <button className={`w-full mt-8 py-3 px-4 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${highlighted ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500' : 'bg-white text-gray-900 hover:bg-gray-100 focus:ring-white'}`}>
      Select Plan
    </button>
  </div>
);

// Testimonial Component
const Testimonial = ({ quote, name, role }: { quote: string, name: string, role: string }) => (
  <div className="bg-gray-50 p-6 rounded-xl">
    <p className="text-gray-700 mb-4 italic">"{quote}"</p>
    <div className="flex items-center">
      <div className="bg-indigo-100 rounded-full w-10 h-10 flex items-center justify-center mr-3">
        <span className="text-indigo-600 font-bold">{name.charAt(0)}</span>
      </div>
      <div>
        <p className="font-medium">{name}</p>
        <p className="text-sm text-gray-600">{role}</p>
      </div>
    </div>
  </div>
);

// Brand Logo Component
const BrandLogo = ({ name }: { name: string }) => (
  <div className="bg-gray-100 rounded-lg p-4 h-20 flex items-center justify-center">
    <span className="text-gray-500 font-medium">{name}</span>
  </div>
);

const HomePage = () => {
  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="bg-white py-4 shadow-sm">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-indigo-700 rounded-full p-2 mr-2">
                <span className="text-white text-xl font-bold">C</span>
              </div>
              <span className="text-2xl font-bold text-indigo-700">comfybase</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <a href="#features" className="text-gray-600 hover:text-indigo-700">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-indigo-700">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-indigo-700">About</a>
              <a href="#testimonials" className="text-gray-600 hover:text-indigo-700">Testimonials</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/auth/login" className="text-indigo-700 hover:text-indigo-800 font-medium">Sign In</Link>
              <Link to="/auth/signup" className="bg-indigo-600 text-white py-2 px-4 rounded-full hover:bg-indigo-700">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <Suspense fallback={<LoadingSpinner />}>
          <section className="bg-gradient-to-b from-indigo-700 to-indigo-400 text-white py-20">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  Transform Your Event Experience
                </h1>
                <p className="text-xl mb-8 text-indigo-100">
                  ComfyBase helps attendees engage better and organizers manage smarter with interactive tools, multimedia notes, and seamless identity verification.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link to="/auth/signup" className="bg-white text-indigo-700 py-3 px-6 rounded-full font-medium hover:bg-gray-100 text-center">
                    Create Your Event
                  </Link>
                  <a href="#features" className="bg-transparent border-2 border-white py-3 px-6 rounded-full font-medium hover:bg-white hover:text-indigo-700 transition-colors flex items-center justify-center">
                    Learn More <ChevronRight className="ml-2 h-5 w-5" />
                  </a>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-indigo-800 p-6 rounded-xl shadow-xl">
                  <img
                    src="/api/placeholder/600/400"
                    alt="Event dashboard preview"
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </section>
        </Suspense>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Everything You Need For Successful Events</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                ComfyBase offers a comprehensive suite of tools designed to enhance attendee engagement
                and streamline event management from start to finish.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<NotebookPen className="h-6 w-6 text-indigo-600" />}
                title="Interactive Notes"
                description="Take multimedia-enhanced notes during sessions and attach images, audio clips, and sticky notes for better information retention."
              />
              <FeatureCard
                icon={<Calendar className="h-6 w-6 text-indigo-600" />}
                title="Session Management"
                description="Easily navigate event schedules, find session information, and receive timely reminders for your registered events."
              />
              <FeatureCard
                icon={<Video className="h-6 w-6 text-indigo-600" />}
                title="Live Streaming"
                description="Access live streams of sessions, workshops and keynotes with real-time interaction capabilities."
              />
              <FeatureCard
                icon={<Users className="h-6 w-6 text-indigo-600" />}
                title="Seamless Identity Verification"
                description="QR code-based identity confirmation for quick and secure access to event venues and sessions."
              />
              <FeatureCard
                icon={<Award className="h-6 w-6 text-indigo-600" />}
                title="Engagement Rewards"
                description="Gamify the experience with rewards for participation, note-taking, and active engagement with speakers."
              />
              <FeatureCard
                icon={<ChevronRight className="h-6 w-6 text-indigo-600" />}
                title="Cross-Platform Sharing"
                description="Share your event notes, media, and experiences across multiple platforms with just a few clicks."
              />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Choose Your Ticket</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select the ticket type that works best for your event needs with our flexible pricing options.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <PricingCard
                title="Standard"
                price="50$"
                features={[
                  "Access to all the lectures",
                  "Notebook, pen & stickers",
                  "Free coffee"
                ]}
              />
              <PricingCard
                title="Business"
                price="100$"
                features={[
                  "Access to all the lectures",
                  "Notebook, pen & stickers",
                  "Free coffee & food",
                  "No queue entrance"
                ]}
                highlighted={true}
              />
              <PricingCard
                title="Premium"
                price="150$"
                features={[
                  "Access to all the lectures",
                  "Notebook, pen & stickers",
                  "Free coffee & food",
                  "No queue entrance",
                  "First line seats in front of the stage"
                ]}
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center">
              <div className="md:w-1/2 mb-10 md:mb-0">
                <h2 className="text-3xl font-bold mb-6">Why ComfyBase?</h2>
                <p className="text-gray-600 mb-6">
                  ComfyBase is not just another event app; it's a solution crafted to transform the
                  attendee experience from start to finish. By enabling real-time interactions, QR code-based
                  identity confirmation, interactive note-taking, and even live streaming for certain users,
                  ComfyBase brings a fresh, dynamic approach to events.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="bg-indigo-100 rounded-full p-1 mr-3 mt-1">
                      <ChevronRight className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-gray-600">
                      <span className="font-medium">For Attendees:</span> Enhanced engagement, better information retention, and a more valuable event experience.
                    </p>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-indigo-100 rounded-full p-1 mr-3 mt-1">
                      <ChevronRight className="h-4 w-4 text-indigo-600" />
                    </div>
                    <p className="text-gray-600">
                      <span className="font-medium">For Organizers:</span> Real-time feedback, streamlined management, and comprehensive data reporting.
                    </p>
                  </div>
                </div>
              </div>
              <div className="md:w-1/2 md:pl-10">
                <img
                  src="/api/placeholder/500/400"
                  alt="ComfyBase in action"
                  className="rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">What People Say</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Don't just take our word for it - hear from event organizers and attendees who have experienced ComfyBase.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Testimonial
                quote="ComfyBase transformed how our attendees engage with content. The multimedia note-taking feature is a game-changer!"
                name="Sarah Johnson"
                role="Conference Director"
                          />

                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
                          <Testimonial
                            quote="The seamless identity verification process made check-in a breeze. Our attendees loved it!"
                            name="Michael Brown"
                              role="Event Manager"
                          />
                            <Testimonial
                                quote="The live streaming feature allowed us to reach a wider audience. Highly recommend ComfyBase!"
                                name="Emily Davis"
                              role="Marketing Specialist"
                          />
                      </div>
                  </div>
              </section>
              {/* Brand Logos Section */}
                <section className="py-20 bg-gray-50">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Trusted by Leading Brands</h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                ComfyBase is trusted by top brands and organizations for their event management needs.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            <BrandLogo name="Brand 1" />
                            <BrandLogo name="Brand 2" />
                            <BrandLogo name="Brand 3" />
                        </div>
                  </div>
              </section>
          </div>
          {/* Footer */}
            <footer className="bg-gray-900 text-white py-6">
                <div className="container mx-auto px-4 text-center">
                <p className="text-sm">© 2023 ComfyBase. All rights reserved.</p>
              </div>
            </footer>
        </ErrorBoundary>
    );
}
export default HomePage;



