import React, { useState, useEffect } from 'react';
import API_URL from '../config';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getRecentlyViewed } from '../hooks/useRecentlyViewed';

export default function RecentlyViewed() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecentListings = async () => {
      const recentIds = getRecentlyViewed();
      
      if (recentIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all listings
        const res = await axios.get(`${API_URL}/listings/`);
        // Filter to only recently viewed
        const recentListings = res.data.filter(listing => recentIds.includes(listing.id));
        // Sort by recently viewed order
        recentListings.sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id));
        setListings(recentListings.slice(0, 4)); // Show max 4
      } catch (err) {
        console.error('Failed to fetch recent listings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentListings();
  }, []);

  if (loading || listings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recently Viewed</h2>
            <p className="text-sm text-gray-600">Properties you've checked out</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {listings.map((listing) => (
          <div
            key={listing.id}
            onClick={() => navigate(`/listing/${listing.id}`)}
            className="bg-gray-50 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <div className="relative h-40">
              <img
                src={
                  listing.images && listing.images.length > 0
                    ? `${API_URL}/${listing.images[0]}`
                    : "https://via.placeholder.com/400"
                }
                alt={listing.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-2 right-2">
                <span className={`${
                  listing.type === "rent" 
                    ? "bg-green-500" 
                    : "bg-blue-500"
                } text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg`}>
                  {listing.type === "rent" ? "RENT" : "SALE"}
                </span>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1 truncate group-hover:text-purple-600 transition">
                {listing.title}
              </h3>
              <div className="flex items-center gap-1 text-gray-600 text-xs mb-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="truncate">{listing.location}</span>
              </div>
              <p className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
                €{listing.price?.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


