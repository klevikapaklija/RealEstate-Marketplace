import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { auth } from '../firebase';
import API_URL from '../config';
import axios from 'axios';

const FavoritesContext = createContext();

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider');
  }
  return context;
}

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch favorites from backend when user logs in
  useEffect(() => {
    if (!user?.firebase_uid) {
      const saved = localStorage.getItem('favorites');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (err) {
          console.error('Error loading favorites from localStorage:', err);
        }
      }
      setLoading(false);
      return;
    }
    
    const fetchFavorites = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setLoading(false);
          return;
        }
        
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API_URL}/users/${user.firebase_uid}/favorites`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setFavorites(data);
            localStorage.setItem('favorites', JSON.stringify(data));
          }
        } else {
          // Fallback to localStorage on error
          const saved = localStorage.getItem('favorites');
          if (saved) {
            try {
              setFavorites(JSON.parse(saved));
            } catch (e) {
              console.error('Error parsing localStorage favorites:', e);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching favorites:', err);
        const saved = localStorage.getItem('favorites');
        if (saved) {
          try {
            setFavorites(JSON.parse(saved));
          } catch (e) {
            console.error('Error parsing localStorage favorites:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchFavorites();
  }, [user?.firebase_uid]);

  // Add favorite (sync to backend if logged in)
  const addFavorite = async (listingId) => {
    // Ensure listingId is a number
    const numericId = typeof listingId === 'string' ? parseInt(listingId, 10) : listingId;
    
    if (favorites.includes(numericId)) {
      return;
    }

    // Optimistically update UI
    const newFavorites = [...favorites, numericId];
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));

    // Sync to backend if logged in
    if (user?.firebase_uid) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          await fetch(`${API_URL}/users/${user.firebase_uid}/favorites/${numericId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (err) {
        console.error('Error adding favorite to backend:', err);
      }
    }
  };

  // Remove favorite (sync to backend if logged in)
  const removeFavorite = async (listingId) => {
    // Ensure listingId is a number
    const numericId = typeof listingId === 'string' ? parseInt(listingId, 10) : listingId;
    
    // Optimistically update UI
    const newFavorites = favorites.filter(id => id !== numericId);
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));

    // Sync to backend if logged in
    if (user?.firebase_uid) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const token = await currentUser.getIdToken();
          await fetch(`${API_URL}/users/${user.firebase_uid}/favorites/${numericId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }
      } catch (err) {
        console.error('Error removing favorite from backend:', err);
      }
    }
  };

  const toggleFavorite = (listingId) => {
    if (favorites.includes(listingId)) {
      removeFavorite(listingId);
    } else {
      addFavorite(listingId);
    }
  };

  const isFavorite = (listingId) => {
    return favorites.includes(listingId);
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        isFavorite,
        count: favorites.length,
        loading
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

