import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function MortgageCalculator({ propertyPrice }) {
  const { t } = useLanguage();
  const [price, setPrice] = useState(propertyPrice || 0);
  const [downPayment, setDownPayment] = useState(20); // percentage
  const [interestRate, setInterestRate] = useState(3.5); // percentage
  const [loanTerm, setLoanTerm] = useState(30); // years
  const [monthlyPayment, setMonthlyPayment] = useState(0);

  useEffect(() => {
    setPrice(propertyPrice || 0);
  }, [propertyPrice]);

  useEffect(() => {
    calculateMortgage();
  }, [price, downPayment, interestRate, loanTerm]);

  const calculateMortgage = () => {
    if (!price || price <= 0) {
      setMonthlyPayment(0);
      return;
    }

    const principal = price - (price * (downPayment / 100));
    const monthlyRate = (interestRate / 100) / 12;
    const numberOfPayments = loanTerm * 12;

    if (monthlyRate === 0) {
      setMonthlyPayment(principal / numberOfPayments);
      return;
    }

    const monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    setMonthlyPayment(monthly);
  };

  const downPaymentAmount = price * (downPayment / 100);
  const loanAmount = price - downPaymentAmount;
  const totalPayment = monthlyPayment * loanTerm * 12;
  const totalInterest = totalPayment - loanAmount;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">{t('mortgageCalculatorTitle') || 'Mortgage Calculator'}</h3>
          <p className="text-sm text-gray-600">{t('estimateMonthlyPayment') || 'Estimate your monthly payment'}</p>
        </div>
      </div>

      {/* Monthly Payment Display */}
      <div className="bg-white rounded-xl p-6 mb-6 shadow-md border-2 border-blue-100">
        <p className="text-sm text-gray-600 mb-1">{t('estimatedMonthlyPayment') || 'Estimated Monthly Payment'}</p>
        <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text">
          €{monthlyPayment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-gray-500 mt-2">{t('principalAndInterest') || 'Principal & Interest'}</p>
      </div>

      {/* Input Controls */}
      <div className="space-y-5">
        {/* Property Price */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-700">{t('propertyPrice') || 'Property Price'}</label>
            <span className="text-sm font-bold text-blue-600">€{price.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="10000"
            max="1000000"
            step="5000"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
        </div>

        {/* Down Payment */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-700">{t('downPayment') || 'Down Payment'}</label>
            <span className="text-sm font-bold text-blue-600">{downPayment}% (€{downPaymentAmount.toLocaleString()})</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="5"
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
        </div>

        {/* Interest Rate */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-700">{t('interestRate') || 'Interest Rate'}</label>
            <span className="text-sm font-bold text-blue-600">{interestRate}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="0.1"
            value={interestRate}
            onChange={(e) => setInterestRate(Number(e.target.value))}
            className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
          />
        </div>

        {/* Loan Term */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-semibold text-gray-700">{t('loanTerm') || 'Loan Term'}</label>
            <span className="text-sm font-bold text-blue-600">{loanTerm} {t('years') || 'years'}</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={loanTerm}
            onChange={(e) => setLoanTerm(Number(e.target.value))}
            className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
          />
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('loanAmount') || 'Loan Amount'}:</span>
          <span className="font-bold text-gray-900">€{loanAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('totalPayment') || 'Total Payment'}:</span>
          <span className="font-bold text-gray-900">€{totalPayment.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t('totalInterest') || 'Total Interest'}:</span>
          <span className="font-bold text-orange-600">€{totalInterest.toLocaleString()}</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4 text-center">
        {t('mortgageDisclaimer') || '* This is an estimate. Actual payments may vary based on taxes, insurance, and other factors.'}
      </p>
    </div>
  );
}

