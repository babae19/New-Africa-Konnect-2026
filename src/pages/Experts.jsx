import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Search, MapPin, Star, Filter, Verified, Briefcase, ExternalLink, SlidersHorizontal, ChevronDown, Users, BadgeCheck, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import SEO from '../components/SEO';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

// --- Expert Card Component ---
const ExpertCard = ({ expert, onHire, onMessage }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="h-full"
        >
            <Card 
                className="h-full flex flex-col p-0 overflow-hidden border border-gray-100 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white group cursor-pointer"
                onClick={() => window.location.href = `/profile/view/${expert.id || expert.user_id}`}
            >
                {/* Header / Banner */}
                <div className="h-24 bg-gradient-to-r from-blue-50 to-indigo-50 relative">
                    <div className="absolute top-3 right-3">
                        {expert.vetting_status === 'verified' && (
                            <span className="bg-white/90 backdrop-blur text-blue-600 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold shadow-sm">
                                <Verified size={12} className="fill-blue-600 text-white" /> Verified
                            </span>
                        )}
                    </div>
                </div>

                {/* Profile Image & Basic Info */}
                <div className="px-6 relative">
                    <div className="flex justify-between items-end -mt-12 mb-4">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white">
                                { (expert.profile_image_url || expert.profileImageUrl) ? (
                                    <img
                                        src={expert.profile_image_url || expert.profileImageUrl}
                                        alt={expert.name}
                                        className="h-full w-full object-cover"
                                        onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name || 'Expert')}&background=0D8ABC&color=fff`; }}
                                    />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {expert.name?.charAt(0) || 'E'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="text-right mb-1">
                            <div className="text-xl font-bold text-gray-900">${expert.hourly_rate || 0}<span className="text-sm text-gray-400 font-normal">/hr</span></div>
                            <div className="flex items-center justify-end gap-1 text-yellow-500 text-sm font-bold">
                                <Star size={14} fill="currentColor" />
                                <span>{expert.rating ? Number(expert.rating).toFixed(1) : 'New'}</span>
                                <span className="text-gray-300 font-normal">({expert.review_count || 0} reviews)</span>
                            </div>
                        </div>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">{expert.name}</h3>
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-primary font-medium text-sm">{expert.title || "Subject Matter Expert"}</p>
                            {expert.company && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-gray-500 text-sm font-medium">{expert.company}</p>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <MapPin size={12} />
                            <span>{expert.location || "Remote"}</span>
                        </div>
                    </div>

                    <p className="text-gray-600 text-sm line-clamp-3 mb-4 min-h-[60px]">
                        {expert.bio || "No bio available."}
                    </p>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {expert.skills?.slice(0, 3).map((skill, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-md border border-gray-100 font-medium">
                                {skill}
                            </span>
                        ))}
                        {expert.skills?.length > 3 && (
                            <span className="px-2 py-1 bg-gray-50 text-gray-400 text-xs rounded-md border border-gray-100">
                                +{expert.skills.length - 3}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="mt-auto px-6 py-4 bg-gray-50/50 border-t border-gray-100 grid grid-cols-2 gap-3">
                    <Button 
                        variant="outline" 
                        onClick={(e) => { e.stopPropagation(); onMessage(expert); }} 
                        className="w-full bg-white hover:bg-gray-50 border-gray-200"
                    >
                        Message
                    </Button>
                    <Button 
                        onClick={(e) => { e.stopPropagation(); onHire(expert); }} 
                        className="w-full shadow-sm shadow-primary/20"
                    >
                        Hire Now
                    </Button>
                </div>
            </Card>
        </motion.div>
    );
};

// --- Filter Sidebar Component ---
const FilterSection = ({ title, children }) => (
    <div className="mb-6">
        <h4 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wider">{title}</h4>
        {children}
    </div>
);

// --- Main Page ---

export default function Experts() {
    const navigate = useNavigate();
    const socket = useSocket();
    const { user } = useAuth();
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const [filters, setFilters] = useState({
        search: searchParams.get('q') || '',
        category: 'all',
        minRate: 0,
        maxRate: 500,
        skills: []
    });
    const [showFilters, setShowFilters] = useState(false); // Mobile filter toggle

    const fetchExperts = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Explicitly request all experts regardless of vetting status
            const data = await api.experts.getAll({ vettingStatus: 'all' });
            if (data && data.experts) {
                setExperts(data.experts);
            }
        } catch (error) {
            console.error("Failed to load experts", error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchExperts();
    }, []);

    // Real-time listener for new experts
    useEffect(() => {
        if (!socket) return;

        const handleNewExpert = (newExpert) => {
            console.log("Real-time expert joined:", newExpert);
            // Refresh the list to get full data and maintain sorting/filtering
            fetchExperts(true);
            // Optional: Showing a small toast
            // toast.info(`${newExpert.name} just joined as an expert!`);
        };

        socket.on('new_expert', handleNewExpert);
        socket.on('expert_updated', handleNewExpert);

        return () => {
            socket.off('new_expert', handleNewExpert);
            socket.off('expert_updated', handleNewExpert);
        };
    }, [socket]);

    // Derived filtered list
    const filteredExperts = experts.filter(expert => {
        const matchesSearch = !filters.search ||
            (expert.name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
            expert.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
            expert.skills?.some(s => s.toLowerCase().includes(filters.search.toLowerCase()));

        const matchesRate = (expert.hourly_rate || 0) >= filters.minRate && (expert.hourly_rate || 0) <= filters.maxRate;
        const matchesSkills = filters.skills.length === 0 || filters.skills.some(skill => expert.skills?.some(item => item.toLowerCase().includes(skill.toLowerCase())));

        return matchesSearch && matchesRate && matchesSkills;
    });

    const handleHire = (expert) => {
        if (!user) {
            toast.error('Please sign in as a client to hire an expert');
            navigate('/signin');
            return;
        }
        if (user.role !== 'client') {
            toast.error('Only client accounts can hire experts');
            return;
        }
        // Navigate to Project Hub with expert pre-selected for hiring
        navigate('/project-hub', {
            state: { expertToHire: { ...expert, id: expert.user_id || expert.id }, view: 'wizard', step: 1 }
        });
    };

    const handleMessage = async (expert) => {
        if (!user) {
            toast.error('Please log in to message experts');
            navigate('/signin');
            return;
        }

        if (user.role !== 'client') {
            toast.error('Only clients can message experts');
            return;
        }

        // Direct Messaging Flow: skip project inquiry and go straight to direct chat
        toast.success('Opening direct conversation...');
        navigate('/collaboration', { state: { view: 'messages', defaultContact: { ...expert, id: expert.id || expert.user_id } } });
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">

            <div className="container mx-auto px-4 md:px-6">
                <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-primary p-7 md:p-10 text-white mb-8 shadow-xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-200 mb-3"><BadgeCheck size={15} /> Africa-wide talent network</div>
                        <h1 className="text-3xl md:text-4xl font-black">Find the right expert</h1>
                        <p className="text-blue-100 mt-2 max-w-xl">Review real profiles, compare relevant skills, message directly, or begin a structured hiring project.</p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, skill, or title..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/20 text-gray-900 bg-white focus:outline-none focus:ring-4 focus:ring-white/20 transition-all shadow-sm"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                            />
                        </div>
                        <Button
                            variant="outline"
                            className="md:hidden"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter size={18} />
                        </Button>
                    </div>
                </div>
                <div className="mt-7 flex flex-wrap gap-5 text-sm text-blue-100"><span className="flex items-center gap-2"><Users size={16} /> {filteredExperts.length} experts</span><span className="flex items-center gap-2"><MessageSquare size={16} /> Direct messaging</span><span className="flex items-center gap-2"><Briefcase size={16} /> Secure collaboration</span></div>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Filters Sidebar (Desktop) */}
                    <div className={`w-full md:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg flex items-center gap-2"><SlidersHorizontal size={18} /> Filters</h3>
                                <button className="text-xs text-primary font-bold hover:underline" onClick={() => setFilters({ search: '', category: 'all', minRate: 0, maxRate: 500, skills: [] })}>Reset</button>
                            </div>

                            <FilterSection title="Hourly Rate">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm text-gray-600 font-medium">
                                        <span>${filters.minRate}</span>
                                        <span>${filters.maxRate}+</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="500"
                                        step="10"
                                        value={filters.maxRate}
                                        onChange={(e) => setFilters({ ...filters, maxRate: parseInt(e.target.value) })}
                                        className="w-full accent-primary h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </FilterSection>

                            <FilterSection title="Skills">
                                <div className="space-y-2">
                                    {['React', 'Node.js', 'Python', 'Design', 'Marketing'].map(skill => (
                                        <label key={skill} className="flex items-center gap-3 cursor-pointer group">
                                            <input type="checkbox" checked={filters.skills.includes(skill)} onChange={() => setFilters(prev => ({ ...prev, skills: prev.skills.includes(skill) ? prev.skills.filter(item => item !== skill) : [...prev.skills, skill] }))} className="w-4 h-4 accent-primary" />
                                            <span className="text-gray-600 group-hover:text-primary transition-colors">{skill}</span>
                                        </label>
                                    ))}
                                </div>
                            </FilterSection>
                        </div>
                    </div>

                    {/* Experts Grid */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-white rounded-2xl h-[400px] animate-pulse border border-gray-100"></div>
                                ))}
                            </div>
                        ) : filteredExperts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredExperts.map(expert => (
                                    <ExpertCard key={expert.id} expert={expert} onHire={handleHire} onMessage={handleMessage} />
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                    <Search size={32} className="text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">No experts found</h3>
                                <p className="text-gray-500 max-w-sm mx-auto mb-6">Try adjusting your filters or search terms to find what you're looking for.</p>
                                <Button variant="outline" onClick={() => setFilters({ ...filters, search: '', minRate: 0, maxRate: 500 })}>
                                    Clear all filters
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
