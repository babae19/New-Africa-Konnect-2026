import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { X, DollarSign, Clock, FileText, Link as LinkIcon, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import BidTemplateSelector from './BidTemplateSelector';

const BidSubmissionModal = ({ project, isOpen, onClose, onBidSubmitted }) => {
    const { profile } = useAuth();
    const [formData, setFormData] = useState({
        bidAmount: '',
        proposedTimeline: '',
        proposedDuration: '',
        coverLetter: '',
        portfolioLinks: ['']
    });
    const [submitting, setSubmitting] = useState(false);
    const [isDrafting, setIsDrafting] = useState(false);

    const handleAIDraft = async () => {
        if (!profile) {
            toast.error("Please complete your expert profile first.");
            return;
        }

        try {
            setIsDrafting(true);
            const result = await api.ai.generateProposal(project, profile);

            if (result.error) {
                toast.error(result.error);
            } else if (result.proposal) {
                setFormData(prev => ({
                    ...prev,
                    coverLetter: result.proposal
                }));
                toast.success("AI has drafted a proposal for you!");
            }
        } catch (error) {
            console.error("AI Drafting failed", error);
            toast.error("Failed to generate AI proposal.");
        } finally {
            setIsDrafting(false);
        }
    };

    if (!isOpen) return null;

    const handleAddPortfolioLink = () => {
        setFormData({
            ...formData,
            portfolioLinks: [...formData.portfolioLinks, '']
        });
    };

    const handleRemovePortfolioLink = (index) => {
        setFormData({
            ...formData,
            portfolioLinks: formData.portfolioLinks.filter((_, i) => i !== index)
        });
    };

    const handlePortfolioLinkChange = (index, value) => {
        const newLinks = [...formData.portfolioLinks];
        newLinks[index] = value;
        setFormData({ ...formData, portfolioLinks: newLinks });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Validate bid amount
            const bidAmount = parseFloat(formData.bidAmount);
            if (isNaN(bidAmount) || bidAmount <= 0) {
                toast.error('Please enter a valid bid amount');
                setSubmitting(false);
                return;
            }

            // Check if bid is within budget range
            if (project.min_budget && bidAmount < project.min_budget) {
                toast.error(`Bid amount must be at least $${project.min_budget}`);
                setSubmitting(false);
                return;
            }

            if (project.max_budget && bidAmount > project.max_budget) {
                toast.error(`Bid amount must not exceed $${project.max_budget}`);
                setSubmitting(false);
                return;
            }

            // Filter out empty portfolio links
            const portfolioLinks = formData.portfolioLinks.filter(link => link.trim() !== '');

            const bidData = {
                bidAmount,
                proposedTimeline: formData.proposedTimeline,
                proposedDuration: parseInt(formData.proposedDuration) || null,
                coverLetter: formData.coverLetter,
                portfolioLinks
            };

            await api.post(`/projects/${project.id}/bids`, bidData);

            toast.success('Bid submitted successfully!');
            onBidSubmitted();
            onClose();
        } catch (error) {
            console.error('Failed to submit bid:', error);
            const errorMessage = error.response?.data?.message || 'Failed to submit bid';
            toast.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Submit Your Bid</h2>
                            <p className="text-gray-600 text-sm mt-1">{project.title}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Budget Range Info */}
                    {(project.min_budget || project.max_budget) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-900">
                                <strong>Budget Range:</strong> ${project.min_budget?.toLocaleString()} - ${project.max_budget?.toLocaleString()}
                            </p>
                        </div>
                    )}

                    {/* Template Selector */}
                    <BidTemplateSelector
                        projectId={project.id}
                        onSelectTemplate={(template) => {
                            setFormData(prev => ({
                                ...prev,
                                coverLetter: template.cover_letter_template
                                    .replace(/{{project_title}}/g, project.title)
                                    .replace(/{{client_name}}/g, project.client_name || 'Client')
                                    .replace(/{{budget_range}}/g, `$${project.min_budget || 0} - $${project.max_budget || 'Any'}`),
                                proposedTimeline: template.proposed_timeline || prev.proposedTimeline,
                                proposedDuration: template.proposed_duration || prev.proposedDuration,
                                bidAmount: template.pricing_strategy === 'fixed' && template.pricing_value ? template.pricing_value : prev.bidAmount
                            }));
                            toast.success(`Template "${template.name}" applied`);
                        }}
                    />

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Bid Amount */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Bid Amount (USD) *
                            </label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.bidAmount}
                                    onChange={(e) => setFormData({ ...formData, bidAmount: e.target.value })}
                                    placeholder="Enter your bid amount"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Proposed Timeline */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Proposed Timeline
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                    <input
                                        type="text"
                                        value={formData.proposedTimeline}
                                        onChange={(e) => setFormData({ ...formData, proposedTimeline: e.target.value })}
                                        placeholder="e.g., 4 weeks"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Duration (days)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.proposedDuration}
                                    onChange={(e) => setFormData({ ...formData, proposedDuration: e.target.value })}
                                    placeholder="e.g., 28"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Cover Letter */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-semibold text-gray-700">
                                    Cover Letter *
                                </label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAIDraft}
                                    disabled={isDrafting}
                                    className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5 text-xs py-1 h-8"
                                >
                                    {isDrafting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    AI Draft Cover Letter
                                </Button>
                            </div>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                                <textarea
                                    required
                                    value={formData.coverLetter}
                                    onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                                    placeholder="Explain why you're the best fit for this project, your relevant experience, and your approach..."
                                    rows={6}
                                    maxLength={2000}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.coverLetter.length}/2000 characters
                            </p>
                        </div>

                        {/* Portfolio Links */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Portfolio Links (Optional)
                            </label>
                            {formData.portfolioLinks.map((link, index) => (
                                <div key={index} className="flex gap-2 mb-2">
                                    <div className="relative flex-1">
                                        <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                        <input
                                            type="url"
                                            value={link}
                                            onChange={(e) => handlePortfolioLinkChange(index, e.target.value)}
                                            placeholder="https://github.com/yourproject"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    {formData.portfolioLinks.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePortfolioLink(index)}
                                            className="p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleAddPortfolioLink}
                                className="mt-2"
                            >
                                + Add Another Link
                            </Button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={submitting}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={submitting}
                                className="flex-1 flex items-center justify-center gap-2"
                            >
                                {submitting && <Loader2 className="animate-spin" size={20} />}
                                {submitting ? 'Submitting...' : 'Submit Bid'}
                            </Button>
                        </div>
                    </form>
                </div>
            </Card>
        </div>
    );
};

export default BidSubmissionModal;
