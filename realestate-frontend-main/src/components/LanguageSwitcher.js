import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

function LanguageSwitcher({ className = "" }) {
  const { language, setLanguage, isAlbanian } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Current Language Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        title={isAlbanian ? "Ndrysho gjuhën" : "Change language"}
      >
        {/* Current Flag - Small */}
        <span className="text-base">
          {isAlbanian ? '🇦🇱' : '🇬🇧'}
        </span>
        {/* Dropdown Arrow */}
        <svg 
          className={`w-3 h-3 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 md:w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* Albanian Option */}
          <button
            onClick={() => handleLanguageChange('al')}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              isAlbanian ? 'bg-blue-50' : ''
            }`}
          >
            <span className="text-2xl">🇦🇱</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Shqip</p>
              <p className="text-xs text-gray-500">Albanian</p>
            </div>
            {isAlbanian && (
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* English Option */}
          <button
            onClick={() => handleLanguageChange('en')}
            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
              !isAlbanian ? 'bg-blue-50' : ''
            }`}
          >
            <span className="text-2xl">🇬🇧</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">English</p>
              <p className="text-xs text-gray-500">United Kingdom</p>
            </div>
            {!isAlbanian && (
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default LanguageSwitcher;

