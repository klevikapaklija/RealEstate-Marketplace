import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import API_URL from './config';

export default function AgentProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [agent, setAgent] = useState(null);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAgentData();
    }, [id]);

    const fetchAgentData = async () => {
        try {
            setLoading(true);

            // Fetch agent details
            const agentResponse = await fetch(`${API_URL}/users/agent/${id}`);
            if (!agentResponse.ok) {
                setLoading(false);
                return;
            }

            const agentData = await agentResponse.json();
            setAgent(agentData);

            // Fetch agent's listings using the firebase_uid
            const listingsResponse = await fetch(`${API_URL}/listings/user/${agentData.firebase_uid}`);
            if (listingsResponse.ok) {
                const listingsData = await listingsResponse.json();
                setListings(listingsData);
            }
        } catch (error) {
            console.error('Failed to fetch agent data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getInitial = (name) => {
        return name?.charAt(0).toUpperCase() || 'A';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
            </div>
        );
    }

    if (!agent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex justify-center items-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('agentNotFound') || 'Agent not found'}</h2>
                    <button
                        onClick={() => navigate('/agencies-agents')}
                        className="text-primary-600 hover:text-primary-700 font-semibold"
                    >
                        {t('backToDirectory') || 'Back to directory'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F5F7] font-sans text-primary-900 pb-20">
            {/* Header / Navigation */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center">
                    <button
                        onClick={() => navigate('/agencies-agents')}
                        className="group flex items-center gap-2 text-gray-500 hover:text-primary-900 transition-colors font-medium"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </div>
                        {t('backToDirectory') || 'Back to Directory'}
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Agent Profile Section */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-white overflow-hidden mb-16 relative">
                    {/* Decorative Background Blur */}
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

                    <div className="md:flex relative z-10">
                        {/* Profile Image Column */}
                        <div className="md:w-1/3 p-8 md:p-12 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50/50">
                            <div className="relative mb-6 group">
                                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full blur opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                                {agent.profile_picture ? (
                                    <img
                                        src={agent.profile_picture}
                                        alt={`${agent.name} ${agent.surname}`}
                                        className="relative w-48 h-48 md:w-56 md:h-56 rounded-full object-cover border-4 border-white shadow-2xl"
                                    />
                                ) : (
                                    <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-white flex items-center justify-center text-primary-900 text-7xl font-bold shadow-2xl border-4 border-white">
                                        {getInitial(agent.name)}
                                    </div>
                                )}
                                <div className="absolute bottom-2 right-4">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg border-2 border-white ${agent.role === 'agent'
                                        ? 'bg-primary-900 text-white'
                                        : 'bg-blue-600 text-white'
                                        }`}>
                                        {agent.role === 'agent' ? t('agent') : t('agency')}
                                    </span>
                                </div>
                            </div>

                            <h1 className="text-3xl font-bold text-center text-primary-900 mb-1">
                                {agent.name} {agent.surname}
                            </h1>
                            <p className="text-gray-500 font-medium mb-6">{t('realEstateProfessional')}</p>

                            <div className="flex gap-3 w-full max-w-xs">
                                {agent.phone && (
                                    <a
                                        href={`tel:${agent.phone}`}
                                        className="flex-1 bg-primary-900 text-white py-3 px-4 rounded-2xl hover:bg-black transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-semibold text-center flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        {t('call')}
                                    </a>
                                )}
                                {agent.phone && (
                                    <a
                                        href={`https://wa.me/${agent.phone.replace(/\s+/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 bg-[#25D366] text-white py-3 px-4 rounded-2xl hover:bg-[#20bd5a] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 font-semibold text-center flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                        </svg>
                                        Chat
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Info Column */}
                        <div className="md:w-2/3 p-8 md:p-12">
                            <h2 className="text-xl font-bold text-primary-900 mb-6 flex items-center gap-2">
                                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </span>
                                {t('contactDetails')}
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                {agent.phone && (
                                    <div className="group p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-green-200 hover:bg-green-50/50 transition-all duration-300">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 group-hover:text-green-600 transition-colors">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{t('phone')}</p>
                                                <a href={`tel:${agent.phone}`} className="text-gray-900 font-semibold hover:text-green-600 transition-colors">
                                                    {agent.phone}
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Stats or Bio Placeholder could go here */}
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <div className="flex gap-8">
                                    <div>
                                        <p className="text-3xl font-bold text-primary-900">{listings.length}</p>
                                        <p className="text-sm text-gray-500 font-medium">{t('activeListings') || 'Active Listings'}</p>
                                    </div>
                                    {/* Add more stats if available */}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Listings Section */}
                <div>
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-primary-900">
                            {t('featuredProperties') || 'Featured Properties'}
                        </h2>
                        <span className="bg-white px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 border border-gray-200 shadow-sm">
                            {listings.length} {listings.length === 1 ? t('property') : t('properties')}
                        </span>
                    </div>

                    {listings.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-50 rounded-full mb-6 text-gray-300">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                {t('noListingsYet') || 'No listings yet'}
                            </h3>
                            <p className="text-gray-500 max-w-md mx-auto">
                                {t('agentHasNoListings') || 'This agent has not posted any properties yet. Check back later for updates.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {listings.map((listing) => (
                                <div
                                    key={listing.id}
                                    onClick={() => navigate(`/listing/${listing.id}`)}
                                    className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer border border-gray-100 hover:border-gray-200 hover:-translate-y-1"
                                >
                                    {/* Property Image */}
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"></div>
                                        {listing.images && listing.images.length > 0 ? (
                                            <img
                                                src={listing.images[0]}
                                                alt={listing.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                        )}

                                        {/* Type Badge */}
                                        <div className="absolute top-4 left-4 z-20">
                                            <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm backdrop-blur-md ${listing.type === 'sale'
                                                ? 'bg-white/90 text-primary-900'
                                                : 'bg-primary-900/90 text-white'
                                                }`}>
                                                {listing.type === 'sale' ? t('forSale') : t('forRent')}
                                            </span>
                                        </div>

                                        {/* Price Tag */}
                                        <div className="absolute bottom-4 right-4 z-20">
                                            <span className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl text-lg font-bold text-primary-900 shadow-lg">
                                                €{listing.price?.toLocaleString()}
                                                {listing.type === 'rent' && <span className="text-xs text-gray-500 font-normal">/{t('month')}</span>}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Property Details */}
                                    <div className="p-6">
                                        <h3 className="text-lg font-bold text-primary-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                            {listing.title}
                                        </h3>

                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50">
                                            {listing.bedrooms && (
                                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                                    </svg>
                                                    <span>{listing.bedrooms} {t('beds')}</span>
                                                </div>
                                            )}
                                            {listing.area && (
                                                <div className="flex items-center gap-2 text-gray-500 text-sm font-medium">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                                    </svg>
                                                    <span>{listing.area}m²</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
