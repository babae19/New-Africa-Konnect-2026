import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Bell, Settings, X, Check, Trash2, Calendar, CreditCard, MessageSquare, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationCenter = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            loadNotifications();
        }
    }, [isOpen, user]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const data = await api.notifications.getAll();
            setNotifications(data.notifications || []);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.notifications.markRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            );
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const deleteNotification = async (e, id) => {
        e.stopPropagation();
        try {
            await api.notifications.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'payment': return <CreditCard className="w-5 h-5 text-green-500" />;
            case 'message': return <MessageSquare className="w-5 h-5 text-blue-500" />;
            case 'project_update': return <Briefcase className="w-5 h-5 text-purple-500" />;
            case 'calendar': return <Calendar className="w-5 h-5 text-orange-500" />;
            default: return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-gray-800">Notifications</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center text-gray-400">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                                    <Bell className="w-12 h-12 mb-2 opacity-20" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map(notification => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1 flex-shrink-0">
                                                    {getIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                                                        {notification.message || notification.data?.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={(e) => deleteNotification(e, notification.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 bg-gray-50 border-t flex justify-between items-center">
                            <a href="/notifications" className="text-sm text-primary font-medium hover:underline">
                                View All
                            </a>
                            <button
                                onClick={() => setShowPreferences(true)}
                                className="text-gray-500 hover:text-primary transition-colors flex items-center gap-1 text-sm"
                            >
                                <Settings className="w-4 h-4" />
                                Preferences
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Preferences Modal */}
            {showPreferences && <NotificationPreferences onClose={() => setShowPreferences(false)} />}
        </div>
    );
};

const NotificationPreferences = ({ onClose }) => {
    const [preferences, setPreferences] = useState({
        email_enabled: true,
        push_enabled: true,
        project_updates: true,
        messages: true,
        payments: true,
        marketing: false
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        try {
            const data = await api.notifications.getPreferences();
            if (data) setPreferences(data);
        } catch (error) {
            console.error('Failed to load preferences', error);
        }
    };

    const handleToggle = (key) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const savePreferences = async () => {
        try {
            setSaving(true);
            await api.notifications.updatePreferences(preferences);
            onClose();
        } catch (error) {
            console.error('Failed to save preferences', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900">Notification Settings</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Channels */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Channels</h3>
                        <Toggle
                            label="Email Notifications"
                            checked={preferences.email_enabled}
                            onChange={() => handleToggle('email_enabled')}
                        />
                        <Toggle
                            label="Push Notifications"
                            checked={preferences.push_enabled}
                            onChange={() => handleToggle('push_enabled')}
                        />
                    </div>

                    <div className="h-px bg-gray-100" />

                    {/* Types */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notification Types</h3>
                        <Toggle
                            label="Project Updates"
                            description="Status changes, milestones, and tasks"
                            checked={preferences.project_updates}
                            onChange={() => handleToggle('project_updates')}
                        />
                        <Toggle
                            label="Messages"
                            description="Direct messages from clients or experts"
                            checked={preferences.messages}
                            onChange={() => handleToggle('messages')}
                        />
                        <Toggle
                            label="Payments"
                            description="Invoices, releases, and escrow updates"
                            checked={preferences.payments}
                            onChange={() => handleToggle('payments')}
                        />
                        <Toggle
                            label="Marketing"
                            description="News, tips, and promotions"
                            checked={preferences.marketing}
                            onChange={() => handleToggle('marketing')}
                        />
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={savePreferences}
                        disabled={saving}
                        className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                        {saving ? 'Saving...' : 'Save Preferences'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const Toggle = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between">
        <div>
            <p className="font-medium text-gray-900">{label}</p>
            {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <button
            onClick={onChange}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${checked ? 'bg-primary' : 'bg-gray-200'}`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}
            />
        </button>
    </div>
);

export default NotificationCenter;
