import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Briefcase, ChevronRight, Clock, AlertCircle, DollarSign, Activity, FileText, Check, Trash2, UserCheck, Store, Video } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'sonner';
import { useSocket } from '../hooks/useSocket';

import { Step1Vault } from '../features/project-hub/Step1Vault';
import { Step2Match } from '../features/project-hub/Step2Match';
import { Step3Interview } from '../features/project-hub/Step3Interview';
import { Step4Contract } from '../features/project-hub/Step4Contract';

const steps = [
    "Company Vault",
    "AI Match",
    "Interview",
    "Contract"
];

const ProjectHub = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'wizard'
    const [clientProjects, setClientProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalSpent: 0,
        activeCount: 0,
        completedCount: 0
    });

    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const socket = useSocket();
    const { currentProject, clearCurrentProject, setActiveProject, deleteProject } = useProject();

    // State for direct hire flow
    const [expertToHire, setExpertToHire] = useState(null);

    useEffect(() => {
        if (location.state?.expertToHire) {
            setExpertToHire(location.state.expertToHire);
            clearCurrentProject();
            setViewMode('wizard');
            setCurrentStep(1); 
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Fetch user projects on mount
    useEffect(() => {
        const fetchProjects = async () => {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                try {
                    const parsed = JSON.parse(userInfo);
                    if (parsed.role === 'expert') {
                        navigate('/expert-dashboard');
                        return;
                    }
                } catch (e) {
                    // ignore error
                }
            }

            if (user?.id) {
                try {
                    const data = await api.projects.getMine();
                    const projects = data?.projects || (Array.isArray(data) ? data : []);
                    setClientProjects(projects);

                    // Calculate stats
                    const totalSpent = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
                    const active      = projects.filter(p => p.status === 'active' || p.status === 'in_progress').length;
                    const completed   = projects.filter(p => p.status === 'completed').length;

                    setStats({
                        totalSpent,
                        activeCount: active,
                        completedCount: completed
                    });
                } catch (e) {
                    console.error("Failed to load projects", e);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [navigate, user]);

    useEffect(() => {
        if (!socket || !user?.id) return;
        socket.emit('join_user', user.id);

        const handleProjectUpdate = (updatedProject) => {
            setClientProjects(prev => {
                const exists = prev.some(project => project.id === updatedProject.id);
                return exists
                    ? prev.map(project => project.id === updatedProject.id ? { ...project, ...updatedProject } : project)
                    : [updatedProject, ...prev];
            });
            if (updatedProject.expert_status === 'accepted') {
                toast.success('Expert accepted your project. Collaboration is now ready.');
            }
        };

        socket.on('project_update', handleProjectUpdate);
        return () => socket.off('project_update', handleProjectUpdate);
    }, [socket, user?.id]);

    const nextStep = () => {
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        } else {
            // Final step completed
            if (currentProject?.id) {
                navigate('/collaboration', { state: { projectId: currentProject.id } });
            } else {
                // Fallback if no project in context (shouldn't happen if flow is followed)
                setViewMode('list');
            }
        }
    };

    const handleDeleteProject = async (id) => {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            try {
                await deleteProject(id);
                setClientProjects(prev => prev.filter(p => p.id !== id));
                toast.success('Project deleted');
            } catch (err) {
                toast.error('Failed to delete project');
            }
        }
    };

    const handleInvitationSent = (updatedProject) => {
        setClientProjects(prev => {
            const exists = prev.some(project => project.id === updatedProject.id);
            return exists
                ? prev.map(project => project.id === updatedProject.id ? { ...project, ...updatedProject } : project)
                : [updatedProject, ...prev];
        });
        setExpertToHire(null);
        setViewMode('list');
    };

    const publishProject = async (project) => {
        try {
            const updated = await api.projects.update(project.id, { status: 'open', open_for_bidding: true });
            setClientProjects(prev => prev.map(p => p.id === project.id ? { ...p, ...updated } : p));
            toast.success('Project published to the marketplace.');
        } catch (error) { toast.error(error.message || 'Could not publish project.'); }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1: return <Step1Vault onNext={nextStep} />;
            case 2: return <Step2Match onNext={nextStep} onInvitationSent={handleInvitationSent} expertToHire={expertToHire} />;
            case 3: return <Step3Interview onNext={nextStep} />;
            case 4: return <Step4Contract onNext={nextStep} />;
            default: return <Step1Vault onNext={nextStep} />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 pb-12">
                <SEO title="Project Hub" description="Manage your Africa Konnect projects." />
                <div className="max-w-7xl auto px-4 sm:px-6 lg:px-8">
                    {/* Command Center Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">Project Hub</h1>
                            <p className="text-gray-600">Overview of your active work and talent pipeline</p>
                        </div>
                        <Button
                            onClick={() => { clearCurrentProject(); setViewMode('wizard'); setCurrentStep(1); }}
                            className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white font-bold"
                        >
                            <Plus className="mr-2" size={20} />
                            Start New Project
                        </Button>
                    </div>

                    {/* Stats Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <Card className="p-6 bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative group">
                            <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                                <Activity size={150} />
                            </div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-500 font-medium text-sm uppercase tracking-wide">Active Projects</span>
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Activity size={20} />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900">{stats.activeCount}</h3>
                                <div className="mt-2 flex items-center text-xs text-green-600 font-medium bg-green-50 w-fit px-2 py-1 rounded-full">
                                    <Activity size={12} className="mr-1" /> All systems operational
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 bg-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative group">
                            <div className="absolute right-0 top-0 opacity-5 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                                <DollarSign size={150} />
                            </div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-500 font-medium text-sm uppercase tracking-wide">Total Investment</span>
                                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                        <DollarSign size={20} />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold text-gray-900">${stats.totalSpent.toLocaleString()}</h3>
                                <p className="text-xs text-gray-400 mt-2">Across {clientProjects.length} projects</p>
                            </div>
                        </Card>

                        <Card className="p-6 bg-gradient-to-br from-indigo-900 to-primary text-white border-none shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative group">
                            <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                                <FileText size={150} />
                            </div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-white/80 font-medium text-sm uppercase tracking-wide">Completed</span>
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
                                        <Check size={20} />
                                    </div>
                                </div>
                                <h3 className="text-3xl font-bold text-white mb-2">{stats.completedCount}</h3>
                                <p className="text-xs text-white/80">
                                    Lifetime project completions
                                </p>
                            </div>
                        </Card>
                    </div>

                    {/* Drafts / Saved Projects */}
                    {clientProjects.some(p => p.status === 'draft' && p.expert_status !== 'pending') && (
                        <div className="mb-10">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <Clock className="text-orange-500 mr-2" size={20} />
                                Resume Setup
                            </h2>
                            <div className="grid gap-4 lg:grid-cols-2">
                                {clientProjects.filter(p => p.status === 'draft' && p.expert_status !== 'pending').map(p => (
                                    <div key={p.id} className="bg-white border border-orange-100 rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0">
                                                <FileText size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-semibold text-gray-900 truncate">{p.title || 'Untitled Draft'}</h4>
                                                <p className="text-xs text-gray-500 truncate">Saved {new Date(p.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => {
                                            setActiveProject(p.id);
                                            setViewMode('wizard');
                                            setCurrentStep(1);
                                        }}>
                                            Resume
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Work */}
                    <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Briefcase className="text-primary" size={22} />
                        Your Project Workspaces
                    </h2>

                    {clientProjects.length === 0 ? (
                        <Card className="p-16 text-center border-dashed border-2 bg-gray-50/50">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Briefcase className="text-primary w-10 h-10" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">No active projects</h2>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">Start your first project to connect with top African tech talent and manage your development.</p>
                            <Button size="lg" onClick={() => { setViewMode('wizard'); setCurrentStep(1); }}>
                                Start Your First Project
                            </Button>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {clientProjects.map(p => {
                                const awaitingAcceptance = p.expert_status === 'pending';
                                const collaborationReady = p.expert_status === 'accepted' || ['active', 'in_progress', 'completed'].includes(p.status);
                                return (
                                <motion.div key={p.id} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                                    <Card className="h-full flex flex-col overflow-hidden border-t-4 border-t-primary hover:shadow-xl transition-shadow">
                                        <div className="p-6 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wide
                                                    ${p.status === 'active' ? 'bg-green-100 text-green-700' :
                                                        p.status === 'draft' ? 'bg-gray-100 text-gray-600' :
                                                            'bg-blue-50 text-blue-600'}`}>
                                                    {awaitingAcceptance ? 'Awaiting expert' : p.status}
                                                </span>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleDeleteProject(p.id)}
                                                        className="text-gray-400 hover:text-error transition-colors p-1"
                                                        title="Delete Project"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{p.title}</h3>
                                            <p className="text-sm text-gray-500 mb-6 line-clamp-2">{p.description}</p>

                                            {awaitingAcceptance && (
                                                <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                                                    <Clock size={15} className="mt-0.5 shrink-0" />
                                                    <span>Your project request is saved. The workspace will activate automatically when the expert accepts.</span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {new Date(p.created_at).toLocaleDateString()}
                                                </div>
                                                <div className="font-semibold text-gray-900">
                                                    ${p.budget?.toLocaleString() || '0'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50 border-t border-gray-100">
                                            <div className="grid grid-cols-2 gap-2 mb-2">
                                                {!p.open_for_bidding ? (
                                                    <Button size="sm" variant="outline" onClick={() => publishProject(p)}><Store size={14} /> Publish</Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" onClick={() => navigate(`/marketplace/projects/${p.id}/bids`)}><UserCheck size={14} /> Manage interest</Button>
                                                )}
                                                <Button size="sm" variant="outline" onClick={() => navigate(`/collaboration?projectId=${p.id}&tab=video`)}><Video size={14} /> Meeting</Button>
                                            </div>
                                            <Button
                                                className="w-full justify-between group"
                                                disabled={awaitingAcceptance}
                                                onClick={() => {
                                                    if (awaitingAcceptance) return;
                                                    if (!collaborationReady) {
                                                        setActiveProject(p.id);
                                                        setViewMode('wizard');
                                                        setCurrentStep(1);
                                                    } else {
                                                        navigate('/collaboration', { state: { projectId: p.id } });
                                                    }
                                                }}
                                            >
                                                {awaitingAcceptance ? 'Waiting for Expert' : collaborationReady ? 'Open Collaboration' : 'Finish Setup'}
                                                {awaitingAcceptance
                                                    ? <UserCheck size={16} />
                                                    : <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                                            </Button>
                                        </div>
                                    </Card>
                                </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Render Wizard View
    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <SEO
                title="Create Project"
                description="Start a new project with Africa Konnect."
            />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header with Back Button */}
                <div className="mb-8">
                    <button
                        onClick={() => setViewMode('list')}
                        className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-4 transition-colors"
                    >
                        <ChevronRight className="rotate-180 mr-1" size={16} /> Back to Hub
                    </button>
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold text-gray-900">New Project Setup</h1>
                        <Button variant="outline" onClick={() => {
                            if (currentProject?.id) {
                                toast.success('Project saved in your Project Hub.');
                                setViewMode('list');
                            } else {
                                setViewMode('list');
                            }
                        }}>
                            Save & Exit
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Progress Sidebar (Desktop) */}
                    <div className="hidden lg:block w-64 shrink-0">
                        <div className="sticky top-24 space-y-1">
                            {steps.map((step, index) => {
                                const stepNum = index + 1;
                                const isActive = stepNum === currentStep;
                                const isCompleted = stepNum < currentStep;
                                const canJump = !!currentProject?.id;

                                return (
                                    <button
                                        key={step}
                                        disabled={!canJump && !isCompleted && !isActive}
                                        onClick={() => canJump && setCurrentStep(stepNum)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${isActive ? 'bg-white shadow-sm ring-1 ring-gray-200' : 'opacity-60'} ${canJump ? 'hover:bg-gray-100 cursor-pointer' : ''}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${isActive ? 'bg-primary text-white' :
                                            isCompleted ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {isCompleted ? <Check size={14} /> : stepNum}
                                        </div>
                                        <span className={`text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {step}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Content */}
                    <div className="flex-1">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {renderStep()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectHub;
