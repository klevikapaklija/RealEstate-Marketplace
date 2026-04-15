// Google Analytics 4 Event Tracking Utilities

/**
 * Check if analytics tracking is allowed based on user consent
 */
const isTrackingAllowed = () => {
  try {
    const consent = localStorage.getItem('cookieConsent');
    if (consent) {
      const consentData = JSON.parse(consent);
      return consentData.analytics === true;
    }
    return false;
  } catch (e) {
    return false;
  }
};

/**
 * Track page views in Google Analytics
 * Call this when navigating between pages
 */
export const trackPageView = (pagePath, pageTitle) => {
  if (!isTrackingAllowed() || !window.gtag) {
    console.log('📊 GA4 tracking disabled - user has not consented to analytics');
    return;
  }
  
  window.gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: pageTitle
  });
  console.log('📊 GA4 Page View:', pagePath);
};

/**
 * Track custom events in Google Analytics
 * @param {string} eventName - Name of the event (e.g., 'listing_view', 'contact_click')
 * @param {object} eventParams - Additional parameters for the event
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (!isTrackingAllowed() || !window.gtag) {
    return;
  }
  
  window.gtag('event', eventName, eventParams);
  console.log('📊 GA4 Event:', eventName, eventParams);
};

/**
 * Track when a user views a listing
 */
export const trackListingView = (listingId, listingTitle, price, type) => {
  trackEvent('listing_view', {
    listing_id: listingId,
    listing_title: listingTitle,
    price: price,
    listing_type: type // 'sale' or 'rent'
  });
};

/**
 * Track when a user contacts about a property
 */
export const trackContactClick = (listingId, contactMethod) => {
  trackEvent('contact_click', {
    listing_id: listingId,
    contact_method: contactMethod // 'phone', 'email', 'whatsapp'
  });
};

/**
 * Track when a user adds a listing to favorites
 */
export const trackAddToFavorites = (listingId) => {
  trackEvent('add_to_favorites', {
    listing_id: listingId
  });
};

/**
 * Track when a user removes a listing from favorites
 */
export const trackRemoveFromFavorites = (listingId) => {
  trackEvent('remove_from_favorites', {
    listing_id: listingId
  });
};

/**
 * Track search queries
 */
export const trackSearch = (searchTerm, filterType, propertyType, resultsCount) => {
  trackEvent('search', {
    search_term: searchTerm,
    filter_type: filterType, // 'all', 'sale', 'rent'
    property_type: propertyType, // 'all', 'apartment', 'house', etc.
    results_count: resultsCount
  });
};

/**
 * Track when a user submits a listing
 */
export const trackListingSubmit = (propertyType, price, location) => {
  trackEvent('listing_submit', {
    property_type: propertyType,
    price: price,
    location: location
  });
};

/**
 * Track user registration
 */
export const trackUserRegister = (method) => {
  trackEvent('sign_up', {
    method: method // 'google', 'email'
  });
};

/**
 * Track user login
 */
export const trackUserLogin = (method) => {
  trackEvent('login', {
    method: method // 'google', 'email'
  });
};

/**
 * Track when a user boosts a listing
 */
export const trackListingBoost = (listingId, boostLevel, price) => {
  trackEvent('listing_boost', {
    listing_id: listingId,
    boost_level: boostLevel,
    price: price
  });
};

/**
 * Track payment success
 */
export const trackPaymentSuccess = (amount, currency, paymentMethod) => {
  trackEvent('purchase', {
    value: amount,
    currency: currency || 'EUR',
    payment_type: paymentMethod // 'paypal'
  });
};

/**
 * Track when user views partnerships page
 */
export const trackPartnershipsView = (partnershipType) => {
  trackEvent('partnerships_view', {
    partnership_type: partnershipType // 'sponsor' or 'investor'
  });
};

/**
 * Track partnership inquiry submission
 */
export const trackPartnershipsSubmit = (partnershipType, investmentAmount) => {
  trackEvent('partnerships_inquiry', {
    partnership_type: partnershipType,
    investment_amount: investmentAmount || null
  });
};
