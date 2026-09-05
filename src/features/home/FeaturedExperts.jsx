import React, { useEffect, useState } from 'react';
import { Star, MapPin, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

import { useSocket } from '../../hooks/useSocket';

const FeaturedExperts = () => {
    const socket = useSocket();
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchFeatured = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            // Fetch all experts (limit removed to show all as requested)
            const data = await api.experts.getAll({ vettingStatus: 'all' });
            if (data && data.experts) {
                setExperts(data.experts);
            }
        } catch (error) {
            console.error('Failed to fetch featured experts:', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeatured();
    }, []);

    // Real-time listener
    useEffect(() => {
        if (!socket) return;

        const handleNewExpert = () => {
            fetchFeatured(true);
        };

        socket.on('new_expert', handleNewExpert);
        socket.on('expert_updated', handleNewExpert);
        return () => {
            socket.off('new_expert', handleNewExpert);
            socket.off('expert_updated', handleNewExpert);
        };
    }, [socket]);

    const LoadingSkeleton = () => (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
                <Card key={i} className="p-0 h-64 animate-pulse bg-gray-100 border-none">
                    <div className="h-full w-full"></div>
                </Card>
            ))}
        </div>
    );

    return (
        <section className="py-24 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row items-center justify-between mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Experts</h2>
                        <p className="text-gray-600">Top-tier verified talent ready to join your team.</p>
                    </div>
                    <Link to="/experts" className="hidden md:block">
                        <Button variant="secondary">View All Experts</Button>
                    </Link>
                </div>

                {loading ? (
                    <LoadingSkeleton />
                ) : experts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <p className="text-gray-500">No featured experts available at the moment.</p>
                        <Link to="/experts" className="text-primary font-medium mt-2 inline-block">Browse all experts</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {experts.map((expert) => (
                            <Card key={expert.id} hoverEffect className="p-0 flex flex-col h-full">
                                <div className="p-6 flex items-start gap-4">
                                    <img
                                        src={expert.profile_image_url || expert.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(expert.name || 'Expert')}`}
                                        alt={expert.name}
                                        className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md bg-gray-200"
                                    />
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-1">
                                            {expert.name}
                                            <CheckCircle size={14} className="text-blue-500 fill-blue-500 text-white" />
                                        </h3>
                                        <p className="text-primary font-medium text-sm line-clamp-1">{expert.title || 'Expert'}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                                                <MapPin size={12} />
                                                <span className="line-clamp-1">{expert.location || 'Remote'}</span>
                                            </div>
                                            {expert.company && (
                                                <div className="flex items-center gap-1 text-gray-400 text-xs">
                                                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                    <span className="line-clamp-1 font-medium">{expert.company}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="ml-auto flex items-center gap-1 bg-highlight/10 px-2 py-1 rounded-lg shrink-0">
                                        <Star size={12} className="text-highlight fill-highlight" />
                                        <span className="text-highlight font-bold text-sm">{expert.rating || '5.0'}</span>
                                    </div>
                                </div>

                                <div className="px-6 pb-6 mt-auto">
                                    <div className="flex flex-wrap gap-2 mb-6 h-16 overflow-hidden content-start">
                                        {(expert.skills || []).slice(0, 3).map((tech) => (
                                            <span key={tech} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                                {tech}
                                            </span>
                                        ))}
                                        {(!expert.skills || expert.skills.length === 0) && (
                                            <span className="text-xs text-gray-400 italic">No skills listed</span>
                                        )}
                                    </div>
                                    <Link to={`/experts?id=${expert.id}`} className="block w-full">
                                        <Button className="w-full" variant="secondary" size="sm">View Profile</Button>
                                    </Link>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="mt-8 md:hidden">
                    <Link to="/experts">
                        <Button variant="secondary" className="w-full">View All Experts</Button>
                    </Link>
                </div>
            </div>
        </section>
    );
};

export { FeaturedExperts };
