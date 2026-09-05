import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare, GitCommit, FileText, CheckCircle,
    AlertCircle, Clock, Video, Upload, Plus, DollarSign,
    LayoutDashboard, List, CreditCard, FolderOpen, Send, Loader, Download
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';
import { useSocket } from '../../hooks/useSocket';
import { api } from '../../lib/api';



const Step5Hub = ({ onNext }) => {
    const { user } = useAuth();
    const { currentProject } = useProject();
    const socket = useSocket();

    const [activeTab, setActiveTab] = useState('overview');
    const [messageInput, setMessageInput] = useState('');
    const [messages, setMessages] = useState([]);
    const [files, setFiles] = useState([]);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [uploading, setUploading] = useState(false);

    const messagesEndRef = useRef(null);

    const projectId = currentProject?.id;

    // Fetch Messages
    useEffect(() => {
        if (activeTab === 'messages' && projectId) {
            fetchMessages();
        }
    }, [activeTab, projectId, fetchMessages]);

    // Fetch Files
    useEffect(() => {
        if (activeTab === 'files' && projectId) {
            fetchFiles();
        }
    }, [activeTab, projectId, fetchFiles]);

    // Socket Listener for New Messages
    useEffect(() => {
        if (!socket || !projectId) return;

        const handleNewMessage = (data) => {
            if (data.projectId === projectId) {
                // If it's my own message coming back, ensure no dupes if optimistically added
                setMessages(prev => {
                    if (prev.find(m => m.id === data.message.id)) return prev;
                    return [...prev, data.message];
                });
                scrollToBottom();
            }
        };

        socket.on('receive_message', handleNewMessage);
        return () => socket.off('receive_message', handleNewMessage);
    }, [socket, projectId]);

    const fetchMessages = React.useCallback(async () => {
        try {
            setLoadingMessages(true);
            const res = await api.messages.getMessages(projectId);
            setMessages(res.messages || []);
            scrollToBottom();
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            setLoadingMessages(false);
        }
    }, [projectId]);

    const fetchFiles = React.useCallback(async () => {
        try {
            setLoadingFiles(true);
            const res = await api.files.getFiles(projectId);
            setFiles(res.files || []);
        } catch (error) {
            console.error("Failed to fetch files", error);
        } finally {
            setLoadingFiles(false);
        }
    }, [projectId]);

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim()) return;

        try {
            const content = messageInput;
            setMessageInput(''); // Optimistic clear

            await api.messages.send(projectId, content);
            // Socket will handle the append
        } catch (error) {
            console.error("Send failed", error);
            alert("Failed to send message");
        }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('projectId', projectId);

            await api.files.upload(projectId, formData);
            fetchFiles(); // Refresh list
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'messages', label: 'Messages', icon: MessageSquare },
        { id: 'files', label: 'Files', icon: FolderOpen },
        { id: 'tasks', label: 'Tasks', icon: List },
        { id: 'payments', label: 'Payments', icon: CreditCard },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="space-y-6">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <Card className="flex-1 p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Project Health</h3>
                                <div className="flex items-center gap-2 text-success font-medium mb-2">
                                    <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
                                    Active
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                                    <div className="bg-success h-2 rounded-full w-[10%]" />
                                </div>
                                <p className="text-xs text-gray-500">Project Started</p>
                            </Card>
                            <Card className="flex-1 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-semibold text-gray-900">Project Team</h3>
                                </div>
                                <div className="flex -space-x-3">
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                        {user?.name?.charAt(0)}
                                    </div>
                                    <div className="w-10 h-10 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">
                                        E
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                );
            case 'messages':
                return (
                    <div className="h-[600px] flex gap-6">
                        <Card className="w-1/3 p-0 overflow-hidden flex flex-col hidden md:flex">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-semibold text-gray-900">Channels</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <button className="w-full text-left p-4 bg-primary/5 border-l-4 border-primary hover:bg-gray-50 transition-colors">
                                    <p className="font-medium text-gray-900"># general</p>
                                    <p className="text-xs text-gray-500 truncate">Project discussion</p>
                                </button>
                            </div>
                        </Card>
                        <Card className="flex-1 p-0 overflow-hidden flex flex-col">
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold"># general</span>
                                </div>
                                <Button size="sm" variant="secondary">
                                    <Video size={16} className="mr-2" /> Start Call
                                </Button>
                            </div>
                            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-white">
                                {loadingMessages ? (
                                    <div className="flex justify-center p-8"><Loader className="animate-spin text-gray-400" /></div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center text-gray-400 mt-20">No messages yet. Start the conversation!</div>
                                ) : (
                                    messages.map((msg, i) => {
                                        const isMe = msg.sender_id === user?.id; // backend uses snake_case usually, verify model
                                        return (
                                            <div key={msg.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] rounded-2xl p-4 ${isMe ? 'bg-primary text-white' : 'bg-gray-100/80 text-gray-800'}`}>
                                                    <div className="flex justify-between items-end gap-4 mb-1">
                                                        <span className={`text-xs font-bold ${isMe ? 'text-white/80' : 'text-gray-600'}`}>
                                                            {msg.sender_name || msg.sender || (isMe ? 'You' : 'User')}
                                                        </span>
                                                        <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm leading-relaxed">{msg.content}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        placeholder="Type a message..."
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    />
                                    <Button size="icon" onClick={handleSendMessage}>
                                        <Send size={18} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>
                );
            case 'files':
                return (
                    <Card className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-gray-900 text-lg">Project Files</h3>
                            <div className="relative">
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                                <label htmlFor="file-upload">
                                    <Button size="sm" as="span" className="cursor-pointer" disabled={uploading}>
                                        <Upload size={16} className="mr-2" />
                                        {uploading ? 'Uploading...' : 'Upload New'}
                                    </Button>
                                </label>
                            </div>
                        </div>
                        <div className="overflow-hidden border border-gray-100 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded By</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {files.map((file, i) => (
                                        <tr key={file.id || i} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <FileText size={18} className="text-gray-400 mr-3" />
                                                    <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.uploaded_by_name || 'User'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(file.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <a
                                                    href={`${api.API_URL}/files/${file.id}/download`} // Direct download link or use API handler
                                                    className="text-primary hover:text-primary/80 flex items-center justify-end gap-1"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Download size={14} /> Download
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                    {files.length === 0 && !loadingFiles && (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                                No files uploaded yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                );
            case 'tasks':
                return (
                    <Card className="p-6 text-center py-20">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <List size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Task Board</h3>
                        <p className="text-gray-500 mb-6">Kanban board integration coming soon.</p>
                        <Button variant="secondary">View External Board</Button>
                    </Card>
                );
            case 'payments':
                return (
                    <div className="space-y-6">
                        <Card className="p-6 bg-primary/5 border-primary/10">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                                        <DollarSign size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 font-medium">Total Escrow Balance</p>
                                        <p className="text-2xl font-bold text-gray-900">$1,500.00</p>
                                    </div>
                                </div>
                                <Button size="lg" onClick={onNext}>Review & Release Milestone 1</Button>
                            </div>
                        </Card>
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-8 flex overflow-x-auto">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                            ? 'bg-primary text-white shadow-md'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                    >
                        <tab.icon size={18} />
                        <span className="whitespace-nowrap">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export { Step5Hub };
