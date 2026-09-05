import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { useSocket } from '../hooks/useSocket';
import {
    LayoutDashboard, Briefcase, DollarSign, Star,
    Bell, CheckCircle, Clock, ChevronRight, Search,
    Filter, ArrowUpRight, User as UserIcon
} from 'lucide-react';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

// Sub-components can remain or be refactored inline if simple
import ExpertProfile from '../features/expert/ExpertProfile';

export default function ExpertDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const socket = useSocket();

    const [profile, setProfile] = useState(null);
    const [invitations, setInvitations] = useState([]);
    const [activeProjects, setActiveProjects] = useState([]);
    const [openProjects, setOpenProjects] = useState([]); // Marketplace
    const [loading, setLoading] = useState(true);
    const [showProfileSetup, setShowProfileSetup] = useState(false);

    const [isEditingProfile, setIsEditingProfile] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        earnings: 0,
        completedProjects: 0,
        rating: 5.0
    });

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                // Check profile
                const profileData = await api.experts.getProfile(user.id).catch(() => null);
                setProfile(profileData);

                if (!profileData || !profileData.is_complete) {
                    setShowProfileSetup(true);
                }

                // Fetch dashboard data
                const [invitedRes, openRes] = await Promise.all([
                    api.projects.getInvitedProjects(),
                    api.projects.getOpen()
                ]);

                const allInvites = invitedRes.projects || [];
                setInvitations(allInvites.filter(p => p.expert_status === 'pending'));
                setActiveProjects(allInvites.filter(p => p.expert_status === 'accepted' || p.status === 'active'));
                setOpenProjects(openRes.projects || []);

                setStats({
                    earnings: profileData?.total_earnings || 0,
                    completedProjects: profileData?.completed_projects || 0,
                    rating: profileData?.rating || 5.0
                });

            } catch (error) {
                console.error("Dashboard load failed", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        if (!socket || !user) return;

        socket.emit('join_user', user.id);

        const handleInvite = (newInvite) => {
            setInvitations(prev => [newInvite, ...prev]);
        };

        socket.on('project_invite', handleInvite);

        return () => {
            socket.off('project_invite', handleInvite);
        }
    }, [socket, user]);

    const handleProfileComplete = () => {
        setShowProfileSetup(false);
        setIsEditingProfile(false);
        // refresh profile
        api.experts.getProfile(user.id)
            .then(setProfile)
            .catch(err => console.error("Failed to refresh profile", err));
    };

    const handleAcceptInvite = async (invite) => {
        try {
            await api.projects.respondToInvite(invite.project_id || invite.id, 'accepted');
            setInvitations(prev => prev.filter(i => i.id !== invite.id));
            const invitedRes = await api.projects.getInvitedProjects();
            const projects = invitedRes.projects || [];
            setActiveProjects(projects.filter(p => p.expert_status === 'accepted' || p.status === 'active'));
        } catch (error) {
            console.error("Failed to accept invite", error);
        }
    };

    const handleDeclineInvite = async (invite) => {
        try {
            await api.projects.respondToInvite(invite.project_id || invite.id, 'rejected');
            setInvitations(prev => prev.filter(i => i.id !== invite.id));
        } catch (error) {
            console.error("Failed to decline invite", error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (showProfileSetup || isEditingProfile) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 pb-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="mb-8 text-center relative">
                        {isEditingProfile && (
                            <Button
                                variant="ghost"
                                className="absolute left-0 top-0"
                                onClick={() => setIsEditingProfile(false)}
                            >
                                ← Back to Dashboard
                            </Button>
                        )}
                        <h1 className="text-3xl font-bold text-gray-900">
                            {showProfileSetup ? 'Complete Your Expert Profile' : 'Edit Your Profile'}
                        </h1>
                        <p className="text-gray-600">
                            {showProfileSetup
                                ? 'To start receiving invitations, we need to know your skills.'
                                : 'Update your skills, rates, and portfolio to attract more clients.'}
                        </p>
                    </div>
                    <ExpertProfile user={user} existingProfile={profile} onComplete={handleProfileComplete} />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <SEO title="Expert Dashboard" description="Manage your work and find opportunities." />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Expert Dashboard</h1>
                        <p className="text-gray-600">Welcome back, {user?.user_metadata?.name || user?.email}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setIsEditingProfile(true)}>
                            <UserIcon size={16} className="mr-2" /> Edit Profile
                        </Button>
                        <Button variant="ghost" onClick={() => navigate(`/profile/view/${user.id}`)}>
                            View Public Profile
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                    <Card className="p-6 bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 font-medium text-sm uppercase tracking-wide">Total Earnings</span>
                            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                <DollarSign size={20} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">${stats.earnings.toLocaleString()}</h3>
                        <div className="mt-2 flex items-center text-xs text-green-600 font-medium bg-green-50 w-fit px-2 py-1 rounded-full">
                            <ArrowUpRight size={12} className="mr-1" /> 12% increase
                        </div>
                    </Card>

                    <Card className="p-6 bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 font-medium text-sm uppercase tracking-wide">Rating</span>
                            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                                <Star size={20} fill="currentColor" />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.rating}</h3>
                        <p className="text-xs text-gray-400 mt-2">Top Rated Plus status</p>
                    </Card>

                    <Card className="p-6 bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-500 font-medium text-sm uppercase tracking-wide">Active Projects</span>
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <Briefcase size={20} />
                            </div>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900">{activeProjects.length}</h3>
                        <p className="text-xs text-gray-400 mt-2">Current active workload</p>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-primary to-blue-700 text-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                        <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                            <Bell size={100} />
                        </div>
                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-white/90 font-medium text-sm uppercase tracking-wide">Invitations</span>
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                                    <Bell size={20} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-2">{invitations.length}</h3>
                            <p className="text-xs text-white/80">
                                {invitations.length > 0 ? 'You have new opportunities!' : 'No pending invites'}
                            </p>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Active Projects & Invites */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Active Projects */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <LayoutDashboard className="mr-2 text-primary" size={20} />
                                Active Workspaces
                            </h2>
                            {activeProjects.length === 0 ? (
                                <Card className="p-8 text-center bg-gray-50 border-dashed">
                                    <p className="text-gray-500">No active projects yet. Apply to open roles below!</p>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {activeProjects.map(p => (
                                        <Card key={p.id} className="p-6 hover:shadow-lg transition-all duration-300 group cursor-pointer border-l-4 border-l-primary" onClick={() => navigate('/collaboration', { state: { projectId: p.id } })}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors mb-1">{p.title}</h3>
                                                    <p className="text-sm text-gray-500 mb-3 flex items-center">
                                                        <UserIcon size={14} className="mr-1" /> {p.client_name || 'Confidential Client'}
                                                    </p>
                                                    <div className="flex gap-4 text-xs text-gray-500">
                                                        <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
                                                            <Clock size={12} className="mr-1" /> Due {new Date(p.deadline || Date.now() + 86400000).toLocaleDateString()}
                                                        </span>
                                                        <span className="flex items-center bg-green-50 text-green-700 px-2 py-1 rounded-full font-medium">
                                                            <CheckCircle size={12} className="mr-1" /> Active
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary text-white shadow-lg shadow-primary/30">
                                                    Enter Workspace <ChevronRight size={16} className="ml-1" />
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Open Market */}
                        <section>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                                    <Search className="mr-2 text-primary" size={20} />
                                    Explore Opportunities
                                </h2>
                                <Button variant="ghost" size="sm">View All</Button>
                            </div>

                            <div className="space-y-4">
                                {openProjects.slice(0, 3).map(p => (
                                    <Card key={p.id} className="p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex gap-2 mb-2">
                                                    {p.skills_required?.map(skill => (
                                                        <span key={skill} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                                <h3 className="font-bold text-gray-900 text-lg mb-1">{p.title}</h3>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{p.description}</p>
                                                <div className="font-semibold text-gray-900">
                                                    ${p.budget?.toLocaleString()} <span className="text-gray-400 font-normal">/ Fixed Price</span>
                                                </div>
                                            </div>
                                            <div className="ml-4 flex flex-col items-end gap-2">
                                                <Button size="sm">Apply Now</Button>
                                                <span className="text-xs text-gray-400">Posted {new Date(p.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                                {openProjects.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No open projects matching your profile currently.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Invitations & Insights */}
                    <div className="space-y-8">
                        {invitations.length > 0 && (
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                    <Bell className="mr-2 text-primary" size={20} />
                                    Invitations
                                </h2>
                                <div className="space-y-3">
                                    {invitations.map(inv => (
                                        <Card key={inv.id} className="p-4 border-l-4 border-l-primary cursor-pointer">
                                            <h4 className="font-bold text-sm text-gray-900 mb-1" onClick={() => navigate('/collaboration', { state: { projectId: inv.project_id } })}>{inv.project_title}</h4>
                                            <p className="text-xs text-gray-500 mb-3">You've been invited to apply.</p>
                                            <div className="flex gap-2">
                                                <Button size="sm" className="w-full text-xs" onClick={() => handleAcceptInvite(inv)}>Accept</Button>
                                                <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => handleDeclineInvite(inv)}>Decline</Button>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        <Card className="p-6 bg-gradient-to-br from-indigo-900 to-purple-900 text-white">
                            <h3 className="font-bold text-lg mb-2">Profile Boost</h3>
                            <p className="text-sm text-white/80 mb-4">Complete your portfolio to rank higher in searches.</p>
                            <div className="w-full bg-white/20 rounded-full h-2 mb-4">
                                <div className="bg-white h-2 rounded-full" style={{ width: '70%' }}></div>
                            </div>
                            <Button size="sm" variant="secondary" className="w-full">Update Portfolio</Button>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
