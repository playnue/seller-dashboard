"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import { useUserData, useAccessToken } from "@nhost/nextjs";
import EnhancedBookingsList from "../components/EnhancedBookingsList";
import VenueDetails from "../components/VenueDetails"
export default function Dashboard() {
  const user = useUserData();
  const accessToken = useAccessToken();
  const [activeTab, setActiveTab] = useState("venue");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings data

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 overflow-auto">
        <div className="bg-white p-6 shadow">
          <h1 className="text-2xl font-bold text-teal-800">
            Hello {user?.displayName}
          </h1>
          <div className="text-sm text-gray-500">
            Welcome back! Here's what's happening with your venues today.
          </div>
        </div>

        {/* Dashboard Content /}
        <div className="p-6">
          {/ Bookings Section */}
        <div className="mb-8">
          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent align-[-0.125em]"></div>
              <p className="mt-2 text-gray-600">Loading bookings...</p>
            </div>
          ) : (
            <VenueDetails />
          )}
        </div>
      </div>
    </div>
  );
}
