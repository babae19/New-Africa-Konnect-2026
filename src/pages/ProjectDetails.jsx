import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import SEO from '../components/SEO';
import { 
    Briefcase, DollarSign, Clock, Calendar, 
    Tag, ChevronLeft, Users, Shield, 
    CheckCircle, MessageSquare, AlertCircle,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import BidSubmissionModal from '../components/bidding/BidSubmissionModal';

const ProjectDetails = () => {
    const { id } = useParams();
    const { user, isExpert, isClient } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isBidModalOpen, setIsBidModalOpen] = useState(false);
    const [hasAlreadyBid, setHasAlreadyBid] = useState(false);

    useEffect(() => {
        fetchProjectDetails();
    }, [id]);

    const fetchProjectDetails = async () => {
        setLoading(true);
        try {
            const data = await api.projects.getById(id);
            setProject(data?.project || data);
            
            // If expert, check if they already bid
            if (isExpert) {
                const bidsRes = await api.bids.getMyBids();
                const bids = bidsRes?.bids || (Array.isArray(bidsRes) ? bidsRes : []);
                const existingBid = bids.find(b => b.project_id === id);
                if (existingBid) setHasAlreadyBid(true);
            }
        } catch (error) {
            console.error('Failed to fetch project details:', error);
            toast.error('Failed to load project details');
            navigate('/marketplace');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (!project) return null;

    const isOwner = user?.id === project.client_id;

    return (
        <div className="min-h-screen bg-gray-50/50 py-24 px-4 sm:px-6">
            <SEO title={`${project.title} | Market`} />
            
            <div className="max-w-5xl mx-auto">
                {/* Header / Back */}
                <button 
                    onClick={() => navigate('/marketplace')}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8 group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Marketplace
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <Card className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{project.title}</h1>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar size={16} />
                                            Posted {new Date(project.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users size={16} />
                                            {project.bid_count || 0} Bids
                                        </span>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold uppercase rounded-full">
                                    {project.status}
                                </div>
                            </div>

                            <div className="prose max-w-none text-gray-600 mb-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
                                <p className="whitespace-pre-wrap">{project.description}</p>
                            </div>

                            <div className="border-t pt-8">
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Required Skills</h3>
                                <div className="flex flex-wrap gap-2">
                                    {project.tech_stack?.map((skill, idx) => (
                                        <span key={idx} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        <Card className="p-6 border-t-4 border-t-primary">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Project Overview</h3>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-gray-500 flex items-center gap-2"><DollarSign size={16} /> Budget</span>
                                    <span className="font-bold text-gray-900">${project.min_budget?.toLocaleString()} - ${project.max_budget?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-gray-500 flex items-center gap-2"><Clock size={16} /> Timeline</span>
                                    <span className="font-semibold text-gray-900">{project.duration || 'Flexible'} days</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-50">
                                    <span className="text-gray-500 flex items-center gap-2"><Calendar size={16} /> Deadline</span>
                                    <span className="font-semibold text-gray-900">
                                        {project.bidding_deadline ? new Date(project.bidding_deadline).toLocaleDateString() : 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {isExpert && !isOwner && (
                                <Button 
                                    className="w-full py-6 text-lg shadow-lg shadow-primary/20"
                                    disabled={hasAlreadyBid || (project.bidding_deadline && new Date(project.bidding_deadline) < new Date())}
                                    onClick={() => setIsBidModalOpen(true)}
                                >
                                    {hasAlreadyBid ? <><CheckCircle size={20} className="mr-2" /> Bid Submitted</> : 'Submit a Proposal'}
                                </Button>
                            )}

                            {isOwner && (
                                <Button 
                                    variant="outline"
                                    className="w-full py-6 text-lg"
                                    onClick={() => navigate(`/marketplace/projects/${project.id}/bids`)}
                                >
                                    <Users size={20} className="mr-2" /> Manage Bids ({project.bid_count || 0})
                                </Button>
                            )}
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                            <h4 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                                <Shield size={18} /> Client Information
                            </h4>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold">
                                    {project.client_name?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">{project.client_name}</p>
                                    <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider">Verified Client</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span>Member since</span>
                                    <span className="font-medium">2024</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Hire rate</span>
                                    <span className="text-green-600 font-bold">98%</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            <BidSubmissionModal 
                project={project}
                isOpen={isBidModalOpen}
                onClose={() => setIsBidModalOpen(false)}
                onBidSubmitted={() => {
                    setHasAlreadyBid(true);
                    fetchProjectDetails();
                }}
            />
        </div>
    );
};

export default ProjectDetails;
