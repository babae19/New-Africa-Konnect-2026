import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';
import socketService from '../lib/socket';

const ProjectContext = createContext({});

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};

export const ProjectProvider = ({ children }) => {
    const [currentProject, setCurrentProject] = useState(null);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    // Initial load
    useEffect(() => {
        loadProjects();
    }, []);

    // Socket listeners
    useEffect(() => {
        const socket = socketService.connect();
        const user = JSON.parse(localStorage.getItem('userInfo'));
        if (user) {
            socketService.joinUser(user.id);
        }

        socket.on('receive_message', (data) => {
            const message = data.message || data;
            const projectId = data.projectId || data.project_id || message.projectId || message.project_id;
            if (!projectId || !message) return;

            // Map backend fields to frontend
            const formattedMessage = {
                ...message,
                text: message.content, // Map content to text
                sender: message.sender || 'Unknown'
            };

            setProjects(prevProjects => {
                const projectIndex = prevProjects.findIndex(p => p.id === projectId);
                if (projectIndex === -1) return prevProjects;

                const project = prevProjects[projectIndex];
                // Check dupes
                if (project.messages?.some(m => m.id === message.id)) return prevProjects;

                const updatedMessages = [...(project.messages || []), formattedMessage];
                const updatedProject = { ...project, messages: updatedMessages };

                const newProjects = [...prevProjects];
                newProjects[projectIndex] = updatedProject;

                // Update currentProject if matching
                if (currentProject?.id === projectId) {
                    setCurrentProject(prev => prev ? { ...prev, messages: updatedMessages } : null);
                }

                return newProjects;
            });
        });

        // Listen for project updates (e.g., status changes)
        socket.on('project_update', (updatedProject) => {
            console.log('Project update received:', updatedProject);
            setProjects(prev => prev.map(p => p.id === updatedProject.id ? { ...p, ...updatedProject } : p));
            if (currentProject?.id === updatedProject.id) {
                setCurrentProject(prev => ({ ...prev, ...updatedProject }));
            }
        });

        // Listen for invites
        socket.on('project_invite', (newProject) => {
            console.log('You have been invited to a project:', newProject);
        });

        // Listen for task updates
        socket.on('task_created', (newTask) => {
            setProjects(prev => {
                const projectIndex = prev.findIndex(p => p.id === newTask.project_id);
                if (projectIndex === -1) return prev;

                const project = prev[projectIndex];
                // Check dupes
                if (project.tasks?.some(t => t.id === newTask.id)) return prev;

                const updatedTasks = [newTask, ...(project.tasks || [])]; // Add to top

                // Add activity for task creation
                // Note: We might want to dedup this if we also listen to 'activity_logged'
                // But for now, ensuring the task list is up to date is priority.

                return prev.map((p, i) => i === projectIndex ? { ...p, tasks: updatedTasks } : p);
            });

            if (currentProject?.id === newTask.project_id) {
                setCurrentProject(prev => {
                    if (prev.tasks?.some(t => t.id === newTask.id)) return prev;
                    return { ...prev, tasks: [newTask, ...(prev.tasks || [])] };
                });
            }
        });

        socket.on('task_updated', (updatedTask) => {
            setProjects(prev => {
                const project = prev.find(p => p.id === updatedTask.project_id);
                if (!project) return prev;

                const updatedTasks = (project.tasks || []).map(t =>
                    t.id === updatedTask.id ? updatedTask : t
                );

                return prev.map(p => p.id === updatedTask.project_id ? { ...p, tasks: updatedTasks } : p);
            });

            if (currentProject?.id === updatedTask.project_id) {
                setCurrentProject(prev => ({
                    ...prev,
                    tasks: (prev.tasks || []).map(t => t.id === updatedTask.id ? updatedTask : t)
                }));
            }
        });

        return () => {
            socket.off('receive_message');
            socket.off('project_update');
            socket.off('project_invite');
            socket.off('task_created');
            socket.off('task_updated');
        };
    }, [currentProject?.id]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const user = JSON.parse(localStorage.getItem('userInfo'));

            if (user) {
                let data;
                let projectList = [];
                if (user.role === 'client') {
                    data = await api.projects.getClientProjects(user.id);
                    projectList = data?.projects || (Array.isArray(data) ? data : []);
                } else {
                    data = await api.projects.getInvitedProjects();
                    projectList = data?.projects || (Array.isArray(data) ? data : []);
                }
                setProjects(projectList);

                // Restore active project if exists
                const savedId = localStorage.getItem('currentProjectId');
                if (savedId && projectList.some(p => p.id === savedId)) {
                    const active = projectList.find(p => p.id === savedId);
                    setCurrentProject(active);
                    loadProjectDetails(savedId);
                    
                    // Also ensure socket joins
                    socketService.connect();
                    socketService.joinProject(savedId);
                }
            } else {
                setProjects([]);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProjectDetails = async (projectId) => {
        try {
            const [tasksRes, filesRes, messagesRes] = await Promise.all([
                api.tasks.getByProject(projectId),
                api.files.getByProject(projectId),
                api.messages.getMessages(projectId)
            ]);

            const tasks = tasksRes?.tasks || (Array.isArray(tasksRes) ? tasksRes : []);
            const files = filesRes?.files || (Array.isArray(filesRes) ? filesRes : []);
            const messagesArray = messagesRes?.messages || (Array.isArray(messagesRes) ? messagesRes : []);

            const formattedMessages = messagesArray.map(m => ({
                ...m,
                text: m.content || m.text,
                sender: m.sender_name || m.sender,
                isMe: false
            }));

            const fullProject = {
                ...projects.find(p => p.id === projectId),
                tasks,
                files,
                messages: formattedMessages,
                activities: []
            };

            setCurrentProject(fullProject);

            // Update in list
            setProjects(prev => prev.map(p => p.id === projectId ? fullProject : p));

        } catch (error) {
            console.error('Error loading project details:', error);
        }
    };

    const createProject = async (projectData) => {
        try {
            const newProject = await api.projects.create({
                ...projectData,
                status: 'draft'
            });

            setProjects([newProject, ...projects]);
            setCurrentProject(newProject);
            return newProject;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    };

    const deleteProject = async (projectId) => {
        try {
            await api.projects.delete(projectId);
            setProjects(prev => prev.filter(p => p.id !== projectId));
            if (currentProject?.id === projectId) {
                setCurrentProject(null);
                localStorage.removeItem('currentProjectId');
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    };

    const clearCurrentProject = () => {
        setCurrentProject(null);
        localStorage.removeItem('currentProjectId');
    };

    const updateProject = async (projectId, updates) => {
        try {
            // Only update core project fields via API
            const coreFields = ['title', 'description', 'budget', 'min_budget', 'max_budget', 'status', 'open_for_bidding', 'bidding_deadline'];
            const hasCoreUpdates = Object.keys(updates).some(k => coreFields.includes(k));

            if (hasCoreUpdates) {
                const updated = await api.projects.update(projectId, updates);

                // Update local state
                setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updated } : p));
                if (currentProject?.id === projectId) {
                    setCurrentProject(prev => ({ ...prev, ...updated }));
                }
            } else {
                // For non-core fields (like local optimistic updates), just update state
                setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
                if (currentProject?.id === projectId) {
                    setCurrentProject(prev => ({ ...prev, ...updates }));
                }
            }
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    };

    const addProjectFile = async (projectId, fileData) => {
        try {
            // Upload to backend
            const uploaded = await api.files.upload({
                name: fileData.name,
                type: fileData.type,
                size: fileData.size,
                data: fileData.data // base64
            }, projectId);

            // Update local state
            const project = projects.find(p => p.id === projectId);
            if (project) {
                const updatedFiles = [...(project.files || []), uploaded];
                updateProject(projectId, { files: updatedFiles });

                // Add activity
                addActivity(projectId, {
                    user: uploaded.uploadedBy || 'You',
                    action: 'uploaded',
                    target: uploaded.name
                });
            }
        } catch (error) {
            console.error('Error adding file:', error);
            throw error;
        }
    };

    const removeProjectFile = async (projectId, fileId) => {
        try {
            await api.files.delete(fileId);
            const project = projects.find(p => p.id === projectId);
            if (project) {
                const updatedFiles = project.files.filter(f => f.id !== fileId);
                updateProject(projectId, { files: updatedFiles });
            }
        } catch (error) {
            console.error('Error removing file:', error);
        }
    };

    const addMessage = async (projectId, message) => {
        try {
            // Send to backend
            const sent = await api.messages.send(projectId, message.text);

            // Backend emits socket event, so we might not need to manually update state 
            // if socket listener is fast enough. But for immediate feedback:
            const formatted = {
                ...sent,
                text: sent.content,
                sender: message.sender,
                isMe: true
            };

            const project = projects.find(p => p.id === projectId);
            if (project) {
                const updatedMessages = [...(project.messages || []), formatted];
                updateProject(projectId, { messages: updatedMessages });
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const addTask = async (projectId, task) => {
        try {
            const newTask = await api.tasks.create(projectId, task);

            const project = projects.find(p => p.id === projectId);
            if (project) {
                const updatedTasks = [...(project.tasks || []), newTask];
                updateProject(projectId, { tasks: updatedTasks });

                addActivity(projectId, {
                    user: task.createdBy,
                    action: 'created task',
                    target: task.title
                });
            }
        } catch (error) {
            console.error('Error adding task:', error);
        }
    };

    const updateTask = async (projectId, taskId, updates) => {
        try {
            const updated = await api.tasks.update(taskId, updates);

            const project = projects.find(p => p.id === projectId);
            if (project) {
                const updatedTasks = (project.tasks || []).map(t =>
                    t.id === taskId ? updated : t
                );
                updateProject(projectId, { tasks: updatedTasks });
            }
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    // Activities are still ephemeral for now, or derived
    const addActivity = (projectId, activity) => {
        const project = projects.find(p => p.id === projectId);
        if (!project) return;

        const newActivity = {
            id: `activity_${Date.now()}`,
            ...activity,
            timestamp: new Date().toISOString(),
        };

        // We don't have an API for activities yet
        const updatedActivities = [...(project.activities || []), newActivity];

        // Just update local state
        setProjects(prev => prev.map(p => p.id === projectId ? { ...p, activities: updatedActivities } : p));
        if (currentProject?.id === projectId) {
            setCurrentProject(prev => ({ ...prev, activities: updatedActivities }));
        }
    };

    const setActiveProject = (projectId) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setCurrentProject(project);
            localStorage.setItem('currentProjectId', projectId);

            // Join socket room
            socketService.connect();
            socketService.joinProject(projectId);

            // Load full details
            loadProjectDetails(projectId);
        }
    };

    const inviteExpert = async (projectId, expertId) => {
        if (!projectId || !expertId) {
            console.error('Missing projectId or expertId for invitation:', { projectId, expertId });
            throw new Error('Project ID and Expert ID are required to send an invitation.');
        }

        try {
            const updated = await api.projects.invite(projectId, expertId);
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updated } : p));
            if (currentProject?.id === projectId) {
                setCurrentProject(prev => prev ? { ...prev, ...updated } : updated);
            }
            return updated;
        } catch (error) {
            console.error('Error inviting expert (ProjectContext):', error);
            throw error;
        }
    };

    const respondToInvite = async (projectId, status) => {
        try {
            const updated = await api.projects.respond(projectId, status);
            setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updated } : p));
            // If accepted and we are the expert, we might want to trigger a reload or redirect
            return updated;
        } catch (error) {
            console.error('Error responding to invite:', error);
            throw error;
        }
    };

    const value = {
        currentProject,
        projects,
        loading,
        createProject,
        updateProject,
        deleteProject,
        clearCurrentProject,
        addProjectFile,
        removeProjectFile,
        addMessage,
        addTask,
        updateTask,
        addActivity,
        setActiveProject,
        inviteExpert,
        respondToInvite
    };

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};
