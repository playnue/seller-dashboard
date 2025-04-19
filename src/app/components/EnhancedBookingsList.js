// components/EnhancedBookingsList.jsx
"use client"
import { useState, useEffect } from "react";
import { Calendar, Clock, Users, CreditCard, ChevronRight, ArrowRight } from "lucide-react";
import { useAccessToken } from "@nhost/nextjs";

export default function EnhancedBookingsList() {
  const [topBookings, setTopBookings] = useState([]);
  const accessToken = useAccessToken()
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (accessToken) {
      fetchTurfBookings();
    }
  }, [accessToken]);

  const fetchTurfBookings = async () => {
    try {
      const userId = getUserIdFromToken(accessToken);
      
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "X-Hasura-Role": "seller",
        },
        body: JSON.stringify({
          query: `
            query GetSellerBookings($userId: uuid!) {
              venues(where: { user_id: { _eq: $userId } }) {
                id
                title
                courts {
                  id
                  name
                  slots {
                    id
                    date
                    start_at
                    end_at
                    price
                    bookings {
                      id
                      created_at
                      payment_type
                      user_id
                      user {
                        id
                        displayName
                        email
                      }
                    }
                  }
                }
              }
            }
          `,
          variables: { userId },
        }),
      });
  
      const { data, errors } = await response.json();
      
      console.log("Raw booking data:", JSON.stringify(data, null, 2));
  
      if (errors) {
        console.error("GraphQL errors:", errors);
        setError("Failed to fetch bookings");
        return;
      }
  
      // Flatten the nested structure
      const allBookings =
        data?.venues.flatMap((venue) =>
          venue.courts.flatMap((court) =>
            court.slots.flatMap((slot) =>
              slot.bookings.map((booking) => ({
                ...booking,
                venue_name: venue.title,
                court_name: court.name,
                slot: {
                  date: slot.date,
                  start_at: slot.start_at,
                  end_at: slot.end_at,
                  price: slot.price,
                }
              }))
            )
          )
        ) || [];
  
      // Sort bookings by date and time
      const sortedBookings = allBookings.sort((a, b) => {
        const dateA = new Date(`${a.slot.date} ${a.slot.start_at}`);
        const dateB = new Date(`${b.slot.date} ${b.slot.start_at}`);
        return dateB - dateA;
      });
  
      // Take only the top 3 bookings
      setTopBookings(sortedBookings.slice(0, 3));
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Error fetching bookings");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to extract user ID from JWT token
  const getUserIdFromToken = (token) => {
    try {
      // Decode the JWT token (without verification)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
  
      const payload = JSON.parse(jsonPayload);
      return payload['https://hasura.io/jwt/claims']['x-hasura-user-id'];
    } catch (error) {
      console.error("Error extracting user ID from token:", error);
      return null;
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format time to 12-hour format
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Calculate payment amount based on payment type
  const calculatePaymentAmount = (booking) => {
    const price = parseFloat(booking.slot.price.replace(/[$,₹]/g, ""));
    return booking.payment_type === 1 ? price * 0.5 : price;
  };

  // Get payment status color
  const getPaymentStatusColor = (paymentType) => {
    switch (paymentType) {
      case 2:
        return { bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: "text-green-500" };
      case 1:
        return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "text-amber-500" };
      default:
        return { bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", icon: "text-gray-500" };
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="inline-block w-1 h-5 bg-blue-500 rounded mr-2"></span>
            Recent Bookings
          </h2>
        </div>
        <div className="text-center py-10 bg-white rounded-lg shadow-sm">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-500 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-2 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="inline-block w-1 h-5 bg-blue-500 rounded mr-2"></span>
            Recent Bookings
          </h2>
        </div>
        <div className="text-center text-red-500 py-10 bg-white rounded-lg shadow-sm border border-dashed border-red-200">
          <p className="font-medium">{error}</p>
          <button 
            onClick={() => {setIsLoading(true); fetchTurfBookings();}}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <span className="inline-block w-1 h-5 bg-blue-500 rounded mr-2"></span>
          Recent Bookings
        </h2>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors hover:gap-2">
          View all <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {topBookings.length > 0 ? (
          topBookings.map((booking) => {
            const paymentStatus = getPaymentStatusColor(booking.payment_type);
            return (
              <div 
                key={booking.id}
                className="flex items-center justify-between py-3 px-4 border-l-4 border-transparent hover:border-blue-500 bg-white hover:bg-blue-50/30 rounded-lg shadow-sm hover:shadow transition-all duration-200 group"
              >
                {/* Left Side - Court Info */}
                <div className="w-1/5">
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                      {booking.court_name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {booking.venue_name}
                    </p>
                  </div>
                </div>

                {/* Center - Date and Time */}
                <div className="flex items-center gap-5 text-sm text-gray-600 w-2/5">
                  <div className="flex items-center gap-1.5 bg-gray-50 group-hover:bg-white px-2 py-1 rounded transition-colors">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium">{formatDate(booking.slot.date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-gray-50 group-hover:bg-white px-2 py-1 rounded transition-colors">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-medium">{formatTime(booking.slot.start_at)} - {formatTime(booking.slot.end_at)}</span>
                  </div>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-2 w-1/5">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
                    <Users className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors truncate">
                    {booking.user?.displayName || 'Guest User'}
                  </span>
                </div>

                {/* Right Side - Payment Status */}
                <div className="flex items-center gap-3 w-1/5 justify-end">
                  <div className="text-right">
                    <div className="font-medium text-gray-900 text-sm">
                      ₹{calculatePaymentAmount(booking).toLocaleString('en-IN')}
                    </div>
                    <div>
                      {booking.payment_type === 2 ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.bg} ${paymentStatus.text} border ${paymentStatus.border}`}>
                          <CreditCard className={`w-3 h-3 mr-1 ${paymentStatus.icon}`} />
                          Full Payment
                        </span>
                      ) : booking.payment_type === 1 ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.bg} ${paymentStatus.text} border ${paymentStatus.border}`}>
                          <CreditCard className={`w-3 h-3 mr-1 ${paymentStatus.icon}`} />
                          50% Advance
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paymentStatus.bg} ${paymentStatus.text} border ${paymentStatus.border}`}>
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center text-gray-500 py-10 bg-white rounded-lg shadow-sm border border-dashed border-gray-200">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-medium">No recent bookings found</p>
            <p className="text-xs text-gray-400 mt-1">New bookings will appear here</p>
          </div>
        )}
      </div>
    </div>
  );
}