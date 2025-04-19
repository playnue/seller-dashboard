// pages/dashboard.js
"use client"
import { useState, useEffect } from 'react';
import Sidebar from './components/sidebar';
import HomeContent from './components/HomeComtent';
import { useUserData } from '@nhost/nextjs';
import EnhancedBookingsList from './components/EnhancedBookingsList';
import VenueDetails from './components/VenueDetails';
import SellerOfflineBooking from './components/SellerOfflineBooking ';

export default function Dashboard() {
  const userData = useUserData();
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // Render the appropriate content based on activeTab
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <HomeContent />;
      case 'bookings':
        return loading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent align-[-0.125em]"></div>
            <p className="mt-2 text-gray-600">Loading bookings...</p>
          </div>
        ) : (
          <EnhancedBookingsList/>
        );
      case 'venue':
        return <VenueDetails/>;
      case 'offline':
        return <SellerOfflineBooking/>;
      case 'sessions':
        return <div className="p-6">Sessions content goes here</div>;
      case 'analytics':
        return <div className="p-6">Analytics content goes here</div>;
      case 'tags':
        return <div className="p-6">Tags content goes here</div>;
      default:
        return <HomeContent />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-teal-800">Hello {userData?.displayName}</h1>
          <div className="text-sm text-gray-500">Welcome back! Here's what's happening with your venues today.</div>
        </div>

        {/* Dashboard Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}