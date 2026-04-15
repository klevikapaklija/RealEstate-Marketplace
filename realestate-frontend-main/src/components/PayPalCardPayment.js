import React, { useEffect, useRef, useState } from 'react';
import { getAuth } from 'firebase/auth';
import API_URL from '../config';

// PayPal LIVE Client ID
const PAYPAL_CLIENT_ID = process.env.REACT_APP_PAYPAL_CLIENT_ID;

if (!PAYPAL_CLIENT_ID) {
  console.warn('⚠️ REACT_APP_PAYPAL_CLIENT_ID environment variable is not set. PayPal payments will not work.');
}

export default function PayPalCardPayment({ listingId, onSuccess, onCancel }) {
  const paypalRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [sdkLoaded, setSdkLoaded] = useState(false);

  // Load PayPal SDK dynamically
  useEffect(() => {
    if (window.paypal) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=EUR`;
    script.async = true;
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => setError('Failed to load PayPal SDK');
    document.body.appendChild(script);

    return () => {
      // Cleanup if component unmounts
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!sdkLoaded || !window.paypal) {
      return;
    }

    const renderPayPalButtons = async () => {
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          setError('Please log in to continue');
          return;
        }

        // Render PayPal Buttons
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'blue',
            shape: 'rect',
            label: 'pay'
          },
          
          createOrder: async () => {
            try {
              const token = await currentUser.getIdToken();
              
              const response = await fetch(`${API_URL}/payment/create-order`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  listing_id: listingId,
                  firebase_uid: currentUser.uid,
                  boost_tier: 1
                })
              });

              const data = await response.json();
              
              if (!response.ok) {
                throw new Error(data.detail || 'Failed to create order');
              }

              return data.order_id;
            } catch (err) {
              console.error('Create order error:', err);
              setError(err.message);
              throw err;
            }
          },

          onApprove: async (data) => {
            try {
              setIsProcessing(true);
              setError(''); // Clear any previous errors
              
              console.log('✅ Payment approved by user, capturing order:', data.orderID);
              
              const response = await fetch(`${API_URL}/payment/capture-order`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  order_id: data.orderID,
                  listing_id: listingId,
                  boost_tier: 1
                })
              });

              const captureData = await response.json();

              if (response.ok && captureData.success) {
                console.log('✅ Payment captured successfully');
                onSuccess(captureData);
              } else {
                throw new Error(captureData.detail || 'Payment failed');
              }
            } catch (err) {
              console.error('Capture error:', err);
              setError(err.message || 'Payment processing failed. Please contact support.');
              setIsProcessing(false);
            }
          },

          onError: (err) => {
            console.error('PayPal error:', err);
            setError('Payment failed. Please try again.');
          },

          onCancel: () => {
            console.log('Payment cancelled by user');
          }
        }).render(paypalRef.current);

      } catch (err) {
        console.error('PayPal button render error:', err);
        setError('Failed to load payment options. Please try again.');
      }
    };

    renderPayPalButtons();
  }, [listingId, onSuccess, sdkLoaded]);

  return (
    <div className="p-6">
      {!sdkLoaded && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center gap-2">
          <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          Loading payment options...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {isProcessing && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <strong>Processing your payment...</strong>
          </div>
          <p className="text-xs text-blue-600 ml-7">
            Please wait while we confirm your payment. This may take a few moments.
          </p>
        </div>
      )}

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">
          Select Payment Method
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Pay with PayPal or credit/debit card (no PayPal account required)
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <p className="text-xs text-yellow-800 flex items-start gap-2">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>
              <strong>Important:</strong> You may be asked to verify this payment with your bank via SMS or app notification. Please complete the verification to proceed.
            </span>
          </p>
        </div>
      </div>

      {/* PayPal Buttons Container */}
      <div ref={paypalRef} className="mb-4"></div>

      <button
        onClick={onCancel}
        disabled={isProcessing}
        className="w-full py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
      >
        Cancel
      </button>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        Secure payment powered by PayPal
      </div>
    </div>
  );
}
