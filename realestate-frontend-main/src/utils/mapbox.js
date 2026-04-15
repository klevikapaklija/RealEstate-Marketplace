/**
 * Mapbox API Utilities
 * 
 * Direct client-side integration with Mapbox APIs.
 * This works with domain-restricted production tokens because
 * the requests come from the browser, not the server.
 */

// Get Mapbox token from environment variable
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;

/**
 * Geocode an address to coordinates (lat/lng)
 * Costs money on Mapbox, use sparingly!
 */
export async function geocodeAddress(address) {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured');
  }

  // Add ", Albania" if not present
  const searchQuery = address.toLowerCase().includes('albania') 
    ? address 
    : `${address}, Albania`;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`;
  
  const params = new URLSearchParams({
    access_token: MAPBOX_TOKEN,
    limit: '5',
    country: 'AL', // Albania
    types: 'place,locality,neighborhood,address,poi',
    proximity: '19.8187,41.3275' // Tirana center
  });

  const response = await fetch(`${url}?${params}`);
  
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  if (!data.features || data.features.length === 0) {
    throw new Error('No results found');
  }

  // City matching logic for better accuracy
  const cityKeywords = {
    'tirana': ['tirana', 'tiranë', 'tirane'],
    'durrës': ['durrës', 'durres', 'durazzo'],
    'vlorë': ['vlorë', 'vlore', 'valona'],
    'shkodër': ['shkodër', 'shkoder', 'scutari'],
    'elbasan': ['elbasan'],
    'korçë': ['korçë', 'korce', 'korca'],
    'fier': ['fier'],
    'berat': ['berat'],
    'lushnjë': ['lushnjë', 'lushnje'],
    'kavajë': ['kavajë', 'kavaje'],
    'gjirokastër': ['gjirokastër', 'gjirokaster'],
    'sarandë': ['sarandë', 'sarande', 'saranda']
  };

  const addressLower = address.toLowerCase();
  let targetCity = null;

  for (const [city, keywords] of Object.entries(cityKeywords)) {
    if (keywords.some(keyword => addressLower.includes(keyword))) {
      targetCity = city;
      break;
    }
  }

  // Try to find matching result
  let feature = data.features[0];
  
  if (targetCity) {
    for (const f of data.features) {
      const placeNameLower = (f.place_name || '').toLowerCase();
      const keywords = cityKeywords[targetCity];
      
      if (keywords.some(keyword => placeNameLower.includes(keyword))) {
        feature = f;
        break;
      }
    }
  }

  return {
    address: feature.place_name,
    latitude: feature.center[1],
    longitude: feature.center[0],
    raw: feature
  };
}

/**
 * Generate a static map image URL
 * No API call needed - just constructs the URL
 */
export function getStaticMapUrl(longitude, latitude, options = {}) {
  if (!MAPBOX_TOKEN) {
    throw new Error('Mapbox token not configured');
  }

  const {
    width = 600,
    height = 400,
    zoom = 14,
    style = 'streets-v11', // streets-v11, outdoors-v11, light-v10, dark-v10
    markerColor = '3b82f6' // Blue marker (hex without #)
  } = options;

  // Format: /styles/v1/mapbox/{style}/static/{overlay}/{lon},{lat},{zoom},{bearing},{pitch}/{width}x{height}{@2x}
  return (
    `https://api.mapbox.com/styles/v1/mapbox/${style}/static/` +
    `pin-s+${markerColor}(${longitude},${latitude})/` +
    `${longitude},${latitude},${zoom},0,0/` +
    `${width}x${height}` +
    `?access_token=${MAPBOX_TOKEN}`
  );
}

/**
 * Generate a static map URL from an address by geocoding it first
 * This combines geocoding + static map generation
 */
export async function getStaticMapUrlFromAddress(address, options = {}) {
  const coords = await geocodeAddress(address);
  return getStaticMapUrl(coords.longitude, coords.latitude, options);
}

/**
 * Check if Mapbox is configured
 */
export function isMapboxConfigured() {
  return Boolean(MAPBOX_TOKEN && MAPBOX_TOKEN !== 'your_mapbox_token_here');
}
