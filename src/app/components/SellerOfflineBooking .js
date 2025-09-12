"use client";
import React, { useState, useEffect } from "react";
import { useAccessToken, useUserData } from "@nhost/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Clock,
  X,
  User,
  Phone,
  DollarSign,
  CreditCard,
  Building,
  MapPin,
  Loader2,
} from "lucide-react";

const SellerOfflineBooking = ({ venueId }) => {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(venueId || null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [courts, setCourts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const accessToken = useAccessToken();
  const user = useUserData();
  const userId = user?.id;

  // Modal and form states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    customerName: "",
    customerPhone: "",
    amount: "",
    bookingSource: "offline", // offline, playo, other
    notes: "",
    paymentReceived: true,
  });

  // Early return if essential data is missing
  if (!userId || !accessToken) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-center">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
          <p className="mt-2 text-gray-600">Loading user data...</p>
        </div>
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date) => {
    const localDate = new Date(date.setHours(0, 0, 0, 0));
    setSelectedDate(localDate);
  };

  // Fetch venues function (same as before)
  const fetchVenues = async () => {
    if (!userId) {
      console.warn("fetchVenues called without userId");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetVenues($userId: uuid!) {
              venues(where: { user_id: { _eq: $userId } }) {
                id
                title
                user_id
              }
            }
          `,
          variables: {
            userId,
          },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        throw new Error("Failed to fetch venues");
      }

      const sellerVenues = data.data.venues;
      setVenues(sellerVenues);

      if (venueId && sellerVenues.find((v) => v.id === venueId)) {
        setSelectedVenue(venueId);
        await fetchCourts(venueId);
      } else if (sellerVenues.length > 0) {
        setSelectedVenue(sellerVenues[0].id);
        await fetchCourts(sellerVenues[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching venues:", error);
      setLoading(false);
    }
  };

  // Fetch courts function (same as before)
  const fetchCourts = async (targetVenueId) => {
    if (!targetVenueId) {
      console.warn("fetchCourts called without venueId");
      setCourts([]);
      return;
    }

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetCourts($venueId: uuid!) {
              courts(where: { venue_id: { _eq: $venueId } }) {
                id
                name
              }
            }
          `,
          variables: {
            venueId: targetVenueId,
          },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        throw new Error("Failed to fetch courts");
      }

      setCourts(data.data.courts);

      if (data.data.courts.length > 0) {
        setSelectedCourt(data.data.courts[0].id);
      } else {
        setSelectedCourt(null);
      }
    } catch (error) {
      console.error("Error fetching courts:", error);
      setCourts([]);
    }
  };

  // Enhanced fetch slots to include booking information
  const fetchSlots = async (courtId, date) => {
    if (!courtId || !date) {
      console.warn("fetchSlots called without required parameters", {
        courtId,
        date,
      });
      setSlots([]);
      return;
    }

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetSlots($courtId: uuid!, $date: date!) {
              slots(where: { court_id: { _eq: $courtId }, date: { _eq: $date } }) {
                id
                start_at
                end_at
                price
                booked
                date
                bookings {
                  id
                  user {
                    displayName
                    phoneNumber
                  }
                  
                }
              }
            }
          `,
          variables: {
            courtId,
            date: formatDate(date),
          },
        }),
      });

      const data = await response.json();
      if (data.errors) {
        console.error("GraphQL errors:", data.errors);
        throw new Error("Failed to fetch slots");
      }

      setSlots(data.data.slots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setSlots([]);
    }
  };

  const handleOfflineBooking = (slot) => {
    setSelectedSlot(slot);
    setBookingForm({
      ...bookingForm,
      amount: slot.price.toString().replace(/[^0-9]/g, ""),
    });
    setShowBookingModal(true);
  };

  const handleFormChange = (field, value) => {
    setBookingForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!bookingForm.customerName.trim()) {
      alert("Please enter customer name");
      return false;
    }
    if (
      !bookingForm.customerPhone.trim() ||
      bookingForm.customerPhone.length < 10
    ) {
      alert("Please enter valid phone number");
      return false;
    }
    if (!bookingForm.amount || parseFloat(bookingForm.amount) <= 0) {
      alert("Please enter valid amount");
      return false;
    }
    return true;
  };

  const handleSubmitBooking = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Update this URL to point to your Nhost function
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_FUNCTIONS}/razorpay/offline-booking`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            slot_id: selectedSlot.id,
            customer_name: bookingForm.customerName,
            customer_phone: bookingForm.customerPhone,
            amount: parseFloat(bookingForm.amount),
            booking_source: bookingForm.bookingSource,
            notes: bookingForm.notes,
            payment_received: bookingForm.paymentReceived,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        // Success handling
        alert("Booking created successfully!");
        setShowBookingModal(false);
        setBookingForm({
          customerName: "",
          customerPhone: "",
          amount: "",
          bookingSource: "offline",
          notes: "",
          paymentReceived: true,
        });
        // Refresh slots to show updated booking status
        fetchSlots(selectedCourt, selectedDate);
      } else {
        throw new Error(data.message || "Failed to create booking");
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert(`Failed to create booking: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeRange = (startTime, endTime) => {
    const formatTime = (time) => {
      const [hours, minutes] = time.split(":");
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  const handleVenueChange = (newVenueId) => {
    setSelectedVenue(newVenueId);
    setSelectedCourt(null);
    setSlots([]);
    if (newVenueId) {
      fetchCourts(newVenueId);
    }
  };

  const handleCourtChange = (courtId) => {
    setSelectedCourt(courtId);
    setSlots([]);
    if (courtId && selectedDate) {
      fetchSlots(courtId, selectedDate);
    }
  };

  // UseEffects (same as before)
  useEffect(() => {
    if (userId && accessToken) {
      fetchVenues();
    }
  }, [userId, accessToken]);

  useEffect(() => {
    if (venueId && venueId !== selectedVenue) {
      setSelectedVenue(venueId);
      fetchCourts(venueId);
    }
  }, [venueId]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchSlots(selectedCourt, selectedDate);
    }
  }, [selectedCourt, selectedDate]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
      </div>
    );
  }

  const currentVenue = venues.find((venue) => venue.id === selectedVenue);
  const currentVenueName = currentVenue ? currentVenue.title : "";
  const currentCourt = courts.find((court) => court.id === selectedCourt);
  const currentCourtName = currentCourt ? currentCourt.name : "";

  return (
    <div className="space-y-6 px-2 sm:px-0">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Building className="h-5 w-5" />
            Offline Booking Management
          </CardTitle>
          <p className="text-sm text-gray-600">
            Mark slots as booked for offline or external platform bookings
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Venue Selection */}
          {venues.length > 0 ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Venue
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {venues.map((venue) => (
                  <button
                    key={venue.id}
                    onClick={() => handleVenueChange(venue.id)}
                    className={`px-4 py-2 rounded-md text-sm transition-all text-left ${
                      selectedVenue === venue.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {venue.title}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center p-4 bg-yellow-50 rounded-md text-yellow-700">
              You don't have any venues registered. Please create a venue first.
            </div>
          )}

          {/* Court Selection */}
          {selectedVenue && courts.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Select Court
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {courts.map((court) => (
                  <button
                    key={court.id}
                    onClick={() => handleCourtChange(court.id)}
                    className={`px-4 py-2 rounded-md text-sm transition-all text-left ${
                      selectedCourt === court.id
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {court.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar and Slots */}
          {selectedCourt && (
            <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6">
              {/* Calendar Section */}
              <div className="order-2 lg:order-1">
                <h3 className="text-md font-medium mb-2">Select Date</h3>
                <div className="mb-2 text-sm text-gray-600">
                  Selected: {formatDate(selectedDate)}
                </div>
                <div className="flex justify-center lg:justify-start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="rounded-md border shadow-sm"
                  />
                </div>
              </div>

              {/* Slots Section */}
              <div className="order-1 lg:order-2">
                <h3 className="text-md font-medium mb-2">
                  Slots for {currentCourtName}
                </h3>
                {slots.length > 0 ? (
                  <div className="space-y-3 max-h-80 lg:max-h-96 overflow-y-auto">
                    {slots.map((slot) => {
                      const isBooked =
                        slot.booked ||
                        (slot.bookings && slot.bookings.length > 0);
                      return (
                        <div
                          key={slot.id}
                          className={`p-3 sm:p-4 rounded-lg border transition-all ${
                            isBooked
                              ? "bg-red-50 border-red-200"
                              : "bg-green-50 border-green-200 hover:shadow-md"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-sm sm:text-base">
                                  {formatTimeRange(slot.start_at, slot.end_at)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <DollarSign className="h-3 w-3" />
                                <span>₹{slot.price.slice(1)}</span>
                              </div>
                              {isBooked &&
                                slot.bookings &&
                                slot.bookings[0] && (
                                  <div className="mt-2 text-xs text-gray-500">
                                    <p>
                                      Booked by:{" "}
                                      {slot.bookings[0].user?.displayName ||
                                        "Offline Customer"}
                                    </p>
                                  </div>
                                )}
                            </div>
                            <Button
                              variant={isBooked ? "outline" : "default"}
                              size="sm"
                              disabled={isBooked}
                              onClick={() => handleOfflineBooking(slot)}
                              className={`w-full sm:w-auto sm:min-w-[120px] ${
                                isBooked
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                            >
                              {isBooked ? "Already Booked" : "Book Slot"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-6 sm:p-8 bg-gray-50 rounded-md">
                    <Clock className="h-10 sm:h-12 w-10 sm:w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm sm:text-base">
                      No slots available for this date
                    </p>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                      Try selecting another date
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responsive Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header - Fixed */}
            <div className="bg-white border-b p-4 flex items-center justify-between flex-shrink-0">
              <h3 className="text-lg font-semibold">Create Offline Booking</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-4">
                {/* Slot Info */}
                <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2 text-sm sm:text-base">
                    Slot Details
                  </h4>
                  <div className="space-y-1 text-xs sm:text-sm">
                    <p>
                      <span className="text-gray-500">Venue:</span>{" "}
                      {currentVenueName}
                    </p>
                    <p>
                      <span className="text-gray-500">Court:</span>{" "}
                      {currentCourtName}
                    </p>
                    <p>
                      <span className="text-gray-500">Date:</span>{" "}
                      {formatDate(selectedDate)}
                    </p>
                    <p>
                      <span className="text-gray-500">Time:</span>{" "}
                      {formatTimeRange(
                        selectedSlot.start_at,
                        selectedSlot.end_at
                      )}
                    </p>
                  </div>
                </div>

                {/* Customer Name */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={bookingForm.customerName}
                      onChange={(e) =>
                        handleFormChange("customerName", e.target.value)
                      }
                      placeholder="Enter customer name"
                      className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Customer Phone */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={bookingForm.customerPhone}
                      onChange={(e) =>
                        handleFormChange("customerPhone", e.target.value)
                      }
                      placeholder="Enter 10-digit phone number"
                      maxLength="10"
                      className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₹
                    </span>
                    <input
                      type="number"
                      value={bookingForm.amount}
                      onChange={(e) =>
                        handleFormChange("amount", e.target.value)
                      }
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Booking Source */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Booking Source
                  </label>
                  <select
                    value={bookingForm.bookingSource}
                    onChange={(e) =>
                      handleFormChange("bookingSource", e.target.value)
                    }
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                  >
                    <option value="offline">Walk-in/Phone Booking</option>
                    <option value="playo">Playo</option>
                    <option value="hudle">Hudle</option>
                    <option value="other">Other Platform</option>
                  </select>
                </div>

                {/* Payment Status */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Payment Status
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentReceived"
                        checked={bookingForm.paymentReceived === true}
                        onChange={() =>
                          handleFormChange("paymentReceived", true)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">Payment Received</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="paymentReceived"
                        checked={bookingForm.paymentReceived === false}
                        onChange={() =>
                          handleFormChange("paymentReceived", false)
                        }
                        className="mr-2"
                      />
                      <span className="text-sm">Payment Pending</span>
                    </label>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => handleFormChange("notes", e.target.value)}
                    placeholder="Add any special notes..."
                    rows="3"
                    className="w-full px-3 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer - Fixed */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row gap-3 border-t flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setShowBookingModal(false)}
                disabled={isSubmitting}
                className="w-full sm:flex-1 order-2 sm:order-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitBooking}
                disabled={isSubmitting}
                className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white order-1 sm:order-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Booking"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerOfflineBooking;
