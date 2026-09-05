import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { FileText, ChevronDown, Check } from 'lucide-react';

const BidTemplateSelector = ({ onSelectTemplate, projectId }) => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await api.bidTemplates.list();
            setTemplates(data);
        } catch (error) {
            console.error('Failed to load templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (template) => {
        try {
            // Apply template via API to increment usage (and potentially process variables server-side if needed)
            // For now, we'll increment usage and use the template data
            await api.bidTemplates.apply(template.id, projectId);

            // Pass template back to parent
            onSelectTemplate(template);
            setIsOpen(false);
        } catch (error) {
            console.error('Error applying template:', error);
            // Fallback to just using the data if API call fails
            onSelectTemplate(template);
            setIsOpen(false);
        }
    };

    if (loading || templates.length === 0) return null;

    return (
        <div className="relative mb-4">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary/80 transition-colors w-full p-2 rounded-lg border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10"
            >
                <FileText size={16} />
                <span>Use a saved template...</span>
                <ChevronDown size={14} className={`ml-auto transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 max-h-60 overflow-y-auto">
                    {templates.map(template => (
                        <button
                            key={template.id}
                            type="button"
                            onClick={() => handleSelect(template)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 last:border-0 transition-colors group"
                        >
                            <div className="bg-blue-50 p-1.5 rounded text-blue-600 group-hover:bg-blue-100 transition-colors">
                                <FileText size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5">
                                    <span className="font-medium text-gray-900 truncate text-sm">
                                        {template.name}
                                    </span>
                                    {template.is_default && (
                                        <span className="bg-green-100 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                                            Default
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 truncate">
                                    {template.cover_letter_template?.substring(0, 50)}...
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BidTemplateSelector;
