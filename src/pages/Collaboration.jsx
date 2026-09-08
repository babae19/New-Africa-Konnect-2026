import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { useCollaboration } from '../hooks/useCollaboration';
import { api } from '../lib/api';
import { Step4Contract } from '../features/project-hub/Step4Contract';
import DirectMessagesPanel from '../components/collaboration/DirectMessagesPanel';
import MeetingRoom from '../components/common/MeetingRoom';
import ScheduleInterviewModal from '../components/ScheduleInterviewModal';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, MessageSquare, FolderOpen, CheckSquare,
    Plus, Paperclip, Send, CheckCircle2, Clock, FileText,
    Download, Play, Upload, Video, Users2, Sparkles, Mail,
    ChevronLeft, X, FileSignature, Loader2, DollarSign,
    CheckCheck, Shield, Zap, Copy, Check, Link, Trash2,
    ExternalLink, MonitorUp, Hand, Settings, LockKeyhole
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, title, description, action }) => (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
        <div className="p-4 bg-white rounded-full shadow-sm mb-4 text-gray-300">
            <Icon size={32} />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 max-w-sm mb-5">{description}</p>
        {action}
    </div>
);

const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const formatDate = (d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' });

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────
const OverviewTab = ({ project, tasks, contracts = [], onInvite }) => {
    const [inviteEmail, setInviteEmail] = useState('');
    const [showInvite, setShowInvite]   = useState(false);
    const [inviting, setInviting]       = useState(false);
    const [aiSuggestions, setAiSuggestions]     = useState(null);
    const [generatingRoadmap, setGeneratingRoadmap] = useState(false);

    const doneCount  = tasks.filter(t => t.status === 'done').length;
    const pct        = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

    const handleGetRoadmap = async () => {
        setGeneratingRoadmap(true);
        try {
            const res = await api.ai.collaborationHelp(project);
            if (res.milestones || res.tasks) setAiSuggestions(res);
            toast.success('AI roadmap generated!');
        } catch { toast.error('Failed to generate roadmap.'); }
        finally { setGeneratingRoadmap(false); }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviting(true);
        try {
            await onInvite(inviteEmail);
            toast.success(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            setShowInvite(false);
        } catch { toast.error('Failed to send invitation.'); }
        finally { setInviting(false); }
    };

    return (
        <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Budget', value: `$${project.budget?.toLocaleString() || '—'}`, icon: DollarSign, color: 'text-green-600 bg-green-50' },
                    { label: 'Deadline', value: project.deadline ? formatDate(project.deadline) : 'No deadline', icon: Clock, color: 'text-orange-600 bg-orange-50' },
                    { label: 'Tasks Done', value: `${doneCount}/${tasks.length}`, icon: CheckCircle2, color: 'text-primary bg-primary/10' },
                    { label: 'Team', value: `${(contracts.filter(c => c.status === 'signed').length) + 1}`, icon: Users2, color: 'text-violet-600 bg-violet-50' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                            <Icon size={18} />
                        </div>
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                            <p className="text-lg font-black text-gray-900 leading-none mt-0.5">{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Project Brief */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{project.title}</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Project #{project.id?.substring(0, 8)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                                project.status === 'active' ? 'bg-green-100 text-green-700' :
                                project.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>{project.status}</span>
                            <button
                                onClick={() => setShowInvite(!showInvite)}
                                className="flex items-center gap-1 px-3 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-full transition-colors"
                            >
                                <Plus size={12} /> Add Member
                            </button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {showInvite && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleInvite}
                                className="flex gap-2"
                            >
                                <input
                                    type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="Team member's email…" required
                                    className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                />
                                <button type="submit" disabled={inviting}
                                    className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl disabled:opacity-60 transition-colors">
                                    {inviting ? <Loader2 size={14} className="animate-spin" /> : 'Invite'}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    <p className="text-gray-600 text-sm leading-relaxed">{project.description || 'No description provided.'}</p>

                    {/* Progress bar */}
                    <div>
                        <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1.5">
                            <span>Completion</span><span className="text-green-600">{pct}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar cards */}
                <div className="space-y-4">
                    {/* AI Roadmap */}
                    <div className="bg-gradient-to-br from-violet-50 to-white border border-violet-100 rounded-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <Sparkles size={14} className="text-violet-500" /> AI Roadmap
                            </h3>
                            <button
                                onClick={handleGetRoadmap} disabled={generatingRoadmap}
                                className="text-xs font-bold text-violet-600 hover:text-violet-800 disabled:opacity-50"
                            >
                                {generatingRoadmap ? <Loader2 size={12} className="animate-spin" /> : aiSuggestions ? 'Refresh' : 'Generate'}
                            </button>
                        </div>
                        {aiSuggestions ? (
                            <div className="space-y-2">
                                {aiSuggestions.milestones?.slice(0, 3).map((m, i) => (
                                    <div key={i} className="flex gap-2 p-2 bg-white rounded-xl border border-violet-50 text-xs">
                                        <div className="w-4 h-4 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                                        <div><p className="font-bold text-gray-800">{m.title}</p><p className="text-gray-400 mt-0.5">{m.description}</p></div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400 italic">Get AI-generated milestones tailored to this project.</p>
                        )}
                    </div>

                    {/* Project Owner */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-5">
                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2 mb-3">
                            <Users2 size={14} className="text-primary" /> Project Owner
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <Avatar name={project.client_name || 'Client'} className="h-9 w-9 bg-primary/10 text-primary text-xs" />
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{project.client_name || 'Client'}</p>
                                <p className="text-[11px] text-primary font-medium">Project Owner</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── MESSAGES TAB ─────────────────────────────────────────────────────────────
const MessagesTab = ({ messages, onSend, user, projectId, typingUsers = [], onTyping = () => {} }) => {
    const [message, setMessage] = useState('');
    const [uploading, setUploading]   = useState(false);
    const scrollRef  = useRef(null);
    const fileRef    = useRef(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!message.trim()) return;
        const content = message;
        setMessage('');
        try {
            await onSend(content);
        } catch (err) {
            setMessage(content);
            toast.error(err.message || 'Message could not be sent.');
        }
    };

    const handleFileSend = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        const toastId = toast.loading(`Uploading ${file.name}…`);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.files.upload(formData, projectId);
            await onSend(`📎 [${file.name}](${res.url})`);
            toast.success('File shared in chat!', { id: toastId });
        } catch (err) {
            toast.error('File share failed.', { id: toastId });
        } finally {
            setUploading(false);
            e.target.value = '';
        }
    };

    const renderContent = (content) => {
        // Render file links as clickable
        const fileLink = content.match(/📎 \[(.+?)\]\((.+?)\)/);
        if (fileLink) {
            return (
                <a href={fileLink[2]} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 underline underline-offset-2 opacity-90 hover:opacity-100">
                    <FileText size={13} /> {fileLink[1]}
                </a>
            );
        }
        return content;
    };

    const isMe = (msg) => msg.sender_id === user.id;

    return (
        <Card className="h-[calc(100vh-220px)] flex flex-col p-0 overflow-hidden shadow-sm border-gray-100">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <MessageSquare size={16} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 text-sm">Project Chat</h3>
                        <p className="text-[11px] text-green-500 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Live
                        </p>
                    </div>
                </div>
                <span className="text-[11px] text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-100">
                    {messages.length} messages
                </span>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scroll-smooth">
                {messages.length === 0 && (
                    <EmptyState icon={MessageSquare} title="No messages yet" description="Start the conversation with your team." />
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${isMe(msg) ? 'justify-end' : 'justify-start'}`}>
                        {!isMe(msg) && (
                            <Avatar name={msg.sender?.name || msg.sender_name || 'User'} className="h-7 w-7 bg-gray-200 text-gray-600 text-xs mr-2 flex-shrink-0 mt-1" />
                        )}
                        <div className={`flex flex-col ${isMe(msg) ? 'items-end' : 'items-start'} max-w-[75%]`}>
                            {!isMe(msg) && (
                                <span className="text-[10px] font-bold text-gray-400 mb-0.5 px-1">{msg.sender?.name || msg.sender_name || 'Team Member'}</span>
                            )}
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                isMe(msg)
                                    ? 'bg-primary text-white rounded-br-sm'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                            } ${msg.isOptimistic ? 'opacity-75' : ''}`}>
                                {renderContent(msg.content)}
                            </div>
                            <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMe(msg) ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                                {isMe(msg) && (
                                    msg.isOptimistic
                                        ? <Loader2 size={10} className="text-gray-300 animate-spin" />
                                        : <CheckCheck size={10} className="text-primary/50" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {typingUsers.length > 0 && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                            </div>
                            <span className="text-[11px] text-gray-400 italic">
                                {typingUsers.map(u => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing…
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border-2 border-gray-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                    <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="text-gray-400 hover:text-primary transition-colors flex-shrink-0"
                        title="Share a file"
                    >
                        {uploading ? <Loader2 size={16} className="animate-spin text-primary" /> : <Paperclip size={16} />}
                    </button>
                    <input ref={fileRef} type="file" className="hidden" onChange={handleFileSend} />
                    <input
                        type="text"
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 placeholder:text-gray-300"
                        placeholder="Type a message…"
                        value={message}
                        onChange={e => { setMessage(e.target.value); onTyping(); }}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
                    />
                    <button
                        type="submit"
                        disabled={!message.trim()}
                        className={`p-2 rounded-full transition-all ${message.trim() ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-400'}`}
                    >
                        <Send size={14} />
                    </button>
                </div>
            </form>
        </Card>
    );
};

// ─── FILES TAB ────────────────────────────────────────────────────────────────
const FilesTab = ({ files, onUpload }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading]   = useState(false);
    const [dragOver, setDragOver]     = useState(false);

    const doUpload = async (file) => {
        if (!file) return;
        setUploading(true);
        const toastId = toast.loading(`Uploading ${file.name}…`);
        try {
            await onUpload(file);
            toast.success('File uploaded!', { id: toastId });
        } catch (err) {
            toast.error('Upload failed: ' + (err.message || 'Unknown error'), { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) await doUpload(file);
    };

    const fileIcon = (type = '') => {
        if (type.includes('image')) return '🖼️';
        if (type.includes('pdf')) return '📄';
        if (type.includes('zip') || type.includes('rar')) return '📦';
        if (type.includes('word') || type.includes('document')) return '📝';
        if (type.includes('sheet') || type.includes('excel')) return '📊';
        if (type.includes('video')) return '🎬';
        return '📎';
    };

    return (
        <div className="space-y-6">
            {/* Drop Zone */}
            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-2xl transition-all ${
                    dragOver
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                }`}
            >
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => doUpload(e.target.files?.[0])} />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-colors ${dragOver ? 'bg-primary/10' : 'bg-gray-100'}`}>
                    {uploading
                        ? <Loader2 size={24} className="animate-spin text-primary" />
                        : <Upload size={24} className={dragOver ? 'text-primary' : 'text-gray-400'} />
                    }
                </div>
                <p className="font-bold text-gray-700 text-sm">{uploading ? 'Uploading…' : dragOver ? 'Drop to upload' : 'Drag & drop or click to upload'}</p>
                <p className="text-xs text-gray-400 mt-1">Supports any file type</p>
            </div>

            {/* File Grid */}
            {files.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {files.map(file => (
                        <motion.div
                            key={file.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="group bg-white border border-gray-100 rounded-2xl p-5 hover:border-primary/30 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-2xl">{fileIcon(file.type || file.mime_type)}</span>
                                <button
                                    onClick={() => file.url && window.open(file.url, '_blank')}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                                    title="Download"
                                >
                                    <Download size={14} />
                                </button>
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm truncate mb-1" title={file.name}>{file.name}</h4>
                            <div className="flex items-center justify-between text-[11px] text-gray-400 border-t border-gray-50 pt-2 mt-2">
                                <span>{file.size ? `${(file.size / 1024).toFixed(1)} KB` : '—'}</span>
                                <span>{formatDate(file.created_at || file.uploaded_at || Date.now())}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : !uploading && (
                <EmptyState
                    icon={FolderOpen}
                    title="No files yet"
                    description="Upload documents, designs, or resources. Drag-and-drop supported."
                />
            )}
        </div>
    );
};

// ─── TASKS TAB ────────────────────────────────────────────────────────────────
const TasksTab = ({ tasks, onCreate, onUpdateStatus, project }) => {
    const [newTitle, setNewTitle]           = useState('');
    const [generatingTasks, setGenerating]  = useState(false);

    const handleSuggest = async () => {
        setGenerating(true);
        try {
            const res = await api.ai.collaborationHelp(project);
            if (res.tasks?.length > 0) {
                const top = res.tasks.slice(0, 10);
                for (const t of top) await onCreate({ title: t.title, status: 'todo' });
                toast.success(`Added ${top.length} AI-suggested tasks!`);
            }
        } catch { toast.error('Failed to suggest tasks.'); }
        finally { setGenerating(false); }
    };

    const handleCreate = (e) => {
        e.preventDefault();
        if (!newTitle.trim()) return;
        onCreate({ title: newTitle, status: 'todo' });
        setNewTitle('');
    };

    const cols = [
        { id: 'todo',        label: 'To Do',       colorClass: 'bg-gray-100 text-gray-600',  icon: Clock },
        { id: 'in_progress', label: 'In Progress',  colorClass: 'bg-blue-100 text-blue-600',  icon: Play },
        { id: 'done',        label: 'Done',          colorClass: 'bg-green-100 text-green-600', icon: CheckCircle2 },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-220px)] space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-900">Project Tasks</h3>
                    <button
                        onClick={handleSuggest} disabled={generatingTasks}
                        className="flex items-center gap-1 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60"
                    >
                        {generatingTasks ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                        AI Suggest
                    </button>
                </div>
                <form onSubmit={handleCreate} className="flex gap-2 flex-1 max-w-sm">
                    <input
                        value={newTitle} onChange={e => setNewTitle(e.target.value)}
                        placeholder="Add a task…"
                        className="flex-1 px-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                    <button type="submit" disabled={!newTitle.trim()}
                        className="px-4 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl disabled:opacity-50 transition-colors">
                        <Plus size={14} />
                    </button>
                </form>
            </div>

            {/* Kanban columns */}
            <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
                {cols.map(col => {
                    const items = tasks.filter(t => t.status === col.id);
                    return (
                        <div key={col.id} className="flex-1 min-w-[280px] flex flex-col bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex items-center justify-between p-4 pb-3">
                                <div className="flex items-center gap-2">
                                    <span className={`p-1.5 rounded-lg ${col.colorClass}`}><col.icon size={13} /></span>
                                    <span className="font-bold text-gray-700 text-sm">{col.label}</span>
                                </div>
                                <span className="text-xs font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">{items.length}</span>
                            </div>
                            <div className="flex-1 p-3 pt-0 space-y-2 overflow-y-auto">
                                {items.map(task => (
                                    <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow group">
                                        <p className="text-sm font-medium text-gray-900 mb-3">{task.title}</p>
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                            <span className="text-[10px] text-gray-400">{formatDate(task.created_at || Date.now())}</span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {col.id !== 'todo'        && <button onClick={() => onUpdateStatus(task.id, 'todo')}        className="w-3 h-3 rounded-full bg-gray-300 hover:scale-125 transition-transform" title="Todo" />}
                                                {col.id !== 'in_progress' && <button onClick={() => onUpdateStatus(task.id, 'in_progress')} className="w-3 h-3 rounded-full bg-blue-400 hover:scale-125 transition-transform" title="In Progress" />}
                                                {col.id !== 'done'        && <button onClick={() => onUpdateStatus(task.id, 'done')}        className="w-3 h-3 rounded-full bg-green-400 hover:scale-125 transition-transform" title="Done" />}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div className="py-8 text-center text-xs text-gray-300 border-2 border-dashed border-gray-100 rounded-xl">
                                        Nothing here yet
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── VIDEO CONFERENCE TAB ─────────────────────────────────────────────────────
const VideoConferenceTab = ({ project, user, onNotify, interviews = [], onSchedule }) => {
    const [inMeeting, setInMeeting] = useState(false);
    const [copied, setCopied]       = useState(false);
    const [joining, setJoining]     = useState(false);
    const [meetingError, setMeetingError] = useState('');
    const [showSchedule, setShowSchedule] = useState(false);

    const upcomingMeeting = [...interviews].filter(item => item.meeting_link).sort((a, b) => new Date(b.scheduled_at || b.scheduled_time) - new Date(a.scheduled_at || a.scheduled_time))[0];
    const meetingLink = upcomingMeeting?.meeting_link || '';

    const handleJoin = async () => {
        if (!meetingLink) { setShowSchedule(true); return; }
        setJoining(true);
        setMeetingError('');
        window.open(meetingLink, '_blank', 'noopener,noreferrer');
        try {
            await onNotify?.(`📹 Google Meet is ready for **${project.title}**.\n\nJoin here: ${meetingLink}`);
        } catch {
            toast.warning('Meeting opened, but the team notification could not be sent. Copy and share the link.');
        } finally {
            setJoining(false);
        }
    };

    const handleCopy = async () => {
        if (!meetingLink) { setShowSchedule(true); return; }
        try {
            await navigator.clipboard.writeText(meetingLink);
            setCopied(true);
            toast.success('Meeting link copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error('Copy was blocked by your browser. Select the link and copy it manually.');
        }
    };

    if (inMeeting) {
        return (
            <div className="h-[calc(100vh-180px)] rounded-2xl overflow-hidden shadow-2xl bg-black flex flex-col">
                <div className="bg-gray-900 px-5 py-3 flex items-center justify-between text-white border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-600 rounded-lg animate-pulse"><Video size={14} /></div>
                        <span className="font-bold text-sm">Live: {project.title}</span>
                        <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleCopy}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors">
                            {copied ? <Check size={12} /> : <Link size={12} />} {copied ? 'Copied' : 'Copy Link'}
                        </button>
                        <button onClick={() => setInMeeting(false)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
                            <X size={12} /> Leave
                        </button>
                    </div>
                </div>
                <div className="flex-1">
                    <MeetingRoom 
                        roomName={project.title} 
                        userName={user?.name || 'User'} 
                        userData={user}
                        meetingId={project.id}
                        onLeave={() => setInMeeting(false)} 
                        onReady={() => { setJoining(false); setMeetingError(''); }}
                        onError={() => setMeetingError('The meeting service could not connect. Check camera permissions and your internet connection, then retry.')}
                    />
                </div>
                {meetingError && (
                    <div className="bg-red-50 border-t border-red-200 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
                        <span>{meetingError}</span>
                        <button onClick={() => { setInMeeting(false); setMeetingError(''); }} className="font-bold underline">Retry</button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-[calc(100vh-260px)]">
            <div className="max-w-md w-full text-center space-y-6">
                {/* Animated video icon */}
                <div className="relative mx-auto w-28 h-28">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-40"></div>
                    <div className="absolute inset-3 bg-primary/10 rounded-full animate-ping opacity-30 [animation-delay:0.5s]"></div>
                    <div className="relative w-full h-full bg-white border-4 border-primary/20 rounded-full flex items-center justify-center shadow-xl">
                        <Video size={36} className="text-primary" />
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Google Meet Workspace</h2>
                    <p className="text-gray-500 text-sm">Schedule a Google Meet with automatic calendar invitations for the client and expert.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left">
                    {[
                        [Video, 'HD video'], [MonitorUp, 'Share screen'],
                        [MessageSquare, 'Live chat'], [Hand, 'Raise hand']
                    ].map(([Icon, label]) => (
                        <div key={label} className="bg-white border border-gray-100 rounded-xl p-3 text-center shadow-sm">
                            <Icon size={16} className="mx-auto mb-1 text-primary" />
                            <span className="text-[11px] font-bold text-gray-600">{label}</span>
                        </div>
                    ))}
                </div>

                {/* Meeting link preview */}
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left">
                    <Link size={13} className="text-gray-400 flex-shrink-0" />
                    <input readOnly value={meetingLink || 'Schedule a meeting to generate the Google Meet link'} onFocus={e => e.target.select()} className="text-xs text-gray-500 truncate flex-1 bg-transparent outline-none" aria-label="Meeting invite link" />
                    <button onClick={handleCopy} className="text-xs font-bold text-primary hover:text-primary/80 flex-shrink-0">
                        {copied ? 'Copied!' : 'Copy'}
                    </button>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={handleJoin}
                        className="w-full py-4 text-base font-bold text-white bg-primary hover:bg-primary/90 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.99] transition-all"
                    >
                        <Video size={18} className="inline mr-2" />
                        {joining ? 'Opening Google Meet…' : meetingLink ? 'Join Google Meet & Notify Team' : 'Schedule Google Meet'}
                    </button>
                    <button onClick={handleCopy}
                        className="w-full py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 rounded-2xl transition-colors">
                        {copied ? <><Check size={14} className="inline mr-1.5 text-green-500" />Link copied!</> : 'Copy invite link only'}
                    </button>
                    <button onClick={() => meetingLink ? window.open(meetingLink, '_blank', 'noopener,noreferrer') : setShowSchedule(true)}
                        className="w-full py-3 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:border-primary rounded-2xl transition-colors">
                        <ExternalLink size={14} className="inline mr-1.5" /> {meetingLink ? 'Open Meet in a new tab' : 'Choose meeting date and time'}
                    </button>
                </div>
                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                    <LockKeyhole size={13} className="text-green-500" /> Only project participants receive this room link.
                </div>
                <ScheduleInterviewModal
                    isOpen={showSchedule}
                    onClose={() => setShowSchedule(false)}
                    expertName={project.selected_expert_name || 'the expert'}
                    onSchedule={async details => {
                        if (!project.selected_expert_id) throw new Error('Select an expert before scheduling a meeting.');
                        await onSchedule({ ...details, expertId: project.selected_expert_id });
                        toast.success('Google Meet created and calendar invitations sent.');
                        setShowSchedule(false);
                    }}
                />
            </div>
        </div>
    );
};

const CompletionPanel = ({ project, user, onProjectChange, onDeleted }) => {
    const [busy, setBusy] = useState('');
    const isClient = project.client_id === user?.id;
    const isExpert = project.selected_expert_id === user?.id;
    const completed = Boolean(project.delivery_accepted_at || project.finalized_at || project.status === 'completed');

    const act = async (action, success) => {
        setBusy(action);
        try {
            const updated = await api.projects.updateCompletion(project.id, action);
            onProjectChange(updated);
            toast.success(success);
        } catch (error) { toast.error(error.message || 'Action could not be completed.'); }
        finally { setBusy(''); }
    };

    const remove = async () => {
        if (!window.confirm('Delete this completed project and its collaboration records? This cannot be undone.')) return;
        setBusy('delete');
        try { await api.projects.delete(project.id); toast.success('Project deleted.'); onDeleted(); }
        catch (error) { toast.error(error.message || 'Project could not be deleted.'); setBusy(''); }
    };

    if (!isClient && !isExpert) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-bold text-gray-900 text-sm">Project completion</h3><p className="text-xs text-gray-500 mt-1">Final delivery and deletion require a clear approval trail.</p></div>
                {completed && <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-100 text-green-700">Finalized</span>}
            </div>
            {isClient && !completed && <Button onClick={() => act('accept_delivery', 'Final delivery accepted.')} disabled={!!busy} className="w-full"><CheckCircle2 size={15} /> Accept final delivery</Button>}
            {isClient && completed && !project.deletion_requested_at && <Button variant="secondary" onClick={() => act('request_deletion', 'Deletion request sent to the expert.')} disabled={!!busy} className="w-full"><Trash2 size={15} /> Request project deletion</Button>}
            {isExpert && project.deletion_requested_at && !project.deletion_consented_at && <Button onClick={() => act('consent_deletion', 'Deletion consent recorded.')} disabled={!!busy} className="w-full"><Check size={15} /> Consent to deletion</Button>}
            {isClient && project.deletion_requested_at && !project.deletion_consented_at && <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3">Waiting for the assigned expert to consent.</p>}
            {isClient && project.deletion_consented_at && <Button onClick={remove} disabled={!!busy} className="w-full bg-red-600 hover:bg-red-700"><Trash2 size={15} /> Permanently delete project</Button>}
        </div>
    );
};

// ─── CONTRACT TAB ─────────────────────────────────────────────────────────────
const ContractTab = ({ project, liveContract }) => {
    return (
        <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-2">
                    <FileSignature size={16} className="text-primary" />
                    <h3 className="font-bold text-gray-900 text-sm">Smart Contracts</h3>
                </div>
                <div className="p-4">
                    <Step4Contract project={project} liveContract={liveContract} hideProceed={true} onNext={() => {}} />
                </div>
            </div>

        </div>
    );
};

// ─── MAIN COLLABORATION PAGE ──────────────────────────────────────────────────
export default function Collaboration() {
    const { user }      = useAuth();
    const location      = useLocation();
    const navigate      = useNavigate();
    const [searchParams] = useSearchParams();
    const projectId     = location.state?.projectId || searchParams.get('projectId');
    const [project, setProject]         = useState(null);
    const [initLoading, setInitLoading] = useState(true);

    const tabParam     = searchParams.get('tab');

    const { socket, activeTab, setActiveTab, data, loading, actions } = useCollaboration(project?.id || projectId, user);

    useEffect(() => {
        if (tabParam && activeTab !== tabParam) {
            setActiveTab(tabParam);
        }
    }, [tabParam, activeTab, setActiveTab]);

    useEffect(() => {
        const loadProject = async () => {
            if (!user) return;
            try {
                if (projectId) {
                    const p = await api.projects.getById(projectId);
                    setProject(p);
                } else {
                    const p = await api.projects.getMine();
                    if (p?.projects?.length > 0) setProject(p.projects[0]);
                }
            } catch (e) {
                console.error(e);
                toast.error('Failed to load project.');
            } finally {
                setInitLoading(false);
            }
        };
        loadProject();
    }, [user, projectId]);

    useEffect(() => {
        if (!socket) return undefined;
        const update = updated => updated.id === project?.id && setProject(prev => ({ ...prev, ...updated }));
        socket.on('project_update', update);
        return () => socket.off('project_update', update);
    }, [socket, project?.id]);

    if (initLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 size={36} className="animate-spin text-primary" />
            </div>
        );
    }

    // Bypass project requirement if the user just explicitly wants their Direct Messages inbox
    if (!project && location.state?.view === 'messages') {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 md:px-8">
                <SEO title="Direct Messages – Africa Konnect" description="Your secure Direct Messaging inbox." />
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-black text-gray-900">Inbox</h1>
                        <p className="text-sm text-gray-500">Secure end-to-end direct messaging with experts and clients.</p>
                    </div>
                    <DirectMessagesPanel defaultContact={location.state?.defaultContact} />
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center p-8">
                <EmptyState
                    icon={FolderOpen}
                    title="No Project Found"
                    description="Please select a project from your dashboard to access the collaboration hub."
                    action={
                        <button onClick={() => navigate(user?.role === 'expert' ? '/expert-dashboard' : '/project-hub')}
                            className="px-5 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors">
                            Go to Dashboard
                        </button>
                    }
                />
            </div>
        );
    }

    const tabs = [
        { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
        { id: 'messages',  label: 'Project Chat', icon: MessageSquare, badge: data.messages.length > 0 ? data.messages.length : null },
        { id: 'tasks',     label: 'Tasks',     icon: CheckSquare, badge: data.tasks.filter(t => t.status !== 'done').length || null },
        { id: 'files',     label: 'Files',     icon: FolderOpen, badge: data.files.length > 0 ? data.files.length : null },
        { id: 'contracts', label: 'Contract',  icon: FileSignature },
        { id: 'video',     label: 'Meeting',   icon: Video },
        { id: 'dm',        label: 'Direct Messages', icon: Mail },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pt-16">
            <SEO title={`${project.title} – Collaboration Hub`} description="Realtime collaboration workspace." />

            {/* ── Sidebar ────────────────────────────────────────────────── */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-100 flex flex-col flex-shrink-0 md:h-[calc(100vh-64px)] sticky top-16 z-20">
                <div className="p-5 border-b border-gray-50">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors text-xs font-bold uppercase tracking-wider mb-4"
                    >
                        <ChevronLeft size={14} /> Dashboard
                    </button>
                    <h1 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2">{project.title}</h1>
                    <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                        <span className="text-[11px] text-gray-500 capitalize">{project.status}</span>
                    </div>
                </div>

                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-150 ${
                                activeTab === tab.id
                                    ? 'bg-primary text-white shadow-md shadow-primary/20 font-bold'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium'
                            }`}
                        >
                            <span className="flex items-center gap-3">
                                <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : 'text-gray-400'} />
                                {tab.label}
                            </span>
                            {tab.badge && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                }`}>{tab.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Security badge */}
                <div className="p-4 border-t border-gray-50">
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <Shield size={11} className="text-green-500" />
                        <span>End-to-end encrypted · Escrow protected</span>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ───────────────────────────────────────────── */}
            <main className="flex-1 p-4 md:p-6 md:h-[calc(100vh-64px)] overflow-y-auto bg-gray-50/50">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="h-full"
                    >
                        {activeTab === 'overview'  && <OverviewTab project={project} tasks={data.tasks} contracts={data.contracts} onInvite={actions.inviteUser} />}
                        {activeTab === 'messages'  && <MessagesTab messages={data.messages} projectId={project.id} onSend={actions.sendMessage} onTyping={actions.sendTyping} typingUsers={data.typingUsers} user={user} />}
                        {activeTab === 'tasks'     && <TasksTab tasks={data.tasks} onCreate={actions.createTask} onUpdateStatus={actions.updateTaskStatus} project={project} />}
                        {activeTab === 'files'     && <FilesTab files={data.files} onUpload={actions.uploadFile} />}
                        {activeTab === 'contracts' && <ContractTab project={project} liveContract={data.contracts?.[0]} />}
                        {activeTab === 'video'     && <VideoConferenceTab project={project} user={user} onNotify={actions.sendMessage} interviews={data.interviews} onSchedule={actions.scheduleInterview} />}
                        {activeTab === 'dm'        && <DirectMessagesPanel project={project} />}
                        {activeTab === 'overview' && <div className="mt-6"><CompletionPanel project={project} user={user} onProjectChange={setProject} onDeleted={() => navigate(user?.role === 'expert' ? '/expert-dashboard' : '/project-hub')} /></div>}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}
