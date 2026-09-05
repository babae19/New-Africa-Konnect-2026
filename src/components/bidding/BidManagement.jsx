import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
    User, DollarSign, Clock, Calendar, Star,
    CheckCircle, XCircle, Loader2, ExternalLink,
    MessageSquare, Video
} from 'lucide-react';
import { toast } from 'sonner';
import AutoScheduleModal from './AutoScheduleModal';

const BidManagement = ({ projectId: propProjectId }) => {
    const { projectId: paramProjectId } = useParams();
    const projectId = propProjectId || paramProjectId;

    const [bids, setBids] = useState([]);
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');

    useEffect(() => {
        if (projectId) {
            fetchProjectAndBids();
        }
    }, [projectId, filter]);

    const fetchProjectAndBids = async () => {
        setLoading(true);
        try {
            const [projectRes, bidsRes] = await Promise.all([
                api.get(`/projects/${projectId}`),
                api.get(`/projects/${projectId}/bids`, { params: { status: filter !== 'all' ? filter : undefined } })
            ]);
            setProject(projectRes.data);
            setBids(bidsRes.data.bids || []);
        } catch (error) {
            console.error('Failed to fetch bids:', error);
            toast.error('Failed to load bids');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptBid = async (bidId) => {
        if (!confirm('Are you sure you want to accept this bid? This will reject all other bids and assign the expert to your project.')) {
            return;
        }

        try {
            await api.put(`/projects/${projectId}/bids/${bidId}/accept`);
            toast.success('Bid accepted! The expert has been notified.');
            fetchProjectAndBids();
        } catch (error) {
            console.error('Failed to accept bid:', error);
            toast.error(error.response?.data?.message || 'Failed to accept bid');
        }
    };

    const handleRejectBid = async (bidId) => {
        if (!confirm('Are you sure you want to reject this bid?')) {
            return;
        }

        try {
            await api.put(`/projects/${projectId}/bids/${bidId}/reject`);
            toast.success('Bid rejected');
            fetchProjectAndBids();
        } catch (error) {
            console.error('Failed to reject bid:', error);
            toast.error(error.response?.data?.message || 'Failed to reject bid');
        }
    };

    const [selectedBidForInterview, setSelectedBidForInterview] = useState(null);

    const handleScheduleClick = (bid) => {
        setSelectedBidForInterview(bid);
    };

    const handleInterviewScheduled = () => {
        // Optionally refresh bids or show a success message
        fetchProjectAndBids();
    };

    const BidCard = ({ bid }) => (
        <Card className="p-6">
            <div className="flex items-start gap-4 mb-4">
                {/* Expert Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                    {bid.expert_image ? (
                        <img src={bid.expert_image} alt={bid.expert_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                        bid.expert_name?.charAt(0).toUpperCase()
                    )}
                </div>

                {/* Expert Info */}
                <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{bid.expert_name}</h3>
                            <p className="text-sm text-gray-600">{bid.expert_title || 'Expert'}</p>
                        </div>
                        {bid.expert_rating && (
                            <div className="flex items-center gap-1 text-yellow-500">
                                <Star size={16} fill="currentColor" />
                                <span className="font-semibold">{bid.expert_rating}</span>
                            </div>
                        )}
                    </div>

                    {/* Expert Stats */}
                    <div className="flex gap-4 text-sm text-gray-600 mb-3">
                        {bid.expert_completed_projects > 0 && (
                            <span>{bid.expert_completed_projects} projects completed</span>
                        )}
                        {bid.expert_hourly_rate && (
                            <span>${bid.expert_hourly_rate}/hr standard rate</span>
                        )}
                    </div>

                    {/* Expert Skills */}
                    {bid.expert_skills && bid.expert_skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {bid.expert_skills.slice(0, 5).map((skill, idx) => (
                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bid Details */}
            <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                <div>
                    <p className="text-xs text-gray-500 mb-1">Bid Amount</p>
                    <p className="text-lg font-bold text-green-600 flex items-center gap-1">
                        <DollarSign size={18} />
                        {bid.bid_amount?.toLocaleString()}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">Timeline</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <Clock size={16} />
                        {bid.proposed_timeline || 'N/A'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-500 mb-1">Submitted</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                        <Calendar size={16} />
                        {new Date(bid.created_at).toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* Cover Letter */}
            {bid.cover_letter && (
                <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Cover Letter</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{bid.cover_letter}</p>
                </div>
            )}

            {/* Portfolio Links */}
            {bid.portfolio_links && bid.portfolio_links.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Portfolio</p>
                    <div className="flex flex-wrap gap-2">
                        {bid.portfolio_links.map((link, idx) => (
                            <a
                                key={idx}
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                                <ExternalLink size={14} />
                                Link {idx + 1}
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Actions */}
            {bid.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                    <Button
                        variant="outline"
                        className="flex-1 flex items-center justify-center gap-2"
                        onClick={() => window.open(`/experts/${bid.expert_id}`, '_blank')}
                    >
                        <User size={16} />
                        View Profile
                    </Button>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 text-blue-600 hover:bg-blue-50"
                        onClick={() => handleScheduleClick(bid)}
                    >
                        <Video size={16} />
                        Interview
                    </Button>
                    <Button
                        variant="outline"
                        className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                        onClick={() => handleRejectBid(bid.id)}
                    >
                        <XCircle size={16} />
                        Reject
                    </Button>
                    <Button
                        className="flex-1 flex items-center gap-2"
                        onClick={() => handleAcceptBid(bid.id)}
                    >
                        <CheckCircle size={16} />
                        Accept Bid
                    </Button>
                </div>
            )}

            {bid.status === 'accepted' && (
                <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-green-600 mb-3">
                        <CheckCircle size={20} />
                        <span className="font-semibold">Bid Accepted</span>
                    </div>
                    <Button
                        className="w-full"
                        onClick={() => window.location.href = `/collaboration/${projectId}`}
                    >
                        Go to Collaboration Hub
                    </Button>
                </div>
            )}

            {bid.status === 'rejected' && (
                <div className="pt-4 border-t">
                    <div className="flex items-center gap-2 text-red-600">
                        <XCircle size={20} />
                        <span className="font-semibold">Bid Rejected</span>
                    </div>
                </div>
            )}
        </Card>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            {project && (
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Bids for: {project.title}</h2>
                    <p className="text-gray-600">Review and manage bids from experts</p>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto">
                {['pending', 'accepted', 'rejected', 'all'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${filter === status
                            ? 'bg-primary text-white'
                            : 'bg-white text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === 'all' && bids.length > 0 && ` (${bids.length})`}
                    </button>
                ))}
            </div>

            {/* Bids List */}
            {bids.length === 0 ? (
                <Card className="p-12 text-center">
                    <User className="mx-auto text-gray-400 mb-4" size={64} />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No bids yet</h3>
                    <p className="text-gray-600">
                        {filter === 'pending'
                            ? 'No pending bids for this project.'
                            : `No ${filter} bids found.`}
                    </p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {bids.map((bid) => (
                        <BidCard key={bid.id} bid={bid} />
                    ))}
                </div>
            )}

            <AutoScheduleModal
                isOpen={!!selectedBidForInterview}
                onClose={() => setSelectedBidForInterview(null)}
                expertId={selectedBidForInterview?.expert_id}
                expertName={selectedBidForInterview?.expert_name}
                projectId={projectId}
                onScheduled={handleInterviewScheduled}
            />
        </div>
    );
};

export default BidManagement;
