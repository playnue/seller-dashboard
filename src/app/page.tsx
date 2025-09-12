// pages/dashboard.js
"use client";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./components/sidebar";
import HomeContent from "./components/HomeComtent";
import { useUserData } from "@nhost/nextjs";
import EnhancedBookingsList from "./components/EnhancedBookingsList";
import VenueDetails from "./components/VenueDetails";
import SellerOfflineBooking from "./components/SellerOfflineBooking ";
import Header from "./components/Header";
import { useVenue } from "./context/VenueContext";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const userData = useUserData();
  const { selectedVenue, venues, isLoading } = useVenue();
  const [activeTab, setActiveTab] = useState("overview");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (userData === null) {
      router.push("/login");
    }
  }, [userData, router]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading until venue is selected
  if (isLoading || !selectedVenue) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          setIsOpen={setSidebarOpen}
        />
        <div className="flex-1 overflow-auto lg:ml-0">
          {/* Mobile header with menu */}
          <div className="lg:hidden bg-white shadow-sm border-b p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <Menu size={20} className="text-gray-600 sm:w-6 sm:h-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-800">Dashboard</h1>
          </div>
          
          {/* Header - Always show on all screen sizes */}
          <Header />
          
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent align-[-0.125em]"></div>
              <p className="mt-2 text-gray-600">
                {isLoading ? "Loading venues..." : "Please select a venue"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <HomeContent venueId={selectedVenue.id} />;
      case "bookings":
        return loading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent align-[-0.125em]"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        ) : (
          <EnhancedBookingsList venueId={selectedVenue.id} />
        );
      case "venue":
        return <VenueDetails venueId={selectedVenue.id} />;
      case "offline":
        return selectedVenue ? (
          <SellerOfflineBooking venueId={selectedVenue.id} />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                No Venue Selected
              </h3>
              <p className="text-gray-600">
                Please select a venue from the header to manage offline
                bookings.
              </p>
            </div>
          </div>
        );
      case "sessions":
        return (
          <div className="p-6">Sessions content for {selectedVenue.title}</div>
        );
      case "analytics":
        return (
          <div className="p-6">Analytics content for {selectedVenue.title}</div>
        );
      case "tags":
        return (
          <div className="p-6">Tags content for {selectedVenue.title}</div>
        );
      default:
        return <HomeContent venueId={selectedVenue.id} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      
      {/* Main content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        {/* Mobile header with menu and page title */}
        <div className="lg:hidden bg-white shadow-sm border-b p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Menu size={20} className="text-gray-600 sm:w-6 sm:h-6" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
        </div>
        
        {/* Header - Always visible with responsive design */}
        <div className="bg-white">
          <Header />
        </div>
        
        {/* Content */}
        <div className="p-3 sm:p-4 lg:p-6">
          {renderContent()}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}