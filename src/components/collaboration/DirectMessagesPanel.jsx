import React, { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { Avatar } from '../ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Search, MessageSquare, ArrowLeft, Check, CheckCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// ── Single conversation thread ─────────────────────────────────────────────
const DMThread = ({ contact, onBack, currentUser, socket }) => {
    const [messages, setMessages]   = useState([]);
    const [input, setInput]         = useState('');
    const [loading, setLoading]     = useState(true);
    const [sending, setSending]     = useState(false);
    const [typing, setTyping]       = useState(false);
    const scrollRef                 = useRef(null);
    const typingTimer               = useRef(null);
    const fileInputRef              = useRef(null);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 50);
    }, []);

    useEffect(() => {
        let cancelled = false;
        const loadDMs = async () => {
            setLoading(true);
            try {
                const res = await api.messages.getDirect(contact.id);
                if (!cancelled) setMessages(Array.isArray(res) ? res : (res?.messages || []));
            } catch (err) {
                console.error('Failed to load DMs:', err);
                if (!cancelled) setMessages([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadDMs();
        return () => { cancelled = true; };
    }, [contact.id]);

    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

    // Live socket events for this DM thread
    useEffect(() => {
        if (!socket) return;
        const handleDM = (msg) => {
            const isRelevant =
                (msg.sender_id === contact.id && msg.receiver_id === currentUser.id) ||
                (msg.sender_id === currentUser.id && msg.receiver_id === contact.id);
            if (!isRelevant) return;
            setMessages(prev => {
                if (prev.some(m => m.id === msg.id)) return prev;
                return [...prev, msg];
            });
            scrollToBottom();
        };
        const handleTyping = ({ userId }) => {
            if (userId !== contact.id) return;
            setTyping(true);
            clearTimeout(typingTimer.current);
            typingTimer.current = setTimeout(() => setTyping(false), 3000);
        };
        socket.on('direct_message', handleDM);
        socket.on('user_typing_dm', handleTyping);
        return () => {
            socket.off('direct_message', handleDM);
            socket.off('user_typing_dm', handleTyping);
            clearTimeout(typingTimer.current);
        };
    }, [socket, contact.id, currentUser.id, scrollToBottom]);

    const sendTypingEvent = () => {
        socket?.emit('typing_dm', { toUserId: contact.id, userId: currentUser.id });
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || sending) return;
        const text = input.trim();
        setInput('');
        setSending(true);

        const tempId = `temp_${Date.now()}`;
        const optimistic = {
            id: tempId, content: text,
            sender_id: currentUser.id, receiver_id: contact.id,
            created_at: new Date().toISOString(), isTemp: true
        };
        setMessages(prev => [...prev, optimistic]);
        scrollToBottom();

        try {
            const res = await api.messages.sendDirect(contact.id, text);
            setMessages(prev => prev.map(m => m.id === tempId ? res : m));
        } catch (err) {
            console.error('DM send failed:', err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            toast.error('Failed to send message.');
        } finally {
            setSending(false);
        }
    };

    const isMine = (msg) => msg.sender_id === currentUser.id;
    const formatTime = (d) => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="flex flex-col h-full">
            {/* Thread Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
                <button onClick={onBack} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors md:hidden">
                    <ArrowLeft size={16} />
                </button>
                <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                    {contact.profile_image_url
                        ? <img src={contact.profile_image_url} alt={contact.name} className="w-full h-full object-cover" />
                        : <Avatar name={contact.name} className="w-full h-full bg-primary/10 text-primary text-xs" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm truncate">{contact.name}</p>
                    <p className="text-[11px] text-gray-400 truncate capitalize">{contact.role}</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span className="text-[11px] text-green-600 font-semibold">Online</span>
                </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50 scroll-smooth">
                {loading && (
                    <div className="flex justify-center py-8">
                        <Loader2 size={20} className="animate-spin text-primary/40" />
                    </div>
                )}
                {!loading && messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 text-center">
                        <MessageSquare size={28} className="text-gray-200 mb-2" />
                        <p className="text-sm text-gray-400 font-medium">No messages yet</p>
                        <p className="text-xs text-gray-300">Send a message to start chatting</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${isMine(msg) ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[75%] space-y-1 ${isMine(msg) ? 'items-end' : 'items-start'} flex flex-col`}>
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                isMine(msg)
                                    ? 'bg-primary text-white rounded-br-sm'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                            } ${msg.isTemp ? 'opacity-70' : ''}`}>
                                {msg.content}
                            </div>
                            <div className={`flex items-center gap-1 px-1 ${isMine(msg) ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                                {isMine(msg) && (
                                    msg.isTemp
                                        ? <Loader2 size={10} className="text-gray-300 animate-spin" />
                                        : <CheckCheck size={10} className="text-primary/50" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {typing && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 px-4 py-2.5 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-2">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            </div>
                            <span className="text-[10px] text-gray-400 italic">{contact.name} is typing…</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-4 py-3 bg-white border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border-2 border-gray-200 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-gray-400 hover:text-primary transition-colors flex-shrink-0"
                    >
                        <Paperclip size={16} />
                    </button>
                    <input ref={fileInputRef} type="file" className="hidden" />
                    <input
                        type="text"
                        value={input}
                        onChange={e => { setInput(e.target.value); sendTypingEvent(); }}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend(e)}
                        placeholder={`Message ${contact.name}…`}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-800 placeholder:text-gray-300 py-1"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || sending}
                        className={`p-2 rounded-full transition-all ${input.trim() ? 'bg-primary text-white shadow-md' : 'bg-gray-200 text-gray-400'}`}
                    >
                        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                </div>
            </form>
        </div>
    );
};

// ── Contact list ───────────────────────────────────────────────────────────
const ContactItem = ({ contact, isSelected, onClick, unread }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 transition-all text-left rounded-xl mx-1 ${
            isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-gray-50'
        }`}
    >
        <div className="relative flex-shrink-0">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
                {contact.profile_image_url
                    ? <img src={contact.profile_image_url} alt="" className="w-full h-full object-cover" />
                    : <Avatar name={contact.name} className="w-full h-full bg-primary/10 text-primary text-sm" />
                }
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white"></span>
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary' : 'text-gray-900'}`}>{contact.name}</p>
                {unread > 0 && (
                    <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">{unread}</span>
                )}
            </div>
            <p className="text-[11px] text-gray-400 capitalize">{contact.role}</p>
        </div>
    </button>
);

// ── Main Panel ─────────────────────────────────────────────────────────────
const DirectMessagesPanel = ({ project, defaultContact }) => {
    const { user }                          = useAuth();
    const socket                            = useSocket();
    const [contacts, setContacts]           = useState([]);
    const [selectedContact, setSelected]    = useState(null);
    const [search, setSearch]               = useState('');
    const [loading, setLoading]             = useState(true);

    useEffect(() => {
        let cancelled = false;
        const loadContacts = async () => {
            setLoading(true);
            try {
                if (project) {
                    // Build contacts from project members (client + expert)
                    const list = [];
                    if (project.client_id && project.client_id !== user.id) {
                        list.push({ id: project.client_id, name: project.client_name || 'Project Client', role: 'client', profile_image_url: project.client_avatar });
                    }
                    if (project.expert_id && project.expert_id !== user.id) {
                        list.push({ id: project.expert_id, name: project.expert_name || 'Assigned Expert', role: 'expert', profile_image_url: project.expert_avatar });
                    }
                    if (!cancelled) setContacts(list);
                } else {
                    // Load all general direct message contacts
                    const data = await api.messages.getDirectChatUsers();
                    if (!cancelled) setContacts(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error('Failed to load DM contacts:', err);
                if (!cancelled) toast.error('Failed to load conversations');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        loadContacts();
        return () => { cancelled = true; };
    }, [project, user.id]);

    useEffect(() => {
        if (defaultContact) setSelected(defaultContact);
    }, [defaultContact]);

    const filtered = contacts.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex h-[calc(100vh-200px)] bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Contact Sidebar */}
            <div className={`w-72 border-r border-gray-100 flex flex-col flex-shrink-0 ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-50">
                    <h3 className="font-bold text-gray-900 mb-3">Direct Messages</h3>
                    <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                        <Search size={13} className="text-gray-400 flex-shrink-0" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search…"
                            className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-gray-700 placeholder:text-gray-300"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto py-2">
                    {loading && (
                        <div className="flex justify-center py-6">
                            <Loader2 size={18} className="animate-spin text-primary/40" />
                        </div>
                    )}
                    {!loading && filtered.length === 0 && (
                        <div className="text-center py-10 px-4">
                            <MessageSquare size={24} className="text-gray-200 mx-auto mb-2" />
                            <p className="text-sm text-gray-400">No contacts yet</p>
                            <p className="text-xs text-gray-300 mt-1">Project members will appear here</p>
                        </div>
                    )}
                    {filtered.map(c => (
                        <ContactItem
                            key={c.id}
                            contact={c}
                            isSelected={selectedContact?.id === c.id}
                            onClick={() => setSelected(c)}
                        />
                    ))}
                </div>
            </div>

            {/* Thread Panel */}
            <div className={`flex-1 ${selectedContact ? 'flex' : 'hidden md:flex'} flex-col`}>
                {selectedContact ? (
                    <DMThread
                        contact={selectedContact}
                        currentUser={user}
                        socket={socket}
                        onBack={() => setSelected(null)}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center px-8">
                        <MessageSquare size={40} className="text-gray-200 mb-3" />
                        <p className="font-semibold text-gray-500 mb-1">Select a conversation</p>
                        <p className="text-sm text-gray-400">Choose a team member from the list to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DirectMessagesPanel;
