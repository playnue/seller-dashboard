// components/EnhancedBookingsList.jsx
"use client"
import { useState, useEffect } from "react";
import { Calendar, Clock, Users, CreditCard, Filter, X, FileSpreadsheet, MapPin, Phone, Mail } from "lucide-react";
import { useAccessToken } from "@nhost/nextjs";

export default function EnhancedBookingsList({venueId}) {
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const accessToken = useAccessToken()
  const [loading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [filteredCount, setFilteredCount] = useState(0);

  useEffect(() => {
    if (accessToken && venueId) {
      fetchTurfBookings();
    }
  }, [accessToken, venueId]);

  useEffect(() => {
    applyFilters();
  }, [allBookings, fromDate, toDate]);

  const applyFilters = () => {
    let filtered = [...allBookings];

    // Apply date filter if dates are selected
    if (fromDate || toDate) {
      filtered = allBookings.filter(booking => {
        const bookingDate = new Date(booking.slot.date);
        const from = fromDate ? new Date(fromDate) : null;
        const to = toDate ? new Date(toDate) : null;

        if (from && to) {
          return bookingDate >= from && bookingDate <= to;
        } else if (from) {
          return bookingDate >= from;
        } else if (to) {
          return bookingDate <= to;
        }
        return true;
      });
      setIsFilterActive(true);
    } else {
      setIsFilterActive(false);
    }

    setFilteredBookings(filtered);
    setFilteredCount(filtered.length);
  };

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
    setIsFilterActive(false);
  };

  // Function to download as Excel (requires xlsx library)
  const downloadExcel = async () => {
    const dataToDownload = isFilterActive ? filteredBookings : allBookings;
    
    if (dataToDownload.length === 0) {
      alert("No bookings to download");
      return;
    }

    try {
      // Dynamically import xlsx library
      const XLSX = await import('xlsx');
      
      // Prepare data for Excel
      const excelData = dataToDownload.map(booking => ({
        'Booking ID': booking.id,
        'Customer Name': booking.user?.displayName || 'Guest User',
        'Venue': booking.venue_name,
        'Court': booking.court_name,
        'Date': new Date(booking.slot.date).toLocaleDateString('en-IN'),
        'Time Slot': `${formatTime(booking.slot.start_at)} - ${formatTime(booking.slot.end_at)}`,
        'Payment Type': booking.payment_type === 2 ? "Full Payment" : booking.payment_type === 1 ? "50% Advance" : "Pending",
        'Amount (₹)': calculatePaymentAmount(booking),
      }));

      // Create workbook and worksheet
      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");

      // Generate filename
      const dateRange = fromDate && toDate ? `_${fromDate}_to_${toDate}` : '';
      const filename = `bookings${dateRange}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert("Excel download failed. Please install 'xlsx' package: npm install xlsx");
    }
  };

  const fetchTurfBookings = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "X-Hasura-Role": "seller",
        },
        body: JSON.stringify({
          query: `
            query GetSellerBookings($venueId: uuid!) {
              venues(where: { id: { _eq: $venueId } }) {
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
                        phoneNumber
                      }
                    }
                  }
                }
              }
            }
          `,
          variables: { venueId },
        }),
      });
  
      const { data, errors } = await response.json();
      
      if (errors) {
        console.error("GraphQL errors:", errors);
        setError("Failed to fetch bookings");
        return;
      }
  
      // Flatten the nested structure
      const bookings =
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
      const sortedBookings = bookings.sort((a, b) => {
        const dateA = new Date(`${a.slot.date} ${a.slot.start_at}`);
        const dateB = new Date(`${b.slot.date} ${b.slot.start_at}`);
        return dateB - dateA;
      });
  
      setAllBookings(sortedBookings);
      setFilteredBookings(sortedBookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      setError("Error fetching bookings");
    } finally {
      setIsLoading(false);
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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
    const price = parseFloat(booking.slot.price.toString().replace(/[$,₹]/g, ""));
    return booking.payment_type === 1 ? price * 0.5 : price;
  };

  // Get payment status badge
  const getPaymentBadge = (paymentType) => {
    switch (paymentType) {
      case 2:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Full Payment
          </span>
        );
      case 1:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            50% Advance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Pending
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            <div className="space-y-3">
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center text-red-500">
            <p className="font-medium mb-4">{error}</p>
            <button 
              onClick={() => {setIsLoading(true); fetchTurfBookings();}}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">Bookings</h2>
              {isFilterActive && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {filteredCount} results
                </span>
              )}
            </div>
            <button
              onClick={downloadExcel}
              className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
              title="Download as Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Excel
            </button>
          </div>

          {/* Filter Section */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="From"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="To"
              />
            </div>

            {isFilterActive && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Court & Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                    {/* Customer Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.user?.displayName || 'Guest User'}
                          </div>
                          {/* <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {booking.user?.email || 'N/A'}
                          </div>
                          {booking.user?.phoneNumber && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {booking.user.phoneNumber}
                            </div>
                          )} */}
                        </div>
                      </div>
                    </td>

                    {/* Court & Venue Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.court_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {booking.venue_name}
                        </div>
                      </div>
                    </td>

                    {/* Date & Time Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(booking.slot.date)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          {formatTime(booking.slot.start_at)} - {formatTime(booking.slot.end_at)}
                        </div>
                      </div>
                    </td>

                    {/* Payment Status Column */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPaymentBadge(booking.payment_type)}
                    </td>

                    {/* Amount Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{calculatePaymentAmount(booking).toLocaleString('en-IN')}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium text-lg">
                        {isFilterActive ? "No bookings found in selected date range" : "No bookings found"}
                      </p>
                      <p className="text-sm mt-1">
                        {isFilterActive ? "Try selecting a different date range" : "New bookings will appear here"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with summary */}
        {filteredBookings.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Showing {filteredBookings.length} booking{filteredBookings.length > 1 ? 's' : ''}
              </span>
              <span className="font-medium">
                Total Revenue: ₹{filteredBookings.reduce((sum, booking) => sum + calculatePaymentAmount(booking), 0).toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}