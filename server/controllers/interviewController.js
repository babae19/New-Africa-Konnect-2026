const {
    createInterview,
    getInterviewsByProject,
    getInterviewsByUser,
    updateInterviewStatus
} = require('../models/interviewModel');
const { getProjectById } = require('../models/projectModel');
const { v4: uuidv4 } = require('uuid');

// Schedule an interview
exports.scheduleInterview = async (req, res) => {
    try {
        const { projectId, expertId, scheduledAt, durationMinutes = 30, notes } = req.body;
        const clientId = req.user.id;

        if (!projectId || !expertId || !scheduledAt) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        /* 
         * Verify user authority: 
         * Only project owner (client) can schedule an interview for now,
         * or maybe allow expert to propose, but let's stick to client scheduling.
         */
        if (project.client_id !== clientId) {
            return res.status(403).json({ message: 'Not authorized to schedule for this project' });
        }

        // Use provided meeting link (from client/frontend logic) or generate one
        let meetingLink = req.body.meetingLink;

        if (!meetingLink) {
            const meetingRoom = uuidv4();
            meetingLink = `https://africakonnect.com/africakonnect-${meetingRoom}`;
        }

        const interview = await createInterview({
            projectId,
            clientId,
            expertId,
            scheduledAt,
            durationMinutes,
            meetingLink,
            notes
        });

        // Notify expert
        const { sendNotification } = require('../services/notificationService');
        await sendNotification(
            expertId,
            'interview_scheduled',
            {
                projectTitle: project.title,
                scheduledAt: scheduledAt,
                meetingLink: meetingLink,
                actionUrl: `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard`
            },
            req.app.get('io')
        );

        // Emit real-time event
        const io = req.app.get('io');
        if (io) {
            io.to(`project_${projectId}`).emit('interview_scheduled', interview);
        }

        res.status(201).json(interview);
    } catch (error) {
        console.error('Schedule error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get interviews for a project
exports.getProjectInterviews = async (req, res) => {
    try {
        const { projectId } = req.params;
        // Check access...
        /* For brevity assuming authorized if viewing project */
        const interviews = await getInterviewsByProject(projectId);
        res.json({ interviews });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get my interviews
exports.getMyInterviews = async (req, res) => {
    try {
        const interviews = await getInterviewsByUser(req.user.id, req.user.role);
        res.json({ interviews });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const interview = await updateInterviewStatus(id, status);
        res.json(interview);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
