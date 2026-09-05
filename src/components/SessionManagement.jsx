import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Monitor, Smartphone, Tablet, Trash2, Shield, Loader2 } from 'lucide-react';

const SessionManagement = () => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState(null);

    useEffect(() => {
        loadSessions();
    }, []);

    const loadSessions = async () => {
        try {
            const data = await api.auth.getSessions();
            setSessions(data.sessions || []);
        } catch (error) {
            console.error('Failed to load sessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevokeSession = async (sessionId) => {
        setRevoking(sessionId);
        try {
            await api.auth.revokeSession(sessionId);
            setSessions(sessions.filter(s => s.id !== sessionId));
        } catch (error) {
            console.error('Failed to revoke session:', error);
            alert('Failed to revoke session');
        } finally {
            setRevoking(null);
        }
    };

    const handleRevokeOthers = async () => {
        if (!confirm('Are you sure you want to revoke all other sessions? You will remain logged in on this device.')) {
            return;
        }

        setRevoking('all');
        try {
            await api.auth.revokeOtherSessions();
            await loadSessions();
        } catch (error) {
            console.error('Failed to revoke sessions:', error);
            alert('Failed to revoke sessions');
        } finally {
            setRevoking(null);
        }
    };

    const getDeviceIcon = (userAgent) => {
        if (!userAgent) return <Monitor size={20} />;
        const ua = userAgent.toLowerCase();
        if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
            return <Smartphone size={20} />;
        }
        if (ua.includes('tablet') || ua.includes('ipad')) {
            return <Tablet size={20} />;
        }
        return <Monitor size={20} />;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <Card className="p-6">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Active Sessions</h2>
                    <p className="text-gray-600 mt-1">
                        Manage your active login sessions across devices
                    </p>
                </div>
                {sessions.length > 1 && (
                    <Button
                        variant="outline"
                        onClick={handleRevokeOthers}
                        disabled={revoking === 'all'}
                    >
                        {revoking === 'all' ? (
                            <>
                                <Loader2 className="animate-spin mr-2" size={16} />
                                Revoking...
                            </>
                        ) : (
                            <>
                                <Shield className="mr-2" size={16} />
                                Revoke All Others
                            </>
                        )}
                    </Button>
                )}
            </div>

            <div className="space-y-3">
                {sessions.length === 0 ? (
                    <Card className="p-6 text-center">
                        <p className="text-gray-500">No active sessions found</p>
                    </Card>
                ) : (
                    sessions.map((session) => (
                        <Card key={session.id} className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4">
                                    <div className="text-gray-400 mt-1">
                                        {getDeviceIcon(session.user_agent)}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-medium text-gray-900">
                                                {session.user_agent?.split(' ')[0] || 'Unknown Device'}
                                            </h3>
                                        </div>
                                        <div className="mt-1 space-y-1 text-sm text-gray-600">
                                            <p>
                                                <span className="font-medium">IP Address:</span>{' '}
                                                {session.ip_address || 'Unknown'}
                                            </p>
                                            <p>
                                                <span className="font-medium">Last Activity:</span>{' '}
                                                {formatDate(session.last_activity)}
                                            </p>
                                            <p>
                                                <span className="font-medium">Created:</span>{' '}
                                                {formatDate(session.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRevokeSession(session.id)}
                                    disabled={revoking === session.id}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    {revoking === session.id ? (
                                        <Loader2 className="animate-spin" size={16} />
                                    ) : (
                                        <Trash2 size={16} />
                                    )}
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-3">
                    <Shield className="text-blue-600 mt-0.5" size={20} />
                    <div className="text-sm text-blue-900">
                        <p className="font-medium">Security Tip</p>
                        <p className="mt-1 text-blue-800">
                            If you see any sessions you don't recognize, revoke them immediately and change your password.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SessionManagement;
