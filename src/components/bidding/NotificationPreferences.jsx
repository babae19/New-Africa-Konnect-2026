import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Bell, Check, Save, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const NotificationPreferences = () => {
    const [preferences, setPreferences] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const data = await api.notificationPreferences.get();
            setPreferences(data);
        } catch (error) {
            console.error('Failed to load preferences:', error);
            // If 404, we might need to create defaults, but backend should handle this on get
            toast.error('Failed to load notification settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updated = await api.notificationPreferences.update(preferences);
            setPreferences(updated);
            toast.success('Preferences saved successfully');
        } catch (error) {
            console.error('Failed to save preferences:', error);
            toast.error('Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field, value) => {
        setPreferences(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (loading) {
        return (
            <Card className="p-8 flex justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </Card>
        );
    }

    if (!preferences) {
        return (
            <Card className="p-8 text-center">
                <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
                <p>Could not load preferences.</p>
                <Button onClick={fetchPreferences} className="mt-4">Retry</Button>
            </Card>
        );
    }

    return (
        <Card className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Bell className="text-primary" size={24} />
                    Notification Preferences
                </h2>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2"
                >
                    {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Changes
                </Button>
            </div>

            <div className="space-y-8">
                {/* Project Matching Settings */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                        Project Matching
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-medium text-gray-700">Enable Project Matching</label>
                                <p className="text-sm text-gray-500">
                                    Receive notifications when new projects match your skills.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={preferences.project_matching}
                                    onChange={(e) => handleChange('project_matching', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {preferences.project_matching && (
                            <div className="bg-gray-50 p-4 rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Minimum Match Score: {Math.round((preferences.match_threshold || 0.70) * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0.5"
                                        max="1.0"
                                        step="0.05"
                                        value={preferences.match_threshold || 0.70}
                                        onChange={(e) => handleChange('match_threshold', parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                                        <span>Lenient (50%)</span>
                                        <span>Strict (100%)</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Notification Frequency
                                    </label>
                                    <select
                                        value={preferences.notification_frequency || 'immediate'}
                                        onChange={(e) => handleChange('notification_frequency', e.target.value)}
                                        className="w-full border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="immediate">Immediate (As soon as posted)</option>
                                        <option value="daily">Daily Digest (9:00 AM)</option>
                                        <option value="weekly">Weekly Summary (Mondays)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* Notification Channels */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                        Notification Channels
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-medium text-gray-700">Email Notifications</label>
                                <p className="text-sm text-gray-500">
                                    Receive updates via email.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
                                checked={preferences.email_enabled}
                                onChange={(e) => handleChange('email_enabled', e.target.checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <label className="font-medium text-gray-700">Push Notifications</label>
                                <p className="text-sm text-gray-500">
                                    Receive browser/mobile push notifications.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
                                checked={preferences.push_enabled}
                                onChange={(e) => handleChange('push_enabled', e.target.checked)}
                            />
                        </div>
                    </div>
                </section>

                {/* General Notifications */}
                <section>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
                        General Updates
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 text-primary border-gray-300 rounded"
                                checked={preferences.project_updates}
                                onChange={(e) => handleChange('project_updates', e.target.checked)}
                            />
                            <span className="text-sm text-gray-700">Project Status Updates</span>
                        </label>

                        <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 text-primary border-gray-300 rounded"
                                checked={preferences.messages}
                                onChange={(e) => handleChange('messages', e.target.checked)}
                            />
                            <span className="text-sm text-gray-700">New Messages</span>
                        </label>

                        <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 text-primary border-gray-300 rounded"
                                checked={preferences.payments}
                                onChange={(e) => handleChange('payments', e.target.checked)}
                            />
                            <span className="text-sm text-gray-700">Payment & Invoices</span>
                        </label>

                        <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                                type="checkbox"
                                className="h-4 w-4 text-primary border-gray-300 rounded"
                                checked={preferences.marketing}
                                onChange={(e) => handleChange('marketing', e.target.checked)}
                            />
                            <span className="text-sm text-gray-700">Marketing & Tips</span>
                        </label>
                    </div>
                </section>
            </div>
        </Card>
    );
};

export default NotificationPreferences;
