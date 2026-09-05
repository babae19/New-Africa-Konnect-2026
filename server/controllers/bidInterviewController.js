const { createBidInterview, getBidInterviewsByProject, updateBidInterview } = require('../models/interviewModel');
const { getBidById } = require('../models/bidModel');
const { getProjectById } = require('../models/projectModel');
const { NOTIFICATION_TYPES, emitNotification } = require('../utils/biddingNotifications');
const { getIO } = require('../socket');

// Schedule interview for a bid
const scheduleInterview = async (req, res) => {
    try {
        const { projectId, bidId } = req.params;
        let { scheduledTime, duration, meetingLink, meetingPlatform, clientNotes } = req.body;

        const { v4: uuidv4 } = require('uuid');
        if (!meetingLink) {
            const meetingRoom = uuidv4();
            meetingLink = `https://africakonnect.com/africakonnect-${meetingRoom}`;
            if (!meetingPlatform) meetingPlatform = 'Jitsi';
        }

        // Verify project ownership
        const project = await getProjectById(projectId);
        if (project.client_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to schedule interviews for this project' });
        }

        // Verify bid exists
        const bid = await getBidById(bidId);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Create interview
        const interview = await createBidInterview({
            projectId,
            expertId: bid.expert_id,
            bidId,
            scheduledTime,
            duration: duration || 30,
            meetingLink,
            meetingPlatform,
            clientNotes
        });

        // Send notification to expert
        const io = getIO();
        if (io) {
            emitNotification(io, bid.expert_id, NOTIFICATION_TYPES.INTERVIEW_SCHEDULED, {
                projectTitle: project.title,
                scheduledTime: new Date(scheduledTime).toLocaleString(),
                interviewId: interview.id
            });
        }

        res.status(201).json({ interview, message: 'Interview scheduled successfully' });
    } catch (error) {
        console.error('Schedule interview error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get interviews for a project
const getProjectInterviews = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify project access
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.client_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view interviews for this project' });
        }

        const interviews = await getBidInterviewsByProject(projectId);

        res.json({ interviews, count: interviews.length });
    } catch (error) {
        console.error('Get interviews error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update interview
const updateInterview = async (req, res) => {
    try {
        const { interviewId } = req.params;
        const { scheduledTime, duration, meetingLink, status, outcome } = req.body;

        // TODO: Add authorization check

        const updatedInterview = await updateBidInterview(interviewId, {
            scheduledTime,
            duration,
            meetingLink,
            status,
            outcome
        });

        // Send notification if rescheduled
        if (scheduledTime) {
            const io = getIO();
            if (io) {
                // TODO: Get project and expert details
                // emitNotification(io, expertId, NOTIFICATION_TYPES.INTERVIEW_RESCHEDULED, {...});
            }
        }

        res.json({ interview: updatedInterview, message: 'Interview updated successfully' });
    } catch (error) {
        console.error('Update interview error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    scheduleInterview,
    getProjectInterviews,
    updateInterview
};
