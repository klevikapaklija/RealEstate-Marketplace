import React from "react";
import { useLanguage } from "./context/LanguageContext";
import { Link } from "react-router-dom";

export default function ListingFees() {
  const { t } = useLanguage();

  const freeFeatures = [
    t('freeFeature1'),
    t('freeFeature2'),
    t('freeFeature3'),
    t('freeFeature4'),
    t('freeFeature5'),
    t('freeFeature6'),
    t('freeFeature7')
  ];

  const premiumFeatures = [
    t('premiumFeature1'),
    t('premiumFeature2'),
    t('premiumFeature3'),
    t('premiumFeature4'),
    t('premiumFeature5'),
    t('premiumFeature6')
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Link 
          to="/contact" 
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('backToContact')}
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('listingFeesTitle')}</h1>
          <p className="text-green-100">{t('listingFeesSubtitle')}</p>
        </div>

        {/* Pricing Sections */}
        <div className="space-y-8 mb-8">
          {/* Free Listing */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('freeListingTitle')}</h2>
            <p className="text-green-600 font-semibold mb-6">{t('freeListingSubtitle')}</p>
            
            <ul className="space-y-3">
              {freeFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium Boost */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('premiumBoostTitle')}</h2>
            <p className="text-green-600 font-semibold mb-6">{t('premiumBoostSubtitle')}</p>
            
            <ul className="space-y-3">
              {premiumFeatures.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Note */}
        <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-6 mb-8">
          <p className="text-gray-700 font-medium">{t('noCommissionNote')}</p>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            to="/add-listing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition font-semibold shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('getStartedFree')}
          </Link>
        </div>
      </div>
    </div>
  );
}
