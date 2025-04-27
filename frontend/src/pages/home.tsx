
import React, { Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import RequestDemoPage from './requestdemo';
import BrandCarousel from './carousel';
import { Calendar, Users, NotebookPen, Video, Award, ChevronRight, ShieldCheck,
         Sparkles, Linkedin, QrCode, CreditCard, Camera, BookOpen, Share2 } from 'lucide-react';
import ErrorBoundary from '../ErroBoundary';
import image from '../assets/Screenshot 2025-03-22 123120.png';
import image2 from '../assets/Screenshot 2025-03-22 130146.png';
// import axios from 'axios';
import chooseus from '../assets/ce.jpg'
import qr from '../assets/qr.jpg'
import linked from '../assets/linked.avif'
import dashboard from '../assets/ntes.png'

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-24">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    <p className="ml-3 text-indigo-600 font-medium">Loading...</p>
  </div>
);

// Feature Card Component with Icon
const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition duration-300">
    <div className="bg-indigo-100 rounded-full p-3 w-14 h-14 flex items-center justify-center mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

// Event Card Component
const EventCard = ({ title, date, location, imageUrl, categories }) => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300">
    <div className="h-48 bg-gray-200 relative">
      <img
        src={imageUrl || "/api/placeholder/400/300"}
        alt={title}
        className="w-full h-full object-cover"
      />
      <div className="absolute top-3 right-3 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded-full">
        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    </div>
    <div className="p-4">
      <div className="flex flex-wrap gap-2 mb-2">
        {categories.map((category, index) => (
          <span key={index} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
            {category}
          </span>
        ))}
      </div>
      <h3 className="text-lg font-bold mb-1">{title}</h3>
      <p className="text-gray-600 text-sm mb-2">{location}</p>
      <Link to={`/events/${title.toLowerCase().replace(/\s+/g, '-')}`} className="text-indigo-600 text-sm font-medium flex items-center">
        View Details <ChevronRight className="h-4 w-4 ml-1" />
      </Link>
    </div>
  </div>
);

