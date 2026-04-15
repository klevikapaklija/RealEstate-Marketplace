import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

export default function CookieConsent() {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true, // Always true, can't be disabled
    analytics: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      const savedPreferences = JSON.parse(cookieConsent);
      setPreferences(savedPreferences);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
    };
    savePreferences(allAccepted);
  };

  const handleAcceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
    };
    savePreferences(necessaryOnly);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
    setShowSettings(false);
  };

  const savePreferences = async (prefs) => {
    // Save to localStorage
    localStorage.setItem('cookieConsent', JSON.stringify(prefs));
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setPreferences(prefs);
    setShowBanner(false);
    
    // Dispatch event for Google Analytics to listen to
    const consentEvent = new CustomEvent('cookieConsentUpdated', {
      detail: prefs
    });
    window.dispatchEvent(consentEvent);
    
    // Generate or retrieve consent ID for non-logged-in users
    let consentId = localStorage.getItem('consentId');
    if (!consentId && !currentUser) {
      // Generate unique consent ID for anonymous users
      consentId = 'consent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('consentId', consentId);
    }
    
    // Save to backend database
    try {
      const token = currentUser?.accessToken;
      
      await fetch(`${API_URL}/consent/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          consent_type: 'cookies',
          version: 'v1.0',
          accepted: true,
          cookie_preferences: prefs,
          consent_id: token ? undefined : consentId, // Send consent_id only for non-logged-in users
        })
      });
      
      
    } catch (error) {
      
      // Continue anyway - localStorage is saved
    }
    
    // Log consent status
    if (prefs.analytics) {
      console.log('✅ Analytics tracking enabled by user');
    } else {
      console.log('🚫 Analytics tracking disabled by user');
    }
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-white border-t-4 border-blue-600 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {!showSettings ? (
              // Simple Banner
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        🍪 {t('cookieConsentTitle')}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {t('cookieConsentText')}{' '}
                        <Link to="/privacy-policy" className="text-blue-600 hover:underline font-semibold">
                          {t('privacyPolicy')}
                        </Link>
                        {' '}{t('and')}{' '}
                        <Link to="/terms-of-service" className="text-blue-600 hover:underline font-semibold">
                          {t('cookiePolicy')}
                        </Link>
                        .
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    {t('cookieSettings')}
                  </button>
                  <button
                    onClick={handleAcceptNecessary}
                    className="px-4 py-2.5 border-2 border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold"
                  >
                    {t('cookieNecessaryOnly')}
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg"
                  >
                    {t('cookieAcceptAll')}
                  </button>
                </div>
              </div>
            ) : (
              // Detailed Settings
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {t('cookieSettingsTitle')}
                  </h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <p className="text-sm text-gray-600">
                  {t('cookieSettingsDescription')}
                </p>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {/* Necessary Cookies */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-gray-900">{t('cookieNecessaryTitle')}</h4>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                            {t('cookieAlwaysActive')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{t('cookieNecessaryDescription')}</p>
                      </div>
                      <div className="ml-4">
                        <input
                          type="checkbox"
                          checked={true}
                          disabled
                          className="w-5 h-5 text-blue-600 rounded"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Analytics Cookies */}
                  <div className="p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{t('cookieAnalyticsTitle')}</h4>
                        <p className="text-sm text-gray-600">{t('cookieAnalyticsDescription')}</p>
                      </div>
                      <div className="ml-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={preferences.analytics}
                            onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={handleAcceptNecessary}
                    className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    {t('cookieNecessaryOnly')}
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg"
                  >
                    {t('cookieSavePreferences')}
                  </button>
                  <button
                    onClick={handleAcceptAll}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold shadow-lg"
                  >
                    {t('cookieAcceptAll')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-30 z-40"></div>
    </>
  );
}

