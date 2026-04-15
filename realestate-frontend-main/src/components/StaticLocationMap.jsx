import React, { useEffect, useState } from 'react';
import { getStaticMapUrlFromAddress, isMapboxConfigured } from '../utils/mapbox';

export default function StaticLocationMap({ location, width = 600, height = 400, zoom = 14 }) {
  const [mapUrl, setMapUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStaticMap = async () => {
      try {
        setLoading(true);
        
        if (!isMapboxConfigured()) {
          throw new Error('Mapbox not configured');
        }

        console.log('🗺️ Generating static map for:', location);
        
        // Generate map URL client-side (works with domain-restricted tokens)
        const url = await getStaticMapUrlFromAddress(location, {
          width,
          height,
          zoom
        });
        
        console.log('✅ Static map URL generated');
        
        setMapUrl(url);
        setError(null);
      } catch (err) {
        console.error('❌ Static map error:', err);
        setError('Unable to load map');
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      fetchStaticMap();
    }
  }, [location, width, height, zoom]);

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  if (error || !mapUrl) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p>{location}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden shadow-md">
      <img 
        src={mapUrl} 
        alt={`Map of ${location}`}
        className="w-full h-auto"
        loading="lazy"
      />
    </div>
  );
}


