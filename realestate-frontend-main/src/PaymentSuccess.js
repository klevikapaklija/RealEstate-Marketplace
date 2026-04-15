import React, { useEffect, useState } from 'react';
import API_URL from './config';
import { useSearchParams, useNavigate } from 'react-router-dom';

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);

  useEffect(() => {
    capturePayment();
  }, []);

  async function capturePayment() {
    const orderId = searchParams.get('token'); // PayPal adds this
    const listingId = searchParams.get('listing_id'); // We add this
    const tier = searchParams.get('tier'); // We add this

    if (!orderId || !listingId || !tier) {
      setError('Missing payment information. Please try again.');
      setProcessing(false);
      return;
    }

    try {
      console.log('🔍 Capturing payment:', { orderId, listingId, tier });
      
      const response = await fetch(`${API_URL}/payment/capture-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: orderId,
          listing_id: parseInt(listingId),
          boost_tier: parseInt(tier)
        })
      });

      const data = await response.json();
      console.log('📥 Capture response:', data);

      if (response.ok && data.success) {
        setSuccess(true);
        setPaymentDetails({
          listingTitle: `Listing #${listingId}`,
          tierName: 'Featured Listing (15 days - $10)',
          transactionId: data.transaction_id,
          payerEmail: data.payer_email
        });
        
        // Redirect to profile after 3 seconds
        setTimeout(() => {
          navigate('/profile');
        }, 3000);
      } else {
        // Handle error response
        const errorMessage = data.detail || data.message || 'Payment capture failed';
        console.error('❌ Payment error:', errorMessage);
        setError(errorMessage);
        setSuccess(false);
      }
    } catch (error) {
      console.error('❌ Capture error:', error);
      setError('Failed to process payment. Please contact support.');
      setSuccess(false);
    } finally {
      setProcessing(false);
    }
  }

  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Processing Your Payment</h2>
          <p className="text-gray-600">Please wait while we confirm your payment with PayPal...</p>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Do not close this window or navigate away.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={() => navigate('/profile')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Try Again
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-4">🎉 Payment Successful!</h1>
          <p className="text-lg text-gray-600 mb-6">Your listing has been boosted successfully!</p>
          
          {paymentDetails && (
            <div className="bg-green-50 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-bold text-green-800 mb-3">Boost Details:</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Listing:</strong> {paymentDetails.listingTitle}</p>
                <p><strong>Plan:</strong> {paymentDetails.tierName}</p>
                {paymentDetails.transactionId && (
                  <p><strong>Transaction ID:</strong> {paymentDetails.transactionId}</p>
                )}
                {paymentDetails.payerEmail && (
                  <p><strong>Email:</strong> {paymentDetails.payerEmail}</p>
                )}
              </div>
            </div>
          )}
          
          <p className="text-gray-500 mb-6">
            Redirecting to your listing in <span className="font-bold">5 seconds</span>...
          </p>
          
          <div className="space-y-3">
            <button 
              onClick={() => navigate(`/listing/${JSON.parse(localStorage.getItem('boostingListing') || '{}').id || ''}`)}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium"
            >
              View Your Boosted Listing
            </button>
            <button 
              onClick={() => navigate('/profile')}
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Go to Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default PaymentSuccess;


