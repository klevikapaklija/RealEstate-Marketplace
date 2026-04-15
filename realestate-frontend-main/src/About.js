import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';

function About() {
  const { t } = useLanguage();

  const stats = [
    {
      number: '1000+',
      labelKey: 'aboutStatsProperties',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      number: '500+',
      labelKey: 'aboutStatsClients',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    }
  ];

  const values = [
    {
      titleKey: 'aboutValueTrust',
      descKey: 'aboutValueTrustDesc',
      icon: (
        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      titleKey: 'aboutValueInnovation',
      descKey: 'aboutValueInnovationDesc',
      icon: (
        <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      )
    },
    {
      titleKey: 'aboutValueExcellence',
      descKey: 'aboutValueExcellenceDesc',
      icon: (
        <svg className="w-12 h-12 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      )
    }
  ];

  return (
    <div className="font-sans text-primary-900 bg-white">
      {/* Hero Section - Apple Minimalist */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden bg-white">
        {/* Subtle Mesh Gradient Background */}
        <div className="absolute inset-0 bg-white">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-accent-50/50 rounded-full blur-3xl opacity-60 animate-float"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-50/30 rounded-full blur-3xl opacity-60 animate-float" style={{ animationDelay: '2s' }}></div>

          {/* Static 'Time and Vision' Background SVG */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <svg className="absolute top-0 left-0 w-full h-full text-gray-300" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Abstract representation of Time (Flowing lines) and Vision (Focus/Eye shape) */}
              <path d="M0 100 C 20 0 50 0 100 100 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.8" />
              <path d="M0 100 C 30 20 70 20 100 100 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.6" />
              <path d="M0 100 C 40 40 60 40 100 100 Z" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4" />

              {/* Subtle Grid/Network for 'Vision/Structure' */}
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#grid)" opacity="0.4" />
            </svg>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[980px] mx-auto px-6 text-center">
          <div className="space-y-8 animate-fade-in-up">
            {/* Badge - Minimalist Pill */}
            <div className="inline-flex items-center gap-2 bg-gray-100/80 backdrop-blur-md border border-gray-200/50 rounded-full px-4 py-1.5 text-xs font-medium text-primary-600 shadow-sm">
              <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
              <span className="tracking-wide uppercase">{t('aboutUs')}</span>
            </div>

            {/* Main Heading - SF Pro Style */}
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-primary-900 leading-[1.1]">
              {t('aboutHeroTitle')}
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-primary-500 max-w-2xl mx-auto font-normal leading-relaxed tracking-tight">
              {t('aboutHeroSubtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-[980px] mx-auto px-6 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-3xl shadow-soft border border-gray-100 p-8 text-center hover:shadow-medium transition-all duration-300 group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-50 rounded-2xl mb-6 text-primary-900 group-hover:scale-110 transition-transform duration-500">
                {stat.icon}
              </div>
              <div className="text-4xl font-bold text-primary-900 mb-2 tracking-tight">
                {stat.number}
              </div>
              <div className="text-primary-500 font-medium">
                {t(stat.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Our Story Section */}
      <section className="max-w-[980px] mx-auto px-6 py-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-semibold text-primary-900 mb-8 tracking-tight">
              {t('aboutStoryTitle')}
            </h2>
            <div className="space-y-6 text-primary-500 leading-relaxed text-lg">
              <p>{t('aboutStoryPara1')}</p>
              <p>{t('aboutStoryPara2')}</p>
              <p>{t('aboutStoryPara3')}</p>
            </div>
          </div>
          <div className="relative group">
            <div className="aspect-square rounded-3xl overflow-hidden shadow-soft group-hover:shadow-medium transition-all duration-500">
              <img
                src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80"
                alt="Modern house"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            </div>
            {/* Decorative Element */}
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-accent-50 rounded-3xl -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform duration-500"></div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="bg-primary-50 py-32">
        <div className="max-w-[980px] mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-semibold text-primary-900 mb-6 tracking-tight">
              {t('aboutValuesTitle')}
            </h2>
            <p className="text-xl text-primary-500 max-w-2xl mx-auto leading-relaxed">
              {t('aboutValuesSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-3xl p-8 shadow-soft hover:shadow-medium transition-all duration-300 group">
                <div className="mb-6 transform group-hover:scale-110 transition-transform duration-500">
                  {value.icon}
                </div>
                <h3 className="text-xl font-semibold text-primary-900 mb-3">
                  {t(value.titleKey)}
                </h3>
                <p className="text-primary-500 leading-relaxed">
                  {t(value.descKey)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-[980px] mx-auto px-6 py-32 text-center">
        <div className="bg-primary-900 rounded-3xl p-12 md:p-20 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">
              {t('aboutCTATitle')}
            </h2>
            <p className="text-xl text-primary-200 mb-10 max-w-2xl mx-auto">
              {t('aboutCTASubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/listings"
                className="bg-white text-primary-900 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {t('aboutCTABrowse')}
              </Link>
              <Link
                to="/contact"
                className="bg-transparent border border-white/30 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
              >
                {t('aboutCTAContact')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;

