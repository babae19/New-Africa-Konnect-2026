const cron = require('node-cron');
const { query } = require('../database/db');
const { transitionState, STATES } = require('../models/projectStateMachine');
const { sendNotification } = require('./notificationService');

/**
 * Initialize all scheduled jobs
 */
const initScheduledJobs = () => {
    console.log('Initializing scheduled jobs...');

    // Check for expired invites every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Running job: expireInvites');
        await expireInvites();
    });
};

/**
 * Expire invites that have passed their expiration date
 */
const expireInvites = async () => {
    try {
        // Find projects in draft/submitted/review that have expired invite_expires_at
        const text = `
            SELECT id, client_id, title 
            FROM projects 
            WHERE invite_expires_at < NOW()
            AND state IN ('submitted', 'expert_review')
        `;

        const result = await query(text);

        for (const project of result.rows) {
            try {
                // Transition to cancelled or specific expired state
                // For now, let's use CANCELLED with reason 'expired'
                // Or if we had an 'expired' state. 
                // Let's assume we want to cancel the invite, so maybe move back to draft?
                // Or actually move to 'rejected' ? 
                // Let's set to cancelled for clarity

                await transitionState(
                    project.id,
                    STATES.CANCELLED,
                    null, // System triggered
                    'Invitation expired automatically'
                );

                // Notify client
                await sendNotification(
                    project.client_id,
                    'project_rejected',
                    {
                        projectTitle: project.title,
                        reason: 'Invitation expired'
                    }
                );

                console.log(`Expired project invite: ${project.id}`);
            } catch (err) {
                console.error(`Failed to expire project ${project.id}:`, err);
            }
        }
    } catch (error) {
        console.error('Error in expireInvites job:', error);
    }
};

module.exports = {
    initScheduledJobs
};
