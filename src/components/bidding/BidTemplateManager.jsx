import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, FileText, Copy } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

const BidTemplateManager = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        coverLetterTemplate: '',
        proposedTimeline: '',
        proposedDuration: '',
        pricingStrategy: 'fixed',
        pricingValue: '',
        isDefault: false
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await api.bidTemplates.list();
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Failed to load templates');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setFormData({
            name: '',
            coverLetterTemplate: '',
            proposedTimeline: '',
            proposedDuration: '',
            pricingStrategy: 'fixed',
            pricingValue: '',
            isDefault: false
        });
        setIsCreating(true);
        setEditingTemplate(null);
    };

    const handleEdit = (template) => {
        setFormData({
            name: template.name,
            coverLetterTemplate: template.cover_letter_template || '',
            proposedTimeline: template.proposed_timeline || '',
            proposedDuration: template.proposed_duration || '',
            pricingStrategy: template.pricing_strategy || 'fixed',
            pricingValue: template.pricing_value || '',
            isDefault: template.is_default
        });
        setEditingTemplate(template);
        setIsCreating(false);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this template?')) return;
        try {
            await api.bidTemplates.delete(id);
            setTemplates(templates.filter(t => t.id !== id));
            toast.success('Template deleted');
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isCreating) {
                const newTemplate = await api.bidTemplates.create(formData);
                setTemplates([newTemplate, ...templates]);
                toast.success('Template created');
                setIsCreating(false);
            } else if (editingTemplate) {
                const updatedTemplate = await api.bidTemplates.update(editingTemplate.id, formData);
                setTemplates(templates.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
                toast.success('Template updated');
                setEditingTemplate(null);
            }
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template');
        }
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingTemplate(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Bid Templates</h2>
                {!isCreating && !editingTemplate && (
                    <Button onClick={handleCreate} className="flex items-center gap-2">
                        <Plus size={16} />
                        New Template
                    </Button>
                )}
            </div>

            {(isCreating || editingTemplate) ? (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">
                        {isCreating ? 'Create New Template' : 'Edit Template'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Template Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g., Standard Web Development Proposal"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cover Letter Template
                            </label>
                            <div className="text-xs text-gray-500 mb-2">
                                Variables: {'{{project_title}}'}, {'{{client_name}}'}, {'{{budget_range}}'}
                            </div>
                            <textarea
                                value={formData.coverLetterTemplate}
                                onChange={e => setFormData({ ...formData, coverLetterTemplate: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent h-48"
                                placeholder="Hi {{client_name}}, I'm interested in your project {{project_title}}..."
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Proposed Timeline
                                </label>
                                <input
                                    type="text"
                                    value={formData.proposedTimeline}
                                    onChange={e => setFormData({ ...formData, proposedTimeline: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g., 2 weeks"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Duration (Days)
                                </label>
                                <input
                                    type="number"
                                    value={formData.proposedDuration}
                                    onChange={e => setFormData({ ...formData, proposedDuration: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    placeholder="e.g., 14"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={formData.isDefault}
                                onChange={e => setFormData({ ...formData, isDefault: e.target.checked })}
                                className="rounded text-primary focus:ring-primary"
                            />
                            <label htmlFor="isDefault" className="text-sm text-gray-700">
                                Set as default template
                            </label>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {isCreating ? 'Create Template' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map(template => (
                        <Card key={template.id} className="p-4 hover:border-primary/50 transition-colors group relative">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-gray-900 pr-8">{template.name}</h3>
                                {template.is_default && (
                                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">
                                        Default
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-500 line-clamp-3 mb-4 h-16 bg-gray-50 p-2 rounded border border-gray-100 italic">
                                "{template.cover_letter_template || 'No cover letter content'}"
                            </p>

                            <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                                <span>Used {template.usage_count} times</span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-primary transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-red-500 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </Card>
                    ))}

                    {templates.length === 0 && !loading && (
                        <div className="col-span-full py-12 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <h3 className="text-gray-900 font-medium mb-1">No templates yet</h3>
                            <p className="text-gray-500 text-sm mb-4">Create templates to speed up your bidding process.</p>
                            <Button onClick={handleCreate} variant="outline" size="sm">
                                Create First Template
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default BidTemplateManager;
