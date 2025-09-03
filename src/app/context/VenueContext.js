// contexts/VenueContext.js
"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import { useUserData, useAccessToken } from '@nhost/nextjs';

const VenueContext = createContext();

export const useVenue = () => {
  const context = useContext(VenueContext);
  if (!context) {
    throw new Error('useVenue must be used within a VenueProvider');
  }
  return context;
};

export const VenueProvider = ({ children }) => {
  const userData = useUserData();
  const accessToken = useAccessToken();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user's venues using GraphQL
  const fetchUserVenues = async (userId) => {
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
            query GetSellerVenues($userId: uuid!) {
              venues(where: { user_id: { _eq: $userId } }) {
                id
                title
                sports
                location
                
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
      
      if (errors) {
        console.error("GraphQL errors:", errors);
        return;
      }

      if (data?.venues) {
        setVenues(data.venues);
        
        // Set first venue as default or restore from localStorage
        const savedVenueId = localStorage.getItem('selectedVenueId');
        const defaultVenue = savedVenueId 
          ? data.venues.find(v => v.id === savedVenueId) || data.venues[0]
          : data.venues[0];
          
        if (defaultVenue) {
          setSelectedVenue(defaultVenue);
        }
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData?.id && accessToken) {
      fetchUserVenues(userData.id);
    }
  }, [userData?.id, accessToken]);

  const switchVenue = (venue) => {
    setSelectedVenue(venue);
    localStorage.setItem('selectedVenueId', venue.id);
  };

  const value = {
    venues,
    selectedVenue,
    switchVenue,
    loading,
    hasMultipleVenues: venues.length > 1,
    refreshVenues: () => {
      if (userData?.id && accessToken) {
        fetchUserVenues(userData.id);
      }
    }
  };

  return (
    <VenueContext.Provider value={value}>
      {children}
    </VenueContext.Provider>
  );
};