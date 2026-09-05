import React, { useState } from 'react';
import { api } from '../lib/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Upload, Link as LinkIcon, FileText, Image, Trash2, ExternalLink, Loader2 } from 'lucide-react';

const PortfolioManager = ({ userId, portfolioItems = [], onUpdate }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newItem, setNewItem] = useState({
        type: 'link',
        title: '',
        description: '',
        url: '',
        imageUrl: ''
    });
    const [loading, setLoading] = useState(false);

    const handleAddItem = async () => {
        if (!newItem.title || !newItem.url) {
            alert('Please provide at least a title and URL');
            return;
        }

        setLoading(true);
        try {
            const data = await api.experts.addPortfolio(newItem);
            onUpdate(data.portfolioItems);
            setNewItem({
                type: 'link',
                title: '',
                description: '',
                url: '',
                imageUrl: ''
            });
            setShowAddForm(false);
        } catch (error) {
            console.error('Failed to add portfolio item:', error);
            alert('Failed to add portfolio item');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveItem = async (itemId) => {
        if (!confirm('Are you sure you want to remove this portfolio item?')) {
            return;
        }

        try {
            const data = await api.experts.removePortfolio(itemId);
            onUpdate(data.portfolioItems);
        } catch (error) {
            console.error('Failed to remove portfolio item:', error);
            alert('Failed to remove portfolio item');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'image':
                return <Image size={20} />;
            case 'pdf':
                return <FileText size={20} />;
            default:
                return <LinkIcon size={20} />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Portfolio</h3>
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    size="sm"
                >
                    <Upload size={16} className="mr-2" />
                    Add Item
                </Button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <Card className="p-4 bg-gray-50">
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={newItem.type}
                                onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="link">External Link</option>
                                <option value="image">Image</option>
                                <option value="pdf">PDF Document</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title *
                            </label>
                            <input
                                type="text"
                                value={newItem.title}
                                onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                                placeholder="Project name or title"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={newItem.description}
                                onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                placeholder="Brief description of the project"
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL *
                            </label>
                            <input
                                type="url"
                                value={newItem.url}
                                onChange={(e) => setNewItem({ ...newItem, url: e.target.value })}
                                placeholder="https://..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {newItem.type === 'link' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Preview Image URL (optional)
                                </label>
                                <input
                                    type="url"
                                    value={newItem.imageUrl}
                                    onChange={(e) => setNewItem({ ...newItem, imageUrl: e.target.value })}
                                    placeholder="https://..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                        )}

                        <div className="flex space-x-2">
                            <Button
                                onClick={handleAddItem}
                                disabled={loading}
                                className="flex-1"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={16} />
                                        Adding...
                                    </>
                                ) : (
                                    'Add to Portfolio'
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setShowAddForm(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolioItems.length === 0 ? (
                    <Card className="col-span-full p-8 text-center">
                        <Upload className="mx-auto text-gray-400 mb-2" size={48} />
                        <p className="text-gray-500">No portfolio items yet</p>
                        <p className="text-sm text-gray-400 mt-1">
                            Add your best work to showcase your skills
                        </p>
                    </Card>
                ) : (
                    portfolioItems.map((item) => (
                        <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            {item.imageUrl && (
                                <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="w-full h-48 object-cover"
                                />
                            )}
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="text-primary">
                                            {getIcon(item.type)}
                                        </div>
                                        <h4 className="font-medium text-gray-900">
                                            {item.title}
                                        </h4>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveItem(item.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                {item.description && (
                                    <p className="text-sm text-gray-600 mb-3">
                                        {item.description}
                                    </p>
                                )}
                                <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sm text-primary hover:text-primary-dark"
                                >
                                    View Project
                                    <ExternalLink size={14} className="ml-1" />
                                </a>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};

export default PortfolioManager;
