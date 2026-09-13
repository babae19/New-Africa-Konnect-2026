import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import SEO from '../components/SEO';
import { 
    ChevronLeft, Loader2, CheckCircle,
    XCircle, Clock, DollarSign, ExternalLink, 
    User, Award, Briefcase, FileText,
    MessageSquare, TrendingUp, Video
} from 'lucide-react';
import { toast } from 'sonner';
import socketService from '../lib/socket';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';

const ManageProjectBids = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [interviewBid, setInterviewBid] = useState(null);

    useEffect(() => {
        fetchData();
        
        // Listen for new bids in real-time
        const socket = socketService.connect();
        socket.on('new_bid', (data) => {
            if (data.projectId === id) {
                toast.info(`New bid from ${data.expertName}!`);
                fetchBids(); // Refresh bid list
            }
        });

        return () => {
            socket.off('new_bid');
        };
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [projRes, bidsRes] = await Promise.all([
                api.projects.getById(id),
                api.projects.getBids(id)
            ]);
            setProject(projRes?.project || projRes);
            setBids(bidsRes.bids || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast.error('Failed to load project or bids');
            navigate('/collaboration', { state: { projectId: id } });
        } finally {
            setLoading(false);
        }
    };

    const scheduleInterview = async (details) => {
        await api.interviews.schedule({ ...details, projectId: id, expertId: interviewBid.expert_id });
        toast.success('Jitsi interview room created and shared with the expert.');
    };

    const fetchBids = async () => {
        try {
            const bidsRes = await api.projects.getBids(id);
            setBids(bidsRes.bids || []);
        } catch (error) {
            console.error('Failed to fetch bids:', error);
        }
    };

    const handleAcceptBid = async (bidId) => {
        if (!confirm("Are you sure you want to accept this bid? This will assign the project and reject all other bidders.")) {
            return;
        }

        try {
            await api.projects.acceptBid(id, bidId);
            toast.success("Bid accepted! Project is now active.");
            navigate('/collaboration');
        } catch (error) {
            console.error('Failed to accept bid:', error);
            toast.error('Failed to accept bid');
        }
    };

    const handleRejectBid = async (bidId) => {
        try {
            await api.projects.rejectBid(id, bidId);
            toast.success("Bid rejected.");
            setBids(prev => prev.filter(b => b.id !== bidId));
        } catch (error) {
            console.error('Failed to reject bid:', error);
            toast.error('Failed to reject bid');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-24 px-4 sm:px-6">
            <SEO title="Manage Bids | Africa Konnect" />
            
            <div className="max-w-6xl mx-auto">
                <button 
                    onClick={() => navigate(`/marketplace/projects/${id}`)}
                    className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors mb-8 group"
                >
                    <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Project Details
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bidders for "{project?.title}"</h1>
                        <p className="text-gray-500">Monitor and select the best expert for your project in real-time.</p>
                    </div>
                    
                </div>

                <div className="space-y-6">
                    {bids.length === 0 ? (
                        <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                                <TrendingUp size={40} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">No bids yet</h3>
                            <p className="text-gray-500 max-w-md mx-auto">As soon as experts submit proposals for this project, they will appear here in real-time.</p>
                        </div>
                    ) : (
                        bids.map((bid) => (
                            <Card key={bid.id} className="p-8 hover:shadow-xl transition-all border-l-4 border-l-transparent hover:border-l-primary overflow-hidden relative">
                                {bid.status === 'accepted' && (
                                    <div className="absolute top-0 right-0 px-4 py-1 bg-green-500 text-white text-xs font-bold uppercase rounded-bl-xl">
                                        Selected
                                    </div>
                                )}
                                
                                <div className="flex flex-col lg:flex-row gap-8">
                                    {/* Expert Info */}
                                    <div className="lg:w-1/4">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold border-2 border-primary/20">
                                                {bid.expert_name?.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-lg hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/profile/view/${bid.expert_id}`)}>
                                                    {bid.expert_name}
                                                </h4>
                                                <p className="text-sm text-gray-500">{bid.expert_title || 'Expert Professional'}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Award size={16} className="text-yellow-500" />
                                                <span>Rating: 4.9/5.0</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <CheckCircle size={16} className="text-green-500" />
                                                <span>12 Projects Completed</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Proposal Content */}
                                    <div className="lg:w-1/2 border-l border-r border-gray-50 px-8">
                                        <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-widest mb-4">
                                            <FileText size={14} /> Proposal Detail
                                        </div>
                                        <p className="text-gray-600 line-clamp-4 text-sm leading-relaxed mb-4">
                                            {bid.cover_letter}
                                        </p>
                                        <div className="flex flex-wrap gap-4">
                                            {bid.proposed_timeline && (
                                                <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                                                    <Clock size={14} /> {bid.proposed_timeline}
                                                </div>
                                            )}
                                            {bid.portfolio_links?.map((link, idx) => (
                                                <a key={idx} href={link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold px-3 py-1 bg-gray-50 text-gray-600 hover:text-primary rounded-full transition-colors">
                                                    <ExternalLink size={14} /> Portfolio {idx + 1}
                                                </a>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Column */}
                                    <div className="lg:w-1/4 flex flex-col justify-center gap-4">
                                        <div className="text-center mb-2">
                                            <p className="text-3xl font-black text-gray-900">${bid.bid_amount?.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Total Bid Amount</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                                            <Button 
                                                className="w-full h-12 shadow-md shadow-primary/10"
                                                onClick={() => handleAcceptBid(bid.id)}
                                                disabled={bid.status !== 'pending'}
                                            >
                                                Accept Proposal
                                            </Button>
                                            <Button 
                                                variant="outline"
                                                className="w-full h-12 text-error border-error/20 hover:bg-error/5 hover:border-error"
                                                onClick={() => handleRejectBid(bid.id)}
                                                disabled={bid.status !== 'pending'}
                                            >
                                                Pass
                                            </Button>
                                        </div>
                                        
                                        <button onClick={() => setInterviewBid(bid)} className="flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors mt-2">
                                            <Video size={16} /> Schedule Video Interview
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
                <ScheduleInterviewModal isOpen={!!interviewBid} onClose={() => setInterviewBid(null)} onSchedule={scheduleInterview} expertName={interviewBid?.expert_name} />
            </div>
        </div>
    );
};

export default ManageProjectBids;
