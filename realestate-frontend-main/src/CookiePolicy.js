import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';

export default function CookiePolicy() {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                {language === 'al' ? 'Politika e Cookies' : 'Cookie Policy'}
              </h1>
              <p className="text-gray-500 mt-1">
                {language === 'al' ? 'Përditësuar më: 10 Nëntor 2025' : 'Last Updated: November 10, 2025'}
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded-lg">
            <p className="text-sm text-gray-700">
              {language === 'al' 
                ? 'Kjo politikë shpjegon se si RealEstateAL përdor cookies dhe teknologji të ngjashme për të përmirësuar përvojën tuaj.'
                : 'This policy explains how RealEstateAL uses cookies and similar technologies to enhance your experience.'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* What are Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">🍪</span>
              {language === 'al' ? 'Çfarë janë Cookies?' : 'What are Cookies?'}
            </h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              {language === 'al'
                ? 'Cookies janë skedarë të vegjël teksti që ruhen në pajisjen tuaj (kompjuter, telefon, tablet) kur vizitoni një faqe interneti. Ato ndihmojnë faqen të funksionojë më mirë dhe të ofrojë një përvojë më të personalizuar.'
                : 'Cookies are small text files that are stored on your device (computer, phone, tablet) when you visit a website. They help the website function better and provide a more personalized experience.'}
            </p>
          </section>

          {/* Types of Cookies We Use */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">📋</span>
              {language === 'al' ? 'Llojet e Cookies që Përdorim' : 'Types of Cookies We Use'}
            </h2>

            {/* Necessary Cookies */}
            <div className="mb-6 p-5 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✓</span>
                {language === 'al' ? '1. Cookies të Nevojshme (Të Detyrueshme)' : '1. Necessary Cookies (Required)'}
              </h3>
              <p className="text-gray-700 mb-3">
                {language === 'al'
                  ? 'Këto cookies janë thelbësore për funksionimin e faqes dhe nuk mund të çaktivizohen.'
                  : 'These cookies are essential for the website to function and cannot be disabled.'}
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Autentifikimi' : 'Authentication'}:</strong>{' '}
                    {language === 'al'
                      ? 'Mbajnë ju të kyçur në llogarinë tuaj (Firebase Auth tokens)'
                      : 'Keep you logged into your account (Firebase Auth tokens)'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Preferencat e Gjuhës' : 'Language Preferences'}:</strong>{' '}
                    {language === 'al'
                      ? 'Mbajnë mend zgjedhjen tuaj të gjuhës (Shqip/Anglisht)'
                      : 'Remember your language choice (Albanian/English)'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Pëlqimet e Cookies' : 'Cookie Consent'}:</strong>{' '}
                    {language === 'al'
                      ? 'Mbajnë mend preferencat tuaja për cookies (cookieConsent, cookieConsentDate)'
                      : 'Remember your cookie preferences (cookieConsent, cookieConsentDate)'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Sigurisë' : 'Security'}:</strong>{' '}
                    {language === 'al'
                      ? 'Mbrojnë faqen nga sulmet (reCAPTCHA tokens)'
                      : 'Protect the site from attacks (reCAPTCHA tokens)'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Analytics Cookies */}
            <div className="mb-6 p-5 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-blue-600">📊</span>
                {language === 'al' ? '2. Cookies Analitike (Opsionale)' : '2. Analytics Cookies (Optional)'}
              </h3>
              <p className="text-gray-700 mb-3">
                {language === 'al'
                  ? 'Këto cookies na ndihmojnë të kuptojmë se si përdoruesit e përdorin faqen.'
                  : 'These cookies help us understand how users interact with the website.'}
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Vizitat e Faqeve' : 'Page Visits'}:</strong>{' '}
                    {language === 'al'
                      ? 'Cilat faqe janë më të vizituara'
                      : 'Which pages are most visited'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Kohëzgjatja e Sesionit' : 'Session Duration'}:</strong>{' '}
                    {language === 'al'
                      ? 'Sa kohë qëndrojnë përdoruesit në faqe'
                      : 'How long users stay on the site'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Përmbajtja Popullore' : 'Popular Content'}:</strong>{' '}
                    {language === 'al'
                      ? 'Cilat prona shihen më shumë'
                      : 'Which properties are viewed most'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Përmirësime të Performancës' : 'Performance Improvements'}:</strong>{' '}
                    {language === 'al'
                      ? 'Identifikimi i problemeve teknike'
                      : 'Identifying technical issues'}
                  </span>
                </li>
              </ul>
            </div>

            {/* Marketing Cookies */}
            <div className="mb-6 p-5 bg-purple-50 border-l-4 border-purple-500 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-purple-600">🎯</span>
                {language === 'al' ? '3. Cookies Marketingu (Opsionale)' : '3. Marketing Cookies (Optional)'}
              </h3>
              <p className="text-gray-700 mb-3">
                {language === 'al'
                  ? 'Këto cookies përdoren për të shfaqur reklama të personalizuara.'
                  : 'These cookies are used to show personalized advertisements.'}
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Reklamat e Personalizuara' : 'Personalized Ads'}:</strong>{' '}
                    {language === 'al'
                      ? 'Shfaqje reklamash bazuar në interesat tuaja'
                      : 'Show ads based on your interests'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Rimarketingu' : 'Remarketing'}:</strong>{' '}
                    {language === 'al'
                      ? 'Shfaqje pronash që keni parë më parë'
                      : 'Show properties you previously viewed'}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span>
                    <strong>{language === 'al' ? 'Media Sociale' : 'Social Media'}:</strong>{' '}
                    {language === 'al'
                      ? 'Integrimi me Instagram, TikTok, Facebook'
                      : 'Integration with Instagram, TikTok, Facebook'}
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* How We Store Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">💾</span>
              {language === 'al' ? 'Si i Ruajmë Cookies' : 'How We Store Cookies'}
            </h2>
            <div className="bg-gray-50 p-5 rounded-lg">
              <p className="text-gray-700 mb-4">
                {language === 'al'
                  ? 'Ne përdorim dy metoda kryesore për të ruajtur të dhënat:'
                  : 'We use two main methods to store data:'}
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📦</span>
                  <div>
                    <h4 className="font-bold text-gray-900">Local Storage</h4>
                    <p className="text-gray-700 text-sm">
                      {language === 'al'
                        ? 'Të dhënat që ruhen në shfletuesin tuaj dhe mbeten edhe pas mbylljes së shfletuesit (preferencat e gjuhës, pëlqimet e cookies, favoritet)'
                        : 'Data stored in your browser that persists after closing (language preferences, cookie consent, favorites)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🗄️</span>
                  <div>
                    <h4 className="font-bold text-gray-900">{language === 'al' ? 'Databaza e Serverit' : 'Server Database'}</h4>
                    <p className="text-gray-700 text-sm">
                      {language === 'al'
                        ? 'Preferencat e cookies ruhen edhe në serverin tonë (vetëm për përdoruesit e regjistruar) për të sinkronizuar në të gjitha pajisjet'
                        : 'Cookie preferences also stored on our server (registered users only) to sync across devices'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Your Rights and Choices */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">⚖️</span>
              {language === 'al' ? 'Të Drejtat dhe Zgjedhjet Tuaja' : 'Your Rights and Choices'}
            </h2>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-2">
                  {language === 'al' ? '✓ Kontrolloni Preferencat' : '✓ Control Preferences'}
                </h4>
                <p className="text-gray-700 text-sm">
                  {language === 'al'
                    ? 'Mund të ndryshoni preferencat tuaja të cookies në çdo kohë duke klikuar butonin "Cookie Settings" në banner-in e cookies ose duke vizituar '
                    : 'You can change your cookie preferences at any time by clicking the "Cookie Settings" button in the cookie banner or by visiting '}
                  <Link to="/consent-management" className="text-blue-600 hover:underline font-semibold">
                    {language === 'al' ? 'Menaxhimi i Pëlqimeve' : 'Consent Management'}
                  </Link>
                  .
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-2">
                  {language === 'al' ? '✓ Fshini Cookies' : '✓ Delete Cookies'}
                </h4>
                <p className="text-gray-700 text-sm">
                  {language === 'al'
                    ? 'Mund të fshini të gjitha cookies nga shfletuesi juaj në çdo kohë. Megjithatë, kjo mund të ndikojë në funksionimin e faqes.'
                    : 'You can delete all cookies from your browser at any time. However, this may affect the functionality of the site.'}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-bold text-gray-900 mb-2">
                  {language === 'al' ? '✓ Bllokoni Cookies' : '✓ Block Cookies'}
                </h4>
                <p className="text-gray-700 text-sm">
                  {language === 'al'
                    ? 'Mund të konfiguroni shfletuesin tuaj të bllokojë të gjitha ose disa cookies. Shikoni udhëzimet e shfletuesit tuaj për më shumë informacion.'
                    : 'You can configure your browser to block all or some cookies. See your browser\'s instructions for more information.'}
                </p>
              </div>
            </div>
          </section>

          {/* Third-Party Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">🔗</span>
              {language === 'al' ? 'Cookies të Palëve të Treta' : 'Third-Party Cookies'}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'al'
                ? 'Ne përdorim shërbime nga palë të treta që mund të vendosin cookies të tyre:'
                : 'We use third-party services that may set their own cookies:'}
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">🔐</span>
                <div>
                  <strong className="text-gray-900">Firebase Authentication</strong>
                  <p className="text-sm text-gray-600">
                    {language === 'al'
                      ? 'Për autentifikimin dhe menaxhimin e llogarive'
                      : 'For authentication and account management'}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">🛡️</span>
                <div>
                  <strong className="text-gray-900">Google reCAPTCHA</strong>
                  <p className="text-sm text-gray-600">
                    {language === 'al'
                      ? 'Për mbrojtjen nga spam dhe sulmet'
                      : 'For protection against spam and attacks'}
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">🗺️</span>
                <div>
                  <strong className="text-gray-900">Mapbox</strong>
                  <p className="text-sm text-gray-600">
                    {language === 'al'
                      ? 'Për shfaqjen e hartave dhe vendndodhjes'
                      : 'For displaying maps and location'}
                  </p>
                </div>
              </li>
            </ul>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">⏱️</span>
              {language === 'al' ? 'Sa Gjatë Ruhen Cookies' : 'How Long Cookies Are Stored'}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left">{language === 'al' ? 'Lloji' : 'Type'}</th>
                    <th className="border border-gray-300 p-3 text-left">{language === 'al' ? 'Kohëzgjatja' : 'Duration'}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-3">{language === 'al' ? 'Të Nevojshme' : 'Necessary'}</td>
                    <td className="border border-gray-300 p-3">{language === 'al' ? 'Deri në 1 vit' : 'Up to 1 year'}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 p-3">{language === 'al' ? 'Analitike' : 'Analytics'}</td>
                    <td className="border border-gray-300 p-3">{language === 'al' ? 'Deri në 2 vjet' : 'Up to 2 years'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-3">{language === 'al' ? 'Marketingu' : 'Marketing'}</td>
                    <td className="border border-gray-300 p-3">{language === 'al' ? 'Deri në 1 vit' : 'Up to 1 year'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-blue-600">📧</span>
              {language === 'al' ? 'Na Kontaktoni' : 'Contact Us'}
            </h2>
            <p className="text-gray-700 mb-4">
              {language === 'al'
                ? 'Nëse keni pyetje ose shqetësime në lidhje me cookies, na kontaktoni:'
                : 'If you have questions or concerns about cookies, contact us:'}
            </p>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href="mailto:realestateal08@gmail.com" className="text-blue-600 hover:underline font-semibold">
                  realestateal08@gmail.com
                </a>
              </p>
            </div>
          </section>

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500 pt-6 border-t">
            <p>{language === 'al' ? 'Kjo politikë është përditësuar për herë të fundit më' : 'This policy was last updated on'} <strong>10 Nëntor 2025</strong></p>
            <p className="mt-2">
              <Link to="/consent-management" className="text-blue-600 hover:underline font-semibold">
                {language === 'al' ? 'Menaxhoni Preferencat e Cookies' : 'Manage Cookie Preferences'}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
