import React, { useState, useEffect } from 'react';
import { Trash2, Bell, BellOff, Play, Search, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import { toast } from 'sonner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const SavedSearches = ({ onExecuteSearch }) => {
    const [searches, setSearches] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadSavedSearches = async () => {
        try {
            setLoading(true);
            const data = await api.savedSearches.list();
            setSearches(data);
        } catch (error) {
            console.error('Error loading saved searches:', error);
            toast.error('Failed to load saved searches');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSavedSearches();
    }, []);

    const handleDelete = async (id) => {
        try {
            await api.savedSearches.delete(id);
            setSearches(prev => prev.filter(s => s.id !== id));
            toast.success('Saved search deleted');
        } catch (error) {
            console.error('Error deleting saved search:', error);
            toast.error('Failed to delete saved search');
        }
    };

    const handleToggleNotification = async (search) => {
        try {
            const updated = await api.savedSearches.update(search.id, {
                notificationEnabled: !search.notification_enabled
            });
            setSearches(prev => prev.map(s => s.id === updated.id ? updated : s));
            toast.success(`Notifications ${updated.notification_enabled ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Error updating notification:', error);
            toast.error('Failed to update notification settings');
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-gray-500">Loading saved searches...</div>;
    }

    if (!Array.isArray(searches) || searches.length === 0) {
        return (
            <div className="p-8 text-center bg-gray-50 rounded-lg border border-gray-100">
                <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 mb-1">No saved searches</h3>
                <p className="text-xs text-gray-500">Save your common search filters to access them quickly.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Search size={18} className="text-primary" />
                Your Saved Searches
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {searches.map(search => (
                    <Card key={search.id} className="p-4 hover:border-primary/50 transition-colors group">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h4 className="font-semibold text-gray-900 truncate pr-2" title={search.name}>
                                    {search.name}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    Last used: {new Date(search.last_used).toLocaleDateString()}
                                </p>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onExecuteSearch(search)}
                                className="h-8 w-8 p-0 rounded-full bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white"
                                title="Run Search"
                            >
                                <Play size={14} className="ml-0.5" />
                            </Button>
                        </div>

                        <div className="flex flex-wrap gap-1 mb-4 h-12 overflow-hidden relative">
                            {Object.entries(search.filters).map(([key, value]) => {
                                if (!value || key === 'sortBy') return null;
                                return (
                                    <span key={key} className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded border border-gray-200">
                                        {key}: {value}
                                    </span>
                                );
                            })}
                            <div className="absolute bottom-0 left-0 w-full h-4 bg-gradient-to-t from-white to-transparent"></div>
                        </div>

                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <button
                                onClick={() => handleToggleNotification(search)}
                                className={`text-xs flex items-center gap-1.5 transition-colors ${search.notification_enabled ? 'text-green-600 font-medium' : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                title="Toggle Email Alerts"
                            >
                                {search.notification_enabled ? <Bell size={14} /> : <BellOff size={14} />}
                                {search.notification_enabled ? 'Alerts On' : 'Alerts Off'}
                            </button>

                            <button
                                onClick={() => handleDelete(search.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                title="Delete Saved Search"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default SavedSearches;
