const {
    createTask,
    getTasksByProject,
    updateTask,
    deleteTask
} = require('../models/taskModel');

const {
    createMilestone,
    updateMilestone,
    getProjectMilestones,
    deleteMilestone
} = require('../models/milestoneModel');

const {
    createFileVersion,
    getFileVersions
} = require('../models/fileVersionModel');

const {
    logActivity,
    getProjectActivity
} = require('../models/activityFeedModel');

const { getProjectById } = require('../models/projectModel');

// --- TASKS ---

exports.createTask = async (req, res) => {
    try {
        const { projectId } = req.params;
        const taskData = {
            ...req.body,
            projectId,
            createdBy: req.user.id
        };

        const task = await createTask(taskData);

        // Log activity
        await logActivity(projectId, req.user.id, 'task_created', { taskTitle: task.title });

        // Notify via Socket
        const io = req.app.get('io');
        if (io) {
            const payload = { ...task, projectId, project_id: projectId };
            io.to(`project_${projectId}`).emit('task_created', payload);
        }

        res.status(201).json(task);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getTasks = async (req, res) => {
    try {
        const { projectId } = req.params;
        const tasks = await getTasksByProject(projectId);
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await updateTask(id, req.body);

        // Log activity if status changed
        if (req.body.status) {
            // Need project ID to log activity. Task returns it?
            // Assuming task contains project_id
            await logActivity(task.project_id, req.user.id, 'task_updated', {
                taskTitle: task.title,
                status: req.body.status
            });
        }

        const io = req.app.get('io');
        if (io) {
            const payload = { ...task, projectId: task.project_id };
            io.to(`project_${task.project_id}`).emit('task_updated', payload);
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const task = await deleteTask(id);

        const io = req.app.get('io');
        if (io) {
            io.to(`project_${task.project_id}`).emit('task_deleted', { id });
        }

        res.json({ message: 'Task deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- MILESTONES ---

exports.createMilestone = async (req, res) => {
    try {
        const { projectId } = req.params;
        const milestone = await createMilestone({ ...req.body, projectId });

        await logActivity(projectId, req.user.id, 'milestone_created', { title: milestone.title });

        const io = req.app.get('io');
        if (io) {
            io.to(`project_${projectId}`).emit('milestone_created', milestone);
        }

        res.status(201).json(milestone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMilestones = async (req, res) => {
    try {
        const { projectId } = req.params;
        const milestones = await getProjectMilestones(projectId);
        res.json(milestones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateMilestone = async (req, res) => {
    try {
        const { id } = req.params;
        const milestone = await updateMilestone(id, req.body);

        const io = req.app.get('io');
        if (io) {
            const payload = { ...milestone, projectId: milestone.project_id };
            io.to(`project_${milestone.project_id}`).emit('milestone_updated', payload);
        }

        res.json(milestone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- FILE VERSIONS ---

exports.addFileVersion = async (req, res) => {
    try {
        const { fileId } = req.params;
        const version = await createFileVersion({
            fileId,
            ...req.body,
            uploadedBy: req.user.id
        });

        const io = req.app.get('io');
        if (io) {
            // We need project_id for files too. Usually file has it.
            // Let's assume createFileVersion returns the version which might not have project_id directly.
            // But 'file_uploaded' hook in useCollaboration expects project_id.
            // Let's look up project_id if not present.
            io.to(`project_${version.project_id}`).emit('file_version_added', version);
        }

        res.status(201).json(version);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getVersions = async (req, res) => {
    try {
        const { fileId } = req.params;
        const versions = await getFileVersions(fileId);
        res.json(versions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- ACTIVITY FEED ---

exports.getActivity = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { limit, offset } = req.query;
        const activity = await getProjectActivity(projectId, limit, offset);
        res.json(activity);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
