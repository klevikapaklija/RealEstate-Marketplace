import React, { useState, useEffect } from 'react';
import API_URL from './config';
import { getImageUrl } from './utils/imageUtils';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from './context/AdminContext';
import { useAuth } from './context/AuthContext';

export default function AdminDashboard() {
  const { isAdmin, loading: adminLoading, adminRequest, logout } = useAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [soldProperties, setSoldProperties] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, listings, users, revenue, sold
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/admin/login');
    } else if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin, adminLoading, navigate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsData, listingsData, usersData, soldData, paymentsData] = await Promise.all([
        adminRequest('/admin/stats'),
        adminRequest('/admin/listings?limit=50'),
        adminRequest('/admin/users?limit=50'),
        adminRequest('/admin/sold-properties?limit=50'),
        adminRequest('/admin/payments?limit=50&status=COMPLETED')
      ]);
      
      setStats(statsData);
      setListings(listingsData.listings);
      setUsers(usersData.users);
      setSoldProperties(soldData.sold_properties);
      setPayments(paymentsData.payments);
    } catch (error) {
      alert('Failed to load admin data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const results = await adminRequest(`/admin/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(results);
      setActiveTab('search');
    } catch (error) {
      alert('Search failed: ' + error.message);
    }
  };

  const deleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await adminRequest(`/admin/listings/${listingId}`, { method: 'DELETE' });
      alert('Listing deleted successfully');
      loadDashboardData();
    } catch (error) {
      alert('Failed to delete listing: ' + error.message);
    }
  };

  const boostListing = async (listingId, tier) => {
    try {
      await adminRequest(`/admin/listings/${listingId}/boost`, {
        method: 'PUT',
        body: JSON.stringify({ tier: parseInt(tier) })
      });
      alert('Listing boost updated successfully');
      loadDashboardData();
    } catch (error) {
      alert('Failed to boost listing: ' + error.message);
    }
  };

  const updateUserRole = async (firebase_uid, newRole) => {
    if (!window.confirm(`Change user role to ${newRole}?`)) return;

    try {
      await adminRequest(`/admin/users/${firebase_uid}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole })
      });
      alert('User role updated successfully');
      loadDashboardData();
    } catch (error) {
      alert('Failed to update user role: ' + error.message);
    }
  };

  const deleteUser = async (firebase_uid, deleteListings = false) => {
    const message = deleteListings 
      ? 'Delete this user AND all their listings?' 
      : 'Delete this user? (Their listings will remain)';
    
    if (!window.confirm(message)) return;

    try {
      await adminRequest(`/admin/users/${firebase_uid}?delete_listings=${deleteListings}`, {
        method: 'DELETE'
      });
      alert('User deleted successfully');
      loadDashboardData();
    } catch (error) {
      alert('Failed to delete user: ' + error.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold">👑 Admin Dashboard</h1>
                <p className="text-sm text-red-100">Logged in as: {user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition font-medium"
              >
                View Site
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-white text-red-600 hover:bg-red-50 rounded-lg transition font-semibold"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search users or listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-white text-red-600 rounded-lg hover:bg-red-50 transition font-semibold"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6 overflow-x-auto">
            {['overview', 'revenue', 'sold', 'listings', 'users', searchResults && 'search'].filter(Boolean).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-4 font-semibold border-b-2 transition capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'revenue' && '💰 '}
                {tab === 'sold' && '🏆 '}
                {tab === 'listings' && '🏠 '}
                {tab === 'users' && '👥 '}
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && stats && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Platform Statistics</h2>
            
            {/* Top Row - Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Listings</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.listings.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">€{stats.revenue.total.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Properties Sold</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.sold_properties.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Row - Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-xs text-gray-500 mb-1">Boosted Listings</p>
                <p className="text-2xl font-bold text-orange-600">{stats.listings.active_boosted}</p>
                <p className="text-xs text-gray-500 mt-1">Active Now</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-xs text-gray-500 mb-1">Total Views</p>
                <p className="text-2xl font-bold text-blue-600">{stats.engagement.total_views.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">All Listings</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-xs text-gray-500 mb-1">Sold Value</p>
                <p className="text-2xl font-bold text-green-600">€{stats.sold_properties.total_value.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Total Worth</p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <p className="text-xs text-gray-500 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.revenue.total_transactions}</p>
                <p className="text-xs text-gray-500 mt-1">Completed</p>
              </div>
            </div>

            {/* Third Row - Charts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Listings by Type</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">For Sale</span>
                    <span className="font-bold text-blue-600">{stats.listings.for_sale}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">For Rent</span>
                    <span className="font-bold text-green-600">{stats.listings.for_rent}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Boosted</span>
                    <span className="font-bold text-orange-600">{stats.listings.boosted}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Property Types</h3>
                <div className="space-y-3">
                  {Object.entries(stats.listings.by_property_type || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                      <span className="font-bold text-blue-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">User Roles</h3>
                <div className="space-y-3">
                  {Object.entries(stats.users.by_role || {}).map(([role, count]) => (
                    <div key={role} className="flex justify-between items-center">
                      <span className="text-gray-600 capitalize">{role}</span>
                      <span className="font-bold text-purple-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && stats && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Revenue & Payments Tracking</h2>
            
            {/* Total Revenue Card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-green-100 text-sm font-semibold mb-2">Total Revenue from Boosts</p>
                  <p className="text-5xl font-bold">€{stats.revenue.total.toFixed(2)}</p>
                  <p className="text-green-100 text-sm mt-2">From {stats.revenue.total_transactions} completed transactions</p>
                </div>
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Revenue by Time Period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Today's Revenue</h3>
                <p className="text-3xl font-bold text-gray-900">€{stats.revenue.today.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Last 7 Days</h3>
                <p className="text-3xl font-bold text-gray-900">€{stats.revenue.last_7_days.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Last 30 Days</h3>
                <p className="text-3xl font-bold text-gray-900">€{stats.revenue.last_30_days.toFixed(2)}</p>
              </div>
            </div>

            {/* Recent Payments */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold text-gray-900">Recent Payments</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listing</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {stats.revenue.recent_payments && stats.revenue.recent_payments.length > 0 ? (
                      stats.revenue.recent_payments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{payment.user_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{payment.listing_title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-green-600">€{payment.amount.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">{payment.currency}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(payment.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(payment.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-500 font-mono">{payment.transaction_id.slice(0, 20)}...</div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                          No payments yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Sold Properties Tab */}
        {activeTab === 'sold' && stats && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">🏆 Sold Properties Tracking</h2>
            
            {/* Sold Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Sold</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.sold_properties.total}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Today</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.sold_properties.today}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Last 7 Days</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.sold_properties.last_7_days}</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-indigo-500">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Last 30 Days</h3>
                <p className="text-3xl font-bold text-gray-900">{stats.sold_properties.last_30_days}</p>
              </div>
            </div>

            {/* Total Value Card */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-purple-100 text-sm font-semibold mb-2">Total Value of Sold Properties</p>
                  <p className="text-5xl font-bold">€{stats.sold_properties.total_value.toLocaleString()}</p>
                  <p className="text-purple-100 text-sm mt-2">Across {stats.sold_properties.total} properties</p>
                </div>
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Top Sellers */}
            {stats.sold_properties.top_sellers && stats.sold_properties.top_sellers.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-6">🏅 Top Sellers</h3>
                <div className="space-y-4">
                  {stats.sold_properties.top_sellers.map((seller, index) => (
                    <div key={seller.user_id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{seller.name}</p>
                          <p className="text-sm text-gray-500">{seller.sales_count} properties sold</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">€{seller.total_value.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Total Value</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sold Properties List */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold text-gray-900">Recently Sold Properties</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sold Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {soldProperties && soldProperties.length > 0 ? (
                      soldProperties.map((property) => (
                        <tr key={property.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{property.title}</div>
                            <div className="text-xs text-gray-500 capitalize">{property.property_type?.replace('_', ' ')}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{property.location}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-bold text-green-600">€{property.price.toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              property.type === 'sale' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {property.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{property.seller?.name}</div>
                            <div className="text-xs text-gray-500">{property.seller?.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(property.sold_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(property.sold_at).toLocaleTimeString()}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No sold properties yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Listings Tab */}
        {activeTab === 'listings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Listings ({listings.length})</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Views</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Boost</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {listings.map(listing => (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{listing.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{listing.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{listing.location}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">€{listing.price.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            listing.type === 'sale' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {listing.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{listing.views || 0}</td>
                        <td className="px-6 py-4">
                          <select
                            value={listing.boosted || 0}
                            onChange={(e) => boostListing(listing.id, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="0">None</option>
                            <option value="1">Basic 🔥</option>
                            <option value="2">Premium 🚀</option>
                            <option value="3">Featured ⭐</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => deleteListing(listing.id)}
                            className="text-red-600 hover:text-red-800 font-semibold text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Manage Users ({users.length})</h2>
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {users.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{user.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{user.name} {user.surname}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{user.phone}</td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.firebase_uid, e.target.value)}
                            className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="person">Person 👤</option>
                            <option value="agent">Agent 🏢</option>
                            <option value="admin">Admin 👑</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => deleteUser(user.firebase_uid, false)}
                              className="text-orange-600 hover:text-orange-800 font-semibold text-sm"
                              title="Delete user only"
                            >
                              Delete User
                            </button>
                            <button
                              onClick={() => deleteUser(user.firebase_uid, true)}
                              className="text-red-600 hover:text-red-800 font-semibold text-sm"
                              title="Delete user and all listings"
                            >
                              Delete All
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Search Results Tab */}
        {activeTab === 'search' && searchResults && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Search Results for "{searchQuery}"</h2>
            
            {searchResults.users && searchResults.users.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Users ({searchResults.users.length})</h3>
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {searchResults.users.map(user => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 text-sm text-gray-900">{user.name} {user.surname}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                            <td className="px-6 py-4 text-sm text-gray-600 capitalize">{user.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {searchResults.listings && searchResults.listings.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Listings ({searchResults.listings.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {searchResults.listings.map(listing => (
                    <div key={listing.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                      {listing.images?.[0] && (
                        <img
                          src={getImageUrl(listing.images[0])}
                          alt={listing.title}
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <h4 className="font-bold text-gray-900 mb-2">{listing.title}</h4>
                        <p className="text-gray-600 text-sm mb-2">{listing.location}</p>
                        <p className="text-blue-600 font-bold">€{listing.price.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!searchResults.users || searchResults.users.length === 0) && 
             (!searchResults.listings || searchResults.listings.length === 0) && (
              <div className="text-center py-12 bg-white rounded-xl shadow-md">
                <p className="text-gray-600">No results found</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


