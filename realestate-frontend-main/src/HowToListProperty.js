import React from "react";
import { useLanguage } from "./context/LanguageContext";
import { Link } from "react-router-dom";

export default function HowToListProperty() {
  const { t } = useLanguage();

  const steps = [
    {
      number: 1,
      icon: "👤",
      title: t('stepAccount'),
      description: t('stepAccountDesc')
    },
    {
      number: 2,
      icon: "➕",
      title: t('stepClickAdd'),
      description: t('stepClickAddDesc')
    },
    {
      number: 3,
      icon: "📝",
      title: t('stepFillDetails'),
      description: t('stepFillDetailsDesc')
    },
    {
      number: 4,
      icon: "📸",
      title: t('stepUploadPhotos'),
      description: t('stepUploadPhotosDesc')
    },
    {
      number: 5,
      icon: "📍",
      title: t('stepAddLocation'),
      description: t('stepAddLocationDesc')
    },
    {
      number: 6,
      icon: "✅",
      title: t('stepSubmit'),
      description: t('stepSubmitDesc')
    }
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('howToListTitle')}</h1>
          <p className="text-blue-100">{t('howToListSubtitle')}</p>
        </div>

        {/* Steps */}
        <div className="space-y-6 mb-8">
          {steps.map((step) => (
            <div key={step.number} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {step.number}
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.icon} {step.title}
                  </h3>
                  <p className="text-gray-600">{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6">
          <p className="text-gray-700 font-bold mb-2">{t('quickTips')}</p>
          <ul className="text-gray-600 space-y-1 ml-4">
            <li>✓ {t('tipQuality')}</li>
            <li>✓ {t('tipHonest')}</li>
            <li>✓ {t('tipRespond')}</li>
            <li>✓ {t('tipUpdate')}</li>
          </ul>
        </div>

        {/* CTA Button */}
        <div className="mt-8 text-center">
          <Link
            to="/add-listing"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('startListingNow')}
          </Link>
        </div>
      </div>
    </div>
  );
}
