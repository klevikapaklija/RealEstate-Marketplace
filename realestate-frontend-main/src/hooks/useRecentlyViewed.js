import { useEffect } from 'react';

const MAX_RECENT_ITEMS = 10;

export function useRecentlyViewed(listingId) {
  useEffect(() => {
    if (!listingId) return;

    // Get existing recent items
    const recentStr = localStorage.getItem('recentlyViewed');
    let recent = recentStr ? JSON.parse(recentStr) : [];

    // Remove the current item if it exists
    recent = recent.filter(id => id !== listingId);

    // Add current item to the front
    recent.unshift(listingId);

    // Keep only the last MAX_RECENT_ITEMS
    recent = recent.slice(0, MAX_RECENT_ITEMS);

    // Save back to localStorage
    localStorage.setItem('recentlyViewed', JSON.stringify(recent));

    
  }, [listingId]);
}

export function getRecentlyViewed() {
  const recentStr = localStorage.getItem('recentlyViewed');
  return recentStr ? JSON.parse(recentStr) : [];
}

export function clearRecentlyViewed() {
  localStorage.removeItem('recentlyViewed');
  
}

