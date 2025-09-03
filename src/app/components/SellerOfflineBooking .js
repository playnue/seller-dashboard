"use client"
import React, { useState, useEffect } from "react";
import { useAccessToken, useUserData } from "@nhost/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Clock } from "lucide-react";

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
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date) => {
    const localDate = new Date(date.setHours(0, 0, 0, 0));
    setSelectedDate(localDate);
  };

  // Fetch all venues for this seller
  // In SellerOfflineBooking component, modify the fetchVenues function:
const fetchVenues = async () => {
  if (!userId) {
    console.warn("fetchVenues called without userId");
    return;
  }

  try {
    setLoading(true); // Make sure you have a loading state
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
          userId, // Make sure userId is valid here
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
    
    // Only proceed if we have venues and a valid venueId prop
    if (venueId && sellerVenues.find(v => v.id === venueId)) {
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

  // Fetch courts for selected venue - only call if venueId is valid
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

  // Fetch slots for selected court and date - only call if both are valid
  const fetchSlots = async (courtId, date) => {
    if (!courtId || !date) {
      console.warn("fetchSlots called without required parameters", { courtId, date });
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

  const handleBookingToggle = async (slot) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            mutation UpdateSlot($slotId: uuid!, $booked: Boolean!) {
              update_slots_by_pk(
                pk_columns: { id: $slotId }
                _set: { booked: $booked }
              ) {
                id
                booked
              }
            }
          `,
          variables: {
            slotId: slot.id,
            booked: !slot.booked,
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to update booking status");

      // Refresh slots after update
      if (selectedCourt && selectedDate) {
        fetchSlots(selectedCourt, selectedDate);
      }
    } catch (error) {
      console.error("Error updating booking status:", error);
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

  // Update useEffect to handle prop changes
  useEffect(() => {
    if (userId && accessToken) {
      fetchVenues();
    }
  }, [userId, accessToken]);

  // Handle venueId prop changes
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

  const currentVenue = venues.find(venue => venue.id === selectedVenue);
  const currentVenueName = currentVenue ? currentVenue.title : "";
  const currentCourt = courts.find(court => court.id === selectedCourt);
  const currentCourtName = currentCourt ? currentCourt.name : "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Seller Offline Booking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Venue Selection */}
          {venues.length > 0 ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Your Venues</label>
              <div className="flex flex-wrap gap-2">
                {venues.map((venue) => (
                  <button
                    key={venue.id}
                    onClick={() => handleVenueChange(venue.id)}
                    className={`px-4 py-2 rounded-md text-sm ${
                      selectedVenue === venue.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
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
              <label className="block text-sm font-medium mb-2">Courts at {currentVenueName}</label>
              <div className="flex flex-wrap gap-2">
                {courts.map((court) => (
                  <button
                    key={court.id}
                    onClick={() => handleCourtChange(court.id)}
                    className={`px-4 py-2 rounded-md text-sm ${
                      selectedCourt === court.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 hover:bg-gray-300"
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
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-2">Select Date</h3>
                <div className="mb-2 text-sm text-gray-600">
                  Selected: {formatDate(selectedDate)}
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  className="rounded-md border"
                />
              </div>

              <div>
                <h3 className="text-md font-medium mb-2">
                  Available Slots for {currentCourtName}
                </h3>
                {slots.length > 0 ? (
                  <div className="space-y-2 max-h-80 overflow-y-auto p-2">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-lg border ${
                          slot.booked ? "bg-orange-100" : "bg-green-100"
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatTimeRange(slot.start_at, slot.end_at)}
                            </span>
                            <span className="text-sm text-gray-600 block">
                              Price: ${slot.price}
                            </span>
                          </div>
                          <Button
                            variant={slot.booked ? "destructive" : "default"}
                            size="sm"
                            onClick={() => handleBookingToggle(slot)}
                          >
                            {slot.booked ? "Cancel Booking" : "Book Offline"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 bg-gray-50 rounded-md text-gray-500">
                    No slots available for this date. Try selecting another date.
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerOfflineBooking;