const {
    createProject,
    getProjectById,
    getProjectsByClient,
    getAllProjects,
    updateProject,
    deleteProject
} = require('../models/projectModel');
const projectMatchingService = require('../services/projectMatchingService');

// Create new project
exports.createProject = async (req, res) => {
    try {
        const { title, description, budget, status, techStack, min_budget, max_budget, duration, open_for_bidding, bidding_deadline } = req.body;
        const clientId = req.user.id;

        // Validate client role
        if (req.user.role !== 'client') {
            return res.status(403).json({ message: 'Only clients can create projects' });
        }

        // Validate required fields
        if (!title) {
            return res.status(400).json({ message: 'Project title is required' });
        }

        const project = await createProject({
            clientId,
            title,
            description,
            budget,
            status: status || 'draft',
            techStack,
            min_budget,
            max_budget,
            open_for_bidding,
            bidding_deadline,
            duration: duration || req.body.duration
        });

        // Trigger background matching job
        if (project.status === 'open' || project.status === 'published') {
            const io = req.app.get('io');
            projectMatchingService.processProjectMatches(project, io).catch(err =>
                console.error('Background matching error:', err)
            );
        }

        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get project by ID
exports.getProject = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await getProjectById(id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check authorization
        const isPublicMarketplaceProject = project.open_for_bidding === true && project.status === 'open';
        if (project.client_id !== req.user.id && req.user.role !== 'admin' && !isPublicMarketplaceProject) {
            // Check if user is an expert on this project
            const { getContractsByProject } = require('../models/contractModel');
            const contracts = await getContractsByProject(id);
            const isExpert = contracts.some(c => c.expert_id === req.user.id);
            const isInvited = project.selected_expert_id === req.user.id && project.expert_status === 'accepted';

            if (!isExpert && !isInvited) {
                // Check if project member
                const { isMember } = require('../models/projectModel');
                const isProjectMember = await isMember(id, req.user.id);

                if (!isProjectMember) {
                    return res.status(403).json({ message: 'Not authorized to view this project' });
                }
            }
        }

        res.json(project);
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get client's projects
exports.getClientProjects = async (req, res) => {
    try {
        const clientId = req.params.clientId || req.user.id;

        // Ensure user can only view their own projects unless admin
        if (req.user.id !== clientId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const projects = await getProjectsByClient(clientId);

        res.json({
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Get client projects error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all projects (with filters)
exports.getAllProjects = async (req, res) => {
    try {
        const { status, minBudget, maxBudget, search, limit, offset } = req.query;

        const filters = {
            status,
            minBudget: minBudget ? parseFloat(minBudget) : undefined,
            maxBudget: maxBudget ? parseFloat(maxBudget) : undefined,
            search,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        };

        const projects = await getAllProjects(filters);

        res.json({
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Get all projects error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update project
exports.updateProject = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, budget, status, techStack, min_budget, max_budget, open_for_bidding, bidding_deadline, duration, visibility, required_skills } = req.body;

        // Get project to check ownership
        const project = await getProjectById(id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check authorization
        if (project.client_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this project' });
        }

        const updatedProject = await updateProject(id, {
            title,
            description,
            budget,
            status,
            techStack: techStack || required_skills,
            min_budget,
            max_budget,
            open_for_bidding,
            bidding_deadline,
            duration,
            visibility
        });

        // Emit real-time update via socket
        const io = req.app.get('io');
        if (io) {
            io.to(`project_${id}`).emit('project_update', updatedProject);
            io.to('marketplace').emit(updatedProject.open_for_bidding && updatedProject.status === 'open' ? 'marketplace_project_upserted' : 'marketplace_project_removed', updatedProject);
        }

        res.json(updatedProject);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete project
exports.deleteProject = async (req, res) => {
    try {
        const { id } = req.params;

        // Get project to check ownership
        const project = await getProjectById(id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check authorization
        if (project.client_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this project' });
        }

        const hasExpert = Boolean(project.selected_expert_id && project.expert_status === 'accepted');
        if (hasExpert) {
            if (!['completed', 'finalized'].includes(project.status) && !project.finalized_at && !project.delivery_accepted_at) {
                return res.status(409).json({ message: 'Accept the final delivery before requesting project deletion.' });
            }
            if (!project.deletion_requested_at || !project.deletion_consented_at || project.deletion_consented_by !== project.selected_expert_id) {
                return res.status(409).json({ message: 'The assigned expert must consent before this completed project can be deleted.' });
            }
        }

        await deleteProject(id);

        const io = req.app.get('io');
        if (io) io.to(`project_${id}`).emit('project_deleted', { id });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateCompletion = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        const project = await getProjectById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const isClient = project.client_id === req.user.id;
        const isExpert = project.selected_expert_id === req.user.id && project.expert_status === 'accepted';
        if (action === 'accept_delivery' && !isClient) return res.status(403).json({ message: 'Only the client can accept final delivery.' });
        if (action === 'request_deletion' && !isClient) return res.status(403).json({ message: 'Only the client can request deletion.' });
        if (action === 'consent_deletion' && !isExpert) return res.status(403).json({ message: 'Only the assigned expert can consent to deletion.' });
        if (!['accept_delivery', 'request_deletion', 'consent_deletion'].includes(action)) return res.status(400).json({ message: 'Invalid action.' });

        if (action === 'request_deletion' && !project.delivery_accepted_at && !project.finalized_at && project.status !== 'completed') {
            return res.status(409).json({ message: 'Final delivery must be accepted before requesting deletion.' });
        }
        if (action === 'consent_deletion' && !project.deletion_requested_at) {
            return res.status(409).json({ message: 'The client has not requested deletion.' });
        }

        const { updateCompletionWorkflow } = require('../models/projectModel');
        const updated = await updateCompletionWorkflow(id, action, req.user.id);
        const io = req.app.get('io');
        if (io) {
            io.to(`project_${id}`).emit('project_update', updated);
            io.to(`user_${project.client_id}`).emit('project_update', updated);
            if (project.selected_expert_id) io.to(`user_${project.selected_expert_id}`).emit('project_update', updated);
        }
        res.json(updated);
    } catch (error) {
        console.error('Completion workflow error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Invite expert to project
exports.inviteExpert = async (req, res) => {
    try {
        const { id } = req.params;
        const { expertId } = req.body;

        const project = await getProjectById(id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Check authorization
        if (project.client_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to invite experts to this project' });
        }

        // Create Notification for Expert
        const { sendNotification } = require('../services/notificationService');
        await sendNotification(
            expertId,
            'project_invite',
            {
                projectTitle: project.title,
                actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/project-hub`
            },
            req.app.get('io')
        );

        // Assign expert in DB
        const { assignExpert } = require('../models/projectModel');
        const updatedProject = await assignExpert(id, expertId);

        // Notify expert via Socket.IO (handled by service for notification, but project_invite event is specific)
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${expertId}`).emit('project_invite', updatedProject);
            io.to(`project_${id}`).emit('project_update', updatedProject);
        }

        res.json(updatedProject);
    } catch (error) {
        console.error('Invite expert error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Respond to project invite
exports.respondToInvite = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'accepted' or 'rejected'

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const project = await getProjectById(id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Verify it's the invited expert
        if (project.selected_expert_id !== req.user.id) {
            return res.status(403).json({ message: 'You are not the invited expert for this project' });
        }

        if (project.expert_status !== 'pending') {
            return res.status(409).json({ message: 'This project invitation has already been answered' });
        }

        const { updateExpertStatus, addMember } = require('../models/projectModel');
        const updatedProject = await updateExpertStatus(id, status);

        // Acceptance is the point at which an invited expert becomes a
        // collaboration participant. Pending/rejected invitations never grant
        // workspace access.
        if (status === 'accepted') {
            await addMember(id, req.user.id, 'expert');
        }

        // Create notification for Client
        const { sendNotification } = require('../services/notificationService');
        await sendNotification(
            project.client_id,
            status === 'accepted' ? 'project_accepted' : 'project_rejected',
            {
                projectTitle: project.title,
                senderName: req.user.name,
                actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/projects/${id}`
            },
            req.app.get('io')
        );

        if (status === 'accepted') {
            // Auto-create contract placeholder
            const { createContract } = require('../models/contractModel');
            await createContract({
                projectId: id,
                expertId: req.user.id,
                clientId: project.client_id,
                terms: 'Standard Agreement', // Placeholder
                amount: project.budget || 0,
                status: 'pending'
            });
        }

        const io = req.app.get('io');
        if (io) {
            io.to(`project_${id}`).emit('project_update', updatedProject);
            io.to(`user_${project.client_id}`).emit('project_update', updatedProject);
        }

        res.json(updatedProject);
    } catch (error) {
        console.error('Respond to invite error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get projects expert is invited to
exports.getInvitedProjects = async (req, res) => {
    try {
        const { getProjectsByExpert } = require('../models/projectModel');
        const projects = await getProjectsByExpert(req.user.id);
        res.json({ projects });
    } catch (error) {
        console.error('Get invited projects error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Transition project state
exports.updateState = async (req, res) => {
    try {
        const { id } = req.params;
        const { state, reason } = req.body;
        const userId = req.user.id;

        const { transitionState } = require('../models/projectStateMachine');

        // Add authorization check here if needed (e.g. only admin or owner can change certain states)

        const project = await transitionState(id, state, userId, reason);

        // Notify relevant parties based on new state

        res.json(project);
    } catch (error) {
        console.error('Update state error:', error);
        res.status(400).json({ message: error.message });
    }
};

// Get project state history
exports.getHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const { getStateHistory } = require('../models/projectStateMachine');

        const history = await getStateHistory(id);
        res.json(history);
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add member to project
exports.addProjectMember = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, role } = req.body;

        const project = await getProjectById(id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Check if requester is authorized (client or existing admin/member)
        if (project.client_id !== req.user.id) {
            // TODO: Allow admins/members with permission
            return res.status(403).json({ message: 'Only project owner can add members' });
        }

        // Find user by email
        const { findUserByEmail } = require('../models/userModel');
        const userToAdd = await findUserByEmail(email);

        if (!userToAdd) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { addMember } = require('../models/projectModel');
        const newMember = await addMember(id, userToAdd.id, role || 'member');

        // Notify user
        const { sendNotification } = require('../services/notificationService');
        await sendNotification(
            userToAdd.id,
            'project_invite',
            {
                projectTitle: project.title,
                actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/collaboration?projectId=${id}`
            },
            req.app.get('io')
        );

        res.status(201).json(newMember);
    } catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get project members
exports.getMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { getProjectMembers } = require('../models/projectModel');
        const members = await getProjectMembers(id);
        res.json(members);
    } catch (error) {
        console.error('Get members error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get or create inquiry (direct message project)
exports.getOrCreateInquiry = async (req, res) => {
    try {
        const { expertId } = req.body;
        const clientId = req.user.id;

        if (req.user.role !== 'client') {
            return res.status(403).json({ message: 'Only clients can initiate inquiries' });
        }

        const { findUserById } = require('../models/userModel');
        const { findExistingInquiry, createProject, assignExpert, addMember } = require('../models/projectModel');

        // 1. Check for existing inquiry
        let project = await findExistingInquiry(clientId, expertId);

        if (project) {
            return res.json(project);
        }

        // 2. Create new inquiry project
        const expert = await findUserById(expertId);
        if (!expert) {
            return res.status(404).json({ message: 'Expert not found' });
        }

        project = await createProject({
            clientId,
            title: `Inquiry: ${expert.name}`,
            description: `Direct conversation between ${req.user.name} and ${expert.name}.`,
            status: 'draft'
        });

        // 3. Assign expert and add as member
        await assignExpert(project.id, expertId);
        await addMember(project.id, expertId, 'expert');
        await addMember(project.id, clientId, 'client');

        res.status(201).json(project);
    } catch (error) {
        console.error('Inquiry creation error:', error);
        res.status(500).json({ message: error.message });
    }
};
