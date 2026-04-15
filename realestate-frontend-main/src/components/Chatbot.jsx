import React, { useState, useEffect, useRef } from 'react';
import API_URL from '../config';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [rateLimitTimer, setRateLimitTimer] = useState(0);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);
  const buttonRef = useRef(null);
  const { isAlbanian } = useLanguage();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mouse tracking for robot eyes
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!buttonRef.current || isOpen) return;

      const button = buttonRef.current.getBoundingClientRect();
      const buttonCenterX = button.left + button.width / 2;
      const buttonCenterY = button.top + button.height / 2;

      const angle = Math.atan2(e.clientY - buttonCenterY, e.clientX - buttonCenterX);
      const distance = Math.min(3, Math.hypot(e.clientX - buttonCenterX, e.clientY - buttonCenterY) / 100);

      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;

      setEyePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isOpen]);

  useEffect(() => {
    // Add welcome message when chat opens
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        text: isAlbanian
          ? '👋 Përshëndetje! Unë jam asistenti juaj virtual për pasuri të paluajtshme. 🏠\n\nSi mund t\'ju ndihmoj sot? Mund të më pyesni për:\n• Shtëpi ose apartamente për shitje ose qira\n• Prona në zona specifike\n• Çmime dhe detaje të pronave\n\nPër shembull:\n- "Dua të gjej një apartament për qira në Tiranë me buxhet 500€"\n- "A keni shtëpi për shitje në Durrës?"\n- "Më trego prona me 3 dhoma në Vlorë"'
          : '👋 Hello! I\'m your virtual real estate assistant. 🏠\n\nHow can I help you today? You can ask me about:\n• Houses or apartments for sale or rent\n• Properties in specific areas\n• Prices and property details\n\nFor example:\n- "I need to rent an apartment in Tirana with a budget of $500"\n- "Do you have houses for sale in Durres?"\n- "Show me properties with 3 bedrooms in Vlore"',
        timestamp: new Date(),
        intent: 'greeting'
      }]);
    }
  }, [isOpen, isAlbanian]);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitTimer > 0) {
      const timer = setTimeout(() => {
        setRateLimitTimer(rateLimitTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (rateLimitTimer === 0 && rateLimited) {
      setRateLimited(false);
    }
  }, [rateLimitTimer, rateLimited]);

  async function sendMessage(messageText = null) {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading || rateLimited) return;

    // Add user message
    const userMessage = {
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          language: 'auto'  // Let backend auto-detect language
        })
      });

      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        setRateLimited(true);
        setRateLimitTimer(5);

        const rateLimitMessage = {
          role: 'assistant',
          text: isAlbanian
            ? '⏱️ Ju lutem prisni 5 sekonda para se të dërgoni mesazhin tjetër.'
            : '⏱️ Please wait 5 seconds before sending another message.',
          timestamp: new Date(),
          isError: true,
          intent: 'rate_limit'
        };
        setMessages(prev => [...prev, rateLimitMessage]);
        setLoading(false);
        return;
      }

      // Handle service unavailable (503)
      if (response.status === 503) {
        const serviceError = {
          role: 'assistant',
          text: isAlbanian
            ? '❌ Asistenti AI nuk është i disponueshëm aktualisht. Ju lutem provoni më vonë.'
            : '❌ AI assistant is currently unavailable. Please try again later.',
          timestamp: new Date(),
          isError: true,
          intent: 'error'
        };
        setMessages(prev => [...prev, serviceError]);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response with backend intent
      const botMessage = {
        role: 'assistant',
        text: data.response,
        listings: data.listings || [],
        language: data.language,
        intent: data.intent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        role: 'assistant',
        text: isAlbanian
          ? '❌ Na vjen keq, ndodhi një gabim. Ju lutem provoni përsëri.'
          : '❌ Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>

      {/* Apple-Style Floating Button */}
      {!isOpen && (
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-white text-primary-900 rounded-full shadow-large hover:shadow-xl transition-all duration-500 z-50 group overflow-hidden border border-gray-100"
          style={{
            animation: 'slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          aria-label="Open chat"
        >
          <div className="relative px-3 py-2.5 md:px-5 md:py-4 flex items-center gap-2 md:gap-3">
            {/* Minimalist Robot Icon */}
            <div className="relative w-8 h-8 md:w-10 md:h-10 bg-accent-50 rounded-full flex items-center justify-center text-accent-600">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* Text Content */}
            <div className="flex flex-col items-start">
              <span className="text-xs md:text-sm font-semibold text-primary-900 tracking-tight">
                {isAlbanian ? 'Pyet AI' : 'Ask AI'}
              </span>
              <span className="text-[10px] md:text-xs text-primary-500 font-medium">
                {isAlbanian ? 'Online' : 'Online'}
              </span>
            </div>

            {/* Arrow Icon */}
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-accent-500 flex items-center justify-center text-white ml-1 md:ml-2 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </button>
      )}

      {/* Apple-Style Chat Window */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[450px] bg-white shadow-2xl z-50 flex flex-col"
          style={{
            animation: 'slideInFromRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Minimalist Header */}
          <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 p-5 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 bg-accent-50 rounded-full flex items-center justify-center text-accent-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-semibold text-lg text-primary-900 tracking-tight">
                  {isAlbanian ? 'Asistenti AI' : 'AI Assistant'}
                </h3>
                <p className="text-xs text-primary-500 font-medium">
                  Powered by Gemini
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {/* Message Bubble */}
                  <div className={`px-5 py-3.5 shadow-sm ${msg.role === 'user'
                    ? 'bg-accent-500 text-white rounded-2xl rounded-tr-sm'
                    : msg.isError
                      ? 'bg-red-50 text-red-600 border border-red-100 rounded-2xl rounded-tl-sm'
                      : 'bg-white text-primary-900 border border-gray-100 rounded-2xl rounded-tl-sm'
                    }`}>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* Property Listings */}
                  {msg.listings && msg.listings.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {msg.listings.map(listing => (
                        <Link
                          key={listing.id}
                          to={`/listing/${listing.id}`}
                          onClick={() => setIsOpen(false)}
                          className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 group"
                        >
                          <div className="flex gap-3 p-3">
                            {listing.images && listing.images.length > 0 && (
                              <img
                                src={`${API_URL}/${listing.images[0]}`}
                                alt={listing.title}
                                className="w-20 h-20 object-cover rounded-xl bg-gray-100"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/96?text=No+Image';
                                }}
                              />
                            )}
                            <div className="flex-1 min-w-0 py-1">
                              <h4 className="font-semibold text-sm text-primary-900 truncate group-hover:text-accent-500 transition-colors">
                                {listing.title}
                              </h4>
                              <p className="text-accent-600 font-semibold text-sm mt-0.5">
                                €{listing.price?.toLocaleString()}
                                {listing.type === 'rent' && '/mo'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                </svg>
                                {listing.location}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Suggestions */}
            {messages.length <= 1 && !loading && (
              <div className="grid grid-cols-2 gap-2 mt-4 animate-fadeIn">
                {(isAlbanian ? [
                  "Apartament për qira",
                  "Shtëpi për shitje",
                  "Prona në Tiranë",
                  "Okazionet e fundit"
                ] : [
                  "Apartment for rent",
                  "House for sale",
                  "Properties in Tirana",
                  "Latest deals"
                ]).map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(suggestion)}
                    disabled={loading || rateLimited}
                    className="text-xs bg-white hover:bg-gray-50 text-primary-600 px-3 py-2.5 rounded-xl border border-gray-200 transition-all text-left font-medium shadow-sm hover:shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-5 bg-white border-t border-gray-100">
            {rateLimited && (
              <div className="mb-3 text-center text-xs text-orange-600 bg-orange-50 py-2 rounded-lg border border-orange-100 font-medium">
                ⏱️ {isAlbanian ? 'Pritni pak...' : 'Please wait...'} {rateLimitTimer}s
              </div>
            )}
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={isAlbanian
                    ? "Shkruaj mesazhin..."
                    : "Type a message..."}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-500/20 focus:border-accent-500 text-sm resize-none min-h-[50px] max-h-[120px]"
                  rows="1"
                  disabled={loading || rateLimited}
                />
              </div>
              <button
                onClick={() => sendMessage()}
                disabled={loading || rateLimited || !input.trim()}
                className="w-12 h-12 bg-accent-500 text-white rounded-full flex items-center justify-center hover:bg-accent-600 transition-all shadow-lg hover:shadow-accent-500/30 disabled:opacity-50 disabled:shadow-none flex-shrink-0"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-3 text-center">
              <span className="text-[10px] text-gray-400 font-medium">
                Powered by Gemini AI
              </span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes slideInFromRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </>
  );
}

export default Chatbot;


