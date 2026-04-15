// API Configuration
// Backend API URL - uses environment variable from Railway
// Set REACT_APP_API_URL in your environment variables

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Warn if using default localhost in production
if (process.env.NODE_ENV === 'production' && (!process.env.REACT_APP_API_URL || API_URL === 'http://localhost:8000')) {
  console.warn('⚠️ Using localhost API URL in production mode. Please set REACT_APP_API_URL environment variable.');
}

export default API_URL;
