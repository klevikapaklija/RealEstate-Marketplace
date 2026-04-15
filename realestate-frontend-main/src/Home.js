import React, { useState, useEffect, useRef } from "react";
import API_URL from './config';
import { Link, useNavigate } from "react-router-dom";
import Chatbot from "./components/Chatbot";
import { useLanguage } from "./context/LanguageContext";
import { getImageUrl } from './utils/imageUtils';

function Home() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [pendingSearch, setPendingSearch] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Auto-expand search bar after a short delay (stays open permanently)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSearchExpanded(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleSearchContainerClick = () => {
    searchInputRef.current?.focus();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!svgRef.current) return;

      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;

      // Calculate mouse position relative to center (from -1 to 1)
      const x = (clientX - innerWidth / 2) / (innerWidth / 2);
      const y = (clientY - innerHeight / 2) / (innerHeight / 2);

      // Move SVG opposite to mouse for parallax effect
      // Rotate slightly based on position
      const moveX = x * -30; // Max 30px movement
      const moveY = y * -30;
      const rotateX = y * 10; // Max 10deg rotation
      const rotateY = x * -10;

      svgRef.current.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px)) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await fetch(`${API_URL}/listings/`);
        if (!response.ok) throw new Error("Failed to fetch listings");
        const data = await response.json();

        // ✅ Show all boosted properties (boosted === 1) and sort them by newest
        const boostedProperties = data
          .filter(property => property.boosted === 1) // ✅ Changed from 3 to 1
          .sort((a, b) => b.id - a.id); // Sort by newest first

        setProperties(boostedProperties);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchListings();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      setPendingSearch(search);
      setShowTypeModal(true);
    } else {
      navigate('/listings');
    }
  };

  const handleTypeSelection = (type) => {
    setShowTypeModal(false);
    if (pendingSearch.trim()) {
      navigate(`/listings?search=${encodeURIComponent(pendingSearch)}&type=${type}`);
    } else {
      navigate(`/listings?type=${type}`);
    }
    setSearch("");
    setPendingSearch("");
  };

  if (loading) return <div className="flex justify-center items-center h-screen">{t('loading')}</div>;
  if (error) return <div className="text-red-600 text-center h-screen">{t('error')}: {error}</div>;

  return (
    <div className="font-sans text-primary-900 bg-white">
      {/* Hero Section - Apple Minimalist */}
      <section className="relative min-h-[620px] sm:min-h-[650px] md:h-[700px] flex items-center justify-center overflow-hidden bg-white py-10 md:py-0">
        {/* Subtle Mesh Gradient Background */}
        <div className="absolute inset-0 bg-white">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-accent-50/50 rounded-full blur-3xl opacity-60 animate-float"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-50/30 rounded-full blur-3xl opacity-60 animate-float" style={{ animationDelay: '2s' }}></div>

          {/* Animated Abstract Shape - Interactive with Enhanced Gradient */}
          <div
            ref={svgRef}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.08] pointer-events-none z-0 transition-transform duration-100 ease-out will-change-transform"
          >
            <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <defs>
                <linearGradient id="houseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#0071e3', stopOpacity: 0.1 }} />
                  <stop offset="100%" style={{ stopColor: '#0071e3', stopOpacity: 0.05 }} />
                </linearGradient>
              </defs>

              {/* House Group */}
              <g transform="translate(100, 150)">
                {/* House Body - Stroke Animation */}
                <path
                  d="M150,20 L280,100 V280 H20 V100 L150,20 Z"
                  fill="url(#houseGradient)"
                  stroke="#0071e3"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw"
                />

                {/* Roof Detail */}
                <path
                  d="M20,100 L150,20 L280,100"
                  fill="none"
                  stroke="#0071e3"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-draw"
                  style={{ animationDelay: '0.5s' }}
                />

                {/* Door Frame */}
                <rect
                  x="110"
                  y="180"
                  width="80"
                  height="100"
                  fill="none"
                  stroke="#0071e3"
                  strokeWidth="2"
                  className="animate-draw"
                  style={{ animationDelay: '1s' }}
                />

                {/* Sliding Door */}
                <rect
                  x="115"
                  y="185"
                  width="70"
                  height="90"
                  fill="#0071e3"
                  fillOpacity="0.2"
                  stroke="#0071e3"
                  strokeWidth="1"
                  className="animate-door-slide"
                />
              </g>

              {/* Pin Group - Drop Animation */}
              <g transform="translate(250, 130)" className="animate-pin-drop">
                <path
                  d="M0,0 C-20,0 -36,-16 -36,-36 C-36,-56 -20,-72 0,-72 C20,-72 36,-56 36,-36 C36,-16 20,0 0,0 Z M0,0 L0,40"
                  fill="#ff3b30"
                  stroke="#ffffff"
                  strokeWidth="2"
                />
                <circle cx="0" cy="-36" r="12" fill="#ffffff" />
              </g>
            </svg>
          </div>

          {/* Floating Home Icons - Beautiful Scattered Design */}
          {/* Top Left Area */}
          <div className="absolute top-[10%] left-[8%] opacity-20 animate-float-rotate" style={{ animationDelay: '0s' }}>
            <svg className="w-12 h-12 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6zm6 16h-3v-5H9v5H6V9.5l6-4.5 6 4.5V19z" />
            </svg>
          </div>

          <div className="absolute top-[25%] left-[15%] opacity-15 animate-float-rotate" style={{ animationDelay: '1s' }}>
            <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
            </svg>
          </div>

          {/* Top Right Area */}
          <div className="absolute top-[15%] right-[10%] opacity-20 animate-float-rotate" style={{ animationDelay: '2s' }}>
            <svg className="w-10 h-10 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6zm6 16h-3v-5H9v5H6V9.5l6-4.5 6 4.5V19z" />
            </svg>
          </div>

          <div className="absolute top-[8%] right-[20%] opacity-10 animate-float-rotate" style={{ animationDelay: '3s' }}>
            <svg className="w-7 h-7 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
            </svg>
          </div>

          {/* Middle Left */}
          <div className="absolute top-[45%] left-[5%] opacity-18 animate-float-rotate" style={{ animationDelay: '1.5s' }}>
            <svg className="w-9 h-9 text-violet-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6zm6 16h-3v-5H9v5H6V9.5l6-4.5 6 4.5V19z" />
            </svg>
          </div>

          {/* Middle Right */}
          <div className="absolute top-[50%] right-[8%] opacity-15 animate-float-rotate" style={{ animationDelay: '2.5s' }}>
            <svg className="w-11 h-11 text-pink-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
            </svg>
          </div>

          {/* Bottom Left Area */}
          <div className="absolute bottom-[15%] left-[12%] opacity-20 animate-float-rotate" style={{ animationDelay: '0.5s' }}>
            <svg className="w-8 h-8 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
            </svg>
          </div>

          <div className="absolute bottom-[25%] left-[20%] opacity-12 animate-float-rotate" style={{ animationDelay: '3.5s' }}>
            <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6zm6 16h-3v-5H9v5H6V9.5l6-4.5 6 4.5V19z" />
            </svg>
          </div>

          {/* Bottom Right Area */}
          <div className="absolute bottom-[20%] right-[15%] opacity-18 animate-float-rotate" style={{ animationDelay: '1.2s' }}>
            <svg className="w-10 h-10 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6zm6 16h-3v-5H9v5H6V9.5l6-4.5 6 4.5V19z" />
            </svg>
          </div>

          <div className="absolute bottom-[10%] right-[25%] opacity-15 animate-float-rotate" style={{ animationDelay: '2.8s' }}>
            <svg className="w-7 h-7 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
            </svg>
          </div>

          {/* Additional scattered homes for fuller coverage */}
          <div className="absolute top-[35%] left-[25%] opacity-10 animate-float-rotate" style={{ animationDelay: '4s' }}>
            <svg className="w-6 h-6 text-indigo-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
            </svg>
          </div>

          <div className="absolute top-[60%] right-[30%] opacity-12 animate-float-rotate" style={{ animationDelay: '4.5s' }}>
            <svg className="w-8 h-8 text-violet-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L4 9v12h5v-7h6v7h5V9l-8-6zm6 16h-3v-5H9v5H6V9.5l6-4.5 6 4.5V19z" />
            </svg>
          </div>

          <div className="absolute top-[40%] right-[18%] opacity-14 animate-float-rotate" style={{ animationDelay: '5s' }}>
            <svg className="w-7 h-7 text-pink-300" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z" />
            </svg>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-[980px] mx-auto px-4 md:px-6 text-center">
          <div className="space-y-4 md:space-y-8 animate-fade-in-up">
            {/* Badge - Minimalist Pill */}
            <div className="inline-flex items-center gap-1.5 md:gap-2 bg-gray-100/80 backdrop-blur-md border border-gray-200/50 rounded-full px-3 md:px-4 py-1 md:py-1.5 text-[10px] md:text-xs font-medium text-primary-600 shadow-sm">
              <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-accent-500 rounded-full"></span>
              <span className="tracking-wide uppercase">{t('trustedPlatform')}</span>
            </div>

            {/* Main Heading - SF Pro Style */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-semibold tracking-tight text-primary-900 leading-[1.15] md:leading-[1.1]">
              {t('heroTitle')}
              <br />
              <span className="gradient-text-accent">
                në Shqipëri
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-primary-500 max-w-2xl mx-auto font-normal leading-relaxed tracking-tight px-2">
              {t('heroSubtitle')}
            </p>

            {/* Search Bar - Animated Slide & Expand */}
            <div className="max-w-2xl mx-auto mt-8 md:mt-12 px-2">
              <div 
                ref={searchContainerRef}
                onClick={handleSearchContainerClick}
                className={`
                  relative flex items-center bg-white/80 backdrop-blur-xl rounded-full shadow-lg border border-white/50
                  transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
                  ${isSearchExpanded ? 'w-full px-1 md:px-2' : 'w-12 md:w-16 px-0 cursor-pointer hover:scale-105'}
                  h-12 md:h-16 overflow-hidden mx-auto
                `}
              >
                {/* Search Icon (Left) */}
                <div className="flex items-center justify-center flex-shrink-0 h-12 md:h-16 w-12 md:w-16 text-primary-400 z-10">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Input Field */}
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(e);
                    }
                  }}
                  className={`
                    h-full bg-transparent border-none outline-none text-primary-900 text-sm md:text-lg placeholder-primary-400 font-medium
                    transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] delay-75
                    focus:ring-0 focus:outline-none
                    ${isSearchExpanded ? 'w-full opacity-100 pl-1 md:pl-2' : 'w-0 opacity-0 p-0'}
                  `}
                />

                {/* Action Button (Right - Arrow) */}
                <button 
                  onClick={handleSearch}
                  className={`
                    flex items-center justify-center flex-shrink-0
                    bg-accent-500 hover:bg-accent-600 text-white rounded-full
                    transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-md hover:shadow-lg
                    ${isSearchExpanded ? 'w-9 h-9 md:w-12 md:h-12 mr-1 opacity-100 scale-100' : 'w-0 h-0 mr-0 opacity-0 scale-0'}
                  `}
                >
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Stats - Minimalist */}
            <div className="grid grid-cols-3 gap-4 md:gap-12 max-w-2xl mx-auto mt-10 md:mt-20 pt-6 md:pt-10 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xl md:text-3xl font-semibold text-primary-900 tracking-tight">1k+</div>
                <div className="text-primary-500 text-xs md:text-sm font-medium mt-0.5 md:mt-1">{t('properties')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-3xl font-semibold text-primary-900 tracking-tight">500+</div>
                <div className="text-primary-500 text-xs md:text-sm font-medium mt-0.5 md:mt-1">{t('happyClients')}</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-3xl font-semibold text-primary-900 tracking-tight">50+</div>
                <div className="text-primary-500 text-xs md:text-sm font-medium mt-0.5 md:mt-1">{t('expertAgents')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Properties Section - Apple Minimalist */}
      <section className="max-w-[980px] mx-auto px-6 py-32">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-semibold text-primary-900 mb-6 tracking-tight">
            {t('promotedProperties')}
          </h2>
          <p className="text-xl text-primary-500 max-w-2xl mx-auto leading-relaxed font-normal">
            {t('promotedPropertiesDesc')}
          </p>
        </div>

        {/* Properties Grid */}
        {properties.length === 0 ? (
          <div className="text-center py-32 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-50 rounded-full mb-6 text-gray-300">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary-900 mb-2">{t('noFeaturedProperties')}</h3>
            <p className="text-primary-500">{t('noFeaturedPropertiesDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {properties.map((property) => (
              <div
                key={property.id}
                onClick={() => navigate(`/listing/${property.id}`)}
                className="group cursor-pointer flex flex-col gap-4"
              >
                {/* Image Container - Clean & Rounded */}
                <div className="relative overflow-hidden rounded-3xl aspect-[4/3] bg-gray-100 shadow-soft group-hover:shadow-medium transition-all duration-500">
                  <img
                    src={
                      property.images && property.images.length > 0
                        ? getImageUrl(property.images[0])
                        : "https://via.placeholder.com/400x300?text=No+Image"
                    }
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />

                  {/* Minimalist Badges */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-white/90 backdrop-blur-md text-primary-900 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide shadow-sm">
                      {t('featured')}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide shadow-sm text-white ${property.type === "rent" ? "bg-accent-500" : "bg-primary-800"
                      }`}>
                      {property.type === "rent" ? t('forRent') : t('forSale')}
                    </span>
                  </div>
                </div>

                {/* Content - Minimalist */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h3 className="text-xl font-semibold text-primary-900 group-hover:text-accent-500 transition-colors line-clamp-1">
                      {property.title}
                    </h3>
                    <p className="text-lg font-semibold text-primary-900">
                      €{property.price?.toLocaleString()}
                    </p>
                  </div>

                  <p className="text-primary-500 text-base line-clamp-1">
                    {property.location}
                  </p>

                  {/* Features - Subtle Icons */}
                  <div className="flex items-center gap-6 pt-2 text-primary-500 text-sm font-medium">
                    {property.rooms && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span>{property.rooms} {t('rooms')}</span>
                      </div>
                    )}
                    {property.size && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        <span>{property.size}m²</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All Button - Minimalist Link */}
        {properties.length > 0 && (
          <div className="text-center mt-20">
            <Link to="/listings" className="inline-flex items-center gap-2 text-accent-500 hover:text-accent-600 font-medium text-lg group transition-colors">
              <span>{t('viewAllProperties')}</span>
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* Why Choose Us Section - Apple Minimalist */}
      <section className="bg-primary-50 py-32">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-semibold text-primary-900 mb-6 tracking-tight">
              {t('whyChooseUs')}
            </h2>
            <p className="text-xl text-primary-500 max-w-2xl mx-auto leading-relaxed font-normal">
              {t('whyChooseUsSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* Feature 1 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-soft flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500 ease-out">
                <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-3">{t('verifiedListings')}</h3>
              <p className="text-primary-500 leading-relaxed">{t('verifiedListingsDesc')}</p>
            </div>

            {/* Feature 2 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-soft flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500 ease-out">
                <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-3">{t('expertAgentsTitle')}</h3>
              <p className="text-primary-500 leading-relaxed">{t('expertAgentsDesc')}</p>
            </div>

            {/* Feature 3 */}
            <div className="text-center group">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-soft flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform duration-500 ease-out">
                <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-3">{t('fastAndEasy')}</h3>
              <p className="text-primary-500 leading-relaxed">{t('fastAndEasyDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Buy/Rent Selection Modal */}
      {showTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 md:p-8 animate-fadeIn">
            <div className="text-center mb-6">
              <div className="w-16 h-16 gradient-bg-accent rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-accent">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('whatAreYouLookingFor')}</h3>
              <p className="text-gray-600">{t('selectPropertyPurpose')}</p>
            </div>

            <div className="space-y-3">
              {/* Buy Button */}
              <button
                onClick={() => handleTypeSelection('sale')}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:shadow-glow-primary text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transform hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {t('buyProperty')}
              </button>

              {/* Rent Button */}
              <button
                onClick={() => handleTypeSelection('rent')}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:shadow-glow-primary text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3 transform hover:scale-105"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                {t('rentProperty')}
              </button>

              {/* Cancel Button */}
              <button
                onClick={() => {
                  setShowTypeModal(false);
                  setPendingSearch("");
                }}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-medium transition-all duration-300"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Chatbot */}
      <Chatbot />
    </div>
  );
}

export default Home;
