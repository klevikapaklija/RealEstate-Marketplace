import React, { useState, useEffect } from 'react';
import API_URL from './config';
import { getImageUrl } from './utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from './context/FavoritesContext';
import { useLanguage } from './context/LanguageContext';
import axios from 'axios';

export default function Favorites() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavoriteListings = async () => {
      if (favorites.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Fetch all listings
        const res = await axios.get(`${API_URL}/listings/`);
        // Filter only favorite listings
        const favoriteListings = res.data.filter(listing => favorites.includes(listing.id));
        setListings(favoriteListings);
      } catch (err) {
        
      } finally {
        setLoading(false);
      }
    };

    fetchFavoriteListings();
  }, [favorites]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-red-500 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white fill-current" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">{t('myFavorites')}</h1>
              <p className="text-red-100">
                {favorites.length} {t('savedProperties')} {favorites.length === 1 ? t('property') : t('properties')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg font-semibold">{t('loadingFavorites')}</p>
            </div>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t('noFavoritesYet')}</h2>
            <p className="text-gray-600 mb-6">{t('startSavingProperties')}</p>
            <button
              onClick={() => navigate('/listings')}
              className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
            >
              {t('browseProperties')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <div 
                key={listing.id} 
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group relative"
              >
                {/* Remove Favorite Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(listing.id);
                  }}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </button>

                {/* Image */}
                <div 
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className="relative overflow-hidden h-56 cursor-pointer"
                >
                  <img
                    src={
                      listing.images && listing.images.length > 0
                        ? getImageUrl(listing.images[0])
                        : "https://via.placeholder.com/400"
                    }
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Type Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`${
                      listing.type === "rent" 
                        ? "bg-green-500" 
                        : "bg-blue-500"
                    } text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg`}>
                      {listing.type === "rent" ? t('forRent') : t('forSale')}
                    </span>
                  </div>
                  {/* Boost Badge */}
                  {listing.boosted > 0 && (
                    <div className="absolute bottom-4 left-4">
                      <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                        ⭐ {t('featured')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div 
                  onClick={() => navigate(`/listing/${listing.id}`)}
                  className="p-5 cursor-pointer"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-red-600 transition">
                    {listing.title}
                  </h3>
                  
                  {/* Location */}
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="text-sm">{listing.location}</span>
                  </div>

                  {/* Features */}
                  {(listing.rooms || listing.bathrooms || listing.size) && (
                    <div className="flex items-center gap-4 text-gray-600 mb-4 text-sm">
                      {listing.rooms && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span>{listing.rooms} {t('bedrooms')}</span>
                        </div>
                      )}
                      {listing.bathrooms && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                          </svg>
                          <span>{listing.bathrooms} {t('bathrooms')}</span>
                        </div>
                      )}
                      {listing.size && (
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          <span>{listing.size}m²</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Price */}
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-2xl font-bold bg-gradient-to-r from-red-500 to-pink-600 text-transparent bg-clip-text">
                      €{listing.price?.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


