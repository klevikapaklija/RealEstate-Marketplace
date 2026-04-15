# RealEstate AL - Modern Real Estate Platform

A full-stack real estate platform built with React and Python/Flask, featuring property listings, favorites management, admin dashboards, and payment processing.

### Home Page - Hero Section
![RealEstate AL Home Page](docs/screenshots/home-hero.png)
*Modern hero section with premium property showcase and smart search functionality. Search by location, property type, and price range with real-time suggestions.*


### For Users
- **Property Listings** - Browse, search, and filter properties by location, price, type, and features
- **Advanced Filtering** - Filter by property type (apartment, house, land), amenities (elevator, parking, garage, balcony)
- **Favorites** - Save favorite properties to your profile
- **Recently Viewed** - Track recently viewed properties
- **Property Details** - View detailed property information with images, floor plans, and location maps
- **User Profiles** - Manage personal information and listings
- **Responsive Design** - Mobile-friendly interface with Tailwind CSS
- **Multi-language Support** - English and Albanian language support
- **Contact & Maps** - Interactive Mapbox integration for property location visualization

### For Sellers
- **List Properties** - Create and manage property listings
- **Multiple Images** - Upload multiple property images and floor plans
- **Listing Management** - Edit, update, or delete your listings
- **Boost Listings** - Promote your listings for better visibility
- **Performance Tracking** - Monitor listing views and engagement

### For Admins
- **Admin Dashboard** - Comprehensive statistics and analytics
- **Listings Management** - View, edit, and manage all listings
- **Users Management** - Manage user accounts and roles
- **Revenue Monitoring** - Track payments and boost sales
- **Property Insights** - View sold properties and sales history
- **Search Functionality** - Advanced search across listings and users

### Payment & Monetization
- **PayPal Integration** - Secure payment processing for listing boosts
- **Payment History** - Track all transactions
- **Boost Tiers** - Multiple boost options for listing promotion

### Privacy & Compliance
- **Consent Management** - Cookie consent and privacy preferences
- **GDPR Compliance** - User data privacy controls
- **Email Verification** - Secure user registration and verification


### Listings Page - Browse & Map View
![RealEstate AL Listings Page](docs/screenshots/listings-map.png)
*Integrated map view with property listings. Browse properties on an interactive map, filter by location and amenities, and view detailed property information with images and pricing.*

## �🛠 Technology Stack

### Frontend
- **React** - UI library
- **Tailwind CSS** - Styling framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Firebase** - Authentication
- **Mapbox GL** - Map visualization
- **PayPal SDK** - Payment processing
- **React Google reCAPTCHA v3** - Security
- **React Phone Number Input** - Phone validation

### Backend
- **Python 3.x** - Programming language
- **Flask** - Web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **JWT** - Authentication tokens
- **Cloudinary** - Image hosting/CDN
- **PayPal API** - Payment processing
- **Firebase Admin SDK** - Auth verification
- **Google reCAPTCHA** - Form protection

### DevOps
- **Railway** - Deployment platform
- **Cloudinary** - Image storage and optimization
- **Mapbox** - Location services

## 📁 Project Structure

```
realestate-backend-main/
├── app/
│   ├── __init__.py
│   ├── main.py                 # Main Flask application
│   ├── models.py               # Database models
│   ├── config.py               # Configuration
│   ├── database.py             # Database initialization
│   ├── chatbot.py              # AI chatbot logic
│   ├── cloudinary_helper.py    # Image upload utilities
│   ├── recaptcha_helper.py     # reCAPTCHA verification
│   └── routes/                 # API endpoints
│       ├── listings.py         # Property listing endpoints
│       ├── users.py            # User management endpoints
│       ├── payment.py          # Payment processing
│       ├── consent.py          # Privacy consent
│       ├── map.py              # Map related endpoints
│       └── panorama.py         # Panorama features
├── migrations/                 # Database migrations
└── requirements.txt            # Python dependencies

realestate-frontend-main/
├── src/
│   ├── components/            # React components
│   │   ├── Chatbot.jsx
│   │   ├── PropertyMap.jsx
│   │   ├── PayPalCardPayment.js
│   │   ├── CookieConsent.js
│   │   └── RecentlyViewed.jsx
│   ├── context/              # React context providers
│   │   ├── AuthContext.jsx
│   │   ├── FavoritesContext.js
│   │   ├── AdminContext.js
│   │   └── LanguageContext.js
│   ├── hooks/                # Custom React hooks
│   │   └── useRecentlyViewed.js
│   ├── utils/                # Utility functions
│   │   ├── mapbox.js         # Mapbox utilities
│   │   ├── imageUtils.js     # Image handling
│   │   └── analytics.js      # GA4 tracking
│   ├── App.js                # Main app component
│   ├── Home.js               # Home page
│   ├── ListingPage.js        # Listing details
│   ├── Profile.js            # User profile
│   ├── AddListing.js         # Create listing
│   ├── AdminDashboard.js     # Admin panel
│   ├── Login.js              # Auth page
│   ├── Favorites.js          # Favorites page
│   └── config.js             # API configuration
└── package.json              # Node dependencies
```

## 🚀 API Endpoints