// Session Card Component
const SessionCard = ({ title, speaker, time, day }) => (
  <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
    <div className="flex items-start">
      <div className="bg-indigo-100 text-indigo-700 font-bold rounded p-2 text-center mr-4 w-16">
        <div className="text-xs">{day}</div>
        <div className="text-sm">{time}</div>
      </div>
      <div>
        <h4 className="font-bold">{title}</h4>
        <p className="text-gray-600 text-sm">{speaker}</p>
      </div>
    </div>
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


const ShowcaseFeature = ({ title, description, image, reverse = false }) => (
  <div className={`flex flex-col ${reverse ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 py-12`}>
    <div className="md:w-1/2">
      <h3 className="text-2xl font-bold mb-4">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      <Link to="/features" className="text-indigo-600 font-medium flex items-center">
        Learn more <ChevronRight className="ml-1 h-5 w-5" />
      </Link>
    </div>
    <div className="md:w-1/2">
      <div className="bg-gray-100 p-4 rounded-xl shadow-lg w-3/4 mx-auto">
        <img src={image || "/api/placeholder/500/400"} alt={title} className="w-full rounded-lg" />
      </div>
    </div>
  </div>
);


const HomePage = () => {
   const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  //  const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://final-year-project-56d5.onrender.com';
  // Mock upcoming events data
  const upcomingEvents = [
    {
      title: "Tech Conference 2025",
      date: "2025-04-15",
      location: "San Francisco, CA",
      imageUrl: "/api/placeholder/400/300",
      categories: ["Technology", "Innovation"]
    },
    {
      title: "Marketing Summit",
      date: "2025-04-20",
      location: "New York, NY",
      imageUrl: "/api/placeholder/400/300",
      categories: ["Marketing", "Business"]
    },
    {
      title: "Design Workshop",
      date: "2025-05-05",
      location: "Chicago, IL",
      imageUrl: "/api/placeholder/400/300",
      categories: ["Design", "UX/UI"]
    }
  ];

  // const upcomingEvents = async () => {
  //   // Fetch upcoming events from the API or database
  //  const response = await axios.get(`${API_BASE_URL}/api/v1/events`);

  //   return response.data;
  // }
  // Mock featured sessions
  const featuredSessions = [
    {
      title: "Future of AI in Events",
      speaker: "Dr. Sarah Johnson",
      time: "10:00 AM",
      day: "Day 1"
    },
    {
      title: "Interactive Engagement Tools",
      speaker: "Michael Brown",
      time: "1:30 PM",
      day: "Day 1"
    },
    {
      title: "Networking in Virtual Events",
      speaker: "Emily Davis",
      time: "11:15 AM",
      day: "Day 2"
    }
  ];

  return (
    <ErrorBoundary>
      <div className="min-h-screen">
        {/* Enhanced Navigation with Dropdown */}
        <nav className="bg-white py-4 shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <div className="flex items-center">
              <div className="bg-indigo-700 rounded-full p-2 mr-2">
                <span className="text-white text-xl font-bold">C</span>
              </div>
              <span className="text-2xl font-bold text-indigo-700">comfybase</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <a href="#features" className="text-gray-600 hover:text-indigo-700">Features</a>
              <a href="#events" className="text-gray-600 hover:text-indigo-700">Events</a>
              <a href="#pricing" className="text-gray-600 hover:text-indigo-700">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-indigo-700">About</a>
              <a href="#testimonials" className="text-gray-600 hover:text-indigo-700">Testimonials</a>
            </div>
            <div className="flex items-center space-x-4">
                {!user && (
                <Link to="/auth/login" className="text-indigo-700 hover:text-indigo-800 font-medium">Sign In</Link>
                )}
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
                    src={image}
                    alt="Event dashboard preview"
                    className="rounded-lg shadow-lg"
                  />
                </div>
              </div>
            </div>
          </section>
        </Suspense>

        {/* Key Product Features Section */}
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
              {/* <FeatureCard
                icon={<Video className="h-6 w-6 text-indigo-600" />}
                title="Live Streaming"
                description="Access live streams of sessions, workshops and keynotes with real-time interaction capabilities for remote attendees."
              /> */}
              <FeatureCard
                icon={<QrCode className="h-6 w-6 text-indigo-600" />}
                title="QR Code Access"
                description="Seamless venue access and identity verification with just a scan - no more wristbands or physical tickets needed."
              />
              <FeatureCard
                icon={<Linkedin className="h-6 w-6 text-indigo-600" />}
                title="LinkedIn Integration"
                description="Share your event insights, notes, and networking connections directly to LinkedIn with one-click posting."
              />
              {/* <FeatureCard
                icon={<Camera className="h-6 w-6 text-indigo-600" />}
                title="Flashback Stories"
                description="Capture event moments that transform into personalized flashback memories in the days following your event."
              /> */}
              <FeatureCard
                icon={<BookOpen className="h-6 w-6 text-indigo-600" />}
                title="Multimedia Library"
                description="Access speaker materials, slides, and resources in your personal multimedia library during and after the event."
              />
            </div>
          </div>
        </section>

        {/* Upcoming Events Section */}
        <section id="events" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Discover Amazing Events</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Browse upcoming events and featured sessions powered by ComfyBase
              </p>
            </div>

            <div className="flex border-b border-gray-200 mb-8">
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'upcoming' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('upcoming')}
              >
                Upcoming Events
              </button>
              <button
                className={`py-2 px-4 font-medium ${activeTab === 'featured' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-500'}`}
                onClick={() => setActiveTab('featured')}
              >
                Featured Sessions
              </button>
            </div>

            {activeTab === 'upcoming' ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {upcomingEvents.map((event, idx) => (
                  <EventCard key={idx} {...event} />
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {featuredSessions.map((session, idx) => (
                  <SessionCard key={idx} {...session} />
                ))}
              </div>
            )}

            <div className="text-center mt-12">
              <Link to="/dashboard/events" className="bg-indigo-100 text-indigo-700 py-2 px-6 rounded-full font-medium hover:bg-indigo-200 inline-flex items-center">
                View All Events <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Showcases Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <ShowcaseFeature
              title="Seamless QR Code Authentication"
              description="No more long lines or security checks. ComfyBase's QR code system provides quick, secure access to venues, sessions, and exclusive areas. Attendees can enter with a simple scan while organizers get real-time attendance tracking."
              image={qr}
            />

            {/* <div className="border-t border-gray-200 my-16"></div>

            <ShowcaseFeature
              title="Live Streaming for Remote Attendees"
              description="Extend your event's reach globally with our premium live streaming feature. Remote attendees get an immersive experience with interactive Q&A, polling, and access to speaker materials - all synchronized with the live event."
              image=""
              reverse={true}
            /> */}

            {/* <div className="border-t border-gray-200 my-16"></div>

            <ShowcaseFeature
              title="Flashback Stories & Memories"
              description="Photos and moments captured during the event transform into personalized 'flashback stories' in the days following. These curated memories help extend engagement and reinforce connections made during your event."
              image="/"
            /> */}

            <div className="border-t border-gray-200 my-16"></div>

            <ShowcaseFeature
              title="Seamless LinkedIn Integration"
              description="Share insights, connect with other attendees, and post multimedia content directly to your LinkedIn profile with our one-click integration. Build your professional network while the event is still fresh."
              image={linked}
              reverse={true}
            />

            <div className="border-t border-gray-200 my-16"></div>

            <ShowcaseFeature
              title="Multimedia Note-Taking"
              description="Capture every insight with our powerful note-taking system. Record audio snippets, take photos of slides, attach files from speakers, and organize everything with tags and bookmarks for easy reference later."
              image={dashboard}
            />
          </div>
        </section>

        {/* Pricing Section with Live Streaming Tiers */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Choose Your Experience</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Select the package that works best for your event needs with our flexible pricing options.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <PricingCard
                title="Standard"
                price="50$"
                features={[
                  "Access to all sessions",
                  "Basic note-taking",
                  "QR code entry",
                  "Event networking",
                  "Notebook & stickers",
                  "Free coffee"
                ]}
              />
              <PricingCard
                title="Business"
                price="100$"
                features={[
                  "All Standard features",
                  "Multimedia note-taking",
                  "LinkedIn integration",
                  "Live session streaming",
                  "Priority access",
                  "Free coffee & meals",
                  "Premium seating"
                ]}
                highlighted={true}
              />
              <PricingCard
                title="Premium"
                price="150$"
                features={[
                  "All Business features",
                  "VIP networking events",
                  "Exclusive speaker access",
                  "Flashback memories premium",
                  "Front row seating",
                  "Extended on-demand access",
                  "Personal concierge"
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
                  identity confirmation, interactive note-taking, and live streaming, ComfyBase brings
                  a fresh, dynamic approach to events.
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
                  src={chooseus}
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

            <div className="grid md:grid-cols-3 gap-8">
              <Testimonial
                quote="ComfyBase transformed how our attendees engage with content. The multimedia note-taking feature is a game-changer!"
                name="Sarah Johnson"
                role="Conference Director"
              />
              <Testimonial
                quote="The seamless identity verification process made check-in a breeze. Our attendees loved it!"
                name="Michael Brown"
                role="Event Manager"
              />
              {/* <Testimonial
                quote="The live streaming feature allowed us to reach a wider audience. Highly recommend ComfyBase!"
                name="Emily Davis"
                role="Marketing Specialist"
              /> */}
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

            <div className="relative">
              <div className="flex overflow-x-auto space-x-6 pb-4">
          <BrandLogo name="TechCorp" />
          <BrandLogo name="InnovateCo" />
          <BrandLogo name="GlobalEvents" />
          <BrandLogo name="FutureConf" />
          <BrandLogo name="EduSummit" />
          <BrandLogo name="CreativeLabs" />
          <BrandLogo name="EventMasters" />
          <BrandLogo name="NextGen" />
              </div>
              <button className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md">
          <ChevronRight className="h-6 w-6 text-indigo-600 rotate-180" />
              </button>
              <button className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-white p-2 rounded-full shadow-md">
          <ChevronRight className="h-6 w-6 text-indigo-600" />
              </button>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="bg-indigo-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Event Experience?</h2>
            <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Join thousands of event organizers who are creating memorable, engaging experiences with ComfyBase.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/auth/signup" className="bg-white text-indigo-700 py-3 px-8 rounded-full font-medium hover:bg-gray-100">
                Get Started Free
              </Link>
              <Link to="/demo" className="bg-transparent border-2 border-white py-3 px-8 rounded-full font-medium hover:bg-white hover:text-indigo-700 transition-colors">
                Request Demo
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8 mb-8">
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-600 rounded-full p-2 mr-2">
                    <span className="text-white text-xl font-bold">C</span>
                  </div>
                  <span className="text-2xl font-bold">comfybase</span>
                </div>
                <p className="text-gray-400">
                  Transforming events with innovative technology for better engagement and seamless management.
                </p>
              </div>

              <div>
                <h4 className="text-lg font-bold mb-4">Features</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white">QR Authentication</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Live Streaming</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Multimedia Notes</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">LinkedIn Sharing</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Flashback Stories</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-bold mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white">About Us</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Contact</a></li>
                </ul>
              </div>

              <div>
                <h4 className="text-lg font-bold mb-4">Resources</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white">Support</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
              <p>© 2025 ComfyBase. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default HomePage;
