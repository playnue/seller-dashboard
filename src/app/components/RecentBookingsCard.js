"use client"
import { useState, useEffect } from "react";
import { Calendar, Clock, Users, CreditCard, ChevronRight, ArrowRight } from "lucide-react";

export default function EnhancedBookingsList({ bookings = [] }) {
  const [topBookings, setTopBookings] = useState([]);

  useEffect(() => {
    // Sort bookings by date and time, most recent first
    const sortedBookings = [...bookings].sort((a, b) => {
      const dateA = new Date(`${a.slot.date} ${a.slot.start_at}`);
      const dateB = new Date(`${b.slot.date} ${b.slot.start_at}`);
      return dateB - dateA;
    });

    // Take only the top 3 bookings
    setTopBookings(sortedBookings.slice(0, 3));
  }, [bookings]);

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

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-0">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
          <span className="inline-block w-1 h-5 bg-blue-500 rounded mr-2"></span>
          Recent Bookings
        </h2>
        {/* <button className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors hover:gap-2">
          View all <ChevronRight className="w-4 h-4" />
        </button> */}
      </div>

      <div className="space-y-3">
        {topBookings.length > 0 ? (
          topBookings.map((booking) => {
            const paymentStatus = getPaymentStatusColor(booking.payment_type);
            return (
              <div 
                key={booking.id}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 px-3 sm:px-4 border-l-4 border-transparent hover:border-blue-500 bg-white hover:bg-blue-50/30 rounded-lg shadow-sm hover:shadow transition-all duration-200 group space-y-3 lg:space-y-0"
              >
                {/* Mobile Layout */}
                <div className="flex flex-col space-y-3 lg:hidden">
                  {/* Court Name and Venue */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                        {booking.court_name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {booking.venue_name}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all mt-1" />
                  </div>

                  {/* Date and Time Row */}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5 bg-gray-50 group-hover:bg-white px-2 py-1 rounded transition-colors">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium text-xs">{formatDate(booking.slot.date)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-gray-50 group-hover:bg-white px-2 py-1 rounded transition-colors">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-medium text-xs">{formatTime(booking.slot.start_at)} - {formatTime(booking.slot.end_at)}</span>
                    </div>
                  </div>

                  {/* User and Payment Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-colors">
                        <Users className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors truncate">
                        {booking.user?.displayName || 'Guest User'}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-gray-900 text-sm mb-1">
                        ₹{calculatePaymentAmount(booking).toLocaleString('en-IN')}
                      </div>
                      {booking.payment_type === 2 ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatus.bg} ${paymentStatus.text} border ${paymentStatus.border}`}>
                          <CreditCard className={`w-3 h-3 mr-1 ${paymentStatus.icon}`} />
                          Full Payment
                        </span>
                      ) : booking.payment_type === 1 ? (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatus.bg} ${paymentStatus.text} border ${paymentStatus.border}`}>
                          <CreditCard className={`w-3 h-3 mr-1 ${paymentStatus.icon}`} />
                          50% Advance
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatus.bg} ${paymentStatus.text} border ${paymentStatus.border}`}>
                          Pending
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Desktop Layout - Original Structure */}
                <div className="hidden lg:flex lg:items-center lg:justify-between lg:w-full">
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