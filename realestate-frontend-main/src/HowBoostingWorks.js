import React from "react";
import { useLanguage } from "./context/LanguageContext";
import { Link } from "react-router-dom";

export default function HowBoostingWorks() {
  const { t } = useLanguage();

  const benefits = [
    {
      icon: "⭐",
      title: t('benefit1Title'),
      description: t('benefit1Desc')
    },
    {
      icon: "🔝",
      title: t('benefit2Title'),
      description: t('benefit2Desc')
    },
    {
      icon: "🏠",
      title: t('benefit3Title'),
      description: t('benefit3Desc')
    },
    {
      icon: "📈",
      title: t('benefit4Title'),
      description: t('benefit4Desc')
    },
    {
      icon: "⚡",
      title: t('benefit5Title'),
      description: t('benefit5Desc')
    },
    {
      icon: "📅",
      title: t('benefit6Title'),
      description: t('benefit6Desc')
    }
  ];

  const steps = [
    t('howToStep1'),
    t('howToStep2'),
    t('howToStep3'),
    t('howToStep4')
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
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 mb-8 text-white">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{t('howBoostingTitle')}</h1>
          <p className="text-purple-100">{t('howBoostingSubtitle')}</p>
        </div>

        {/* What Is Section */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('whatIsBoost')}</h2>
          <p className="text-gray-600 text-lg">{t('whatIsBoostDesc')}</p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <div className="text-4xl mb-4">{benefit.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-gray-600">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* How To Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('howToBoostTitle')}</h2>
          <ol className="space-y-4">
            {steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                </div>
                <p className="text-gray-700 pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Pricing & Renewal */}
        <div className="space-y-4 mb-8">
          <div className="bg-green-50 border-l-4 border-green-400 rounded-lg p-6">
            <p className="text-gray-700 font-bold mb-2">{t('pricingTitle')}</p>
            <p className="text-gray-600">{t('pricingDesc')}</p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="text-center">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-semibold shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {t('boostYourProperty')}
          </Link>
        </div>
      </div>
    </div>
  );
}
