import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import SEO from '../components/SEO';
import { User, MapPin, Building, Globe, Mail, Calendar, CheckCircle, Star, MessageSquare, Briefcase, Award, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const PublicProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hiring, setHiring] = useState(false);
    const [messaging, setMessaging] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await api.auth.getPublicProfile(id);
                setProfile(data);
            } catch (err) {
                console.error("Failed to load profile", err);
                setError("User not found or access denied.");
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProfile();
        }
    }, [id]);

    const handleHire = async () => {
        if (!currentUser) {
            navigate('/signin', { state: { returnUrl: `/expert/${id}` } });
            return;
        }

        if (currentUser.role !== 'client') {
            toast.error('Only clients can hire experts');
            return;
        }

        setHiring(true);
        try {
            // Send an automated DM directly to the expert notifying them of a potential hire
            await api.messages.sendDirect(
                profile.id,
                `Hi ${profile.name}, I am interested in hiring you for a potential engagement! Let's discuss requirements.`
            );
            
            toast.success('Engagement initiated! Expert has been notified via Direct Message.');
            // Route client straight to project hub wizard to start creating the project spec
            navigate('/project-hub', { state: { expertToHire: { ...profile, user_id: profile.id, hourly_rate: profile.hourlyRate }, view: 'wizard', step: 1 } });
        } catch (error) {
            console.error("Failed to initiate hire:", error);
            toast.error("Failed to start engagement. Please try again.");
        } finally {
            setHiring(false);
        }
    };

    const handleMessage = async () => {
        if (!currentUser) { 
            toast.error('Please log in to message experts');
            navigate('/signin'); 
            return;
        }

        if (currentUser.role !== 'client') {
            toast.error('Only clients can message experts');
            return;
        }

        setMessaging(true);
        try {
            // Go straight to the Collaboration Workspace, which handles DMs dynamically via DirectMessagesPanel
            // We pass the expert down in state so the panel automatically opens their chat
            toast.success('Opening conversation...');
            navigate('/collaboration', { state: { view: 'messages', defaultContact: profile } });
        } catch (error) {
            console.error("Failed to start conversation:", error);
            toast.error("Failed to start conversation. Please try again.");
        } finally {
            setMessaging(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center pt-20">
                <p className="text-xl text-red-500 mb-4">{error || "Profile not found"}</p>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    const isExpert = profile.role === 'expert';

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <SEO title={`${profile.name} - Profile`} description={`View profile of ${profile.name}`} />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Info Card */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                            <div className="h-32 bg-gradient-to-br from-primary to-purple-700 relative">
                                {profile.vettingStatus === 'verified' && (
                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                        <CheckCircle size={12} /> Verified Expert
                                    </div>
                                )}
                            </div>
                            <div className="px-6 pb-6 relative">
                                <div className="flex justify-center -mt-16 mb-4">
                                    <div className="w-32 h-32 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden">
                                        {(profile.profile_image_url || profile.profileImageUrl) ? (
                                            <img
                                                src={profile.profile_image_url || profile.profileImageUrl}
                                                alt={profile.name}
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'User')}&background=0D8ABC&color=fff&size=128`; }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-blue-600 text-white text-3xl font-bold">
                                                {profile.name?.charAt(0) || 'U'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                                    <p className="text-primary font-medium">{profile.title || (isExpert ? "Subject Matter Expert" : "Client")}</p>

                                    {isExpert && profile.rating && (
                                        <div className="flex items-center justify-center gap-1 text-yellow-500 text-sm font-bold mt-2">
                                            <Star size={16} fill="currentColor" />
                                            <span>{profile.rating}</span>
                                            <span className="text-gray-400 font-normal">({profile.reviewCount || 0} reviews)</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 mb-8 text-sm">
                                    {profile.hourlyRate && (
                                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                            <span className="text-gray-500">Hourly Rate</span>
                                            <span className="font-bold text-gray-900">${profile.hourlyRate}/hr</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 text-gray-600">
                                        <MapPin size={18} className="text-gray-400" />
                                        <span>{profile.location || "Location not specified"}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Calendar size={18} className="text-gray-400" />
                                        <span>Joined {new Date(profile.joinedAt).toLocaleDateString()}</span>
                                    </div>
                                    {profile.company && (
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <Building size={18} className="text-gray-400" />
                                            <span>{profile.company}</span>
                                        </div>
                                    )}
                                    {profile.website && (
                                        <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary hover:underline">
                                            <Globe size={18} className="text-gray-400" />
                                            <span>Website</span>
                                        </a>
                                    )}
                                </div>

                                {currentUser?.id !== profile.id && isExpert && (
                                    <div className="space-y-3">
                                        <Button className="w-full shadow-lg shadow-primary/20" onClick={handleHire} disabled={hiring}>
                                            <Briefcase size={18} className="mr-2" />
                                            {hiring ? "Processing..." : "Hire Now"}
                                        </Button>
                                        <Button variant="outline" className="w-full" onClick={handleMessage} disabled={messaging}>
                                            <MessageSquare size={18} className="mr-2" />
                                            {messaging ? "Starting Chat..." : "Message"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Bio */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                            <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                                {profile.bio || "This user hasn't added a bio yet."}
                            </p>
                        </div>

                        {/* Skills */}
                        {isExpert && profile.skills?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Skills & Expertise</h2>
                                <div className="flex flex-wrap gap-2">
                                    {profile.skills.map((skill, index) => (
                                        <span key={index} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg border border-gray-100 font-medium hover:bg-primary/5 hover:text-primary transition-colors cursor-default">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Portfolio */}
                        {isExpert && profile.portfolio && profile.portfolio.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Portfolio</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {profile.portfolio.map((item, index) => (
                                        <div key={index} className="group border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-all">
                                            {item.imageUrl && (
                                                <div className="h-40 bg-gray-100 overflow-hidden">
                                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                </div>
                                            )}
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 mb-1 group-hover:text-primary transition-colors">{item.title}</h3>
                                                <p className="text-gray-500 text-sm line-clamp-2 mb-3">{item.description}</p>
                                                {item.url && (
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary text-sm font-medium flex items-center hover:underline">
                                                        View Project <ExternalLink size={14} className="ml-1" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Certifications (Visual Placeholder if data exists, assuming array of strings or objects) */}
                        {isExpert && profile.certifications?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Certifications</h2>
                                <div className="space-y-3">
                                    {profile.certifications.map((cert, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                            <Award className="text-orange-500 mt-1" size={20} />
                                            <div>
                                                <h4 className="font-bold text-gray-900">{typeof cert === 'string' ? cert : cert.name}</h4>
                                                {typeof cert === 'object' && cert.issuer && (
                                                    <p className="text-sm text-gray-500">{cert.issuer} • {cert.year}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicProfile;
