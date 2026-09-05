import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import SEO from '../components/SEO';
import BidTemplateManager from '../components/bidding/BidTemplateManager';
import AvailabilityManager from '../components/bidding/AvailabilityManager';
import {
    Briefcase, DollarSign, Clock, Calendar,
    CheckCircle, XCircle, Loader2, AlertCircle,
    ExternalLink, Trash2, FileText, List
} from 'lucide-react';
import { toast } from 'sonner';

const MyBids = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('bids'); // 'bids' or 'templates'
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all', 'pending', 'accepted', 'rejected'

    useEffect(() => {
        if (activeTab === 'bids') {
            fetchMyBids();
        }
    }, [filter, activeTab]);

    const fetchMyBids = async () => {
        setLoading(true);
        try {
            const params = filter !== 'all' ? { status: filter } : {};
            const response = await api.bids.getMyBids(params);
            setBids(response.bids || []);
        } catch (error) {
            console.error('Failed to fetch bids:', error);
            toast.error('Failed to load your bids');
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawBid = async (bidId) => {
        if (!confirm('Are you sure you want to withdraw this bid?')) return;

        try {
            await api.bids.withdrawBid(bidId);
            toast.success('Bid withdrawn successfully');
            fetchMyBids();
        } catch (error) {
            console.error('Failed to withdraw bid:', error);
            toast.error(error.response?.data?.message || 'Failed to withdraw bid');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
            accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
            rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
            withdrawn: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Withdrawn' }
        };
        const badge = badges[status] || badges.pending;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                <Icon size={14} />
                {badge.label}
            </span>
        );
    };

    const BidCard = ({ bid }) => (
        <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{bid.project_title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{bid.project_description}</p>
                </div>
                {getStatusBadge(bid.status)}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={16} className="text-green-600" />
                    <div>
                        <p className="text-xs text-gray-500">Your Bid</p>
                        <p className="font-semibold">${Number(bid.bid_amount).toLocaleString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} className="text-blue-600" />
                    <div>
                        <p className="text-xs text-gray-500">Timeline</p>
                        <p className="font-semibold">{bid.proposed_timeline || 'N/A'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={16} className="text-purple-600" />
                    <div>
                        <p className="text-xs text-gray-500">Submitted</p>
                        <p className="font-semibold text-xs">
                            {new Date(bid.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Briefcase size={16} className="text-orange-600" />
                    <div>
                        <p className="text-xs text-gray-500">Client</p>
                        <p className="font-semibold text-xs">{bid.client_name}</p>
                    </div>
                </div>
            </div>

            {bid.cover_letter && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Cover Letter</p>
                    <p className="text-sm text-gray-600 line-clamp-3">{bid.cover_letter}</p>
                </div>
            )}

            <div className="flex gap-3 pt-4 border-t">
                <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 flex items-center justify-center gap-2"
                    onClick={() => window.open(`/marketplace/projects/${bid.project_id}`, '_blank')}
                >
                    <ExternalLink size={16} />
                    View Project
                </Button>
                {bid.status === 'pending' && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-red-600 hover:bg-red-50"
                        onClick={() => handleWithdrawBid(bid.id)}
                    >
                        <Trash2 size={16} />
                        Withdraw
                    </Button>
                )}
                {bid.status === 'accepted' && (
                    <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => window.location.href = `/collaboration/${bid.project_id}`}
                    >
                        Go to Project
                    </Button>
                )}
            </div>
        </Card>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 py-24 px-4 sm:px-6">
            <SEO title="My Bids" />

            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bids & Templates</h1>
                        <p className="text-gray-600">Manage your project bids and proposal templates</p>
                    </div>

                    <div className="bg-white p-1 rounded-lg border border-gray-200 inline-flex shadow-sm">
                        <button
                            onClick={() => setActiveTab('bids')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'bids'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <List size={16} />
                            Active Bids
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'templates'
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <FileText size={16} />
                            Templates
                        </button>
                    </div>
                </div>

                {activeTab === 'bids' ? (
                    <>
                        {/* Filter Tabs */}
                        <div className="flex gap-2 mb-6 overflow-x-auto">
                            {['all', 'pending', 'accepted', 'rejected'].map((status) => (
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

                        {loading ? (
                            <div className="min-h-[400px] flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary" size={48} />
                            </div>
                        ) : bids.length === 0 ? (
                            <Card className="p-12 text-center">
                                <Briefcase className="mx-auto text-gray-400 mb-4" size={64} />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No bids found</h3>
                                <p className="text-gray-600 mb-6">
                                    {filter === 'all'
                                        ? "You haven't submitted any bids yet."
                                        : `You don't have any ${filter} bids.`}
                                </p>
                                <Button onClick={() => window.location.href = '/marketplace'}>
                                    Browse Projects
                                </Button>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {bids.map((bid) => (
                                    <BidCard key={bid.id} bid={bid} />
                                ))}
                            </div>
                        )}
                    </>
                ) : activeTab === 'templates' ? (
                    <BidTemplateManager />
                ) : (
                    <AvailabilityManager />
                )}
            </div>
        </div>
    );
};

export default MyBids;
