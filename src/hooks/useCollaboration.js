import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useSocket } from './useSocket';

export const useCollaboration = (projectId, user) => {
    const socket = useSocket();
    const [activeTab, setActiveTab] = useState('overview');

    // Data States
    const [messages, setMessages] = useState([]);
    const [files, setFiles] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [interviews, setInterviews] = useState([]);
    const [activity, setActivity] = useState([]);
    const [typingUsers, setTypingUsers] = useState([]);

    // Loading States
    const [loading, setLoading] = useState({
        messages: false,
        files: false,
        tasks: false,
        activity: false,
        contracts: false
    });

    const [error, setError] = useState(null);

    // Initial Data Fetch
    useEffect(() => {
        if (!projectId) return;

        const fetchAllData = async () => {
            setLoading(prev => ({ ...prev, messages: true, files: true, tasks: true, contracts: true }));
            try {
                // Parallel fetching
                const [msgsRes, filesRes, tasksRes, contractsRes, interviewsRes] = await Promise.allSettled([
                    api.messages.getMessages(projectId),
                    api.files.getFiles(projectId),
                    api.tasks.getByProject(projectId),
                    api.contracts.getByProject(projectId),
                    api.interviews.getByProject(projectId)
                ]);

                // Handle Messages
                if (msgsRes.status === 'fulfilled') {
                    const data = msgsRes.value;
                    setMessages(data?.messages || (Array.isArray(data) ? data : []));
                } else {
                    console.error("Failed to fetch messages", msgsRes.reason);
                }

                // Handle Files
                if (filesRes.status === 'fulfilled') {
                    const data = filesRes.value;
                    setFiles(data?.files || (Array.isArray(data) ? data : []));
                } else {
                    console.error("Failed to fetch files", filesRes.reason);
                }

                // Handle Contracts
                if (contractsRes.status === 'fulfilled') {
                    const data = contractsRes.value;
                    setContracts(data?.contracts || (Array.isArray(data) ? data : []));
                }

                // Handle Interviews
                if (interviewsRes.status === 'fulfilled') {
                    const data = interviewsRes.value;
                    setInterviews(data?.interviews || (Array.isArray(data) ? data : []));
                } else {
                    console.error("Failed to fetch interviews", interviewsRes.reason);
                }

                // Handle Tasks
                if (tasksRes.status === 'fulfilled') {
                    const data = tasksRes.value;
                    setTasks(data?.tasks || (Array.isArray(data) ? data : []));
                } else {
                    console.error("Failed to fetch tasks", tasksRes.reason);
                }

            } catch (err) {
                console.error("Failed to fetch collaboration data", err);
                setError("Failed to load some project data");
            } finally {
                setLoading({ messages: false, files: false, tasks: false, activity: false });
            }
        };

        fetchAllData();
    }, [projectId]);

    // Socket Event Listeners
    useEffect(() => {
        if (!socket || !projectId) return;

        // Join project room
        if (socket.connected) {
            socket.emit('join_project', projectId);
        } else {
            socket.on('connect', () => {
                socket.emit('join_project', projectId);
            });
        }

        const handleNewMessage = (msg) => {
            const msgProjectId = msg.project_id || msg.projectId;
            if (msgProjectId === projectId) {
                setMessages(prev => {
                    if (prev.some(m => m.id === msg.id)) return prev;
                    return [...prev, msg];
                });
            }
        };

        const handleTaskUpdate = (task) => {
            const taskProjectId = task.project_id || task.projectId;
            if (taskProjectId === projectId) {
                setTasks(prev => {
                    const exists = prev.find(t => t.id === task.id);
                    if (exists) return prev.map(t => t.id === task.id ? task : t);
                    return [...prev, task];
                });
            }
        };

        const handleFileUploaded = (file) => {
            const fileProjectId = file.project_id || file.projectId;
            if (fileProjectId === projectId) {
                setFiles(prev => {
                    if (prev.some(f => f.id === file.id)) return prev;
                    return [...prev, file];
                });
            }
        };

        const handleFileVersionAdded = (version) => {
            // Update file in list if matched
            setFiles(prev => prev.map(f => f.id === version.file_id ? { ...f, updated_at: version.created_at } : f));
        };

        const handleTaskCreated = (task) => {
            const taskProjectId = task.project_id || task.projectId;
            if (taskProjectId === projectId) {
                setTasks(prev => {
                    if (prev.some(t => t.id === task.id)) return prev;
                    return [...prev, task];
                });
            }
        };

        const handleTaskDeleted = ({ id }) => {
            setTasks(prev => prev.filter(t => t.id !== id));
        };

        const handleContractUpdated = (contract) => {
            const contractProjectId = contract.project_id || contract.projectId;
            if (contractProjectId === projectId) {
                setContracts(prev => {
                    const exists = prev.find(c => c.id === contract.id);
                    if (exists) return prev.map(c => c.id === contract.id ? contract : c);
                    return [...prev, contract];
                });
            }
        };

        const handleInterviewScheduled = (interview) => {
            const intProjectId = interview.project_id || interview.projectId;
            if (intProjectId === projectId) {
                setInterviews(prev => {
                    if (prev.some(i => i.id === interview.id)) return prev;
                    return [...prev, interview];
                });
            }
        };

        const handleUserTyping = ({ userId, userName }) => {
            if (userId === user.id) return;
            setTypingUsers(prev => {
                if (prev.find(u => u.id === userId)) return prev;
                return [...prev, { id: userId, name: userName }];
            });
            // Auto remove after 3s
            setTimeout(() => {
                setTypingUsers(prev => prev.filter(u => u.id !== userId));
            }, 3000);
        };

        socket.on('receive_message', handleNewMessage);
        socket.on('task_updated', handleTaskUpdate);
        socket.on('task_created', handleTaskCreated);
        socket.on('task_deleted', handleTaskDeleted);
        socket.on('file_uploaded', handleFileUploaded);
        socket.on('file_version_added', handleFileVersionAdded);
        socket.on('contract_updated', handleContractUpdated);
        socket.on('interview_scheduled', handleInterviewScheduled);
        socket.on('user_typing', handleUserTyping);

        return () => {
            socket.off('receive_message', handleNewMessage);
            socket.off('task_updated', handleTaskUpdate);
            socket.off('task_created', handleTaskCreated);
            socket.off('task_deleted', handleTaskDeleted);
            socket.off('file_uploaded', handleFileUploaded);
            socket.off('file_version_added', handleFileVersionAdded);
            socket.off('contract_updated', handleContractUpdated);
            socket.off('interview_scheduled', handleInterviewScheduled);
            socket.off('user_typing', handleUserTyping);
            socket.emit('leave_project', projectId);
        };
    }, [socket, projectId]);

    // Actions
    const sendMessage = useCallback(async (content) => {
        if (!projectId) {
            console.error("Cannot send message: Project ID is missing.");
            return;
        }
        const tempId = Date.now();
        try {
            // Optimistic update
            const optimisticMsg = {
                id: tempId,
                content,
                sender_id: user?.id,
                created_at: new Date().toISOString(),
                isOptimistic: true,
                sender: {
                    id: user?.id,
                    name: user?.name || 'You',
                    avatar_url: user?.avatar_url
                }
            };
            setMessages(prev => [...prev, optimisticMsg]);

            const res = await api.messages.send(projectId, content);
            setMessages(prev => prev.map(m => m.id === tempId ? res : m));
            return res;
        } catch (err) {
            console.error("Failed to send message", err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            throw err;
        }
    }, [projectId, user]);

    const uploadFile = useCallback(async (fileData) => {
        try {
            const formData = new FormData();
            formData.append('file', fileData);
            const res = await api.files.upload(formData, projectId);
            setFiles(prev => [...prev, res]);
            return res;
        } catch (err) {
            console.error("Upload failed", err);
            throw err;
        }
    }, [projectId]);

    const createTask = useCallback(async (taskData) => {
        try {
            const res = await api.tasks.create(projectId, taskData);
            setTasks(prev => [...prev, res]);
            return res;
        } catch (err) {
            console.error("Task creation failed", err);
            throw err;
        }
    }, [projectId]);

    const updateTaskStatus = useCallback(async (taskId, status) => {
        const previousTasks = [...tasks];
        try {
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
            await api.tasks.update(taskId, { status });
        } catch (err) {
            console.error("Task update failed", err);
            setTasks(previousTasks); // Rollback
            toast.error("Failed to update task status");
        }
    }, [tasks]);

    const sendTyping = useCallback(() => {
        if (socket && projectId) {
            socket.emit('typing_start', { roomId: projectId, userId: user.id, userName: user.name });
        }
    }, [socket, projectId, user]);

    const signContract = useCallback(async (contractId) => {
        const previousContracts = [...contracts];
        try {
            setContracts(prev => prev.map(c => c.id === contractId ? { ...c, status: 'signed' } : c));
            const res = await api.contracts.sign(contractId);
            setContracts(prev => prev.map(c => c.id === contractId ? res : c));
            return res;
        } catch (err) {
            console.error("Sign contract failed", err);
            setContracts(previousContracts); // Rollback
            toast.error("Failed to sign contract");
        }
    }, [contracts]);

    const scheduleInterview = useCallback(async (data) => {
        try {
            const res = await api.interviews.schedule({ ...data, projectId });
            setInterviews(prev => [...prev, res]);
            return res;
        } catch (err) {
            console.error("Schedule interview failed", err);
            throw err;
        }
    }, [projectId]);

    const createContract = useCallback(async (contractData) => {
        try {
            const res = await api.contracts.create({ ...contractData, projectId });
            setContracts(prev => [...prev, res]);
            return res;
        } catch (err) {
            console.error("Create contract failed", err);
            throw err;
        }
    }, [projectId]);

    const inviteUser = useCallback(async (email) => {
        try {
            // api.projects.inviteMember(projectId, email)
            // We need to implement this in api lib as well if not exists
            const res = await api.projects.inviteMember(projectId, email);
            return res;
        } catch (err) {
            console.error("Invite failed", err);
            throw err;
        }
    }, [projectId]);

    return {
        activeTab,
        setActiveTab,
        data: { messages, files, tasks, activity, contracts, interviews, typingUsers },
        loading,
        error,
        actions: {
            sendMessage,
            sendTyping,
            uploadFile,
            createTask,
            updateTaskStatus,
            signContract,
            scheduleInterview,
            createContract,
            inviteUser
        }
    };
};
