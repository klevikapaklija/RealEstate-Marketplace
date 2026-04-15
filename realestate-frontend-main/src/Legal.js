import React, { useState } from 'react';
import { useLanguage } from './context/LanguageContext';

export default function Legal() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' or 'terms'

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold">{t('legalTitle')}</h1>
              <p className="text-blue-100 mt-2">{t('legalSubtitle')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-4xl mx-auto px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'privacy'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t('privacyPolicyTitle')}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`flex-1 py-4 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'terms'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('termsTitle')}
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          
          {/* Privacy Policy Content */}
          {activeTab === 'privacy' && (
            <div>
              <p className="text-blue-600 text-sm mb-6">{t('lastUpdated')}: {t('privacyLastUpdated')}</p>
              
              {/* Introduction */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyIntroTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('privacyIntroText1')}</p>
                <p className="text-gray-700 leading-relaxed">{t('privacyIntroText2')}</p>
              </section>

              {/* Information We Collect */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyInfoCollectTitle')}</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('privacyPersonalInfo')}</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>{t('privacyInfoName')}</li>
                  <li>{t('privacyInfoEmail')}</li>
                  <li>{t('privacyInfoPhone')}</li>
                  <li>{t('privacyInfoAddress')}</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('privacyPropertyInfo')}</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2 mb-4">
                  <li>{t('privacyInfoPropertyDetails')}</li>
                  <li>{t('privacyInfoPhotos')}</li>
                  <li>{t('privacyInfoLocation')}</li>
                  <li>{t('privacyInfoPrice')}</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">{t('privacyUsageData')}</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('privacyInfoBrowser')}</li>
                  <li>{t('privacyInfoIP')}</li>
                  <li>{t('privacyInfoPages')}</li>
                  <li>{t('privacyInfoSearches')}</li>
                </ul>
              </section>

              {/* How We Use Your Information */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyHowWeUseTitle')}</h2>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('privacyUseProvideServices')}</li>
                  <li>{t('privacyUseConnect')}</li>
                  <li>{t('privacyUseImprove')}</li>
                  <li>{t('privacyUseSendUpdates')}</li>
                  <li>{t('privacyUseComply')}</li>
                </ul>
              </section>

              {/* Information Sharing */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacySharingTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('privacySharingText')}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('privacyShareBuyers')}</li>
                  <li>{t('privacyShareProviders')}</li>
                  <li>{t('privacySharePayment')}</li>
                  <li>{t('privacyShareLegal')}</li>
                  <li>{t('privacyShareConsent')}</li>
                </ul>
              </section>

              {/* Third-Party Services */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyThirdPartyTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('privacyThirdPartyText')}</p>
                <div className="bg-gray-50 p-6 rounded-xl">
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span><strong>Google Analytics</strong> - {t('privacyThirdPartyAnalytics')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span><strong>Firebase</strong> - {t('privacyThirdPartyFirebase')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span><strong>Cloudinary</strong> - {t('privacyThirdPartyCloudinary')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span><strong>Google reCAPTCHA</strong> - {t('privacyThirdPartyRecaptcha')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span><strong>Google Gemini AI</strong> - {t('privacyThirdPartyGemini')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      <span><strong>Mapbox</strong> - {t('privacyThirdPartyMapbox')}</span>
                    </li>
                  </ul>
                </div>
                <p className="text-gray-600 text-sm mt-4 italic">{t('privacyThirdPartyNote')}</p>
              </section>

              {/* Payment Processing */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyPaymentTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('privacyPaymentText')}</p>
                <div className="bg-blue-50 p-6 rounded-xl mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{t('privacyPaymentBoostTitle')}</h3>
                  <p className="text-gray-700 mb-2">{t('privacyPaymentBoostText')}</p>
                </div>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('privacyPaymentInfo1')}</li>
                  <li>{t('privacyPaymentInfo2')}</li>
                  <li>{t('privacyPaymentInfo3')}</li>
                  <li>{t('privacyPaymentInfo4')}</li>
                </ul>
                <p className="text-gray-600 text-sm mt-4 italic">{t('privacyPaymentNote')}</p>
              </section>

              {/* Data Security */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacySecurityTitle')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('privacySecurityText')}</p>
              </section>

              {/* Cookies */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyCookiesTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('privacyCookiesText')}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('privacyCookieSession')}</li>
                  <li>{t('privacyCookiePreferences')}</li>
                  <li>{t('privacyCookieAnalytics')}</li>
                </ul>
              </section>

              {/* Data Retention */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyRetentionTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('privacyRetentionText')}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('privacyRetentionActive')}</li>
                  <li>{t('privacyRetentionInactive')}</li>
                  <li>{t('privacyRetentionLegal')}</li>
                </ul>
              </section>

              {/* Legal Basis */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyLegalBasisTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('privacyLegalBasisText')}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('privacyLegalBasisConsent')}</li>
                  <li>{t('privacyLegalBasisContract')}</li>
                  <li>{t('privacyLegalBasisLegitimate')}</li>
                  <li>{t('privacyLegalBasisLegal')}</li>
                </ul>
              </section>

              {/* Data Transfers */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyDataTransferTitle')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('privacyDataTransferText')}</p>
              </section>

              {/* Your Rights */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyRightsTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('privacyRightsIntro')}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('privacyRightAccess')}</li>
                  <li>{t('privacyRightCorrect')}</li>
                  <li>{t('privacyRightDelete')}</li>
                  <li>{t('privacyRightObject')}</li>
                  <li>{t('privacyRightExport')}</li>
                  <li>{t('privacyRightWithdraw')}</li>
                  <li>{t('privacyRightComplaint')}</li>
                </ul>
              </section>

              {/* Children's Privacy */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyChildrenTitle')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('privacyChildrenText')}</p>
              </section>

              {/* Changes to Policy */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyChangesTitle')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('privacyChangesText')}</p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyContactTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('privacyContactText')}</p>
                <div className="bg-blue-50 p-6 rounded-xl">
                  <p className="text-gray-800"><strong>{t('email')}:</strong> realestateal08@gmail.com</p>
                </div>
              </section>
            </div>
          )}

          {/* Terms of Service Content */}
          {activeTab === 'terms' && (
            <div>
              <p className="text-blue-600 text-sm mb-6">{t('lastUpdated')}: {t('termsLastUpdated')}</p>
              
              {/* Introduction */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsIntroTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('termsIntroText1')}</p>
                <p className="text-gray-700 leading-relaxed">{t('termsIntroText2')}</p>
              </section>

              {/* Acceptance of Terms */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsAcceptanceTitle')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('termsAcceptanceText')}</p>
              </section>

              {/* Account Registration */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsAccountTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('termsAccountText')}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('termsAccountAccurate')}</li>
                  <li>{t('termsAccountSecurity')}</li>
                  <li>{t('termsAccountResponsible')}</li>
                  <li>{t('termsAccountNotify')}</li>
                </ul>
              </section>

              {/* Property Listings */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsListingsTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('termsListingsText')}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('termsListingsOwnership')}</li>
                  <li>{t('termsListingsAccurate')}</li>
                  <li>{t('termsListingsLegal')}</li>
                  <li>{t('termsListingsPhotos')}</li>
                  <li>{t('termsListingsProhibited')}</li>
                </ul>
              </section>

              {/* User Conduct */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsConductTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('termsConductText')}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('termsConductIllegal')}</li>
                  <li>{t('termsConductHarmful')}</li>
                  <li>{t('termsConductFraud')}</li>
                  <li>{t('termsConductSpam')}</li>
                  <li>{t('termsConductInterfere')}</li>
                  <li>{t('termsConductInfringe')}</li>
                </ul>
              </section>

              {/* Fees and Payments */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsFeesTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('termsFeesText')}</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>{t('termsFeesBasic')}</li>
                  <li>{t('termsFeesFeatured')}</li>
                  <li>{t('termsFeesNonRefundable')}</li>
                </ul>
              </section>

              {/* Intellectual Property */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsIPTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('termsIPText1')}</p>
                <p className="text-gray-700 leading-relaxed">{t('termsIPText2')}</p>
              </section>

              {/* Disclaimer of Warranties */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsDisclaimerTitle')}</h2>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-gray-700 leading-relaxed mb-4">{t('termsDisclaimerText1')}</p>
                  <p className="text-gray-700 leading-relaxed">{t('termsDisclaimerText2')}</p>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsLiabilityTitle')}</h2>
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <p className="text-gray-700 leading-relaxed">{t('termsLiabilityText')}</p>
                </div>
              </section>

              {/* Indemnification */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsIndemnityTitle')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('termsIndemnityText')}</p>
              </section>

              {/* Termination */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsTerminationTitle')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('termsTerminationText')}</p>
              </section>

              {/* Governing Law */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsGoverningLawTitle')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('termsGoverningLawText')}</p>
              </section>

              {/* Changes to Terms */}
              <section className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsChangesTitle')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('termsChangesText')}</p>
              </section>

              {/* Contact */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsContactTitle')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('termsContactText')}</p>
                <div className="bg-indigo-50 p-6 rounded-xl">
                  <p className="text-gray-800"><strong>{t('email')}:</strong> realestateal08@gmail.com</p>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
