import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';

const Partnerships = () => {
  const { t } = useLanguage();

  const benefits = [
    {
      title: t('globalReach'),
      description: t('globalReachDesc'),
      icon: (
        <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: t('premiumBranding'),
      description: t('premiumBrandingDesc'),
      icon: (
        <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: t('growthSupport'),
      description: t('growthSupportDesc'),
      icon: (
        <svg className="w-8 h-8 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    }
  ];

  return (
    <div className="font-sans text-primary-900 bg-white">
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 bg-white">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-accent-50/50 rounded-full blur-3xl opacity-60 animate-float"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-50/30 rounded-full blur-3xl opacity-60 animate-float" style={{ animationDelay: '2s' }}></div>

          {/* Animated Partnerships & Growth Background */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
            <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="growthGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: '#0071e3', stopOpacity: 0.6 }} />
                </linearGradient>
                <filter id="glow-soft">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Upward Growth Curve */}
              <path
                d="M-50,550 C150,550 250,450 400,300 S650,150 850,100"
                fill="none"
                stroke="url(#growthGradient)"
                strokeWidth="4"
                strokeLinecap="round"
                className="animate-draw"
                style={{ animationDuration: '3s' }}
              />

              {/* Connecting Network Lines */}
              <g className="animate-fade-in" style={{ animationDelay: '1s' }}>
                <line x1="200" y1="480" x2="400" y2="300" stroke="#0071e3" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="5,5" />
                <line x1="400" y1="300" x2="600" y2="200" stroke="#0071e3" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="5,5" />
                <line x1="200" y1="480" x2="300" y2="550" stroke="#0071e3" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="5,5" />
              </g>

              {/* Partnership Nodes */}
              <g filter="url(#glow-soft)">
                {/* Node 1 */}
                <circle cx="200" cy="480" r="12" fill="white" stroke="#6366f1" strokeWidth="3" className="animate-bounce-in" style={{ animationDelay: '0.5s' }}>
                  <animate attributeName="r" values="12;14;12" dur="3s" repeatCount="indefinite" />
                </circle>

                {/* Node 2 - Central Hub */}
                <circle cx="400" cy="300" r="20" fill="white" stroke="#0071e3" strokeWidth="4" className="animate-bounce-in" style={{ animationDelay: '1.2s' }}>
                  <animate attributeName="r" values="20;24;20" dur="4s" repeatCount="indefinite" />
                </circle>

                {/* Node 3 - High Growth */}
                <circle cx="600" cy="200" r="16" fill="white" stroke="#a855f7" strokeWidth="3" className="animate-bounce-in" style={{ animationDelay: '2s' }}>
                  <animate attributeName="r" values="16;18;16" dur="3s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Floating Particles */}
              <circle cx="300" cy="400" r="4" fill="#0071e3" opacity="0.4" className="animate-float" style={{ animationDuration: '4s' }} />
              <circle cx="500" cy="250" r="6" fill="#a855f7" opacity="0.3" className="animate-float" style={{ animationDuration: '5s', animationDelay: '1s' }} />
              <circle cx="100" cy="500" r="8" fill="#6366f1" opacity="0.2" className="animate-float" style={{ animationDuration: '6s', animationDelay: '0.5s' }} />
            </svg>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[980px] mx-auto px-6 text-center">
          <div className="space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-gray-100/80 backdrop-blur-md border border-gray-200/50 rounded-full px-4 py-1.5 text-xs font-medium text-primary-600 shadow-sm">
              <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
              <span className="tracking-wide uppercase">{t('partnerships')}</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-primary-900 leading-[1.1]">
              {t('partnershipsHeroTitle')} <span className="gradient-text-accent">RealEstateAL</span>
            </h1>

            <p className="text-xl md:text-2xl text-primary-500 max-w-2xl mx-auto font-normal leading-relaxed tracking-tight">
              {t('partnershipsHeroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                to="/contact"
                className="bg-primary-900 text-white px-8 py-4 rounded-full font-semibold hover:bg-black transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                {t('becomePartner')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-[980px] mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100 hover:shadow-medium transition-all duration-300 group">
              <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                {benefit.icon}
              </div>
              <h3 className="text-xl font-semibold text-primary-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-primary-500 leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-[980px] mx-auto px-6 pb-32 text-center">
        <div className="bg-primary-900 rounded-3xl p-12 md:p-20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">
              {t('readyToGrow')}
            </h2>
            <p className="text-xl text-primary-200 mb-10 max-w-2xl mx-auto">
              {t('readyToGrowDesc')}
            </p>
            <Link
              to="/contact"
              className="inline-block bg-white text-primary-900 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              {t('contactUs')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Partnerships;
