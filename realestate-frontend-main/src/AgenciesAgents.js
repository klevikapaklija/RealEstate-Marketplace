import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './context/LanguageContext';
import API_URL from './config';

export default function AgenciesAgents() {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'agent', 'agency'

    useEffect(() => {
        fetchAgentsAndAgencies();
    }, []);

    const fetchAgentsAndAgencies = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/users/agents-agencies`);
            if (response.ok) {
                const data = await response.json();
                setAgents(data);
            }
        } catch (error) {
            console.error('Failed to fetch agents and agencies:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredAgents = agents.filter(agent => {
        if (filter === 'all') return true;
        return agent.role === filter;
    });

    const getInitial = (name) => {
        return name?.charAt(0).toUpperCase() || 'A';
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 md:py-12">
            <div className="max-w-7xl mx-auto px-4">
                {/* Hero Section */}
                <div className="relative text-center mb-12 py-16 overflow-hidden rounded-3xl bg-white/60 backdrop-blur-md border border-white/60 shadow-sm">
                    {/* Background SVG - Network Connections */}
                    <div className="absolute inset-0 pointer-events-none opacity-40">
                        <svg className="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice">
                            <defs>
                                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                                    <stop offset="50%" stopColor="#0071e3" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,150 Q200,50 400,150 T800,150" fill="none" stroke="url(#lineGradient)" strokeWidth="2" className="animate-pulse" style={{ animationDuration: '4s' }} />
                            <path d="M0,150 Q200,250 400,150 T800,150" fill="none" stroke="url(#lineGradient)" strokeWidth="2" className="animate-pulse" style={{ animationDuration: '4s', animationDelay: '2s' }} />

                            {/* Floating Dots */}
                            <circle cx="200" cy="150" r="4" fill="#0071e3" className="animate-ping" style={{ animationDuration: '3s' }} />
                            <circle cx="600" cy="150" r="4" fill="#a855f7" className="animate-ping" style={{ animationDuration: '3s', animationDelay: '1.5s' }} />
                        </svg>
                    </div>

                    <div className="relative z-10">
                        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary-700 via-primary-600 to-primary-800 bg-clip-text text-transparent mb-6 tracking-tight">
                            Agencies & Agents
                        </h1>
                        <p className="text-gray-600 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                            {t('findProfessionalHelp') || 'Find professional real estate agents and agencies to help you with your property needs'}
                        </p>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex justify-center gap-2 md:gap-4 mb-8">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all ${filter === 'all'
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {t('all') || 'All'}
                    </button>
                    <button
                        onClick={() => setFilter('agent')}
                        className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all ${filter === 'agent'
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {t('agents') || 'Agents'}
                    </button>
                    <button
                        onClick={() => setFilter('agency')}
                        className={`px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold transition-all ${filter === 'agency'
                            ? 'bg-primary-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {t('agencies') || 'Agencies'}
                    </button>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Results Count */}
                        <p className="text-center text-gray-600 mb-6">
                            {filteredAgents.length} {filteredAgents.length === 1 ? t('result') : t('results')}
                        </p>

                        {/* Agents Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredAgents.map((agent) => (
                                <div
                                    key={agent.id}
                                    onClick={() => navigate(`/agent/${agent.id}`)}
                                    className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group hover:-translate-y-1 cursor-pointer"
                                >
                                    {/* Profile Picture */}
                                    <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden">
                                        {agent.profile_picture ? (
                                            <img
                                                src={agent.profile_picture}
                                                alt={`${agent.name} ${agent.surname}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="text-white text-6xl font-bold">
                                                {getInitial(agent.name)}
                                            </div>
                                        )}

                                        {/* Role Badge */}
                                        <div className="absolute top-3 right-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${agent.role === 'agent'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-orange-100 text-orange-700'
                                                }`}>
                                                {agent.role === 'agent' ? t('agent') || 'Agent' : t('agency') || 'Agency'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                                            {agent.name} {agent.surname}
                                        </h3>

                                        {agent.phone && (
                                            <div className="flex items-center gap-2 text-gray-600 mb-3">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                                <span className="text-sm">{agent.phone}</span>
                                            </div>
                                        )}

                                        {/* Contact Button */}
                                        {agent.phone && (
                                            <a
                                                href={`tel:${agent.phone}`}
                                                className="w-full bg-primary-600 text-white py-2 px-4 rounded-xl hover:bg-primary-700 transition font-semibold text-center block"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {t('contact') || 'Contact'}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Empty State */}
                        {filteredAgents.length === 0 && (
                            <div className="text-center py-20">
                                <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                                    <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    {t('noAgentsFound') || 'No agents or agencies found'}
                                </h3>
                                <p className="text-gray-500">
                                    {t('tryDifferentFilter') || 'Try selecting a different filter'}
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
