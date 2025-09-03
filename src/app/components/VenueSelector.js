// components/VenueSelector.js
"use client";
import { useState } from 'react';
import { useVenue } from '../context/VenueContext';

const VenueSelector = () => {
  const { venues, selectedVenue, switchVenue, hasMultipleVenues } = useVenue();
  const [isOpen, setIsOpen] = useState(false);

  // If user has only one venue, show venue name without dropdown
  if (!hasMultipleVenues) {
    return (
      <div className="flex items-center space-x-2 bg-teal-50 px-3 py-2 rounded-lg">
        <div className="h-5 w-5 text-teal-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <span className="text-sm font-medium text-teal-800">
          {selectedVenue?.title || 'Loading...'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-teal-50 hover:bg-teal-100 px-3 py-2 rounded-lg transition-colors border border-teal-200"
      >
        <div className="h-5 w-5 text-teal-600">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <span className="text-sm font-medium text-teal-800">
          {selectedVenue?.title || 'Select Venue'}
        </span>
        <div className={`h-4 w-4 text-teal-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="py-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Your Venues ({venues.length})
            </div>
            {venues.map((venue) => (
              <button
                key={venue.id}
                onClick={() => {
                  switchVenue(venue);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                  selectedVenue?.id === venue.id ? 'bg-teal-50 text-teal-800' : 'text-gray-700'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div className="h-4 w-4 mt-0.5 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h4M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{venue.title}</div>
                    {venue.location && (
                      <div className="text-xs text-gray-500">{venue.location}</div>
                    )}
                    {venue.sports && venue.sports.length > 0 && (
                      <div className="text-xs text-gray-500">
                        {venue.sports.join(', ')}
                      </div>
                    )}
                    <div className="text-xs text-gray-400">
                      {venue.courts?.length || 0} courts
                    </div>
                  </div>
                  {selectedVenue?.id === venue.id && (
                    <div className="h-4 w-4 text-teal-600">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default VenueSelector;