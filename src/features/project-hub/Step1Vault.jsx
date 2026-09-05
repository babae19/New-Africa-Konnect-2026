import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, Check, Sparkles, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProject } from '../../contexts/ProjectContext';
import { useFileUpload } from '../../hooks/useFileUpload';
import { api } from '../../lib/api';
import { toast } from 'sonner';

const techStacks = [
    "React", "Node.js", "Python", "Figma", "Cybersecurity",
    "AWS", "Flutter", "DevOps", "Data Science", "Blockchain"
];

// Debounce helper
function useDebounce(value, delay) {
    const [debouncedValue, setDebouncedValue] = React.useState(value);
    React.useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

const Step1Vault = ({ onNext }) => {
    const { currentProject, createProject, updateProject, addProjectFile } = useProject();
    const { uploadFile, uploading } = useFileUpload();
    const [files, setFiles] = useState(currentProject?.files || []);
    const [selectedStack, setSelectedStack] = useState(currentProject?.techStack || []);
    const [isDragging, setIsDragging] = useState(false);
    const [projectTitle, setProjectTitle] = useState(currentProject?.title || '');
    const [projectDescription, setProjectDescription] = useState(currentProject?.description || '');
    const [budget, setBudget] = useState(currentProject?.budget || '');
    const [duration, setDuration] = useState(currentProject?.duration || '');
    const [isGenerating, setIsGenerating]   = useState(false);
    const [isAnalyzing, setIsAnalyzing]     = useState(false);
    
    // Marketplace bidding state
    const [isOpenForBidding, setIsOpenForBidding] = useState(currentProject?.open_for_bidding || false);
    const [minBudget, setMinBudget]               = useState(currentProject?.min_budget || '');
    const [maxBudget, setMaxBudget]               = useState(currentProject?.max_budget || '');
    const [biddingDeadline, setBiddingDeadline]   = useState(currentProject?.bidding_deadline ? new Date(currentProject.bidding_deadline).toISOString().split('T')[0] : '');
    const [isSaving, setIsSaving]                 = useState(false);
    const [lastSaved, setLastSaved]               = useState(null);

    // Sync with currentProject when it changes (for "Continue Setup" flow)
    React.useEffect(() => {
        if (currentProject) {
            setProjectTitle(prev => prev || currentProject.title || '');
            setProjectDescription(prev => prev || currentProject.description || '');
            setBudget(prev => prev || currentProject.budget || '');
            setDuration(prev => prev || currentProject.duration || '');
            setFiles(prev => prev.length ? prev : (currentProject.files || []));
            setSelectedStack(prev => prev.length ? prev : (currentProject.techStack || currentProject.tech_stack || []));
            setIsOpenForBidding(prev => prev || currentProject.open_for_bidding || false);
            setMinBudget(prev => prev || currentProject.min_budget || '');
            setMaxBudget(prev => prev || currentProject.max_budget || '');
            setBiddingDeadline(prev => prev || (currentProject.bidding_deadline ? new Date(currentProject.bidding_deadline).toISOString().split('T')[0] : ''));
        }
    }, [currentProject]);

    // --- Auto-save Logic ---
    const debouncedProjectState = useDebounce({
        title: projectTitle,
        description: projectDescription,
        budget,
        minBudget,
        maxBudget,
        duration,
        techStack: selectedStack,
        open_for_bidding: isOpenForBidding,
        bidding_deadline: biddingDeadline
    }, 2000); // Save after 2s of inactivity

    React.useEffect(() => {
        const autoSave = async () => {
            // Only auto-save if we have at least a title and we're not currently generating/analyzing
            if (!projectTitle || isGenerating || isAnalyzing) return;
            
            // Check if anything actually changed since currentProject
            const hasChanges = 
                projectTitle !== currentProject?.title ||
                projectDescription !== (currentProject?.description || '') ||
                parseFloat(budget || 0) !== parseFloat(currentProject?.budget || 0) ||
                selectedStack.length !== (currentProject?.techStack || currentProject?.tech_stack || []).length;

            if (!hasChanges && currentProject?.id) return;

            try {
                setIsSaving(true);
                let projectId = currentProject?.id;
                
                const projectData = {
                    title: projectTitle || 'Untitled Draft',
                    techStack: selectedStack,
                    description: projectDescription,
                    budget: parseFloat(budget || 0),
                    min_budget: parseFloat(minBudget || 0),
                    max_budget: parseFloat(maxBudget || 0),
                    duration: duration,
                    open_for_bidding: isOpenForBidding,
                    bidding_deadline: biddingDeadline ? new Date(biddingDeadline).toISOString() : null,
                    status: 'draft'
                };

                if (!projectId) {
                    const newProject = await createProject(projectData);
                    console.log('Draft created:', newProject.id);
                } else {
                    await updateProject(projectId, projectData);
                }
                setLastSaved(new Date());
            } catch (error) {
                console.error('Auto-save failed:', error);
            } finally {
                setIsSaving(false);
            }
        };

        autoSave();
    }, [debouncedProjectState]);

    const handleAIGenerate = async () => {
        if (!projectTitle.trim()) {
            toast.error("Please enter a basic project idea or title first.");
            return;
        }

        try {
            setIsGenerating(true);
            const result = await api.ai.generateProject(projectTitle, projectDescription);

            if (result.error) {
                toast.error(result.error);
            } else {
                setProjectTitle(result.title || projectTitle);
                setProjectDescription(result.description || projectDescription);
                
                // Set budgets if available
                if (result.min_budget) setMinBudget(result.min_budget);
                if (result.max_budget) setMaxBudget(result.max_budget);
                
                // If AI doesn't provide min/max, use the single estimated_budget as fallback
                if (!result.min_budget && result.estimated_budget) {
                    setBudget(result.estimated_budget);
                }

                setDuration(result.estimated_duration || duration);

                if (result.techStack && Array.isArray(result.techStack)) {
                    // Filter out duplicates and invalid entries
                    const newStacks = result.techStack.filter(tech => 
                        tech && typeof tech === 'string' && !selectedStack.includes(tech)
                    );
                    if (newStacks.length > 0) {
                        setSelectedStack(prev => [...new Set([...prev, ...newStacks])]);
                    }
                }
                toast.success("AI has refined your project details!");
            }
        } catch (error) {
            console.error("AI Generation failed", error);
            toast.error("Failed to generate project details.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        for (const file of droppedFiles) {
            await handleFileUpload(file);
        }
    };

    const handleFileUpload = async (file) => {
        try {
            const result = await uploadFile(file);
            if (result.file) {
                setFiles([...files, result.file]);

                if (currentProject) {
                    addProjectFile(currentProject.id, result.file);
                }

                // If it's a first file or user hasn't filled much, auto-analyze
                if (!projectDescription || projectDescription.length < 50) {
                    await analyzeUploadedFile(result.file);
                }
            }
        } catch (error) {
            toast.error('Error uploading file: ' + error.message);
        }
    };

    const analyzeUploadedFile = async (fileData) => {
        try {
            setIsAnalyzing(true);
            toast.loading("AI is analyzing your document...", { id: "analyzing-doc" });
            
            const result = await api.ai.analyzeDocument(fileData.data);
            
            if (result) {
                setProjectTitle(result.title || projectTitle);
                setProjectDescription(result.description || projectDescription);
                if (result.min_budget) setMinBudget(result.min_budget);
                if (result.max_budget) setMaxBudget(result.max_budget);
                if (result.estimated_duration) setDuration(result.estimated_duration);
                
                if (result.techStack && Array.isArray(result.techStack)) {
                    const newStacks = result.techStack.filter(tech => 
                        tech && typeof tech === 'string' && !selectedStack.includes(tech)
                    );
                    setSelectedStack(prev => [...new Set([...prev, ...newStacks])]);
                }
                
                toast.success("AI has extracted project details from your document!", { id: "analyzing-doc" });
            }
        } catch (error) {
            console.error("Analysis failed", error);
            toast.error("AI couldn't analyze the document format, but we've stored it.", { id: "analyzing-doc" });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleFileInput = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleFileUpload(file);
        }
    };

    const toggleStack = (tech) => {
        if (selectedStack.includes(tech)) {
            setSelectedStack(selectedStack.filter(t => t !== tech));
        } else {
            setSelectedStack([...selectedStack, tech]);
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleProceed = async () => {
        try {
            let projectId = currentProject?.id;

            if (!projectId) {
                // Create project
                const newProject = await createProject({
                    title: projectTitle || 'New Project',
                    techStack: selectedStack,
                    description: projectDescription || 'Created via Vault',
                    budget: parseFloat(budget || 0),
                    min_budget: parseFloat(minBudget || 0),
                    max_budget: parseFloat(maxBudget || 0),
                    duration: duration,
                    open_for_bidding: isOpenForBidding,
                    bidding_deadline: biddingDeadline ? new Date(biddingDeadline).toISOString() : null
                });
                projectId = newProject.id;
            } else {
                // Update project details
                await updateProject(projectId, {
                    techStack: selectedStack,
                    title: projectTitle || currentProject.title,
                    description: projectDescription || currentProject.description,
                    budget: parseFloat(budget || currentProject.budget || 0),
                    min_budget: parseFloat(minBudget || 0),
                    max_budget: parseFloat(maxBudget || 0),
                    duration: duration || currentProject.duration,
                    open_for_bidding: isOpenForBidding,
                    bidding_deadline: biddingDeadline ? new Date(biddingDeadline).toISOString() : null
                });
            }

            // Upload any files that haven't been uploaded to backend yet
            // Backend files represent IDs as UUIDs, local files use 'file_' prefix
            const pendingFiles = files.filter(f => f.id && f.id.toString().startsWith('file_'));

            for (const file of pendingFiles) {
                await addProjectFile(projectId, file);
            }

            onNext();
        } catch (error) {
            console.error('Error proceeding:', error);
            // alert('Failed to save project. Please try again.'); 
            // Don't block UI with alert for now, but log it.
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 relative">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's start by understanding your needs</h2>
                <p className="text-gray-600">Upload your project files securely. We'll analyze them to find your perfect match.</p>
                
                {/* Auto-save Indicator */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[11px] font-medium text-gray-400">
                    {isSaving ? (
                        <>
                            <Loader2 size={12} className="animate-spin text-primary" />
                            <span>Saving draft...</span>
                        </>
                    ) : lastSaved ? (
                        <>
                            <Check size={12} className="text-green-500" />
                            <span>Draft saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </>
                    ) : null}
                </div>
            </div>

            <Card className="p-8 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Project Title</h3>
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        placeholder="Enter your project title or a simple idea..."
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAIGenerate}
                        disabled={isGenerating || !projectTitle.trim()}
                        className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {projectDescription ? 'Refine with AI' : 'AI Help'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Budget Match</h3>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                placeholder="5000"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        >
                            <option value="">Select duration...</option>
                            <option value="1_month">Wait (&lt; 1 month)</option>
                            <option value="1_3_months">Sprint (1-3 months)</option>
                            <option value="3_6_months">Marathon (3-6 months)</option>
                            <option value="6_plus_months">Odyssey (6+ months)</option>
                        </select>
                    </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2">Project Description</h3>
                <p className="text-xs text-gray-500 mb-3">Provide a clear description of your goals, target audience, and key features. AI can help you refine this.</p>
                <div className="relative mb-8">
                    <textarea
                        className="w-full h-48 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none font-sans text-sm"
                        placeholder="E.g. I want to build a marketplace for local artisans in Africa to sell their crafts globally. It needs secure payments, review systems, and multi-language support..."
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                    />
                    <div className="absolute bottom-3 right-3 text-[10px] font-mono text-gray-400">
                        {projectDescription.length} characters
                    </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-4">2. Supporting Documents (Optional)</h3>
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                        <Upload size={24} />
                    </div>
                    <p className="text-gray-900 font-medium mb-1">Drag & drop files here to skip manual entry</p>
                    <p className="text-gray-500 text-sm mb-4">PDF, DOCX, or Images (Max 10MB)</p>
                    <label>
                        <Button variant="secondary" size="sm" disabled={uploading || isAnalyzing}>
                            {uploading ? 'Uploading...' : isAnalyzing ? 'Analyzing...' : 'Browse Files'}
                        </Button>
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileInput}
                            disabled={uploading}
                        />
                    </label>
                </div>

                {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {files.map((file, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText size={18} className="text-primary" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-error">
                                    <X size={18} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </Card>
            
            {/* Marketplace Bidding Section */}
            <Card className="p-8 mb-8 border-2 border-primary/10 bg-gradient-to-br from-white to-primary/5">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Project Marketplace</h3>
                        <p className="text-sm text-gray-500">Allow experts to find and bid on your project publicly</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={isOpenForBidding}
                            onChange={(e) => setIsOpenForBidding(e.target.checked)}
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                </div>

                <AnimatePresence>
                    {isOpenForBidding && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-6 overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Budget (USD)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            placeholder="Min"
                                            value={minBudget}
                                            onChange={(e) => setMinBudget(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Maximum Budget (USD)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                            placeholder="Max"
                                            value={maxBudget}
                                            onChange={(e) => setMaxBudget(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bidding Deadline</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                    value={biddingDeadline}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setBiddingDeadline(e.target.value)}
                                />
                                <p className="text-[11px] text-gray-400 mt-1">Experts won't be able to bid after this date</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Card>

            <Card className="p-8 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">2. Which technologies matter?</h3>
                <div className="flex flex-wrap gap-3">
                    {techStacks.map((tech) => (
                        <button
                            key={tech}
                            onClick={() => toggleStack(tech)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedStack.includes(tech)
                                ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary ring-offset-2'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {selectedStack.includes(tech) && <Check size={14} />}
                                {tech}
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            <div className="flex justify-end">
                <Button
                    size="lg"
                    onClick={handleProceed}
                    disabled={selectedStack.length === 0}
                >
                    Proceed to Match
                </Button>
            </div>
        </div>
    );
};

export { Step1Vault };
