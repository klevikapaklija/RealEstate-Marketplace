import React, { useState, useEffect } from 'react';
import { useLanguage } from './context/LanguageContext';
import { useAuth } from './context/AuthContext';
import API_URL from './config';

const ConsentManagement = () => {
  const { t } = useLanguage();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consentStatus, setConsentStatus] = useState(null);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
  });

  useEffect(() => {
    // Load preferences from localStorage first (works without login)
    const savedConsent = localStorage.getItem('cookieConsent');
    if (savedConsent) {
      try {
        const consentData = JSON.parse(savedConsent);
        setPreferences(consentData);
      } catch (e) {
        console.error('Error parsing saved consent:', e);
      }
    }
    
    // If user is logged in, fetch from backend
    if (currentUser) {
      fetchConsentStatus();
    } else {
      // Not logged in - just use localStorage
      setLoading(false);
    }
  }, [currentUser]);

  const fetchConsentStatus = async () => {
    try {
      const token = currentUser?.accessToken;
      const response = await fetch(`${API_URL}/consent/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConsentStatus(data);
        
        // Update preferences from consent status
        if (data.cookie_preferences) {
          setPreferences(data.cookie_preferences);
        }
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      // Always update localStorage (works for everyone)
      localStorage.setItem('cookieConsent', JSON.stringify(preferences));
      localStorage.setItem('cookieConsentDate', new Date().toISOString());
      
      // Update Google Analytics consent
      if (window.gtag) {
        window.gtag('consent', 'update', {
          'analytics_storage': preferences.analytics ? 'granted' : 'denied',
        });
      }
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
        detail: preferences 
      }));
      
      // Log consent status
      if (preferences.analytics) {
        console.log('✅ Analytics tracking enabled by user');
      } else {
        console.log('🚫 Analytics tracking disabled by user');
      }
      
      // Generate or retrieve consent ID for non-logged-in users
      let consentId = localStorage.getItem('consentId');
      if (!consentId && !currentUser) {
        // Generate unique consent ID for anonymous users
        consentId = 'consent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('consentId', consentId);
      }
      
      // Save to backend database (works for logged in and non-logged in users)
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
            cookie_preferences: preferences,
            consent_id: token ? undefined : consentId, // Send consent_id only for non-logged-in users
          })
        });
        
        // Refresh status if user is logged in
        if (currentUser) {
          fetchConsentStatus();
        }
      } catch (error) {
        console.error('Error saving to database:', error);
        // Continue anyway - localStorage is saved
      }
      
      alert(t('preferencesSaved') || 'Preferences saved successfully!');
      
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert(t('errorSavingPreferences') || 'Error saving preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleWithdrawConsent = async () => {
    if (!window.confirm(t('confirmWithdrawConsent') || 'Are you sure you want to withdraw your consent? This will set all optional cookies to disabled.')) {
      return;
    }

    const minimalPreferences = {
      necessary: true,
      analytics: false,
    };

    setPreferences(minimalPreferences);
    setSaving(true);

    try {
      // Update localStorage
      localStorage.setItem('cookieConsent', JSON.stringify(minimalPreferences));
      localStorage.setItem('cookieConsentDate', new Date().toISOString());
      
      // Disable Google Analytics
      if (window.gtag) {
        window.gtag('consent', 'update', {
          'analytics_storage': 'denied',
        });
      }
      
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('cookieConsentUpdated', { 
        detail: minimalPreferences 
      }));
      
      // Log consent status
      console.log('🚫 Analytics tracking disabled by user');
      
      // Generate or retrieve consent ID for non-logged-in users
      let consentId = localStorage.getItem('consentId');
      if (!consentId && !currentUser) {
        // Generate unique consent ID for anonymous users
        consentId = 'consent_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('consentId', consentId);
      }
      
      // Save to backend database (works for logged in and non-logged in users)
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
            accepted: false,
            cookie_preferences: minimalPreferences,
            consent_id: token ? undefined : consentId, // Send consent_id only for non-logged-in users
          })
        });
        
        // Refresh status if user is logged in
        if (currentUser) {
          fetchConsentStatus();
        }
      } catch (error) {
        console.error('Error saving to database:', error);
        // Continue anyway - localStorage is saved
      }
      
      alert(t('consentWithdrawn') || 'Consent withdrawn successfully.');
      
    } catch (error) {
      console.error('Error withdrawing consent:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
              <div className="space-y-4">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('consentManagement') || 'Consent Management'}
            </h1>
            <p className="text-gray-600">
              {t('consentManagementDesc') || 'Manage your privacy preferences and view your consent history.'}
            </p>
          </div>

          {/* Current Status */}
          {!currentUser && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-700">
                    {t('notLoggedInNotice') || 'You are not logged in. Preferences will be saved locally on this device only. Log in to sync your preferences across devices.'}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {consentStatus && currentUser && (
            <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t('currentStatus') || 'Current Status'}
              </h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">{t('lastUpdated') || 'Last Updated'}:</span>{' '}
                  {new Date(consentStatus.timestamp).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">{t('version') || 'Version'}:</span>{' '}
                  {consentStatus.version}
                </p>
                <p>
                  <span className="font-medium">{t('status') || 'Status'}:</span>{' '}
                  <span className={`px-2 py-1 rounded ${consentStatus.accepted ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {consentStatus.accepted ? (t('consented') || 'Consented') : (t('withdrawn') || 'Withdrawn')}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* Cookie Preferences */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {t('cookiePreferences') || 'Cookie Preferences'}
            </h2>
            
            <div className="space-y-4">
              {/* Necessary Cookies */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {t('necessaryCookies') || 'Necessary Cookies'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t('necessaryCookiesDesc') || 'These cookies are essential for the website to function properly. They cannot be disabled.'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-not-allowed opacity-50">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {t('analyticsCookies') || 'Analytics Cookies'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {t('analyticsCookiesDesc') || 'These cookies help us understand how visitors interact with our website.'}
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                      className={`w-12 h-6 rounded-full relative transition ${
                        preferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition transform ${
                        preferences.analytics ? 'right-1' : 'left-1'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            <button
              onClick={handleSavePreferences}
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {saving ? (t('saving') || 'Saving...') : (t('savePreferences') || 'Save Preferences')}
            </button>
            
            <button
              onClick={handleWithdrawConsent}
              disabled={saving}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {t('withdrawConsent') || 'Withdraw Consent'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsentManagement;
