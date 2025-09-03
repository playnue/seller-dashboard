"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUserData, useAccessToken } from "@nhost/nextjs";
import { LuMapPin, LuClock, LuCheck, LuPencil } from "react-icons/lu";
import {
  SPORTS_LIST,
  AMENITIES_LIST,
  AMENITY_CATEGORIES,
} from "../constants/venue-options";

const VenueDetails = ({venueId}) => {
  const user = useUserData();
  const accessToken = useAccessToken();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    description: null,
    location: null,
    open_at: null,
    close_at: null,
    sports: [],
    amenities: [],
    user_id: "",
    image_id: null,
    extra_image_ids: null,
  });

  // Fetch venue data
  useEffect(() => {
    const fetchVenueDetails = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(
          process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              query: `
                query GetVenueByUserId {
                  venues(where: {id: {_eq: "${venueId}"}}) {
                    id
                    title
                    description
                    location
                    open_at
                    close_at
                    sports
                    amenities
                    user_id
                    image_id
                    extra_image_ids
                  }
                }
              `,
            }),
          }
        );

        const data = await response.json();
        if (data.errors) {
          throw new Error("Failed to fetch venue data");
        }

        if (data.data.venues.length > 0) {
          const venueData = data.data.venues[0];
          setFormData(venueData);
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
        setError("Failed to load venue details");
        setLoading(false);
      }
    };

    fetchVenueDetails();
  }, [user?.id, accessToken]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSportToggle = (sportName) => {
    setFormData((prev) => ({
      ...prev,
      sports: prev.sports.includes(sportName)
        ? prev.sports.filter((sport) => sport !== sportName)
        : [...prev.sports, sportName],
    }));
  };

  const handleAmenityToggle = (amenityName) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenityName)
        ? prev.amenities.filter((amenity) => amenity !== amenityName)
        : [...prev.amenities, amenityName],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

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
            mutation UpdateVenue($id: uuid!, $updates: venues_set_input!) {
              update_venues_by_pk(
                pk_columns: { id: $id }
                _set: $updates
              ) {
                id
              }
            }
          `,
          variables: {
            id: formData.id,
            updates: {
              title: formData.title,
              description: formData.description,
              location: formData.location,
              open_at: formData.open_at,
              close_at: formData.close_at,
              sports: formData.sports,
              amenities: formData.amenities,
            },
          },
        }),
      });

      const data = await response.json();
      if (data.errors) throw new Error("Failed to update venue");
      
      setIsEditing(false);
      alert("Venue updated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to update venue");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to get sport icon
  const getSportIcon = (sportName) => {
    const sport = SPORTS_LIST.find(s => s.name === sportName);
    return sport ? sport.icon : "🏆";
  };

  // Helper to categorize amenities
  const categorizeAmenities = (amenities) => {
    const categorized = {};
    
    AMENITY_CATEGORIES.forEach(category => {
      categorized[category.id] = {
        name: category.name,
        items: []
      };
    });
    
    amenities?.forEach(amenityName => {
      const amenity = AMENITIES_LIST.find(a => a.name === amenityName);
      if (amenity) {
        categorized[amenity.category].items.push(amenityName);
      }
    });
    
    return categorized;
  };

  // Format time string for display
  const formatTime = (timeString) => {
    if (!timeString) return "Not specified";
    
    try {
      // If in 24-hour format (HH:MM), convert to 12-hour format
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      
      return `${hour12}:${minutes} ${ampm}`;
    } catch (e) {
      return timeString;
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-500 border-r-transparent"></div>
      <p className="ml-3 text-gray-600">Loading venue details...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      <h3 className="font-medium">Error</h3>
      <p>{error}</p>
    </div>
  );
  
  if (!formData.id) return (
    <div className="p-6 text-center">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-yellow-800 mb-4">No Venue Found</h2>
        <p className="text-gray-600 mb-6">You haven't registered any venues yet.</p>
        <Button>Register a New Venue</Button>
      </div>
    </div>
  );

  // View mode (non-editable)
  if (!isEditing) {
    const categorizedAmenities = categorizeAmenities(formData.amenities);
    
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-teal-800">Venue Details</h2>
          <Button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700"
          >
            <LuPencil size={18} />
            Edit Venue
          </Button>
        </div>

        {/* Venue Banner/Header */}
        <div className="bg-gradient-to-r from-teal-600 to-blue-500 text-white p-6 rounded-lg mb-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-2">{formData.title}</h1>
          {formData.location && (
            <div className="flex items-center mb-2">
              <LuMapPin className="mr-2" />
              <span>{formData.location}</span>
            </div>
          )}
          {(formData.open_at || formData.close_at) && (
            <div className="flex items-center">
              <LuClock className="mr-2" />
              <span>
                {formatTime(formData.open_at)} - {formatTime(formData.close_at)}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 overflow-hidden">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">About This Venue</h3>
              <p className="text-gray-700 leading-relaxed">
                {formData.description || "No description provided for this venue."}
              </p>
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Sports Available</h3>
              {formData?.sports?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData?.sports?.map((sport) => (
                    <div key={sport} className="flex items-center p-3 bg-teal-50 rounded-lg border border-teal-100">
                      <span className="text-xl mr-2">{getSportIcon(sport)}</span>
                      <span className="font-medium text-teal-800">{sport}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No sports listed for this venue.</p>
              )}
            </Card>
          </div>

          {/* Right column - Amenities */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Amenities</h3>
              {formData.amenities?.length > 0 ? (
                <div className="space-y-6">
                  {Object.values(categorizedAmenities).map((category: any) => 
                    category.items.length > 0 && (
                      <div key={category.name} className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">{category.name}</h4>
                        <ul className="space-y-2">
                          {category.items.map((amenity) => (
                            <li key={amenity} className="flex items-center">
                              <LuCheck className="text-teal-500 mr-2" />
                              <span>{amenity}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No amenities listed for this venue.</p>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800">Additional Information</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-600">Venue ID</h4>
                  <p className="text-sm text-gray-500">{formData.id}</p>
                </div>
                {formData.image_id && (
                  <div>
                    <h4 className="font-medium text-gray-600">Main Image</h4>
                    <p className="text-sm text-gray-500">Available</p>
                  </div>
                )}
                {formData.extra_image_ids && formData.extra_image_ids.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-600">Additional Images</h4>
                    <p className="text-sm text-gray-500">{formData.extra_image_ids.length} available</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-teal-800">Edit Venue</h2>
        <Button variant="outline" onClick={() => setIsEditing(false)}>
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6 border-l-4 border-teal-500">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Venue Title</label>
              <Input
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full"
                required
                placeholder="Enter venue name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Description
              </label>
              <Textarea
                name="description"
                value={formData.description || ""}
                onChange={handleInputChange}
                rows={4}
                placeholder="Describe your venue"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Location</label>
              <Input
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
                placeholder="Enter venue address"
                className="w-full"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-blue-500">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Operating Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Open At</label>
              <Input
                type="time"
                name="open_at"
                value={formData.open_at || ""}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Close At</label>
              <Input
                type="time"
                name="close_at"
                value={formData.close_at || ""}
                onChange={handleInputChange}
                className="w-full"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-emerald-500">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Sports Available</h3>
          <p className="text-gray-600 mb-4">Select all sports activities available at your venue</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {SPORTS_LIST.map((sport) => (
              <label 
                key={sport.id} 
                className={`flex items-center p-3 rounded-md border transition-colors cursor-pointer ${
                  formData.sports.includes(sport.name)
                    ? "bg-teal-50 border-teal-300"
                    : "bg-white border-gray-200 hover:bg-gray-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.sports.includes(sport.name)}
                  onChange={() => handleSportToggle(sport.name)}
                  className="rounded border-gray-300 text-teal-600 mr-2"
                />
                <div className="flex items-center">
                  <span className="text-xl mr-2">{sport.icon}</span>
                  <span className={formData.sports.includes(sport.name) ? "font-medium" : ""}>
                    {sport.name}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-purple-500">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Amenities</h3>
          <p className="text-gray-600 mb-4">Select all amenities available at your venue</p>
          
          {AMENITY_CATEGORIES.map((category) => (
            <div key={category.id} className="mb-8">
              <h4 className="text-lg font-medium mb-4 text-gray-700 border-b pb-2">{category.name}</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {AMENITIES_LIST.filter(
                  (amenity) => amenity.category === category.id
                ).map((amenity) => (
                  <label
                    key={amenity.id}
                    className={`flex items-center p-3 rounded-md border transition-colors cursor-pointer ${
                      formData.amenities.includes(amenity.name)
                        ? "bg-purple-50 border-purple-200"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.name)}
                      onChange={() => handleAmenityToggle(amenity.name)}
                      className="rounded border-gray-300 text-purple-500 mr-2"
                    />
                    <span className={formData.amenities.includes(amenity.name) ? "font-medium" : ""}>
                      {amenity.name}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </Card>

        <div className="flex justify-end space-x-4">
          <Button 
            variant="outline" 
            type="button" 
            onClick={() => setIsEditing(false)}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="bg-teal-600 hover:bg-teal-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                Updating...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default VenueDetails;