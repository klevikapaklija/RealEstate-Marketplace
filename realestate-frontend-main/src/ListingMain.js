import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import API_URL from "./config";
import { getImageUrl } from './utils/imageUtils';
import { useFavorites } from "./context/FavoritesContext";
import { useRecentlyViewed } from "./hooks/useRecentlyViewed";
import MortgageCalculator from "./components/MortgageCalculator";
import StaticLocationMap from "./components/StaticLocationMap";
import { useLanguage } from "./context/LanguageContext";

export default function ListingPage() {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [listing, setListing] = useState(null);
  const [error, setError] = useState("");
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showMortgageCalc, setShowMortgageCalc] = useState(false);
  const [showFloorPlanModal, setShowFloorPlanModal] = useState(false);
  const { toggleFavorite, isFavorite } = useFavorites();

  // Track this listing as recently viewed
  useRecentlyViewed(id);

  // Calculate time ago
  const getTimeAgo = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
      year: 31536000,
      month: 2592000,
      week: 604800,
      day: 86400,
      hour: 3600,
      minute: 60
    };

    for (let [unit, secondsInUnit] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / secondsInUnit);
      if (interval >= 1) {
        // Return bilingual format
        if (unit === 'year') return interval === 1 ? (t('oneYearAgo') || '1 year ago') : `${interval} ${t('yearsAgo') || 'years ago'}`;
        if (unit === 'month') return interval === 1 ? (t('oneMonthAgo') || '1 month ago') : `${interval} ${t('monthsAgo') || 'months ago'}`;
        if (unit === 'week') return interval === 1 ? (t('oneWeekAgo') || '1 week ago') : `${interval} ${t('weeksAgo') || 'weeks ago'}`;
        if (unit === 'day') return interval === 1 ? (t('oneDayAgo') || '1 day ago') : `${interval} ${t('daysAgo') || 'days ago'}`;
        if (unit === 'hour') return interval === 1 ? (t('oneHourAgo') || '1 hour ago') : `${interval} ${t('hoursAgo') || 'hours ago'}`;
        if (unit === 'minute') return interval === 1 ? (t('oneMinuteAgo') || '1 minute ago') : `${interval} ${t('minutesAgo') || 'minutes ago'}`;
      }
    }
    return t('justNow') || 'Just now';
  };

  const openFullscreen = (index) => {
    setCurrentImageIndex(index);
    setFullscreenImage(listing.images[index]);
  };

  const closeFullscreen = () => {
    setFullscreenImage(null);
  };

  const nextImage = () => {
    const newIndex = (currentImageIndex + 1) % listing.images.length;
    setCurrentImageIndex(newIndex);
    setFullscreenImage(listing.images[newIndex]);
  };

  const prevImage = () => {
    const newIndex = (currentImageIndex - 1 + listing.images.length) % listing.images.length;
    setCurrentImageIndex(newIndex);
    setFullscreenImage(listing.images[newIndex]);
  };

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await axios.get(`${API_URL}/listings/${id}`);
        setListing(response.data);

        // Update Open Graph meta tags for WhatsApp/Facebook preview
        const listing = response.data;
        const ogImage = listing.images && listing.images.length > 0
          ? getImageUrl(listing.images[0])
          : 'https://realestateal.al/favicon-512x512.png';

        // Update document title
        document.title = `${listing.title} - €${listing.price?.toLocaleString()} - RealEstateAL`;

        // Update or create meta tags
        const updateMetaTag = (property, content) => {
          let tag = document.querySelector(`meta[property="${property}"]`);
          if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
          }
          tag.setAttribute('content', content);
        };

        updateMetaTag('og:title', `${listing.title} - ${listing.location}`);
        updateMetaTag('og:description', listing.description || `${listing.property_type} for ${listing.type} in ${listing.location}. Price: €${listing.price?.toLocaleString()}`);
        updateMetaTag('og:image', ogImage);
        updateMetaTag('og:image:secure_url', ogImage);
        updateMetaTag('og:url', `https://realestateal.al/listing/${id}`);
        updateMetaTag('og:type', 'product');
        updateMetaTag('og:site_name', 'RealEstateAL');

        // Twitter Card
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:title', `${listing.title} - €${listing.price?.toLocaleString()}`);
        updateMetaTag('twitter:description', listing.description?.substring(0, 200) || `${listing.property_type} in ${listing.location}`);
        updateMetaTag('twitter:image', ogImage);

        // Increment view count when user opens the listing
        fetch(`${API_URL}/listings/${id}/view`, {
          method: 'POST'
        }).catch(() => { });
      } catch (err) {
        setError("Failed to load listing details");
      }
    };
    fetchListing();
  }, [id]);

  if (error) {
    return <div className="text-center text-red-600 mt-10">{error}</div>;
  }

  if (!listing) {
    return <div className="text-center mt-10">{t('loading')}</div>;
  }

  return (
    <>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
      <div className="min-h-screen bg-primary-50 font-sans text-primary-900 py-6 md:py-12">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
          {/* Fullscreen Image Modal - Apple Style */}
          {fullscreenImage && (
            <div className="fixed inset-0 bg-white/95 backdrop-blur-xl z-50 flex items-center justify-center animate-fadeIn">
              {/* Close Button */}
              <button
                onClick={closeFullscreen}
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-primary-900 hover:bg-gray-200 transition-all duration-300 z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Previous Button */}
              {listing.images.length > 1 && (
                <button
                  onClick={prevImage}
                  className="absolute left-6 p-4 bg-white rounded-full shadow-large hover:scale-110 transition-all duration-300 text-primary-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Image */}
              <img
                src={getImageUrl(fullscreenImage)}
                alt={`${listing.title} - ${t('fullView')}`}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
              />

              {/* Next Button */}
              {listing.images.length > 1 && (
                <button
                  onClick={nextImage}
                  className="absolute right-6 p-4 bg-white rounded-full shadow-large hover:scale-110 transition-all duration-300 text-primary-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}

              {/* Image Counter */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-2 rounded-full font-medium text-sm tracking-wide">
                {currentImageIndex + 1} / {listing.images.length}
              </div>
            </div>
          )}

          {/* Images Gallery - Apple Style Grid */}
          {listing.images && listing.images.length > 0 && (
            <div className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden mb-8">
              {/* Mobile: Horizontal Scroll */}
              <div className="md:hidden overflow-x-auto snap-x snap-mandatory scrollbar-hide">
                <div className="flex">
                  {listing.images.slice(0, 6).map((img, index) => (
                    <div key={index} className="flex-shrink-0 w-full snap-center relative">
                      <img
                        src={getImageUrl(img)}
                        alt={`${listing.title} - Image ${index + 1}`}
                        onClick={() => openFullscreen(index)}
                        className="w-full h-72 object-cover cursor-pointer active:opacity-90"
                      />
                      {/* Show +X overlay on 6th image if there are more */}
                      {index === 5 && listing.images.length > 6 && (
                        <div
                          onClick={() => openFullscreen(5)}
                          className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                        >
                          <span className="text-white text-3xl font-bold tracking-tight">
                            +{listing.images.length - 6}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {/* Image indicator dots */}
                {listing.images.length > 1 && (
                  <div className="flex justify-center gap-2 py-4 bg-white border-t border-gray-50">
                    {listing.images.slice(0, 6).map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === 0 ? 'bg-primary-900 w-4' : 'bg-gray-300'}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Desktop: Grid */}
              <div className="hidden md:block">
                {/* Dynamic grid based on image count */}
                {listing.images.length === 1 && (
                  <div className="p-2">
                    <img
                      src={getImageUrl(listing.images[0])}
                      alt={`${listing.title} - Image 1`}
                      onClick={() => openFullscreen(0)}
                      className="rounded-2xl w-full h-[600px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                  </div>
                )}

                {listing.images.length === 2 && (
                  <div className="grid grid-cols-2 gap-2 p-2">
                    {listing.images.slice(0, 2).map((img, index) => (
                      <img
                        key={index}
                        src={getImageUrl(img)}
                        alt={`${listing.title} - Image ${index + 1}`}
                        onClick={() => openFullscreen(index)}
                        className="rounded-2xl w-full h-[500px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                      />
                    ))}
                  </div>
                )}

                {listing.images.length === 3 && (
                  <div className="grid grid-cols-2 gap-2 p-2">
                    <img
                      src={getImageUrl(listing.images[0])}
                      alt={`${listing.title} - Image 1`}
                      onClick={() => openFullscreen(0)}
                      className="rounded-2xl w-full row-span-2 h-[600px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                    <img
                      src={getImageUrl(listing.images[1])}
                      alt={`${listing.title} - Image 2`}
                      onClick={() => openFullscreen(1)}
                      className="rounded-2xl w-full h-[296px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                    <img
                      src={getImageUrl(listing.images[2])}
                      alt={`${listing.title} - Image 3`}
                      onClick={() => openFullscreen(2)}
                      className="rounded-2xl w-full h-[296px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                  </div>
                )}

                {listing.images.length === 4 && (
                  <div className="grid grid-cols-2 gap-2 p-2">
                    {listing.images.slice(0, 4).map((img, index) => (
                      <img
                        key={index}
                        src={getImageUrl(img)}
                        alt={`${listing.title} - Image ${index + 1}`}
                        onClick={() => openFullscreen(index)}
                        className="rounded-2xl w-full h-[300px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                      />
                    ))}
                  </div>
                )}

                {listing.images.length === 5 && (
                  <div className="grid grid-cols-4 gap-2 p-2">
                    <img
                      src={getImageUrl(listing.images[0])}
                      alt={`${listing.title} - Image 1`}
                      onClick={() => openFullscreen(0)}
                      className="rounded-2xl w-full col-span-2 row-span-2 h-[600px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                    <img
                      src={getImageUrl(listing.images[1])}
                      alt={`${listing.title} - Image 2`}
                      onClick={() => openFullscreen(1)}
                      className="rounded-2xl w-full col-span-2 h-[296px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                    <img
                      src={getImageUrl(listing.images[2])}
                      alt={`${listing.title} - Image 3`}
                      onClick={() => openFullscreen(2)}
                      className="rounded-2xl w-full h-[296px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                    <img
                      src={getImageUrl(listing.images[3])}
                      alt={`${listing.title} - Image 4`}
                      onClick={() => openFullscreen(3)}
                      className="rounded-2xl w-full h-[296px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                    <img
                      src={getImageUrl(listing.images[4])}
                      alt={`${listing.title} - Image 5`}
                      onClick={() => openFullscreen(4)}
                      className="rounded-2xl w-full h-[296px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                  </div>
                )}

                {listing.images.length >= 6 && (
                  <div className="grid grid-cols-4 gap-2 p-2">
                    <img
                      src={getImageUrl(listing.images[0])}
                      alt={`${listing.title} - Image 1`}
                      onClick={() => openFullscreen(0)}
                      className="rounded-2xl w-full col-span-2 row-span-2 h-[600px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                    <img
                      src={getImageUrl(listing.images[1])}
                      alt={`${listing.title} - Image 2`}
                      onClick={() => openFullscreen(1)}
                      className="rounded-2xl w-full col-span-2 h-[296px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                    />
                    {listing.images.slice(2, 6).map((img, index) => (
                      <div key={index + 2} className="relative">
                        <img
                          src={getImageUrl(img)}
                          alt={`${listing.title} - Image ${index + 3}`}
                          onClick={() => openFullscreen(index + 2)}
                          className="rounded-2xl w-full h-[296px] object-cover cursor-pointer hover:opacity-95 transition-opacity duration-300"
                        />
                        {/* Show +X overlay on last image if there are more */}
                        {index === 3 && listing.images.length > 6 && (
                          <div
                            onClick={() => openFullscreen(5)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center cursor-pointer hover:bg-black/70 transition-colors duration-300"
                          >
                            <span className="text-white text-4xl font-bold tracking-tight">
                              +{listing.images.length - 6}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compact Header Section - Apple Style */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8 mb-6 relative">
            {/* Favorite Button - Absolute Top Right */}
            <button
              onClick={() => toggleFavorite(listing.id)}
              className="absolute top-6 right-6 w-12 h-12 bg-white hover:bg-red-50 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-medium border border-gray-100 z-10"
              title={isFavorite(listing.id) ? t('removeFromFavorites') : t('addToFavorites')}
            >
              {isFavorite(listing.id) ? (
                <svg className="w-6 h-6 text-red-500 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 md:pr-20">
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase ${listing.type === "rent"
                    ? "bg-green-100 text-green-700"
                    : "bg-accent-50 text-accent-700"
                    }`}>
                    {listing.type === "rent" ? t('forRent') : t('forSale')}
                  </span>
                  {listing.boosted > 0 && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-primary-900 text-white tracking-wide uppercase flex items-center gap-1">
                      <span className="text-yellow-400">★</span> {t('featured')}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl md:text-4xl font-bold text-primary-900 mb-3 tracking-tight">{listing.title}</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-primary-500">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-base font-medium">{listing.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm font-medium">{listing.views || 0} views</span>
                  </div>
                  {listing.created_at && (
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">{t('postedAgo') || 'Posted'} {getTimeAgo(listing.created_at)}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full lg:w-auto lg:text-right mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-0 border-gray-100">
                <p className="text-xs font-semibold text-primary-400 uppercase tracking-wider mb-1">{t('price')}</p>
                <p className="text-3xl md:text-4xl font-bold text-primary-900 tracking-tight">€{listing.price?.toLocaleString()}</p>
                {listing.type === "rent" && <p className="text-sm text-primary-500 mt-1 font-medium">{t('perMonth')}</p>}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            {/* Left Column - Description and Details */}
            <div className="lg:col-span-2 space-y-6 md:space-y-8">

              {/* Description */}
              {listing.description && (
                <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-bold text-primary-900 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    {t('description')}
                  </h2>
                  <p className="text-base text-primary-600 leading-relaxed whitespace-pre-line font-medium">{listing.description}</p>
                </div>
              )}

              {/* Property Features */}
              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  {t('propertyDetails')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                  {/* Only show bedrooms for apartments and private homes */}
                  {(listing.property_type === 'apartment' || listing.property_type === 'private_home') && (
                    <div className="flex flex-col p-4 rounded-2xl bg-primary-50/50 border border-gray-100 hover:border-primary-200 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{t('bedrooms')}</span>
                      </div>
                      <p className="text-lg font-bold text-primary-900">{listing.rooms || t('notSpecified')}</p>
                    </div>
                  )}
                  {/* Only show bathrooms for apartments and private homes */}
                  {(listing.property_type === 'apartment' || listing.property_type === 'private_home') && (
                    <div className="flex flex-col p-4 rounded-2xl bg-primary-50/50 border border-gray-100 hover:border-primary-200 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-primary-400" fill="currentColor" viewBox="0 0 32 32">
                          <path d="M 6 6 L 6 13 L 4 13 L 4 15 L 6 15 L 6 24 L 8 24 L 8 15 L 24 15 L 24 24 L 26 24 L 26 15 L 28 15 L 28 13 L 26 13 L 26 10 C 26 8.355469 24.644531 7 23 7 L 10 7 C 8.894531 7 8 7.894531 8 9 L 8 13 L 6 13 Z M 8 9 L 23 9 C 23.5625 9 24 9.4375 24 10 L 24 13 L 8 13 Z M 10 17 L 10 19 L 12 19 L 12 17 Z M 14 17 L 14 19 L 16 19 L 16 17 Z M 18 17 L 18 19 L 20 19 L 20 17 Z M 22 17 L 22 19 L 24 19 L 24 17 Z" />
                        </svg>
                        <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{t('bathrooms')}</span>
                      </div>
                      <p className="text-lg font-bold text-primary-900">{listing.bathrooms || t('notSpecified')}</p>
                    </div>
                  )}
                  {/* Size is shown for all property types */}
                  <div className="flex flex-col p-4 rounded-2xl bg-primary-50/50 border border-gray-100 hover:border-primary-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{t('propertySize')}</span>
                    </div>
                    <p className="text-lg font-bold text-primary-900">{listing.size ? `${listing.size} m²` : t('notSpecified')}</p>
                  </div>

                  <div className="flex flex-col p-4 rounded-2xl bg-primary-50/50 border border-gray-100 hover:border-primary-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{t('location')}</span>
                    </div>
                    <p className="text-lg font-bold text-primary-900 truncate" title={listing.location}>{listing.location}</p>
                  </div>

                  <div className="flex flex-col p-4 rounded-2xl bg-primary-50/50 border border-gray-100 hover:border-primary-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{t('propertyType')}</span>
                    </div>
                    <p className="text-lg font-bold text-primary-900 capitalize">{listing.property_type?.replace('_', ' ') || t('notSpecified')}</p>
                  </div>

                  <div className="flex flex-col p-4 rounded-2xl bg-primary-50/50 border border-gray-100 hover:border-primary-200 transition-colors">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{t('price')}</span>
                    </div>
                    <p className="text-lg font-bold text-primary-900">€{listing.price?.toLocaleString()}</p>
                  </div>

                  {/* Additional features for apartments and houses */}
                  {(listing.property_type === 'apartment' || listing.property_type === 'private_home') && (
                    <>
                      {/* Floor Information */}
                      {(listing.floor !== null && listing.floor !== undefined) && (
                        <div className="flex flex-col p-4 rounded-2xl bg-primary-50/50 border border-gray-100 hover:border-primary-200 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{t('floor')}</span>
                          </div>
                          <p className="text-lg font-bold text-primary-900">
                            {listing.total_floors ? `${listing.floor}/${listing.total_floors}` : listing.floor}
                          </p>
                        </div>
                      )}

                      {/* Elevator */}
                      {listing.has_elevator && (
                        <div className="flex flex-col p-4 rounded-2xl bg-green-50/50 border border-green-100 hover:border-green-200 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">{t('hasElevator')}</span>
                          </div>
                          <p className="text-lg font-bold text-green-700">✓</p>
                        </div>
                      )}

                      {/* Parking */}
                      {listing.has_parking && (
                        <div className="flex flex-col p-4 rounded-2xl bg-green-50/50 border border-green-100 hover:border-green-200 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                            <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">{t('hasParking')}</span>
                          </div>
                          <p className="text-lg font-bold text-green-700">✓</p>
                        </div>
                      )}

                      {/* Garage */}
                      {listing.has_garage && (
                        <div className="flex flex-col p-4 rounded-2xl bg-green-50/50 border border-green-100 hover:border-green-200 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">{t('hasGarage')}</span>
                          </div>
                          <p className="text-lg font-bold text-green-700">✓</p>
                        </div>
                      )}

                      {/* Balcony */}
                      {listing.has_balcony && (
                        <div className="flex flex-col p-4 rounded-2xl bg-green-50/50 border border-green-100 hover:border-green-200 transition-colors">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">{t('hasBalcony')}</span>
                          </div>
                          <p className="text-lg font-bold text-green-700">✓</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Floor Plan */}
              {listing.floor_plan && (
                <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8">
                  <h2 className="text-xl md:text-2xl font-bold text-primary-900 mb-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    📐 Floor Plan
                  </h2>
                  <div className="flex flex-col items-center">
                    <div
                      className="relative group cursor-pointer max-w-sm"
                      onClick={() => setShowFloorPlanModal(true)}
                    >
                      <img
                        src={listing.floor_plan}
                        alt="Floor Plan"
                        className="w-full h-48 object-contain rounded-2xl border-2 border-gray-200 hover:border-primary-400 transition-all duration-300 hover:shadow-lg bg-gray-50"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-2xl transition-all duration-300 flex items-center justify-center">
                        <div className="bg-white rounded-full p-3 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg">
                          <svg className="w-6 h-6 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Click to view full size
                    </p>
                  </div>
                </div>
              )}

              {/* Location Map */}
              <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8">
                <h2 className="text-xl md:text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  {t('exactLocation') || 'Exact Location'}
                </h2>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
                  title={t('openInMaps') || 'Open in Google Maps'}
                >
                  <StaticLocationMap location={listing.location} width={400} height={200} zoom={14} />
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white rounded-full p-4 shadow-large transform translate-y-2 group-hover:translate-y-0">
                      <svg className="w-6 h-6 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                  </div>
                </a>
                <p className="text-xs text-primary-500 mt-3 flex items-center gap-1.5 font-medium">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('clickToOpenMaps') || 'Click to open in Google Maps for directions'}
                </p>
              </div>
            </div>

            {/* Right Column - Contact Information */}
            <div className="lg:col-span-1 space-y-6 md:space-y-8">
              {/* Contact Card */}
              {listing.user && (
                <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8 lg:sticky lg:top-24">
                  <h2 className="text-xl md:text-2xl font-bold text-primary-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    {t('listedBy')}
                  </h2>

                  {/* Seller Profile */}
                  <div className="text-center mb-6">
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-primary-900 rounded-full flex items-center justify-center text-white text-2xl md:text-3xl font-bold mx-auto mb-4 shadow-lg border-4 border-primary-50 overflow-hidden">
                      {listing.user.profile_picture ? (
                        <img
                          src={listing.user.profile_picture}
                          alt={`${listing.user.name}'s profile`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        listing.user.name?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-primary-900 mb-1">{listing.user.name} {listing.user.surname}</h3>
                    {listing.user.role && (
                      <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${listing.user.role === "agent"
                        ? "bg-purple-100 text-purple-700"
                        : listing.user.role === "agency"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-gray-100 text-gray-700"
                        }`}>
                        {listing.user.role === "agent" ? t('realEstateAgent') : listing.user.role === "agency" ? t('agency') : t('privateSeller')}
                      </span>
                    )}
                  </div>

                  {/* Contact Details */}
                  <div className="space-y-3 mb-6">
                    {listing.user.phone && (
                      <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-2xl border border-gray-100">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm text-primary-900">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider">{t('phone')}</p>
                          <p className="text-sm font-bold text-primary-900">{listing.user.phone}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 mb-6">
                    {listing.user.phone && (
                      <a
                        href={`tel:${listing.user.phone}`}
                        className="w-full bg-white text-primary-900 border border-gray-200 px-6 py-3.5 rounded-2xl hover:bg-gray-50 transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {t('callNow')}
                      </a>
                    )}
                    {listing.user.phone && (
                      <a
                        href={`https://wa.me/${listing.user.phone.replace(/\s+/g, '')}?text=${encodeURIComponent(
                          t('whatsappMessageToSeller')
                            .replace('{title}', listing.title)
                            .replace('{price}', listing.price?.toLocaleString())
                            .replace('{link}', `https://realestateal.al/listing/${id}`)
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-[#25D366] text-white px-6 py-3.5 rounded-2xl hover:bg-[#20bd5a] transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        {t('sendMessage') || 'Send WhatsApp Message'}
                      </a>
                    )}
                  </div>

                  {/* Mortgage Calculator Dropdown */}
                  {listing.type === "sale" && (
                    <div className="mb-6">
                      <button
                        onClick={() => setShowMortgageCalc(!showMortgageCalc)}
                        className="w-full bg-white text-primary-900 border border-gray-200 px-6 py-3.5 rounded-2xl hover:bg-gray-50 transition-all duration-300 font-semibold flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        {showMortgageCalc ? t('hideMortgage') : t('calculateMortgage')}
                        <svg
                          className={`w-4 h-4 text-primary-400 transition-transform duration-300 ${showMortgageCalc ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {showMortgageCalc && (
                        <div className="mt-4 animate-fadeIn">
                          <MortgageCalculator propertyPrice={listing.price} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Social Sharing */}
                  <div className="pt-6 border-t border-gray-100">
                    <p className="text-xs font-semibold text-primary-500 uppercase tracking-wider mb-4 text-center">{t('shareProperty')}</p>
                    <div className="flex gap-3 justify-center">
                      {/* WhatsApp */}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          t('whatsappShareMessage')
                            .replace('{title}', listing.title)
                            .replace('{price}', listing.price?.toLocaleString())
                            .replace('{link}', `https://realestateal.al/listing/${id}`)
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-sm"
                        title="Share on WhatsApp"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </a>

                      {/* Facebook */}
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-[#1877F2] text-white flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-sm"
                        title="Share on Facebook"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                      </a>

                      {/* Instagram */}
                      <a
                        href="https://instagram.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center hover:scale-110 transition-transform duration-300 shadow-sm"
                        title="Share on Instagram"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div >

      {/* Floor Plan Modal */}
      {
        showFloorPlanModal && listing.floor_plan && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
            onClick={() => setShowFloorPlanModal(false)}
          >
            <div className="relative max-w-7xl max-h-full">
              <button
                onClick={() => setShowFloorPlanModal(false)}
                className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={listing.floor_plan}
                alt="Floor Plan - Full Size"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )
      }
    </>
  );
}
