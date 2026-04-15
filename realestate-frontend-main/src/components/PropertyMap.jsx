import { useEffect, useState, useRef, useMemo, memo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { getImageUrl } from '../utils/imageUtils';

// Set Mapbox token from environment variable
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

const PropertyMap = memo(function PropertyMap({ listings = [], center = null, hoveredListingId = null, onBoundsChange = null }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef(new Map()); // Use Map for efficient marker lookup by listing ID
  const hasInitiallyFit = useRef(false); // Track if we've done initial fitBounds
  const boundsChangeTimeout = useRef(null); // Debounce bounds changes
  const lastCenterKey = useRef(null); // Track last center to avoid re-centering
  const [loading, setLoading] = useState(true);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState(null);

  // Create a stable string key from listing IDs to detect actual changes
  // Round coordinates to avoid floating-point precision issues
  const listingsKey = useMemo(() => {
    const key = listings
      .map(l => `${l.id}-${l.latitude?.toFixed(6)}-${l.longitude?.toFixed(6)}`)
      .sort()
      .join('|');
    console.log('🔑 listingsKey updated:', key.substring(0, 100) + '...');
    return key;
  }, [listings]);

  // Check if Mapbox is configured on mount
  useEffect(() => {
    console.log('🔵 Checking Mapbox configuration...');
    
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'your_mapbox_token_here') {
      console.error('❌ Mapbox token not configured');
      setError('Mapbox token not configured. Please add REACT_APP_MAPBOX_ACCESS_TOKEN to your environment variables.');
      setLoading(false);
      return;
    }
    
    console.log('✅ Mapbox token found, setting up...');
    mapboxgl.accessToken = MAPBOX_TOKEN;
    setLoading(false);
  }, []);

  // Initialize map - ONLY ONCE per component lifecycle
  useEffect(() => {
    if (loading || error) {
      console.log('⏳ Waiting for configuration...');
      return;
    }
    
    if (map.current) {
      console.log('✅ Map already initialized - reusing existing instance');
      return;
    }

    console.log('🗺️ Initializing NEW map instance');

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [19.8187, 41.3275], // Center of Albania (Tirana)
        zoom: 8,
        pitch: 0, // 2D view (0 degrees pitch)
        bearing: 0, // North-up orientation
        maxBounds: [
          [18.5, 39.0], // Southwest coordinates of Albania
          [21.5, 43.0]  // Northeast coordinates of Albania
        ],
        minZoom: 6.5, // Prevent zooming out too far from Albania
        maxZoom: 18,
        dragRotate: false, // Disable rotation for 2D view
        touchPitch: false, // Disable pitch on touch devices
        preserveDrawingBuffer: true // Optimize for performance
      });

      map.current.on('load', () => {
        console.log('✅ Map loaded successfully');
        setMapLoaded(true);
        
        // Disable 3D terrain and pitch controls
        map.current.touchZoomRotate.disableRotation();
        
        // Add bounds change listener for filtering listings by visible area
        if (onBoundsChange) {
          const handleBoundsChange = () => {
            // Debounce to avoid too many updates while dragging
            if (boundsChangeTimeout.current) {
              clearTimeout(boundsChangeTimeout.current);
            }
            
            boundsChangeTimeout.current = setTimeout(() => {
              const bounds = map.current.getBounds();
              console.log('🗺️ Map bounds changed:', bounds);
              onBoundsChange(bounds);
            }, 500); // Increased debounce to reduce API calls
          };
          
          // Listen to moveend (fires after pan/zoom completes, not during drag)
          map.current.on('moveend', handleBoundsChange);
        }
      });

      map.current.on('error', (e) => {
        console.error('❌ Map error:', e);
        setError('Map failed to load');
      });

      // Add navigation controls (zoom only, no rotation)
      const nav = new mapboxgl.NavigationControl({
        showCompass: false, // Hide compass for 2D view
        visualizePitch: false
      });
      map.current.addControl(nav, 'top-right');

      // Add fullscreen control
      map.current.addControl(new mapboxgl.FullscreenControl());

    } catch (err) {
      console.error('❌ Map initialization error:', err);
      setError(err.message);
    }

    return () => {
      if (map.current) {
        console.log('🧹 Cleaning up map...');
        map.current.remove();
        map.current = null;
      }
    };
  }, [loading, error]);

  // Handle center prop changes (for geocoding search) - only fly to new locations
  useEffect(() => {
    if (!map.current || !mapLoaded || !center) return;

    // Create a unique key for this center location
    const centerKey = `${center.lng.toFixed(4)}-${center.lat.toFixed(4)}`;
    
    // Only fly if this is a NEW location (not the same one)
    if (lastCenterKey.current === centerKey) {
      console.log('⏭️ Skipping flyTo - already at this location');
      return;
    }

    console.log(`🎯 Flying to NEW searched location: [${center.lng}, ${center.lat}]`);
    lastCenterKey.current = centerKey;

    map.current.flyTo({
      center: [center.lng, center.lat],
      zoom: center.zoom || 12,
      duration: 2000,
      essential: true
    });
  }, [center, mapLoaded]);

  // Add/update/remove markers for listings - ONLY when listings actually change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    console.log(`📍 [MARKER SYNC] Starting - ${listings.length} total listings`);
    console.log(`📍 [MARKER SYNC] Current markers on map: ${markers.current.size}`);

    // Get valid listings with coordinates
    const validListings = listings.filter(l => l.latitude && l.longitude);
    console.log(`✅ ${validListings.length} listings have valid coordinates`);

    // Create a Set of current listing IDs for efficient lookup
    const currentListingIds = new Set(validListings.map(l => l.id));

    // Remove markers for listings that no longer exist
    let removedCount = 0;
    markers.current.forEach((markerData, listingId) => {
      if (!currentListingIds.has(listingId)) {
        console.log(`🗑️ Removing marker for listing ${listingId}`);
        markerData.marker.remove();
        markers.current.delete(listingId);
        removedCount++;
      }
    });
    if (removedCount > 0) console.log(`🗑️ Removed ${removedCount} markers`);

    // Add or update markers for each listing
    let addedCount = 0;
    let skippedCount = 0;
    
    validListings.forEach(listing => {
      // Skip if marker already exists at same coordinates
      const existingMarker = markers.current.get(listing.id);
      if (existingMarker) {
        // Verify coordinates haven't changed
        const coordsChanged = 
          existingMarker.lng !== listing.longitude || 
          existingMarker.lat !== listing.latitude;
        
        if (coordsChanged) {
          console.log(`⚠️ Coordinates changed for listing ${listing.id}, updating marker`);
          existingMarker.marker.setLngLat([listing.longitude, listing.latitude]);
          existingMarker.lng = listing.longitude;
          existingMarker.lat = listing.latitude;
        } else {
          skippedCount++;
        }
        return;
      }

      console.log(`➕ Adding NEW marker for listing ${listing.id} at [${listing.longitude}, ${listing.latitude}]`);
      addedCount++;

      // Check if listing is boosted
      const isBoosted = listing.boosted > 0;

      // Create custom marker element with conditional styling for boosted listings
      const el = document.createElement('div');
      el.className = 'custom-marker-wrapper';
      el.innerHTML = `
        <div class="marker-pin ${isBoosted ? 'boosted' : ''}">
          <div class="marker-dot ${isBoosted ? 'boosted' : ''}"></div>
        </div>
      `;
      el.style.cursor = 'pointer';

      // Create marker at EXACT coordinate - it will NEVER move
      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'bottom',
        draggable: false // Ensure markers cannot be dragged
      })
        .setLngLat([listing.longitude, listing.latitude])
        .setPopup(
          new mapboxgl.Popup({ 
            offset: 25,
            closeButton: true,
            closeOnClick: true,
            className: 'custom-popup',
            maxWidth: '300px' // Limit popup width
          })
            .setHTML(`
              <div class="listing-popup">
                ${listing.images && listing.images.length > 0 ? 
                  `<div class="popup-image-wrapper">
                    <img src="${getImageUrl(listing.images[0])}" 
                         alt="${listing.title}"
                         class="popup-image" />
                    ${listing.boosted > 0 ? `
                      <span class="popup-badge badge-featured">
                        ⭐ FEATURED
                      </span>
                    ` : ''}
                  </div>` 
                  : ''}
                <div class="popup-content">
                  <h3 class="popup-title">${listing.title}</h3>
                  <p class="popup-price">€${listing.price.toLocaleString()}</p>
                  <div class="popup-details">
                    ${(listing.property_type === 'apartment' || listing.property_type === 'private_home') ? `
                      <span class="detail-item">
                        <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        ${listing.rooms} beds
                      </span>
                      <span class="detail-item">
                        <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                        </svg>
                        ${listing.bathrooms} baths
                      </span>
                    ` : ''}
                    <span class="detail-item">
                      <svg class="detail-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                      ${listing.size} m²
                    </span>
                  </div>
                  <p class="popup-location">
                    <svg class="location-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    ${listing.location}
                  </p>
                  <a href="/listing/${listing.id}" class="popup-button">
                    View Details
                    <svg class="button-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </div>
              </div>
            `)
        )
        .addTo(map.current);

      // Store marker with its listing ID and element for hover effects
      markers.current.set(listing.id, { 
        marker: marker,
        element: el,
        lng: listing.longitude,
        lat: listing.latitude
      });
    });

    console.log(`✅ [MARKER SYNC COMPLETE] Total: ${markers.current.size} | Added: ${addedCount} | Skipped: ${skippedCount} | Removed: ${removedCount}`);

    // ONLY fit bounds on very first load
    if (!hasInitiallyFit.current && validListings.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      validListings.forEach(listing => {
        bounds.extend([listing.longitude, listing.latitude]);
      });

      // Wait for markers to be fully rendered
      setTimeout(() => {
        if (map.current) {
          map.current.fitBounds(bounds, {
            padding: { top: 80, bottom: 80, left: 80, right: 80 },
            maxZoom: 13,
            duration: 1500,
            essential: true
          });
          
          hasInitiallyFit.current = true;
          console.log('🎯 Initial fitBounds completed - will NEVER run again');
        }
      }, 100);
    } else {
      console.log('⏭️ Skipping fitBounds - user viewport preserved');
    }
  }, [listingsKey, mapLoaded]); // Use stable listingsKey instead of listings array

  // Handle hover effect - enlarge marker when listing is hovered
  useEffect(() => {
    if (!mapLoaded || markers.current.size === 0) return;

    markers.current.forEach((markerData, listingId) => {
      const isHovered = listingId === hoveredListingId;
      const markerPin = markerData.element.querySelector('.marker-pin');
      
      if (markerPin) {
        if (isHovered) {
          // Enlarge the hovered marker with smooth transition
          markerPin.style.transform = 'scale(1.5)';
          markerPin.style.transition = 'transform 0.2s ease-out';
          markerPin.style.zIndex = '1000';
        } else {
          // Reset to normal size
          markerPin.style.transform = 'scale(1)';
          markerPin.style.transition = 'transform 0.2s ease-out';
          markerPin.style.zIndex = '1';
        }
      }
    });
  }, [hoveredListingId, mapLoaded]);

  // Show error state
  if (error) {
    return (
      <div style={{ 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#fee',
        color: '#c00',
        padding: '20px',
        textAlign: 'center',
        borderRadius: '12px'
      }}>
        <div>
          <h3>❌ Map Error</h3>
          <p>{error}</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            Check browser console for details
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <p style={{ color: '#666' }}>Loading map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '20px', textAlign: 'center' }}>
        <svg style={{ width: '48px', height: '48px', color: '#ef4444', marginBottom: '12px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p style={{ color: '#666', fontWeight: 'bold', marginBottom: '8px' }}>Map Error</p>
        <p style={{ color: '#999', fontSize: '14px' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div 
        ref={mapContainer} 
        style={{ width: '100%', height: '100%' }} 
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Return true to SKIP re-render (props are equal), false to allow re-render (props changed)
  
  // 1. Check if listings array changed (by length and IDs only, not full deep comparison)
  const listingsEqual = 
    prevProps.listings.length === nextProps.listings.length &&
    prevProps.listings.every((listing, index) => {
      const nextListing = nextProps.listings[index];
      return listing.id === nextListing?.id &&
             listing.latitude === nextListing?.latitude &&
             listing.longitude === nextListing?.longitude &&
             listing.boosted === nextListing?.boosted; // Include boosted status
    });
  
  // 2. Check if center changed (for search/geocoding)
  const centerEqual = 
    prevProps.center === nextProps.center || 
    (prevProps.center?.lng === nextProps.center?.lng && 
     prevProps.center?.lat === nextProps.center?.lat &&
     prevProps.center?.zoom === nextProps.center?.zoom);
  
  // 3. Check if hovered listing changed
  const hoveredEqual = prevProps.hoveredListingId === nextProps.hoveredListingId;
  
  // 4. IMPORTANT: Don't compare callback references - they change but functionality is the same
  // This prevents unnecessary re-renders when parent component re-renders
  const callbackEqual = true; // Always consider callbacks equal
  
  // Return true to SKIP re-render
  const shouldSkipRender = listingsEqual && centerEqual && hoveredEqual && callbackEqual;
  
  if (!shouldSkipRender) {
    console.log('🔄 PropertyMap re-rendering because:', {
      listingsChanged: !listingsEqual,
      centerChanged: !centerEqual,
      hoveredChanged: !hoveredEqual
    });
  } else {
    console.log('⏭️ PropertyMap skipping re-render - props unchanged');
  }
  
  return shouldSkipRender;
});

export default PropertyMap;


