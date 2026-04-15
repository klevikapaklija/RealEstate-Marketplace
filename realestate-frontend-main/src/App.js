import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, useLocation } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import { useAuth } from "./context/AuthContext";
import { useAdmin } from "./context/AdminContext";
import { useFavorites } from "./context/FavoritesContext";
import { useLanguage } from "./context/LanguageContext";
import API_URL from "./config";
import { getAuth } from "firebase/auth";
import AddListing from "./AddListing";
import Profile from "./Profile";
import ListingMain from "./ListingMain";
import ListingsPage from "./ListingPage";
import Contact from "./Contact";
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import Favorites from "./Favorites";
import About from "./About";
import Legal from "./Legal";
import ConsentManagement from "./ConsentManagement";
import CookiePolicy from "./CookiePolicy";
import PaymentSuccess from "./PaymentSuccess";
import Partnerships from "./Partnerships";
import AuthHandler from "./AuthHandler";
import HowToListProperty from "./HowToListProperty";
import ListingFees from "./ListingFees";
import HowBoostingWorks from "./HowBoostingWorks";
import AgenciesAgents from "./AgenciesAgents";
import AgentProfile from "./AgentProfile";
import LanguageSwitcher from "./components/LanguageSwitcher";
import CookieConsent from "./components/CookieConsent";
import { trackPageView } from "./utils/analytics";

