import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { useSocket } from '../../hooks/useSocket';
import { toast } from 'sonner';
import { useAuth } from "../../contexts/AuthContext";
import { Link } from 'react-router-dom';

const NotificationCenter = () => {
    const { user } = useAuth();
    const socket = useSocket();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Close on click outside
    const containerRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch initial notifications
    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await api.notifications.getAll();
            setNotifications(res.notifications || []);
            setUnreadCount(res.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user]);

    // Listen for new notifications via socket (if persisted backend emits one)
    // Or simpler: Just listen for project_invite, payment etc and re-fetch.
    // Ideally backend emits 'notification' event to user room.
    // Since we didn't add explicit 'notification' socket emit in backend yet (we did project_invite), 
    // let's add a generic listener or poll.
    // ACTUALLY: We emitted 'project_invite' and 'project_update'. 
    // Let's listen to those and re-fetch generic notifications.
    useEffect(() => {
        if (!socket || !user) return;

        // Generic handler for all notification-like events
        const handleRefresh = (data) => {
            fetchNotifications();
            // Show toast if data is provided
            // data can be the object { ... } or just a trigger
            if (data && (data.title || data.message)) {
                toast(data.title || 'New Notification', {
                    description: data.message,
                    action: data.actionUrl ? {
                        label: 'View',
                        onClick: () => window.location.href = data.actionUrl
                    } : undefined
                });
            } else if (data && data.project_title) {
                // Handle specific legacy events like 'project_invite' if they send different structure
                toast.info('New Invitation', {
                    description: `Invited to project: ${data.project_title}`
                });
            }
        };

        const handleNotification = (data) => {
            fetchNotifications();

            if (data.type === 'project_match') {
                toast.success('New Project Match!', {
                    description: data.message,
                    action: {
                        label: 'View Project',
                        onClick: () => window.location.href = data.data?.actionUrl || `/projects/${data.data?.projectId}`
                    }
                });
            } else {
                toast(data.type?.replace('_', ' ').toUpperCase() || 'NOTIFICATION', {
                    description: data.message,
                    action: data.data?.actionUrl ? {
                        label: 'Go',
                        onClick: () => window.location.href = data.data.actionUrl
                    } : undefined
                });
            }
        };

        socket.on('project_invite', handleRefresh);
        socket.on('project_update', handleRefresh);
        socket.on('notification', handleNotification);

        return () => {
            socket.off('project_invite', handleRefresh);
            socket.off('project_update', handleRefresh);
            socket.off('notification', handleNotification);
        };
    }, [socket, user]);

    const handleMarkRead = async (id, e) => {
        e.stopPropagation();
        try {
            await api.notifications.markRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark read', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.notifications.markRead('all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all read', error);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await api.notifications.delete(id);
            const notif = notifications.find(n => n.id === id);
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (notif && !notif.is_read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 origin-top-right"
                    >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="text-xs text-primary hover:text-primary/80 font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {loading && notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center flex flex-col items-center gap-3">
                                    <Bell size={32} className="text-gray-200" />
                                    <p className="text-gray-500 text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map(notif => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 hover:bg-gray-50 transition-colors relative group ${notif.is_read ? 'opacity-75' : 'bg-blue-50/30'}`}
                                        >
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${notif.is_read ? 'bg-transparent' : 'bg-primary'}`} />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate pr-6">{notif.title}</p>
                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{notif.message}</p>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(notif.created_at).toLocaleDateString()}
                                                        </span>
                                                        {notif.link && (
                                                            <Link
                                                                to={notif.link}
                                                                className="text-xs text-primary font-medium hover:underline"
                                                                onClick={() => setIsOpen(false)}
                                                            >
                                                                View Details
                                                            </Link>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notif.is_read && (
                                                    <button
                                                        onClick={(e) => handleMarkRead(notif.id, e)}
                                                        className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                                                        title="Mark as read"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => handleDelete(notif.id, e)}
                                                    className="p-1 hover:bg-red-100 text-red-600 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationCenter;
