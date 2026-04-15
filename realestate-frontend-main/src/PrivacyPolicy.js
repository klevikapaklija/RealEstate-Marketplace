import React from 'react';
import { useLanguage } from './context/LanguageContext';

export default function PrivacyPolicy() {
  const { t, language } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold">{t('privacyPolicyTitle')}</h1>
              <p className="text-blue-100 mt-2">{t('lastUpdated')}: {t('privacyLastUpdated')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          
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

          {/* Legal Basis for Processing */}
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

          {/* International Data Transfers */}
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
            </ul>
          </section>

          {/* Website Ownership and Protection */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyOwnershipTitle')}</h2>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <p className="text-gray-700 leading-relaxed mb-4">{t('privacyOwnershipText1')}</p>
              <p className="text-gray-700 leading-relaxed mb-4">{t('privacyOwnershipText2')}</p>
              <p className="text-gray-700 leading-relaxed">{t('privacyOwnershipText3')}</p>
            </div>
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
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('privacyContactTitle')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">{t('privacyContactText')}</p>
            <div className="bg-blue-50 p-6 rounded-xl">
              <p className="text-gray-800"><strong>{t('email')}:</strong> realestateal08@gmail.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

