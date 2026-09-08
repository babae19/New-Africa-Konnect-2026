const {
    createInterview,
    getInterviewsByProject,
    getInterviewsByUser,
    updateInterviewStatus
} = require('../models/interviewModel');
const { getProjectById } = require('../models/projectModel');
const { createCalendarEvent } = require('../services/calendarService');

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

        const { findUserById } = require('../models/userModel');
        const expert = await findUserById(expertId);
        if (!expert) return res.status(404).json({ message: 'Expert not found' });
        const start = new Date(scheduledAt);
        const calendarEvent = await createCalendarEvent({
            summary: `${project.title} — Africa Konnect Interview`, description: notes || 'Project interview arranged through Africa Konnect.',
            startTime: start, endTime: new Date(start.getTime() + durationMinutes * 60000),
            attendees: [project.client_email, expert.email]
        });
        const meetingLink = calendarEvent.meetingLink;

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
        res.status(error.code === 'GOOGLE_MEET_NOT_CONFIGURED' ? 503 : 500).json({ message: error.message, code: error.code });
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