### Listings
- `GET /listings/` - Fetch all listings
- `GET /listings/{id}` - Get listing details
- `GET /listings/user/{firebase_uid}` - Get user's listings
- `POST /listings/` - Create new listing
- `PUT /listings/{id}` - Update listing
- `DELETE /listings/{id}` - Delete listing

### Users
- `GET /users/{firebase_uid}` - Get user profile
- `POST /users/` - Create user
- `GET /users/{firebase_uid}/favorites` - Get user favorites
- `POST /users/{firebase_uid}/favorites/{listing_id}` - Add favorite
- `DELETE /users/{firebase_uid}/favorites/{listing_id}` - Remove favorite

### Payments
- `POST /payment/create-order` - Create PayPal order
- `POST /payment/capture-order` - Capture PayPal payment

### Consent & Privacy
- `POST /consent/save` - Save user consent preferences
- `GET /consent/status` - Get consent status

### Admin
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/listings` - List all properties
- `GET /admin/users` - List all users
- `GET /admin/sold-properties` - Sold properties
- `GET /admin/payments` - Payment history
- `GET /admin/search?query=` - Global search
- `DELETE /admin/listings/{id}` - Delete listing
- `PUT /admin/listings/{id}/boost` - Boost listing
- `PUT /admin/users/{firebase_uid}/role` - Change user role

## ⚙️ Setup Instructions

### Prerequisites
- Node.js 14+
- Python 3.8+
- PostgreSQL 12+
- Firebase project
- Mapbox API key
- PayPal sandbox/live credentials
- Cloudinary account
- Google reCAPTCHA key

### Backend Setup

1. **Clone repository and navigate to backend:**
```bash
cd realestate-backend-main
```

2. **Create virtual environment:**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set environment variables:**
Create a `.env` file with:
```env
DATABASE_URL=postgresql://user:password@localhost/realestate
FIREBASE_CREDENTIALS=path/to/serviceAccountKey.json
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_SECRET=your_paypal_secret
RECAPTCHA_SECRET_KEY=your_recaptcha_secret
FLASK_ENV=development
SECRET_KEY=your_secret_key
```

5. **Initialize database:**
```bash
python -c "from app import app, db; app.app_context().push(); db.create_all()"
```

6. **Run backend:**
```bash
python app/main.py
```

### Frontend Setup

1. **Navigate to frontend:**
```bash
cd realestate-frontend-main
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set environment variables:**
Create a `.env` file with:
```env
REACT_APP_API_URL=http://localhost:8000
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_MAPBOX_TOKEN=your_mapbox_token
REACT_APP_PAYPAL_CLIENT_ID=your_paypal_client_id
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
REACT_APP_GA4_MEASUREMENT_ID=your_ga4_id
```

4. **Start development server:**
```bash
npm start
```

The app will open at `http://localhost:3000`

## 📊 Key Features Implementation

### Authentication
- Firebase Authentication for user management
- JWT tokens for API authentication
- Email verification and password reset
- Admin key-based access control

### Property Management
- Dynamic listing creation with image uploads
- Geolocation integration with Mapbox
- Advanced filtering and search capabilities
- Boost system for premium placement

### Favorites System
- User-specific favorite lists (logged-in)
- LocalStorage fallback for anonymous users
- Persistent storage in database

### Admin Dashboard
- Real-time statistics
- User and listing management
- Payment/revenue tracking
- Advanced search functionality

### Consent Management
- GDPR-compliant cookie consent
- User preference tracking
- Anonymous user consent IDs

## 📝 Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `FIREBASE_CREDENTIALS` | Path to Firebase service account JSON |
| `CLOUDINARY_*` | Cloudinary image hosting credentials |
| `PAYPAL_CLIENT_ID` | PayPal merchant client ID |
| `PAYPAL_SECRET` | PayPal merchant secret |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA secret |
| `SECRET_KEY` | Flask secret key |

### Frontend
| Variable | Description |
|----------|-------------|
| `REACT_APP_API_URL` | Backend API base URL |
| `REACT_APP_FIREBASE_*` | Firebase project credentials |
| `REACT_APP_MAPBOX_TOKEN` | Mapbox API key |
| `REACT_APP_PAYPAL_CLIENT_ID` | PayPal client ID |
| `REACT_APP_RECAPTCHA_SITE_KEY` | reCAPTCHA site key |
| `REACT_APP_GA4_MEASUREMENT_ID` | Google Analytics ID |

## 🔐 Security Features

- Firebase-based authentication
- JWT token verification
- reCAPTCHA form protection
- SQL injection prevention via SQLAlchemy ORM
- CORS configuration
- Admin key authentication
- Secure password handling with Firebase
- Rate limiting for failed login attempts
- Email verification requirements

## 🌐 Deployment

### Deploying to Railway

1. **Backend:**
   - Push code to GitHub
   - Connect Railway to GitHub repo
   - Set environment variables
   - Deploy

2. **Frontend:**
   - Set `REACT_APP_API_URL` to Railway backend URL
   - Deploy to Vercel/Netlify or Railway

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues and questions, please open an issue on the GitHub repository.

## 🙏 Acknowledgments

- Mapbox for location services
- Firebase for authentication
- PayPal for payment processing
- Cloudinary for image hosting
- Tailwind CSS for styling framework

---

**Built with ❤️ for the Real Estate Community**
