import React, { useState, useEffect } from "react";
import { useAccessToken, useUserData } from "@nhost/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Clock } from "lucide-react";

const SellerOfflineBooking = () => {
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [courts, setCourts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const accessToken = useAccessToken();
  const user = useUserData()
  const userId=user.id // To store the seller's user ID

  const formatDate = (date) => {
    if (!date) return "";
    // Create a new date object and adjust for timezone
    const d = new Date(date);
    // Get year, month, and day components
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    // Return in YYYY-MM-DD format
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date) => {
    // Create a new date at midnight in local timezone
    const localDate = new Date(date.setHours(0, 0, 0, 0));
    setSelectedDate(localDate);
  };

  // Fetch user ID (assuming it's available from auth context or similar)
  

  // Fetch all venues first
  const fetchVenues = async () => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
            query GetVenues {
              venues {
                id
                title
                user_id
              }
            }
          `
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to fetch venues");
      
      // Filter venues to only include those owned by the current user
      const sellerVenues = data.data.venues.filter(venue => venue.user_id === userId);
      setVenues(sellerVenues);
      
      // Select first venue by default if any exist
      if (sellerVenues.length > 0) {
        setSelectedVenue(sellerVenues[0].id);
        fetchCourts(sellerVenues[0].id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching venues:", error);
      setLoading(false);
    }
  };

  // Fetch courts for selected venue
  const fetchCourts = async (venueId) => {
    if (!venueId) return;
    
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
            venueId,
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to fetch courts");
      setCourts(data.data.courts);
      
      // Select first court by default if any exist
      if (data.data.courts.length > 0) {
        setSelectedCourt(data.data.courts[0].id);
      }
    } catch (error) {
      console.error("Error fetching courts:", error);
    }
  };

  // Fetch slots for selected court and date
  const fetchSlots = async (courtId, date) => {
    if (!courtId || !date) return;

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
      if (data.errors) throw new Error("Failed to fetch slots");
      
      // Set slots separately instead of nesting in courts array
      setSlots(data.data.slots);
    } catch (error) {
      console.error("Error fetching slots:", error);
    }
  };

  // Handle booking toggle
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
      fetchSlots(selectedCourt, selectedDate);
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  // Format time range for display
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

  // Handle venue change
  const handleVenueChange = (venueId) => {
    setSelectedVenue(venueId);
    fetchCourts(venueId);
    setSelectedCourt(null); // Reset selected court
    setSlots([]); // Clear slots when venue changes
  };

  // Handle court change
  const handleCourtChange = (courtId) => {
    setSelectedCourt(courtId);
    fetchSlots(courtId, selectedDate);
  };

 

  useEffect(() => {
    if (userId) {
      fetchVenues();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchSlots(selectedCourt, selectedDate);
    }
  }, [selectedCourt, selectedDate]);

  if (loading) return <div className="flex justify-center p-4">Loading...</div>;

  // Get current venue name
  const currentVenue = venues.find(venue => venue.id === selectedVenue);
  const currentVenueName = currentVenue ? currentVenue.title : "";

  // Get current court name
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

              {/* Slots Display */}
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