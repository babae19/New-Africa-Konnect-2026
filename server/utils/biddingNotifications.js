// Notification types for bidding system
const NOTIFICATION_TYPES = {
    // Bidding notifications
    NEW_BID: 'new_bid',
    BID_ACCEPTED: 'bid_accepted',
    BID_REJECTED: 'bid_rejected',
    BID_WITHDRAWN: 'bid_withdrawn',

    // Interview notifications
    INTERVIEW_SCHEDULED: 'interview_scheduled',
    INTERVIEW_RESCHEDULED: 'interview_rescheduled',
    INTERVIEW_CANCELLED: 'interview_cancelled',
    INTERVIEW_REMINDER: 'interview_reminder',

    // Project notifications
    PROJECT_OPENED_FOR_BIDDING: 'project_opened_for_bidding',
    BIDDING_DEADLINE_APPROACHING: 'bidding_deadline_approaching',
    PROJECT_ASSIGNED: 'project_assigned'
};

// Notification helper functions
const createNotificationPayload = (type, data) => {
    const templates = {
        [NOTIFICATION_TYPES.NEW_BID]: {
            title: 'New Bid Received',
            message: `${data.expertName} submitted a bid of $${data.bidAmount} on your project "${data.projectTitle}"`,
            icon: 'dollar-sign',
            color: 'green',
            link: `/project-hub?project=${data.projectId}&tab=bids`
        },
        [NOTIFICATION_TYPES.BID_ACCEPTED]: {
            title: 'Bid Accepted! 🎉',
            message: `Your bid on "${data.projectTitle}" has been accepted! The client will contact you soon.`,
            icon: 'check-circle',
            color: 'green',
            link: `/my-bids?highlight=${data.bidId}`
        },
        [NOTIFICATION_TYPES.BID_REJECTED]: {
            title: 'Bid Not Selected',
            message: `Your bid on "${data.projectTitle}" was not selected. Keep bidding on other projects!`,
            icon: 'x-circle',
            color: 'red',
            link: `/marketplace`
        },
        [NOTIFICATION_TYPES.BID_WITHDRAWN]: {
            title: 'Bid Withdrawn',
            message: `${data.expertName} withdrew their bid on "${data.projectTitle}"`,
            icon: 'alert-circle',
            color: 'orange',
            link: `/project-hub?project=${data.projectId}&tab=bids`
        },
        [NOTIFICATION_TYPES.INTERVIEW_SCHEDULED]: {
            title: 'Interview Scheduled',
            message: `Interview scheduled for ${data.scheduledTime} regarding "${data.projectTitle}"`,
            icon: 'calendar',
            color: 'blue',
            link: `/interviews/${data.interviewId}`
        },
        [NOTIFICATION_TYPES.INTERVIEW_RESCHEDULED]: {
            title: 'Interview Rescheduled',
            message: `Interview for "${data.projectTitle}" has been rescheduled to ${data.scheduledTime}`,
            icon: 'calendar',
            color: 'orange',
            link: `/interviews/${data.interviewId}`
        },
        [NOTIFICATION_TYPES.INTERVIEW_CANCELLED]: {
            title: 'Interview Cancelled',
            message: `Interview for "${data.projectTitle}" has been cancelled`,
            icon: 'x-circle',
            color: 'red',
            link: `/my-bids`
        },
        [NOTIFICATION_TYPES.INTERVIEW_REMINDER]: {
            title: 'Interview Reminder',
            message: `Your interview for "${data.projectTitle}" starts in ${data.timeUntil}`,
            icon: 'bell',
            color: 'blue',
            link: `/interviews/${data.interviewId}`
        },
        [NOTIFICATION_TYPES.PROJECT_OPENED_FOR_BIDDING]: {
            title: 'New Project Available',
            message: `A new project matching your skills is open for bidding: "${data.projectTitle}"`,
            icon: 'briefcase',
            color: 'purple',
            link: `/marketplace/projects/${data.projectId}`
        },
        [NOTIFICATION_TYPES.BIDDING_DEADLINE_APPROACHING]: {
            title: 'Bidding Deadline Soon',
            message: `Bidding for "${data.projectTitle}" closes in ${data.timeRemaining}`,
            icon: 'clock',
            color: 'orange',
            link: `/marketplace/projects/${data.projectId}`
        },
        [NOTIFICATION_TYPES.PROJECT_ASSIGNED]: {
            title: 'Project Assigned',
            message: `You've been assigned to "${data.projectTitle}". Start collaborating now!`,
            icon: 'check-circle',
            color: 'green',
            link: `/collaboration/${data.projectId}`
        }
    };

    return templates[type] || {
        title: 'Notification',
        message: data.message || 'You have a new notification',
        icon: 'bell',
        color: 'blue',
        link: '/'
    };
};

// Emit notification via Socket.IO
const emitNotification = (io, userId, type, data) => {
    const notification = createNotificationPayload(type, data);

    // Emit to specific user
    io.to(`user_${userId}`).emit('notification', {
        type,
        ...notification,
        timestamp: new Date().toISOString(),
        read: false
    });
};

// Emit to multiple users
const emitToMultipleUsers = (io, userIds, type, data) => {
    userIds.forEach(userId => {
        emitNotification(io, userId, type, data);
    });
};

module.exports = {
    NOTIFICATION_TYPES,
    createNotificationPayload,
    emitNotification,
    emitToMultipleUsers
};
