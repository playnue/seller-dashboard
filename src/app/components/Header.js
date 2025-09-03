// components/Header.js
import { useAccessToken, useUserData } from "@nhost/nextjs";
import React, { useEffect, useState } from "react";
import { useVenue } from "../context/VenueContext";
import VenueSelector from "./VenueSelector";

const Header = () => {
  const user = useUserData();
  const accessToken = useAccessToken();
  const { selectedVenue, loading: venueLoading } = useVenue();
  const [activeTab, setActiveTab] = useState("venue");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTurfBookings = async (userId) => {
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "X-Hasura-Role": "seller",
        },
        body: JSON.stringify({
          query: `
            query GetSellerBookings($userId: uuid!) {
              venues(where: { user_id: { _eq: $userId } }) {
                id
                title
                sports
                courts {
                  id
                  name
                }
              }
            }
          `,
          variables: { userId },
        }),
      });

      const { data, errors } = await response.json();
      console.log(data);
      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTurfBookings(user.id);
    }
  }, [user?.id]);

  return (
    <div className="bg-white p-6 shadow">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-teal-800">
            Hello {user?.displayName}
          </h1>
          <div className="text-sm text-gray-500">
            Welcome back! Here's what's happening with{" "}
            {selectedVenue ? selectedVenue.title : "your venues"} today.
          </div>
        </div>
        
        {/* Venue Selector - only show when venues are loaded */}
        {!venueLoading && <VenueSelector />}
      </div>
    </div>
  );
};

export default Header;