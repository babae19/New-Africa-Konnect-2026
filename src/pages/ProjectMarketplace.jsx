import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import SEO from '../components/SEO';
import AdvancedSearchPanel from '../components/bidding/AdvancedSearchPanel';
import SavedSearches from '../components/bidding/SavedSearches';
import {
    Briefcase, TrendingUp, ChevronRight, Users,
    DollarSign, Clock, MapPin, Calendar, Tag, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const ProjectMarketplace = () => {
    const { user, isClient } = useAuth();
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        minBudget: '',
        maxBudget: '',
        skills: '',
        minDuration: '',
        maxDuration: '',
        complexity: '',
        postedAfter: '',
        sortBy: 'recent'
    });
    const [viewMode, setViewMode] = useState('grid');
    const [savedSearches, setSavedSearches] = useState([]);

    useEffect(() => {
        // Allow both experts and clients
        if (user?.role !== 'expert' && user?.role !== 'client') {
            toast.error('Access denied: Login required to browse projects');
            navigate('/signin');
            return;
        }
        fetchMarketplaceProjects();
        fetchSavedSearches();
    }, [user, navigate]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchMarketplaceProjects();
        }, 500);
        return () => clearTimeout(timer);
    }, [filters]);

    const fetchMarketplaceProjects = async () => {
        setLoading(true);
        try {
            const response = await api.projects.getMarketplace(filters);
            setProjects(response.projects || []);
        } catch (error) {
            console.error('Failed to fetch marketplace projects:', error);
            toast.error('Failed to load projects');
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSavedSearches = async () => {
        try {
            const data = await api.savedSearches.list();
            setSavedSearches(data);
        } catch (error) {
            console.error('Failed to load saved searches:', error);
        }
    };

    const handleSaveSearch = async (name) => {
        try {
            const newSearch = await api.savedSearches.create({
                name,
                filters
            });
            setSavedSearches([newSearch, ...savedSearches]);
            toast.success('Search saved successfully');
        } catch (error) {
            console.error('Failed to save search:', error);
            toast.error('Failed to save search');
        }
    };

    const handleApplySavedSearch = async (search) => {
        setFilters(search.filters);
        // Also update last used
        try {
            await api.savedSearches.execute(search.id);
            // Update local list to reflect new last_used time
            fetchSavedSearches();
        } catch (error) {
            console.error('Failed to execute saved search:', error);
        }
    };

    const handleViewProject = (projectId) => {
        navigate(`/marketplace/projects/${projectId}`);
    };

    const ProjectCard = ({ project }) => (
        <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewProject(project.id)}>
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">{project.title}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{project.description}</p>
                </div>
                {project.bid_count > 0 && (
                    <div className="ml-4 flex items-center gap-1 text-sm text-gray-500 whitespace-nowrap">
                        <Users size={16} />
                        <span>{project.bid_count} bids</span>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
                {project.required_skills?.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        {skill}
                    </span>
                ))}
                {project.required_skills?.length > 3 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        +{project.required_skills.length - 3} more
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="font-semibold">
                        ${Number(project.min_budget).toLocaleString()} - ${Number(project.max_budget).toLocaleString()}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                    <Clock size={16} className="text-blue-600" />
                    <span>{project.duration || 'Flexible'} days</span>
                </div>
                {project.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={16} className="text-red-600" />
                        <span>{project.location}</span>
                    </div>
                )}
                {project.bidding_deadline && (
                    <div className="flex items-center gap-2 text-gray-600">
                        <Calendar size={16} className="text-orange-600" />
                        <span className="text-xs">
                            Due: {new Date(project.bidding_deadline).toLocaleDateString()}
                        </span>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Briefcase size={16} className="text-gray-600" />
                    </div>
                    <span className="text-sm text-gray-600">{project.client_name}</span>
                </div>
                <Button 
                    size="sm" 
                    className="flex items-center gap-2"
                    onClick={() => navigate(`/marketplace/projects/${project.id}`)}
                >
                    View Details
                    <ChevronRight size={16} />
                </Button>
            </div>
        </Card>
    );

    if (loading && projects.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 py-24 px-4 sm:px-6">
            <SEO title="Project Marketplace" />

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Project Marketplace</h1>
                        <p className="text-gray-600">Browse and bid on open projects from clients worldwide</p>
                    </div>
                    {isClient && (
                        <Button 
                            onClick={() => navigate('/project-hub')}
                            className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-primary/20 transition-all font-bold text-lg group"
                        >
                            <Briefcase size={22} className="group-hover:scale-110 transition-transform" />
                            Start a Project
                        </Button>
                    )}
                </div>

                <SavedSearches onExecuteSearch={handleApplySavedSearch} />
                <div className="mb-6"></div>

                <AdvancedSearchPanel
                    filters={filters}
                    onFilterChange={setFilters}
                    onSaveSearch={handleSaveSearch}
                    savedSearches={savedSearches}
                    onApplySavedSearch={handleApplySavedSearch}
                />

                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600">
                        <span className="font-semibold text-gray-900">{projects.length}</span> projects available
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                            <Tag size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}
                        >
                            <TrendingUp size={20} />
                        </button>
                    </div>
                </div>

                {projects.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Briefcase className="mx-auto text-gray-400 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects found</h3>
                        <p className="text-gray-600 mb-6">
                            Try adjusting your filters or search terms.
                        </p>
                        <Button onClick={() => setFilters({
                            search: '',
                            minBudget: '',
                            maxBudget: '',
                            skills: '',
                            minDuration: '',
                            maxDuration: '',
                            complexity: '',
                            postedAfter: '',
                            sortBy: 'recent'
                        })}>
                            Clear Filters
                        </Button>
                    </Card>
                ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                        {projects.map((project) => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectMarketplace;
