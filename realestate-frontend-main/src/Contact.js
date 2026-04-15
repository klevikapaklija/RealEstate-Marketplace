import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend

    setSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    }, 3000);
  };

  return (
    <div className="font-sans text-primary-900 bg-white">
      {/* Hero Section - Apple Minimalist */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden bg-white">
        {/* Subtle Mesh Gradient Background */}
        <div className="absolute inset-0 bg-white">
          <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-accent-50/50 rounded-full blur-3xl opacity-60 animate-float"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-50/30 rounded-full blur-3xl opacity-60 animate-float" style={{ animationDelay: '2s' }}></div>

          {/* Floating Communication Icons */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* Phone Icon - Top Left */}
            <div className="absolute top-[15%] left-[15%] text-accent-200 opacity-0 animate-scale-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <div className="animate-float" style={{ animationDuration: '6s' }}>
                <svg className="w-16 h-16 md:w-24 md:h-24 transform -rotate-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.26-.26.35-.63.24-1.01a11.36 11.36 0 01-.56-3.53C8.96 3.55 8.19 2.8 7.24 2.8H4.25C3.3 2.8 2.53 3.55 2.53 4.49c0 9.93 8.05 17.98 17.98 17.98.94 0 1.69-.77 1.69-1.72v-2.99c0-.95-.75-1.71-1.7-1.71h-.49z" />
                </svg>
              </div>
            </div>

            {/* Mail Icon - Top Right */}
            <div className="absolute top-[20%] right-[15%] text-primary-200 opacity-0 animate-scale-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
              <div className="animate-float" style={{ animationDuration: '7s', animationDelay: '1s' }}>
                <svg className="w-20 h-20 md:w-28 md:h-28 transform rotate-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
            </div>

            {/* Chat Icon - Bottom Left */}
            <div className="absolute bottom-[20%] left-[20%] text-blue-200 opacity-0 animate-scale-in" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
              <div className="animate-float" style={{ animationDuration: '8s', animationDelay: '0.5s' }}>
                <svg className="w-14 h-14 md:w-20 md:h-20 transform -rotate-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
            </div>

            {/* Location Icon - Bottom Right */}
            <div className="absolute bottom-[25%] right-[20%] text-purple-200 opacity-0 animate-scale-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
              <div className="animate-float" style={{ animationDuration: '6.5s', animationDelay: '1.5s' }}>
                <svg className="w-12 h-12 md:w-16 md:h-16 transform rotate-12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
            </div>

            {/* Instagram Icon - Center Top (Floating high) */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 text-pink-200 opacity-0 animate-scale-in" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
              <div className="animate-float" style={{ animationDuration: '9s' }}>
                <svg className="w-10 h-10 md:w-14 md:h-14" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 w-full max-w-[980px] mx-auto px-6 text-center">
          <div className="space-y-8 animate-fade-in-up">
            {/* Badge - Minimalist Pill */}
            <div className="inline-flex items-center gap-2 bg-gray-100/80 backdrop-blur-md border border-gray-200/50 rounded-full px-4 py-1.5 text-xs font-medium text-primary-600 shadow-sm">
              <span className="w-1.5 h-1.5 bg-accent-500 rounded-full"></span>
              <span className="tracking-wide uppercase">{t('wereHereToHelp')}</span>
            </div>

            {/* Main Heading - SF Pro Style */}
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight text-primary-900 leading-[1.1]">
              {t('getInTouch')}
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-primary-500 max-w-2xl mx-auto font-normal leading-relaxed tracking-tight">
              {t('contactPageSubtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="max-w-[980px] mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Contact Card - Email */}
          <div className="bg-white rounded-3xl p-8 shadow-soft border border-gray-100 text-center group hover:shadow-medium transition-all duration-300">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
              <svg className="w-8 h-8 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-primary-900 mb-3">{t('emailUs')}</h3>
            <p className="text-primary-500 mb-4">{t('emailResponse')}</p>
            <a href="mailto:realestateal08@gmail.com" className="text-accent-500 font-medium hover:text-accent-600 transition-colors">
              realestateal08@gmail.com
            </a>
          </div>
        </div>

        {/* Contact Form Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left - Form */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-semibold text-primary-900 mb-3 tracking-tight">{t('sendUsMessage')}</h2>
              <p className="text-primary-500">{t('formSubtitle')}</p>
            </div>

            {submitted && (
              <div className="mb-6 bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-800 font-medium">{t('thankYouMessage')}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    {t('fullName')} *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all duration-300 placeholder-primary-400"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    {t('emailAddress')} *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all duration-300 placeholder-primary-400"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    {t('phoneNumber')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all duration-300 placeholder-primary-400"
                    placeholder="+355 69 123 4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-2">
                    {t('subject')} *
                  </label>
                  <div className="relative">
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all duration-300 appearance-none"
                    >
                      <option value="">{t('selectSubject')}</option>
                      <option value="general">{t('generalInquiry')}</option>
                      <option value="buying">{t('buyingProperty')}</option>
                      <option value="selling">{t('sellingProperty')}</option>
                      <option value="renting">{t('rentingProperty')}</option>
                      <option value="support">{t('technicalSupport')}</option>
                      <option value="other">{t('other')}</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-primary-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary-700 mb-2">
                  {t('message')} *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-primary-900 focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 transition-all duration-300 placeholder-primary-400 resize-none"
                  placeholder={t('messagePlaceholder')}
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-900 text-white px-8 py-4 rounded-xl hover:bg-black transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {t('sendMessage')}
              </button>
            </form>
          </div>

          {/* FAQ Quick Links */}
          <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-8">
            <h3 className="text-2xl font-semibold text-primary-900 mb-6 flex items-center gap-3 tracking-tight">
              <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {t('commonQuestions')}
            </h3>
            <div className="space-y-3">
              <Link to="/how-to-list-property" className="block p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-primary-700 group-hover:text-primary-900 font-medium">{t('howToListProperty')}</span>
                  <svg className="w-5 h-5 text-primary-400 group-hover:text-accent-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              <Link to="/listing-fees" className="block p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-primary-700 group-hover:text-primary-900 font-medium">{t('listingFees')}</span>
                  <svg className="w-5 h-5 text-primary-400 group-hover:text-accent-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
              <Link to="/how-boosting-works" className="block p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all duration-300 group">
                <div className="flex items-center justify-between">
                  <span className="text-primary-700 group-hover:text-primary-900 font-medium">{t('howBoostingWorks')}</span>
                  <svg className="w-5 h-5 text-primary-400 group-hover:text-accent-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

