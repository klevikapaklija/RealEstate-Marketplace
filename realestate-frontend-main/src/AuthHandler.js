import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getAuth, applyActionCode, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { useLanguage } from './context/LanguageContext';

export default function AuthHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const handleAuthAction = async () => {
      const auth = getAuth();
      const actionMode = searchParams.get('mode');
      const actionCode = searchParams.get('oobCode');

      if (!actionMode || !actionCode) {
        setStatus('error');
        setMessage(t('invalidLink') || 'Invalid or expired link');
        return;
      }

      setMode(actionMode);

      try {
        switch (actionMode) {
          case 'resetPassword':
            // Verify the password reset code is valid
            await verifyPasswordResetCode(auth, actionCode);
            setShowPasswordReset(true);
            setStatus('ready');
            setMessage(t('enterNewPassword') || 'Please enter your new password');
            break;

          case 'verifyEmail':
            // Apply the email verification code
            await applyActionCode(auth, actionCode);
            setStatus('success');
            setMessage(t('emailVerifiedSuccess') || 'Your email has been verified successfully! You can now log in.');
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            break;

          case 'recoverEmail':
            // Apply the email recovery code
            await applyActionCode(auth, actionCode);
            setStatus('success');
            setMessage(t('emailRecoveredSuccess') || 'Your email has been recovered successfully!');
            
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            break;

          default:
            setStatus('error');
            setMessage(t('unsupportedAction') || 'Unsupported action');
        }
      } catch (error) {
        console.error('Auth action error:', error);
        setStatus('error');
        
        if (error.code === 'auth/expired-action-code') {
          setMessage(t('linkExpired') || 'This link has expired. Please request a new one.');
        } else if (error.code === 'auth/invalid-action-code') {
          setMessage(t('linkInvalid') || 'This link is invalid or has already been used.');
        } else {
          setMessage(error.message || t('actionFailed') || 'Action failed. Please try again.');
        }
      }
    };

    handleAuthAction();
  }, [searchParams, navigate, t]);

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage(t('passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setMessage(t('weakPassword') || 'Password must be at least 6 characters');
      return;
    }

    setResetLoading(true);

    try {
      const auth = getAuth();
      const actionCode = searchParams.get('oobCode');
      
      await confirmPasswordReset(auth, actionCode, newPassword);
      
      setStatus('success');
      setMessage(t('passwordResetSuccess') || 'Your password has been reset successfully! Redirecting to login...');
      setShowPasswordReset(false);
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      setStatus('error');
      
      if (error.code === 'auth/weak-password') {
        setMessage(t('weakPassword') || 'Password is too weak. Please use a stronger password.');
      } else {
        setMessage(error.message || t('passwordResetFailed') || 'Failed to reset password. Please try again.');
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`p-6 text-white ${
          status === 'success' 
            ? 'bg-gradient-to-r from-green-500 to-green-600' 
            : status === 'error'
            ? 'bg-gradient-to-r from-red-500 to-red-600'
            : 'bg-gradient-to-r from-blue-600 to-blue-700'
        }`}>
          <div className="flex items-center justify-center mb-2">
            {status === 'processing' && (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            )}
            {status === 'success' && (
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {status === 'ready' && (
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-center">
            {status === 'processing' && (t('processing') || 'Processing...')}
            {status === 'success' && (t('success') || 'Success!')}
            {status === 'error' && (t('error') || 'Error')}
            {status === 'ready' && mode === 'resetPassword' && (t('resetPassword') || 'Reset Password')}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {showPasswordReset ? (
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <p className="text-gray-600 text-center mb-6">{message}</p>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('newPassword') || 'New Password'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder={t('enterNewPassword') || 'Enter new password'}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t('confirmPassword') || 'Confirm Password'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder={t('confirmNewPassword') || 'Confirm new password'}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {resetLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('processing') || 'Processing...'}
                  </span>
                ) : (
                  t('resetPassword') || 'Reset Password'
                )}
              </button>
            </form>
          ) : (
            <>
              <div className={`p-4 rounded-xl mb-6 ${
                status === 'success' 
                  ? 'bg-green-50 text-green-800 border-2 border-green-200' 
                  : status === 'error'
                  ? 'bg-red-50 text-red-800 border-2 border-red-200'
                  : 'bg-blue-50 text-blue-800 border-2 border-blue-200'
              }`}>
                <p className="text-center font-medium">{message}</p>
              </div>

              {status === 'success' && (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    {t('redirectingToLogin') || 'Redirecting to login...'}
                  </p>
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center space-y-4">
                  <button
                    onClick={() => navigate('/login')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg"
                  >
                    {t('goToLogin') || 'Go to Login'}
                  </button>
                  
                  {mode === 'resetPassword' && (
                    <button
                      onClick={() => navigate('/login')}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl transition font-medium"
                    >
                      {t('requestNewLink') || 'Request New Link'}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
