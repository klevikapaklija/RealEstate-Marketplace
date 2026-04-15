import React from 'react';

function BoostBadge({ listing, className = "" }) {
  if (!listing.boosted || listing.boosted === 0) {
    return null;
  }

  // Calculate days remaining
  const getBoostDaysRemaining = (expiresAt) => {
    if (!expiresAt) return 0;
    const expireDate = new Date(expiresAt);
    const today = new Date();
    const diffTime = expireDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const daysLeft = listing.boost_expires_at ? getBoostDaysRemaining(listing.boost_expires_at) : 0;

  return (
    <div className={`boost-badge ${className}`}>
      <div className="flex items-center gap-1">
        <span className="text-lg">⭐</span>
        <span className="font-bold text-sm">FEATURED</span>
      </div>
      {daysLeft > 0 && (
        <div className="text-xs opacity-90 mt-1">
          {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
        </div>
      )}
      
      <style jsx>{`
        .boost-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: linear-gradient(135deg, #ffd700, #ffed4e);
          color: #000;
          padding: 8px 12px;
          border-radius: 20px;
          font-weight: bold;
          text-align: center;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
          z-index: 10;
          border: 2px solid rgba(255, 255, 255, 0.8);
        }
        
        .boost-badge:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
      `}</style>
    </div>
  );
}

export default BoostBadge;

