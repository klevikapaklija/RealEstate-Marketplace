import React from 'react';
import { useLanguage } from './context/LanguageContext';

export default function TermsOfService() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold">{t('termsTitle')}</h1>
              <p className="text-indigo-100 mt-2">{t('lastUpdated')}: {t('termsLastUpdated')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          
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

          {/* Website Ownership and Protection */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsOwnershipTitle')}</h2>
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded">
              <p className="text-gray-700 leading-relaxed mb-4">{t('termsOwnershipText1')}</p>
              <p className="text-gray-700 leading-relaxed mb-4">{t('termsOwnershipText2')}</p>
              <p className="text-gray-700 leading-relaxed">{t('termsOwnershipText3')}</p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('termsContactTitle')}</h2>
            <p className="text-gray-700 leading-relaxed mb-4">{t('termsContactText')}</p>
            <div className="bg-indigo-50 p-6 rounded-xl">
              <p className="text-gray-800"><strong>{t('email')}:</strong> realestateal08@gmail.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

