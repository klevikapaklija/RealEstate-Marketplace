import React, { useState, useEffect } from "react";
import API_URL from './config';
import { auth } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import './phoneInputStyles.css';

function LoginForm() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [phone, setPhone] = useState("");
  const [userType, setUserType] = useState("person");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeName, setWelcomeName] = useState("");
  const [profile, setProfile] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // New states for error handling and login attempts
  const [errorMessage, setErrorMessage] = useState("");
  const [errorType, setErrorType] = useState(""); // 'error', 'success', 'warning'
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutEndTime) {
      const interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((lockoutEndTime - now) / 1000));
        setRemainingTime(remaining);

        if (remaining === 0) {
          setLockoutEndTime(null);
          setLoginAttempts(0);
          setErrorMessage("");
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lockoutEndTime]);

  // Auto-hide error messages after 5 seconds
  useEffect(() => {
    if (errorMessage && errorType !== 'warning') {
      const timer = setTimeout(() => {
        setErrorMessage("");
        setErrorType("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage, errorType]);

  const showError = (message, type = 'error') => {
    setErrorMessage(message);
    setErrorType(type);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Check if user is locked out
    if (lockoutEndTime && Date.now() < lockoutEndTime) {
      showError(t('tooManyAttempts').replace('{seconds}', remainingTime), 'warning');
      return;
    }

    setLoading(true);

    if (isSignup && password !== confirmPassword) {
      showError(t('passwordsDoNotMatch'), 'error');
      setLoading(false);
      return;
    }

    if (isSignup && !agreeToTerms) {
      showError(t('mustAgreeToTerms'), 'error');
      setLoading(false);
      return;
    }

    // Validate phone number for signup
    if (isSignup && phone && !isValidPhoneNumber(phone)) {
      showError(t('invalidPhoneNumber') || 'Please enter a valid phone number with country code', 'error');
      setLoading(false);
      return;
    }

    // Execute reCAPTCHA only if available (user consented to analytics)
    let recaptchaToken = null;
    if (executeRecaptcha) {
      try {
        recaptchaToken = await executeRecaptcha('login');
      } catch (error) {
        console.error('reCAPTCHA execution failed:', error);
        // Continue without reCAPTCHA if it fails
      }
    }

    try {

      let userCredential;
      if (isSignup) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Send email verification
        await sendEmailVerification(userCredential.user);

        // Get the ID token for backend user creation
        const idToken = await userCredential.user.getIdToken();
        const consentId = localStorage.getItem('consentId');

        // Get user's actual cookie preferences from localStorage
        let cookiePreferences = {
          necessary: true,
          analytics: false,
          marketing: false
        };

        try {
          const storedConsent = localStorage.getItem('cookieConsent');
          if (storedConsent) {
            const consentData = JSON.parse(storedConsent);
            cookiePreferences = {
              necessary: consentData.necessary !== false, // Always true
              analytics: consentData.analytics === true,
              marketing: consentData.marketing === true
            };
          }
        } catch (e) {
          console.error('Failed to parse cookie consent:', e);
        }

        // Create user in backend immediately (but they can't login until verified)
        try {
          const formData = new FormData();
          formData.append('firebase_uid', userCredential.user.uid);
          formData.append('name', name);
          formData.append('surname', surname);
          formData.append('email', email);
          formData.append('phone', phone);
          formData.append('role', userType);
          if (recaptchaToken) {
            formData.append('recaptcha_token', recaptchaToken);
          }
          if (consentId) {
            formData.append('consent_id', consentId);
          }
          if (profilePicture) {
            formData.append('profile_picture', profilePicture);
          }

          const response = await fetch(`${API_URL}/users/`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${idToken}`,
            },
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend error: ${response.statusText}`);
          }

          // Save consent
          try {
            await fetch(`${API_URL}/consent/save`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
              },
              body: JSON.stringify({
                consent_type: 'all',
                version: 'v1.0',
                accepted: true,
                cookie_preferences: cookiePreferences
              })
            });
            console.log('✅ User consent saved successfully');
          } catch (error) {
            console.error('Failed to save consent:', error);
          }

          // Clear consent_id
          if (consentId) {
            localStorage.removeItem('consentId');
            console.log('✅ Anonymous consent merged with new account');
          }
        } catch (backendError) {
          console.error('Backend user creation failed:', backendError);
          // Even if backend fails, show verification popup - user can verify and try again
        }

        // Sign out user immediately - they must verify email before logging in
        await auth.signOut();

        // Show email verification popup
        setVerificationEmail(email);
        setShowEmailVerification(true);
        setLoading(false);

        // Don't proceed further - user must verify email first
        return;
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          showError(t('pleaseVerifyEmail'), 'error');
          await auth.signOut();
          setLoading(false);
          return;
        }

        // Reset login attempts on successful login
        setLoginAttempts(0);
        setLockoutEndTime(null);
      }

      const user = userCredential.user;
      const idToken = await user.getIdToken();

      if (isSignup) {
        // Get consent_id from localStorage to merge anonymous consent
        const consentId = localStorage.getItem('consentId');

        // Send extra info to backend with token
        const response = await fetch(`${API_URL}/users/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            firebase_uid: user.uid,
            name,
            surname,
            email,
            phone,
            role: userType,
            recaptcha_token: recaptchaToken,
            consent_id: consentId || undefined, // Send consent_id to merge anonymous consent
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || `Backend error: ${response.statusText}`);
        }

        // Always save consent on signup (will update merged records or create new ones)
        try {
          await fetch(`${API_URL}/consent/save`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              consent_type: 'all',
              version: 'v1.0',
              accepted: true,
              cookie_preferences: {
                necessary: true,
                analytics: false,
                marketing: false
              }
            })
          });
          console.log('✅ User consent saved successfully');
        } catch (error) {
          console.error('Failed to save consent:', error);
        }

        // Clear consent_id after successful user creation
        if (consentId) {
          localStorage.removeItem('consentId');
          console.log('✅ Anonymous consent merged with new account');
        }

        setWelcomeName(name);
        setShowWelcome(true);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        // After login, fetch profile from backend
        const response = await fetch(`${API_URL}/me`, {
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Backend error: ${response.statusText}`);
        }

        const profileData = await response.json();
        setProfile(profileData);

        setWelcomeName(profileData.name || email.split("@")[0]);
        setShowWelcome(true);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (error) {

      // Handle login failures for non-signup
      if (!isSignup) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        if (newAttempts >= 3) {
          const lockoutEnd = Date.now() + 60000; // 1 minute from now
          setLockoutEndTime(lockoutEnd);
          showError(t('tooManyAttempts').replace('{seconds}', 60), 'warning');
        } else {
          const attemptsLeft = 3 - newAttempts;
          showError(t('loginError').replace('{attempts}', attemptsLeft), 'error');
        }
      } else {
        // Show friendly error message for signup
        if (error.code === 'auth/email-already-in-use') {
          showError(t('emailAlreadyInUse'), 'error');
        } else if (error.code === 'auth/weak-password') {
          showError(t('weakPassword'), 'error');
        } else {
          showError(error.message, 'error');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    setLoading(true);
    try {
      // User needs to sign in first to reload verification status
      if (!auth.currentUser) {
        // Try to sign in with stored credentials
        showError(t('pleaseLoginAgain'), 'warning');
        setShowEmailVerification(false);
        setLoading(false);
        return;
      }

      // Reload the user to check verification status
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        // Email verified! User can now login normally
        setShowEmailVerification(false);
        setWelcomeName(name);
        setShowWelcome(true);

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        showError(t('emailNotVerifiedYet'), 'warning');
      }
    } catch (error) {
      showError(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      // Need to sign in temporarily to resend verification
      const userCredential = await signInWithEmailAndPassword(auth, verificationEmail, password);
      await sendEmailVerification(userCredential.user);
      await auth.signOut();
      showError(t('verificationEmailSent'), 'success');
    } catch (error) {
      showError(t('failedToResendEmail'), 'error');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResetMessage("");

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage(t('resetEmailSent'));
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail("");
        setResetMessage("");
      }, 3000);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        setResetMessage(t('emailNotFound'));
      } else if (error.code === 'auth/invalid-email') {
        setResetMessage(t('invalidEmail'));
      } else {
        setResetMessage(t('resetEmailError'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-8">
      {/* Beautiful Error/Success Message Banner */}
      {errorMessage && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4 animate-slide-down`}>
          <div className={`rounded-2xl shadow-2xl p-4 flex items-start gap-3 ${errorType === 'success'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
              : errorType === 'warning'
                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
                : 'bg-gradient-to-r from-red-500 to-red-600 text-white'
            }`}>
            <div className="flex-shrink-0 mt-0.5">
              {errorType === 'success' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : errorType === 'warning' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage("")}
              className="flex-shrink-0 hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex flex-col justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 bg-blue-100 rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-800 text-lg font-semibold mt-6">
              {isSignup ? t('creatingAccount') : t('loggingIn')}
            </p>
            <p className="text-gray-500 text-sm mt-2">{t('pleaseWait')}</p>
          </div>
        </div>
      )}

      {/* Email Verification Popup */}
      {showEmailVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-8 text-white text-center">
              <div className="inline-block p-4 bg-white bg-opacity-20 rounded-full mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold">{t('verifyYourEmail')}</h2>
              <p className="text-blue-100 text-sm mt-2">{t('almostThere')}</p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-gray-700 mb-4">
                  {t('verificationEmailSentTo')}
                </p>
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mb-4">
                  <p className="text-blue-800 font-semibold">{verificationEmail}</p>
                </div>
                <p className="text-sm text-gray-600">
                  {t('checkInboxAndClickLink')}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t('nextSteps')}
                </h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    <span>{t('openEmailInbox')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    <span>{t('clickVerificationLink')}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    <span>{t('returnAndClickConfirm')}</span>
                  </li>
                </ol>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleVerifyEmail}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('checking')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t('iHaveVerified')}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleResendVerification}
                  className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition font-semibold"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('resendEmail')}
                  </span>
                </button>

                <button
                  onClick={async () => {
                    // Just close the popup - account is already created, they can try logging in later
                    setShowEmailVerification(false);
                    setVerificationEmail("");
                    setIsSignup(false); // Switch back to login mode
                  }}
                  className="w-full text-gray-500 py-2 rounded-xl hover:text-gray-700 transition text-sm"
                >
                  {t('cancelAndGoBack')}
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  {t('didntReceiveEmail')}{' '}
                  <span className="text-gray-600 font-medium">{t('checkSpamFolder')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Popup */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white p-10 rounded-2xl shadow-2xl text-center animate-bounce">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-blue-600 mb-2">{t('welcome')}</h2>
            <p className="text-xl text-gray-700">{t('hello').replace('{name}', welcomeName)}</p>
            <p className="text-gray-500 mt-2">{t('redirectingHome')}</p>
          </div>
        </div>
      )}

      {/* Forgot Password Modal - Redesigned */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{t('resetPassword')}</h2>
                  <p className="text-blue-100 text-sm mt-1">{t('enterEmailReset')}</p>
                </div>
                <button
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                    setResetMessage("");
                  }}
                  className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {resetMessage && (
                <div className={`mb-5 p-4 rounded-xl flex items-start gap-3 ${resetMessage === t('resetEmailSent')
                    ? "bg-green-50 text-green-800 border-2 border-green-200"
                    : "bg-red-50 text-red-800 border-2 border-red-200"
                  }`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {resetMessage === t('resetEmailSent') ? (
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="font-medium text-sm">{resetMessage}</p>
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('emailAddress')}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('sending')}
                    </span>
                  ) : t('sendResetLink')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl shadow-2xl w-[90%] max-w-md border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
            {isSignup ? t('createAccount') : t('login')}
          </h2>
          <p className="text-gray-500 mt-2">
            {isSignup ? t('joinOurCommunity') : t('welcomeBack')}
          </p>
        </div>

        {/* Lockout Warning */}
        {lockoutEndTime && remainingTime > 0 && (
          <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-orange-800 text-sm">{t('accountLocked')}</p>
                <p className="text-orange-700 text-sm mt-1">
                  {t('waitBeforeRetry').replace('{seconds}', remainingTime)}
                </p>
              </div>
            </div>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <input
                type="text"
                placeholder={t('firstName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="text"
                placeholder={t('lastName')}
                value={surname}
                onChange={(e) => setSurname(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />
              <div className="w-full">
                <PhoneInput
                  international
                  defaultCountry="AL"
                  placeholder={t('phoneNumber')}
                  value={phone}
                  onChange={setPhone}
                  className="w-full phone-input-custom"
                  countryCallingCodeEditable={false}
                  required
                />
                {phone && !isValidPhoneNumber(phone) && (
                  <p className="text-red-500 text-sm mt-1">{t('invalidPhoneNumber') || 'Invalid phone number'}</p>
                )}
              </div>
              <select
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              >
                <option value="person">{t('person')}</option>
                <option value="agent">{t('agent')}</option>
                <option value="agency">{t('agency')}</option>
              </select>
            </>
          )}

          {isSignup && (
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profilePictureOptional') || 'Profile Picture (Optional)'}
              </label>

              {profilePicturePreview && (
                <div className="mb-3 flex items-center gap-4">
                  <img
                    src={profilePicturePreview}
                    alt="Profile Preview"
                    className="w-20 h-20 object-cover rounded-full border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProfilePicture(null);
                      if (profilePicturePreview) {
                        URL.revokeObjectURL(profilePicturePreview);
                        setProfilePicturePreview(null);
                      }
                    }}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    {t('remove') || 'Remove'}
                  </button>
                </div>
              )}

              <input
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
                  if (!validTypes.includes(file.type)) {
                    showError('Only JPG and PNG images are allowed for profile picture.', 'error');
                    e.target.value = '';
                    return;
                  }

                  if (file.size > 6 * 1024 * 1024) {
                    showError('Profile picture must be less than 6MB.', 'error');
                    e.target.value = '';
                    return;
                  }

                  setProfilePicture(file);
                  setProfilePicturePreview(URL.createObjectURL(file));
                }}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">{t('uploadProfilePictureHint') || 'Upload a profile picture (JPG or PNG, max 6MB)'}</p>
            </div>
          )}

          <input
            type="email"
            placeholder={t('email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />

          <input
            type="password"
            placeholder={t('password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />

          {isSignup && (
            <>
              <input
                type="password"
                placeholder={t('confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                required
              />

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                  {t('agreeToTermsPart1')}{' '}
                  <Link
                    to="/terms-of-service"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                  >
                    {t('termsOfService')}
                  </Link>
                  {' '}{t('and')}{' '}
                  <Link
                    to="/privacy-policy"
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
                  >
                    {t('privacyPolicy')}
                  </Link>
                  .
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading || (lockoutEndTime && remainingTime > 0)}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('processing')}
              </span>
            ) : lockoutEndTime && remainingTime > 0 ? (
              `🔒 ${t('locked')} (${remainingTime}s)`
            ) : (
              isSignup ? t('signUp') : t('login')
            )}
          </button>
        </form>

        {!isSignup && (
          <div className="text-center mt-4">
            <button
              onClick={() => setShowForgotPassword(true)}
              className="text-blue-600 text-sm font-medium hover:text-blue-700 hover:underline transition"
            >
              {t('forgotPassword')}
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            {isSignup ? t('alreadyHaveAccount') : t('dontHaveAccount')}{" "}
            <button
              onClick={() => {
                setIsSignup(!isSignup);
                setErrorMessage("");
                setLoginAttempts(0);
                setLockoutEndTime(null);
              }}
              className="text-blue-600 font-semibold hover:text-blue-700 hover:underline transition"
            >
              {isSignup ? t('login') : t('signUp')}
            </button>
          </p>
        </div>

        {/* reCAPTCHA Badge Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            {t('recaptchaProtected')}
          </p>
        </div>
      </div>
    </div>
  );
}

// Main export with conditional reCAPTCHA Provider
export default function Login() {
  const [hasAnalyticsConsent, setHasAnalyticsConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  useEffect(() => {
    // Check if user has consented to analytics cookies
    const checkConsent = () => {
      try {
        const consent = localStorage.getItem('cookieConsent');
        if (consent) {
          const consentData = JSON.parse(consent);
          setHasAnalyticsConsent(consentData.analytics === true);
        }
      } catch (e) {
        console.error('Error checking consent:', e);
      }
      setConsentChecked(true);
    };

    checkConsent();

    // Listen for consent updates
    const handleConsentUpdate = (e) => {
      if (e.detail) {
        setHasAnalyticsConsent(e.detail.analytics === true);
      }
    };

    window.addEventListener('cookieConsentUpdated', handleConsentUpdate);

    return () => {
      window.removeEventListener('cookieConsentUpdated', handleConsentUpdate);
    };
  }, []);

  // Don't render until consent is checked
  if (!consentChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Only wrap with reCAPTCHA provider if user has consented to analytics
  if (hasAnalyticsConsent) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey="6LcWYwksAAAAAMBF8bac0SWEOYX29eC-NDV0zhqN">
        <LoginForm />
      </GoogleReCaptchaProvider>
    );
  }

  // If no consent, render form without reCAPTCHA
  return <LoginForm />;
}