export default function App() {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const { count: favoritesCount } = useFavorites();
  const { t, language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [userProfile, setUserProfile] = useState(null);

  // Handle scroll for Back to Top button
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show if scrolled down > 300px AND scrolling up
      if (currentScrollY > 300 && currentScrollY < lastScrollY) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Track page views on route change and scroll to top
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on route change
    trackPageView(location.pathname + location.search, document.title);
  }, [location]);

  const handleAddListingClick = () => {
    if (user) {
      navigate("/add-listing");
    } else {
      navigate("/login");
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
  };

  // Get first letter for avatar
  const getInitial = () => {
    if (!user) return "";
    if (user.displayName && user.displayName.length > 0)
      return user.displayName.charAt(0).toUpperCase();
    if (user.email && user.email.length > 0)
      return user.email.charAt(0).toUpperCase();
    return "?";
  };

  // Fetch user profile with profile_picture from Cloudinary
  useEffect(() => {
    if (!user?.firebase_uid) {
      setUserProfile(null);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const currentUser = getAuth().currentUser;
        if (!currentUser) return;

        const token = await currentUser.getIdToken();

        const response = await fetch(`${API_URL}/users/${user.firebase_uid}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const profileData = await response.json();
          setUserProfile(profileData);
        }
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user?.firebase_uid]);

  return (
    <div className="font-sans text-gray-800 min-h-screen flex flex-col">
      {/* Modern Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-lg bg-white/95">
        <div className="w-full px-4 md:px-8 lg:px-12 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <img
                src="/favicon.svg"
                alt="RealEstateAL Logo"
                className="w-8 h-8 md:w-10 md:h-10 object-contain hover:scale-110 transition-transform duration-300"
              />
              <h1 className="text-lg md:text-2xl font-bold gradient-text-primary">
                RealEstateAL
              </h1>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/listings?type=sale"
                className="px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
              >
                {t('buy')}
              </Link>
              <Link
                to="/listings?type=rent"
                className="px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
              >
                {t('rent')}
              </Link>
              <Link
                to="/partnerships"
                className="px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
              >
                {t('partnerships')}
              </Link>
              <Link
                to="/agencies-agents"
                className="px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
              >
                {t('Agencies & Agents') || 'Agencies & Agents'}
              </Link>
              {/* <Link 
                to="/Partnerships" 
                className="px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
              >
                {language === 'sq' ? 'Partneritete' : 'Partnerships'}
              </Link> */}
              <Link
                to="/contact"
                className="px-4 py-2 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
              >
                {t('contact')}
              </Link>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-2 md:space-x-3">
              {user ? (
                <>
                  {/* Desktop User Actions */}
                  <div className="hidden md:flex items-center space-x-3">
                    {/* Favorites Button */}
                    <Link
                      to="/favorites"
                      className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-red-50 transition font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {t('favorites')}
                      {favoritesCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {favoritesCount}
                        </span>
                      )}
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-orange-600 text-white px-4 py-2.5 rounded-xl hover:from-red-700 hover:to-orange-700 transition font-semibold shadow-lg shadow-red-500/30"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>{t('admin')}</span>
                      </Link>
                    )}
                    <button
                      onClick={handleAddListingClick}
                      className="flex items-center gap-2 bg-accent-500 text-white px-5 py-2.5 rounded-full hover:bg-accent-600 transition-all duration-300 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>{t('addListing')}</span>
                    </button>
                  </div>

                  {/* Profile Avatar */}
                  <div
                    onClick={handleProfileClick}
                    className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center bg-gradient-to-r from-accent-500 to-accent-600 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-accent-500/30 hover:shadow-accent-500/50 hover:scale-105 transition-all duration-300 overflow-hidden"
                    title="Go to Profile"
                  >
                    {userProfile?.profile_picture ? (
                      <img
                        src={userProfile.profile_picture}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitial()
                    )}
                  </div>

                  {/* Language Switcher */}
                  <LanguageSwitcher />
                </>
              ) : (
                <div className="hidden md:flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="px-5 py-2.5 text-gray-700 hover:text-blue-600 font-medium transition"
                  >
                    {t('login')}
                  </Link>
                  <button
                    onClick={handleAddListingClick}
                    className="flex items-center gap-2 bg-accent-500 text-white px-5 py-2.5 rounded-full hover:bg-accent-600 transition-all duration-300 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
                  >
                    {t('addListing')}
                  </button>
                  {/* Language Switcher */}
                  <LanguageSwitcher />
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-100 py-4 space-y-2">
              {/* Language Switcher - Mobile */}
              <div className="px-4 pb-2 border-b border-gray-100">
                <LanguageSwitcher />
              </div>

              {/* Navigation Links */}
              <Link
                to="/listings?type=sale"
                className="block px-4 py-3 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('buy')}
              </Link>
              <Link
                to="/listings?type=rent"
                className="block px-4 py-3 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('rent')}
              </Link>
              <Link
                to="/partnerships"
                className="block px-4 py-3 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('partnerships')}
              </Link>
              <Link
                to="/agencies-agents"
                className="block px-4 py-3 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('Agencies & Agents') || 'Agencies & Agents'}
              </Link>
              <Link
                to="/contact"
                className="block px-4 py-3 rounded-lg text-gray-700 hover:text-primary-600 hover:bg-primary-50 transition font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t('contact')}
              </Link>

              {user ? (
                <>
                  {/* Favorites */}
                  <Link
                    to="/favorites"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:text-red-600 hover:bg-red-50 transition font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {t('favorites')}
                    {favoritesCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {favoritesCount}
                      </span>
                    )}
                  </Link>

                  {/* Add Listing */}
                  <button
                    onClick={() => {
                      handleAddListingClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-all duration-300 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('addListing')}
                  </button>

                  {isAdmin && (
                    <Link
                      to="/admin/dashboard"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 transition font-semibold"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {t('admin')}
                    </Link>
                  )}
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-3 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t('login')}
                  </Link>
                  <button
                    onClick={() => {
                      handleAddListingClick();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full px-4 py-3 rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-all duration-300 font-medium text-left"
                  >
                    {t('addListing')}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Routes */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/__/auth/action" element={<AuthHandler />} />
          <Route path="/__/auth/handler" element={<AuthHandler />} />
          <Route path="/add-listing" element={<AddListing />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/listing/:id" element={<ListingMain />} />
          <Route path="/listings" element={<ListingsPage />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/partnerships" element={<Partnerships />} />
          <Route path="/agencies-agents" element={<AgenciesAgents />} />
          <Route path="/agent/:id" element={<AgentProfile />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/privacy-policy" element={<Legal />} />
          <Route path="/terms-of-service" element={<Legal />} />
          <Route path="/consent-management" element={<ConsentManagement />} />
          <Route path="/cookie-policy" element={<CookiePolicy />} />
          <Route path="/how-to-list-property" element={<HowToListProperty />} />
          <Route path="/listing-fees" element={<ListingFees />} />
          <Route path="/how-boosting-works" element={<HowBoostingWorks />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>

      {/* Modern Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-8 md:mb-12">
            {/* Brand Section */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                <img
                  src="/favicon.svg"
                  alt="RealEstateAL Logo"
                  className="w-8 h-8 md:w-10 md:h-10 object-contain"
                />
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">RealEstateAL</h2>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                {t('footerTagline')}
              </p>
              {/* Social Media */}
              <div className="flex gap-3">
                <a
                  href="https://www.instagram.com/realestateal_al?igsh=eDFtazdvYmJvcmR0&utm_source=qr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-pink-600 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                  title="Follow us on Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                  </svg>
                </a>
                <a
                  href="https://www.tiktok.com/@realestateal0?_r=1&_t=ZM-91Hzw3R4iUK"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600 hover:bg-black hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                  title="Follow us on TikTok"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links - Hidden on Mobile */}
            <div className="hidden md:block">
              <h3 className="text-gray-900 font-bold mb-6 text-lg">{t('quickLinks')}</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/listings?type=sale" className="text-gray-500 hover:text-primary-600 transition flex items-center gap-2 group">
                    <span className="text-primary-400 group-hover:translate-x-1 transition-transform">›</span> {t('buyProperty')}
                  </Link>
                </li>
                <li>
                  <Link to="/listings?type=rent" className="text-gray-500 hover:text-primary-600 transition flex items-center gap-2 group">
                    <span className="text-primary-400 group-hover:translate-x-1 transition-transform">›</span> {t('rentProperty')}
                  </Link>
                </li>
                <li>
                  <Link to="/add-listing" className="text-gray-500 hover:text-primary-600 transition flex items-center gap-2 group">
                    <span className="text-primary-400 group-hover:translate-x-1 transition-transform">›</span> {t('listYourProperty')}
                  </Link>
                </li>
                <li>
                  <Link to="/listings" className="text-gray-500 hover:text-primary-600 transition flex items-center gap-2 group">
                    <span className="text-primary-400 group-hover:translate-x-1 transition-transform">›</span> {t('allProperties')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="text-gray-900 font-bold mb-6 text-lg">{t('resources')}</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/about" className="text-gray-500 hover:text-primary-600 transition flex items-center gap-2 group">
                    <span className="text-primary-400 group-hover:translate-x-1 transition-transform">›</span> {t('about')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-gray-900 font-bold mb-6 text-lg">{t('contactUs')}</h3>
              <ul className="space-y-4 text-gray-500 text-sm">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <a href="mailto:realestateal08@gmail.com" className="hover:text-primary-600 transition mt-1.5">
                    realestateal08@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-100 pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm text-center md:text-left">
                © {new Date().getFullYear()} RealEstateAL. {t('allRightsReserved')}
              </p>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
                <Link to="/legal" className="hover:text-primary-600 transition">{t('legalTitle')}</Link>
                <Link to="/cookie-policy" className="hover:text-primary-600 transition">{t('cookiePolicy')}</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Back to Top Button */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary-900 text-white px-4 py-2 md:px-6 md:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-500 z-50 flex items-center gap-2 group ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
          }`}
      >
        <span className="font-medium text-sm md:text-base">{t('backToTop') || 'Back to Top'}</span>
        <svg
          className="w-5 h-5 transform group-hover:-translate-y-1 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>

      <CookieConsent />
    </div>
  );
}

