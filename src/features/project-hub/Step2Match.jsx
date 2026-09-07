import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, CheckCircle, MapPin, Star, Search, User, FileText, Bot, Globe, Loader2, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { api } from '../../lib/api';
import { useProject } from '../../contexts/ProjectContext';
import { toast } from 'sonner';

const Step2Match = ({ onNext, onInvitationSent, expertToHire }) => {
    const { currentProject, inviteExpert } = useProject();
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [experts, setExperts] = useState([]);
    const [applicants, setApplicants] = useState([]);
    const [selectedExperts, setSelectedExperts] = useState([]);
    const [inviting, setInviting] = useState(false);
    const [activeTab, setActiveTab] = useState('matches'); // 'matches' | 'applicants'
    const [isMatching, setIsMatching] = useState(false);

    useEffect(() => {
        loadData();
    }, [currentProject]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Fetch AI Matches (All experts for now, filtered by verification)
            const expertsData = await api.experts.getAll({ verified: 'true' });
            setExperts(expertsData.experts || []);

            // 2. Fetch Applicants if project exists
            if (currentProject?.id) {
                try {
                    const appsData = await api.applications.getByProject(currentProject.id);
                    if (appsData && appsData.applications) {
                        setApplicants(appsData.applications);
                    }
                } catch (e) {
                    console.error("No applications or error fetching", e);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            if (expertToHire) {
                // Determine if expertToHire is already in the list
                setExperts(prev => {
                    const exists = prev.find(e => (e.id === expertToHire.id || e.user_id === expertToHire.id));
                    if (!exists) {
                        return [expertToHire, ...prev];
                    }
                    return prev;
                });
                setSelectedExperts([expertToHire.user_id || expertToHire.id]);
            }
            setTimeout(() => setStatsLoading(false), 2000);
        }
    };

    const runAIMatch = async () => {
        if (!currentProject || !experts.length) return;
        setIsMatching(true);
        try {
            const result = await api.ai.matchExperts(
                {
                    projectDescription: currentProject.description,
                    requirements: currentProject.requirements
                },
                experts
            );

            if (result.matches && result.matches.length > 0) {
                // Merge matched results with existing expert data
                const matchedExperts = result.matches.map(match => {
                    const fullExpert = experts.find(e => e.id === match.id);
                    if (fullExpert) {
                        return {
                            ...fullExpert,
                            reason: match.reason,
                            score: match.score
                        };
                    }
                    return null;
                }).filter(Boolean);

                if (matchedExperts.length > 0) {
                    setExperts(matchedExperts);
                    setActiveTab('matches');
                    toast.success(`AI found ${matchedExperts.length} perfect matches!`);
                } else {
                    toast.error("AI couldn't find specific matches among the provided experts.");
                }
            } else {
                throw new Error("Could not parse AI response");
            }
        } catch (error) {
            console.error("AI Match failed", error);
            toast.error("AI Match failed. Falling back to default list.");
        } finally {
            setIsMatching(false);
        }
    };

    const toggleExpert = (id) => {
        setSelectedExperts(prev => 
            prev.includes(id) 
                ? prev.filter(eId => eId !== id)
                : [...prev, id]
        );
    };

    const handleInvite = async () => {
        if (selectedExperts.length === 0) {
            toast.error('Please select at least one expert to invite.');
            return;
        }
        if (!currentProject?.id) {
            toast.error('Project not found. Please go back and create your project first.');
            return;
        }

        try {
            setInviting(true);
            
            // Invite the primary expert (first selected) — DB supports one selected_expert_id
            const primaryExpertId = selectedExperts[0];
            
            // Check if any selected experts are applicants and shortlist them
            for (const expertId of selectedExperts) {
                const applicant = applicants.find(a => a.expert_id === expertId);
                if (applicant) {
                    try {
                        await api.applications.updateStatus(applicant.id, 'shortlisted');
                    } catch (e) {
                        console.warn('Could not shortlist applicant:', e.message);
                    }
                }
            }
            
            // Send invitation to primary expert
            const updatedProject = await inviteExpert(currentProject.id, primaryExpertId);
            
            toast.success('Project saved and sent. Awaiting expert acceptance.');
            onInvitationSent?.(updatedProject);
        } catch (error) {
            console.error('Invitation failed:', error);
            toast.error('Failed to invite expert: ' + (error.message || 'Please try again.'));
        } finally {
            setInviting(false);
        }
    };

    if (loading || statsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative w-24 h-24 mb-8">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-full h-full border-4 border-gray-200 border-t-primary rounded-full"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-primary">
                        <Sparkles size={32} className="animate-pulse" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing your company DNA...</h2>
                <p className="text-gray-600">Scanning {experts.length > 0 ? experts.length : '5,000+'} vetted experts for the perfect match.</p>
            </div>
        );
    }

    const handlePostToMarketplace = async () => {
        if (!currentProject?.id) {
            toast.error('Project not found. Please go back and create your project first.');
            return;
        }
        if (!confirm("This will make your project visible to all experts on the Marketplace. Continue?")) return;
        try {
            await api.projects.update(currentProject.id, {
                status: 'open',
                open_for_bidding: true,
                visibility: 'public',
                min_budget: currentProject.min_budget || currentProject.budget,
                max_budget: currentProject.max_budget || currentProject.budget,
                required_skills: currentProject.tech_stack || currentProject.techStack
            });
            toast.success("Project is now live on the Marketplace! Experts can see and bid on it.");
            onNext();
        } catch (error) {
            console.error(error);
            toast.error("Failed to post project.");
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Find your perfect expert</h2>
                    <p className="text-gray-600">AI has analyzed your project. Here are the best matches.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePostToMarketplace}>
                        <Globe className="mr-2" size={16} />
                        Post to Marketplace
                    </Button>
                    <Button
                        onClick={runAIMatch}
                        disabled={isMatching}
                        className="shadow-lg shadow-purple-500/20"
                    >
                        {isMatching ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                        Run AI Match
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex justify-center mb-8">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 flex">
                    <button
                        onClick={() => setActiveTab('matches')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'matches' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Sparkles size={16} />
                        AI Matches
                    </button>
                    <button
                        onClick={() => setActiveTab('applicants')}
                        className={`px-6 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'applicants' ? 'bg-primary text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <User size={16} />
                        Applicants
                        {applicants.length > 0 && (
                            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{applicants.length}</span>
                        )}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {activeTab === 'matches' ? (
                    experts.map((expert) => (
                        <ExpertCard
                            key={expert.user_id || expert.id}
                            expert={expert}
                            selected={selectedExperts.includes(expert.user_id || expert.id)}
                            onSelect={() => toggleExpert(expert.user_id || expert.id)}
                            type="match"
                        />
                    ))
                ) : (
                    applicants.length === 0 ? (
                        <div className="col-span-3 text-center py-12 text-gray-500">
                            No applicants yet. Experts will appear here once they show interest.
                        </div>
                    ) : (
                        applicants.map((app) => (
                            <ExpertCard
                                key={app.expert_id}
                                expert={{
                                    id: app.expert_id,
                                    name: app.expert_name,
                                    title: app.expert_title || 'Applicant',
                                    location: app.expert_location || 'Remote',
                                    bio: app.pitch,
                                    rate: app.rate,
                                    profile_image_url: app.expert_avatar
                                }}
                                selected={selectedExperts.includes(app.expert_id)}
                                onSelect={() => toggleExpert(app.expert_id)}
                                type="applicant"
                                application={app}
                            />
                        ))
                    )
                )}
            </div>

            <div className="flex justify-between items-center">
                <Button
                    variant="ghost"
                    onClick={() => {
                        toast.info('Skipping expert selection. You can invite experts later from the Marketplace.');
                        onNext();
                    }}
                >
                    Skip for Now <ChevronRight className="ml-1" size={16} />
                </Button>

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={handlePostToMarketplace}
                        disabled={!currentProject?.id}
                    >
                        <Globe className="mr-2" size={16} />
                        Post to Marketplace
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleInvite}
                        disabled={selectedExperts.length === 0 || inviting || !currentProject?.id}
                    >
                        {inviting ? 'Processing...' : activeTab === 'applicants' ? `Interview ${selectedExperts.length} Selected` : `Invite ${selectedExperts.length} Selected`}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const ExpertCard = ({ expert, selected, onSelect, type, application }) => (
    <Card
        className={`cursor-pointer transition-all ${selected
            ? 'ring-2 ring-primary border-primary shadow-xl shadow-primary/10'
            : 'hover:border-primary/50'
            }`}
        onClick={onSelect}
    >
        <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
                <img
                    src={expert.profile_image_url || `https://ui-avatars.com/api/?name=${expert.name}`}
                    alt={expert.name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                />
                <div>
                    <h3 className="font-bold text-gray-900">{expert.name}</h3>
                    <p className="text-primary font-medium text-sm">{expert.title || 'Expert'}</p>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    {expert.location || 'Remote'}
                </div>
                {type === 'match' && (
                    <div className="flex items-center gap-1 bg-highlight/10 px-2 py-1 rounded-lg">
                        <Star size={12} className="text-highlight fill-highlight" />
                        <span className="text-highlight font-bold text-sm">{expert.score ? `${expert.score}% Match` : '9.8'}</span>
                    </div>
                )}
                {type === 'applicant' && (
                    <div className="font-bold text-gray-900">
                        ${application.rate}
                    </div>
                )}
            </div>

            <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-blue-700 font-medium">
                    {type === 'match' ? (
                        expert.reason ? <><Bot size={12} className="inline mr-1" /> AI Reason: {expert.reason}</> : <><Sparkles size={12} className="inline mr-1" /> Why We Matched You</>
                    ) : (
                        <><FileText size={12} className="inline mr-1" /> Pitch</>
                    )}
                </p>
                <p className="text-xs text-blue-600 mt-1 leading-relaxed line-clamp-3">
                    {expert.reason || expert.bio || application?.pitch || 'No description available.'}
                </p>
            </div>

            {selected && (
                <div className="flex justify-center text-primary">
                    <CheckCircle size={24} className="fill-primary text-white" />
                </div>
            )}
        </div>
    </Card>
);

export { Step2Match };
