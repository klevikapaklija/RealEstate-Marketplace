import React, { useState, useEffect, useCallback, useRef } from "react";
import API_URL from './config';
import { getImageUrl } from './utils/imageUtils';
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import PropertyMap from "./components/PropertyMap";
import RecentlyViewed from "./components/RecentlyViewed";
import { useFavorites } from "./context/FavoritesContext";
import { useLanguage } from "./context/LanguageContext";
import { geocodeAddress } from "./utils/mapbox";

// Custom Dropdown Component
const CustomDropdown = ({ label, value, options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-primary-500 mb-2 uppercase tracking-wider">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 bg-primary-50 border border-transparent rounded-2xl flex items-center justify-between transition-all duration-300 group hover:bg-white hover:shadow-md ${isOpen ? 'bg-white shadow-md ring-2 ring-accent-500/20 border-accent-500' : ''}`}
      >
        <span className={`font-medium truncate ${selectedOption ? 'text-primary-900' : 'text-primary-400'}`}>
          {selectedOption ? selectedOption.label : 'Select...'}
        </span>
        <svg className={`w-5 h-5 text-primary-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent-500' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
          <ul className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${value === option.value
                  ? 'bg-accent-50 text-accent-900 font-medium'
                  : 'text-primary-700 hover:bg-gray-50'
                  }`}
              >
                <span className="truncate">{option.label}</span>
                {value === option.value && (
                  <svg className="w-4 h-4 text-accent-500 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default function ListingsPage() {
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const geocodeTimeout = useRef(null); // For debouncing geocoding

  // Initialize filterType from URL parameters to prevent showing wrong results
  const getInitialFilterType = () => {
    const typeQuery = searchParams.get('type');
    if (typeQuery && (typeQuery === 'sale' || typeQuery === 'rent')) {
      return typeQuery;
    }
    return "all";
  };

  const [listings, setListings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || "");
  const [filterType, setFilterType] = useState(getInitialFilterType()); // all | rent | sale
  const [propertyType, setPropertyType] = useState("all"); // all | private_home | apartment | land | business
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  // New apartment/house feature filters
  const [hasElevator, setHasElevator] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasGarage, setHasGarage] = useState(false);
  const [hasBalcony, setHasBalcony] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [mapCenter, setMapCenter] = useState(null); // For geocoding search
  const [showMap, setShowMap] = useState(false); // Mobile map toggle
  const [hoveredListingId, setHoveredListingId] = useState(null); // Track hovered listing for map sync
  const [mapBounds, setMapBounds] = useState(null); // Track visible map area
  const [filterByMapBounds, setFilterByMapBounds] = useState(false); // Toggle for bounds filtering
  const [lastGeocodedSearch, setLastGeocodedSearch] = useState(''); // Track last geocoded query to prevent duplicates
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || ""); // Controlled input value
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavorites();

  // Handle filter type change and update URL
  const handleFilterTypeChange = (newFilterType) => {
    setFilterType(newFilterType);

    // Update URL to reflect the filter
    const currentParams = new URLSearchParams(searchParams.toString());
    if (newFilterType === "all") {
      currentParams.delete('type');
    } else {
      currentParams.set('type', newFilterType);
    }

    // Navigate to the new URL
    const newUrl = currentParams.toString() ? `?${currentParams.toString()}` : '';
    navigate(`/listings${newUrl}`, { replace: true });
  };

  // Update state when URL parameters change (for navigation between filters)
  // Only sync from URL on mount or when URL actually changes externally
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    const typeQuery = searchParams.get('type');

    // Only update search if it came from URL and is different (avoid loop)
    if (searchQuery && searchQuery !== search) {
      setSearch(searchQuery);
      setSearchInput(searchQuery); // Also update input field
    }

    const newFilterType = typeQuery && (typeQuery === 'sale' || typeQuery === 'rent') ? typeQuery : "all";
    if (newFilterType !== filterType) {
      setFilterType(newFilterType);
    }
  }, [searchParams]); // Remove search and filterType from dependencies

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      try {
        // Fetch listings based on filter type
        const endpoint = filterType === "all"
          ? `${API_URL}/listings/`
          : `${API_URL}/listings/${filterType}`;

        const res = await axios.get(endpoint);
        setListings(res.data);
        setFiltered(res.data);
      } catch (err) {

      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, [filterType]); // Re-fetch when filter type changes

  // Filter + search logic
  useEffect(() => {
    // No loading state - instant smooth filtering with CSS animations
    let results = listings;

    // Filter by property type (private_home, apartment, land)
    if (propertyType !== "all") {
      results = results.filter((l) => l.property_type === propertyType);
    }

    if (search.trim() !== "") {
      results = results.filter((l) =>
        l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.location.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (minPrice) results = results.filter((l) => l.price >= Number(minPrice));
    if (maxPrice) results = results.filter((l) => l.price <= Number(maxPrice));

    // Apply apartment/house feature filters
    if (hasElevator) results = results.filter((l) => l.has_elevator === true);
    if (hasParking) results = results.filter((l) => l.has_parking === true);
    if (hasGarage) results = results.filter((l) => l.has_garage === true);
    if (hasBalcony) results = results.filter((l) => l.has_balcony === true);

    // Filter by visible map bounds (like Zillow)
    if (filterByMapBounds && mapBounds) {
      results = results.filter((l) => {
        if (!l.latitude || !l.longitude) return false;

        const inBounds =
          l.longitude >= mapBounds.getWest() &&
          l.longitude <= mapBounds.getEast() &&
          l.latitude >= mapBounds.getSouth() &&
          l.latitude <= mapBounds.getNorth();

        return inBounds;
      });
      console.log(`📍 Filtered to ${results.length} listings in visible map area`);
    }

    // Sort by boost level (featured first, then premium, then boosted, then regular)
    results.sort((a, b) => {
      const boostA = a.boosted || 0;
      const boostB = b.boosted || 0;
      return boostB - boostA; // Higher boost first
    });

    setFiltered(results);
  }, [filterType, search, minPrice, maxPrice, listings, propertyType, hasElevator, hasParking, hasGarage, hasBalcony, mapBounds, filterByMapBounds]);

  // Separate effect for geocoding ONLY when search text changes (not on every filter)
  // REMOVED AUTO-GEOCODING - Now only geocodes when user clicks search button
  useEffect(() => {
    // Clear existing timeout
    if (geocodeTimeout.current) {
      clearTimeout(geocodeTimeout.current);
    }

    // Don't auto-geocode anymore - only update map center when search changes
    if (search.trim() === "") {
      setMapCenter(null); // Reset map center when search is cleared
      setLastGeocodedSearch('');
    }

    // Cleanup timeout on unmount
    return () => {
      if (geocodeTimeout.current) {
        clearTimeout(geocodeTimeout.current);
      }
    };
  }, [search]); // Only run when search text changes

  // Handle search button click - geocode the location
  const handleSearchClick = () => {
    const searchQuery = searchInput.trim();

    if (searchQuery !== "") {
      // Only geocode if this is a NEW search query
      if (searchQuery !== lastGeocodedSearch) {
        console.log(`🔍 User clicked search - Geocoding: "${searchQuery}"`);
        geocodeLocation(searchQuery);
        setLastGeocodedSearch(searchQuery);
      }
      setSearch(searchQuery); // Update the actual search filter
    } else {
      setSearch(""); // Clear search
      setMapCenter(null);
      setLastGeocodedSearch('');
    }
  };

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  // Handle map bounds change - filter listings by visible area
  // Use useCallback to prevent creating new function on every render
  const handleMapBoundsChange = useCallback((bounds) => {
    console.log('🗺️ Map bounds changed, updating filters');
    setMapBounds(bounds);
    setFilterByMapBounds(true); // Enable bounds filtering when user moves map
  }, []); // Empty deps - function is stable and never changes

  // Geocode location using client-side Mapbox API
  const geocodeLocation = async (query) => {
    try {
      console.log('🗺️ Geocoding search query (client-side):', query);

      // Use client-side Mapbox geocoding (works with domain-restricted tokens)
      const coords = await geocodeAddress(query);

      console.log('✅ Geocoding success:', coords);

      setMapCenter({ lng: coords.longitude, lat: coords.latitude, zoom: 12 }); // Zoom level 12 for cities
    } catch (err) {
      console.error('❌ Geocoding error:', err);
      setMapCenter(null);
    }
  };

  return (
    <div className="min-h-screen bg-primary-50 font-sans text-primary-900">
      {/* Page Header - Apple Style */}
      <div className="relative bg-gradient-to-r from-primary-50 via-white to-primary-50 border-b border-gray-200 sticky top-0 z-30 overflow-hidden shadow-sm">
        {/* Background Decorative Elements */}
        <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
          <div className="absolute top-[-50%] left-[-10%] w-[50%] h-[200%] bg-gradient-to-r from-accent-100/30 to-transparent transform rotate-12 blur-3xl"></div>
          <div className="absolute bottom-[-50%] right-[-10%] w-[50%] h-[200%] bg-gradient-to-l from-primary-100/30 to-transparent transform -rotate-12 blur-3xl"></div>
        </div>

        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-6 flex items-center justify-between relative z-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary-900 mb-2">{t('exploreProperties')}</h1>
            <p className="text-base text-primary-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent-500 animate-pulse"></span>
              {t('findPerfectHome').replace('{count}', filtered.length)}
            </p>
          </div>
        </div>
      </div>

      {/* Recently Viewed Section */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 mt-6">
        <RecentlyViewed />
      </div>

      {/* SEARCH & FILTER BAR - Glassmorphic Pill */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 my-6">
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-4 md:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-primary-500 mb-2 uppercase tracking-wider">{t('search')}</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1 group">
                  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-400 group-focus-within:text-accent-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="w-full pl-12 pr-4 py-3 bg-primary-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all duration-300 placeholder-primary-400 text-primary-900 font-medium"
                  />
                </div>
                <button
                  onClick={handleSearchClick}
                  className="px-6 py-3 bg-primary-900 text-white font-semibold rounded-2xl hover:bg-black transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  {t('searchButton') || 'Search'}
                </button>
              </div>
            </div>

            {/* Buy/Rent Filter */}
            <CustomDropdown
              label={t('type')}
              value={filterType}
              onChange={handleFilterTypeChange}
              options={[
                { value: 'all', label: t('all') },
                { value: 'sale', label: t('buy') },
                { value: 'rent', label: t('rent') }
              ]}
            />

            {/* Property Type Filter */}
            <CustomDropdown
              label={t('propertyType')}
              value={propertyType}
              onChange={setPropertyType}
              options={[
                { value: 'all', label: t('allTypes') },
                { value: 'apartment', label: t('apartment') },
                { value: 'private_home', label: t('privateHome') },
                { value: 'land', label: t('land') },
                { value: 'business', label: t('business') }
              ]}
            />

            {/* Price Range */}
            <div>
              <label className="block text-xs font-semibold text-primary-500 mb-2 uppercase tracking-wider">{t('priceRange')}</label>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  placeholder={t('min')}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-primary-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all duration-300 text-primary-900 font-medium"
                />
                <span className="text-primary-300">-</span>
                <input
                  type="number"
                  placeholder={t('max')}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-primary-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all duration-300 text-primary-900 font-medium"
                />
              </div>
            </div>

            {/* Apartment/House Features */}
            {(propertyType === 'apartment' || propertyType === 'private_home') && (
              <div className="lg:col-span-5 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-primary-500 uppercase tracking-wider">{t('features')}</label>
                  {(hasElevator || hasParking || hasGarage || hasBalcony) && (
                    <button
                      onClick={() => {
                        setHasElevator(false);
                        setHasParking(false);
                        setHasGarage(false);
                        setHasBalcony(false);
                      }}
                      className="text-xs text-accent-500 hover:text-accent-600 font-medium transition-colors"
                    >
                      {t('clearAll')}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: t('hasElevator'), checked: hasElevator, setter: setHasElevator },
                    { label: t('hasParking'), checked: hasParking, setter: setHasParking },
                    { label: t('hasGarage'), checked: hasGarage, setter: setHasGarage },
                    { label: t('hasBalcony'), checked: hasBalcony, setter: setHasBalcony }
                  ].map((feature, idx) => (
                    <label key={idx} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-full border transition-all duration-300 ${feature.checked
                      ? 'bg-accent-50 border-accent-200 text-accent-700 shadow-sm'
                      : 'bg-white border-gray-200 text-primary-600 hover:border-gray-300'
                      }`}>
                      <input
                        type="checkbox"
                        checked={feature.checked}
                        onChange={(e) => feature.setter(e.target.checked)}
                        className="hidden"
                      />
                      <span className="text-sm font-medium">{feature.label}</span>
                      {feature.checked && (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile Map Toggle Button - Below Filters */}
            <div className="md:hidden lg:col-span-5">
              <button
                onClick={() => setShowMap(!showMap)}
                className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-semibold text-base transition-all duration-300 shadow-md ${
                  showMap 
                    ? 'bg-accent-500 text-white shadow-accent-500/30 hover:bg-accent-600' 
                    : 'bg-white text-primary-900 border border-gray-200 hover:border-accent-500 hover:text-accent-600'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {showMap ? (t('hideMap') || 'Hide Map') : (t('showMap') || 'Show Map')}
                <span className={`w-2 h-2 rounded-full ${showMap ? 'bg-white' : 'bg-accent-500'}`}></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAP & LISTINGS SIDE BY SIDE */}
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 pb-12">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 280px)', minHeight: '700px' }}>
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-primary-900 text-lg font-semibold">{t('loadingProperties')}</p>
              <p className="text-primary-500 text-sm mt-2">{t('pleaseWaitFetching')}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Map View */}
            {showMap && (
              <div className="md:hidden mb-6 bg-white rounded-3xl shadow-soft overflow-hidden relative border border-gray-100" style={{ height: '500px' }}>
                <div className="absolute top-4 left-4 z-10">
                  <button
                    onClick={() => {
                      setFilterByMapBounds(!filterByMapBounds);
                      if (filterByMapBounds) setMapBounds(null);
                    }}
                    className={`${filterByMapBounds
                      ? 'bg-accent-500 text-white'
                      : 'bg-white text-primary-700'
                      } px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-medium text-xs border ${filterByMapBounds ? 'border-accent-500' : 'border-gray-200'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    {filterByMapBounds ? t('searchAsIMove') || 'Search as I move' : t('searchThisArea') || 'Search this area'}
                  </button>
                </div>

                <PropertyMap
                  listings={filtered}
                  center={mapCenter}
                  hoveredListingId={hoveredListingId}
                  onBoundsChange={filterByMapBounds ? handleMapBoundsChange : undefined}
                />
              </div>
            )}

            {/* Desktop: Side by Side | Mobile: Listings Only */}
            <div className={`${showMap ? 'hidden md:flex' : 'flex'} gap-6`} style={{ height: 'calc(100vh - 280px)', minHeight: '700px' }}>
              {/* MAP - LEFT SIDE (Desktop Only) */}
              <div className="hidden md:block md:w-1/2 bg-white rounded-3xl shadow-soft overflow-hidden relative border border-gray-100">
                <div className="absolute top-4 left-4 z-10">
                  <button
                    onClick={() => {
                      setFilterByMapBounds(!filterByMapBounds);
                      if (filterByMapBounds) setMapBounds(null);
                    }}
                    className={`${filterByMapBounds
                      ? 'bg-accent-500 text-white'
                      : 'bg-white text-primary-700'
                      } px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 font-medium text-sm border ${filterByMapBounds ? 'border-accent-500' : 'border-gray-200'
                      }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                    {filterByMapBounds ? t('searchAsIMove') || 'Search as I move' : t('searchThisArea') || 'Search this area'}
                  </button>
                </div>

                <PropertyMap
                  listings={filtered}
                  center={mapCenter}
                  hoveredListingId={hoveredListingId}
                  onBoundsChange={filterByMapBounds ? handleMapBoundsChange : undefined}
                />
              </div>

              {/* LISTINGS - RIGHT SIDE (SCROLLABLE) */}
              <div className="w-full md:w-1/2 overflow-y-auto custom-scrollbar relative pr-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                  {filtered.length === 0 ? (
                    <div className="col-span-full text-center py-20">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-4">
                        <svg className="w-10 h-10 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-primary-900 mb-2">{t('noPropertiesFound')}</h3>
                      <p className="text-primary-500">{t('adjustFilters')}</p>
                    </div>
                  ) : (
                    filtered.map((listing) => (
                      <div
                        key={listing.id}
                        className="bg-white rounded-3xl shadow-soft hover:shadow-medium transition-all duration-500 group relative overflow-hidden border border-gray-100 flex flex-col"
                        onMouseEnter={() => setHoveredListingId(listing.id)}
                        onMouseLeave={() => setHoveredListingId(null)}
                      >
                        {/* Favorite Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(listing.id);
                          }}
                          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform duration-300"
                        >
                          {isFavorite(listing.id) ? (
                            <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                          )}
                        </button>

                        {/* Image Container */}
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
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          {/* Type Badge */}
                          <div className="absolute top-4 left-4">
                            <span className={`backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold shadow-sm border border-white/20 ${listing.type === "rent"
                              ? "bg-green-500/90 text-white"
                              : "bg-accent-500/90 text-white"
                              }`}>
                              {listing.type === "rent" ? t('rent') : t('forSale')}
                            </span>
                          </div>
                          {/* Boost Badge */}
                          {listing.boosted > 0 && (
                            <div className="absolute bottom-4 left-4">
                              <span className="bg-white/90 backdrop-blur-md text-primary-900 px-3 py-1 rounded-full text-xs font-bold shadow-sm flex items-center gap-1">
                                <span className="text-yellow-500">★</span> {t('featured')}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div
                          onClick={() => navigate(`/listing/${listing.id}`)}
                          className="p-5 cursor-pointer flex-1 flex flex-col"
                        >
                          <div className="mb-2">
                            <p className="text-2xl font-bold text-primary-900 tracking-tight">
                              €{listing.price?.toLocaleString()}
                            </p>
                          </div>

                          <h3 className="text-base font-medium text-primary-900 mb-2 truncate group-hover:text-accent-500 transition-colors">
                            {listing.title}
                          </h3>

                          <div className="flex items-center gap-1.5 text-primary-500 mb-4">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="text-sm truncate">{listing.location}</span>
                          </div>

                          {/* Features Grid */}
                          <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-auto pt-4 border-t border-gray-50">
                            {listing.rooms && (
                              <div className="flex items-center gap-2 text-sm text-primary-600">
                                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>{listing.rooms} {t('rooms')}</span>
                              </div>
                            )}
                            {listing.size && (
                              <div className="flex items-center gap-2 text-sm text-primary-600">
                                <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                </svg>
                                <span>{listing.size}m²</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div >
  );
}

