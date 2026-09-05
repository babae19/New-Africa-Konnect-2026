const { query } = require('../database/db');
const notificationPreferenceModel = require('../models/notificationPreferenceModel');
const { createCalendarEvent } = require('./calendarService'); // Using this for sending invites if needed? No, separate.

/**
 * Service to match new projects with experts based on skills and preferences
 */

const findMatchingExperts = async (project) => {
    console.log(`[MatchingService] Finding experts for project: ${project.title}`);

    // 1. Find experts with matching skills
    // We look for experts who have at least one of the required skills
    // AND have project_matching enabled in preferences

    // Note: This query assumes expert_profiles table exists and has skills. 
    // If skills are in users table or elsewhere, adjust accordingly.
    // Based on previous fetching of experts, skills might be in expert_profiles.skills (text[]) or similar.

    const text = `
        SELECT 
            u.id, 
            u.email, 
            u.first_name, 
            u.last_name,
            ep.skills as expert_skills,
            ep.hourly_rate,
            np.project_matching,
            np.match_threshold,
            np.preferred_skills,
            np.notification_frequency
        FROM users u
        JOIN expert_profiles ep ON u.id = ep.user_id
        JOIN notification_preferences np ON u.id = np.user_id
        WHERE 
            np.project_matching = true
            AND (
                -- Check if expert has any of the project required skills
                ep.skills && $1::text[] 
                OR 
                -- Or if expert explicitly listed these skills in preferences
                np.preferred_skills && $1::text[]
            )
            AND (
                -- Budget check (if set in preferences)
                (np.budget_min IS NULL OR $2 >= np.budget_min)
                AND
                (np.budget_max IS NULL OR $2 <= np.budget_max)
            )
    `;

    // $1 = project.required_skills (array), $2 = project.budget_max (or min/avg)
    // Assuming project.budget_min and budget_max exists. usage: logic depends on specific pricing model (fixed/hourly)
    // For simplicity, we'll pass project skills and a representative budget value

    const skills = project.required_skills || [];
    const budget = project.budget_max || 0; // Simplified

    const result = await query(text, [skills, budget]);
    const candidates = result.rows;

    console.log(`[MatchingService] Found ${candidates.length} potential candidates`);

    const matches = [];

    for (const candidate of candidates) {
        const score = calculateMatchScore(candidate, project);
        const threshold = candidate.match_threshold || 0.70;

        if (score >= threshold) {
            matches.push({
                expert: candidate,
                score,
                project
            });
        }
    }

    return matches;
};

const calculateMatchScore = (expert, project) => {
    let score = 0;
    const expertSkills = expert.expert_skills || [];
    const projectSkills = project.required_skills || [];

    // 1. Skill Match (60% weight)
    if (projectSkills.length > 0) {
        const matchingSkills = projectSkills.filter(skill => expertSkills.includes(skill));
        const skillMatchRatio = matchingSkills.length / projectSkills.length;
        score += skillMatchRatio * 0.6;
    }

    // 2. Budget Alignment (20% weight)
    // Simplified logic: valid if expert rate is within project budget
    // Here getting deeper logic requires converting hourly to fixed etc. 
    // We'll assume if they passed the SQL filter, it's a "good" match, adding points.
    score += 0.2;

    // 3. Experience/Rating (20% weight)
    // Could fetch rating from another join, for now assume baseline
    score += 0.2;

    return Math.min(score, 1.0); // Cap at 100%
};

const processProjectMatches = async (project, io) => {
    try {
        const matches = await findMatchingExperts(project);

        for (const match of matches) {
            await queueNotification(match, io);
        }

        return matches.length;
    } catch (error) {
        console.error('Error processing project matches:', error);
        return 0;
    }
};

const queueNotification = async (match, io) => {
    const { expert, project, score } = match;

    console.log(`[MatchingService] Queuing notification for ${expert.email} (Match: ${Math.round(score * 100)}%)`);

    const text = `
        INSERT INTO notification_queue (
            user_id, notification_type, data, scheduled_for
        )
        VALUES ($1, 'project_match', $2, CURRENT_TIMESTAMP)
        RETURNING id, created_at
    `;

    const data = {
        projectId: project.id,
        projectTitle: project.title,
        matchScore: score,
        skills: project.required_skills,
        actionUrl: `/projects/${project.id}`
    };

    const result = await query(text, [expert.id, JSON.stringify(data)]);
    const notificationId = result.rows[0].id;

    // Real-time notification via Socket.IO
    if (io) {
        const socketData = {
            id: notificationId,
            type: 'project_match',
            title: 'New Project Match!',
            message: `Project "${project.title}" matches your skills (${Math.round(score * 100)}% match)`,
            data: data,
            created_at: result.rows[0].created_at,
            is_read: false,
            link: data.actionUrl
        };

        // Emit to specific user room (assuming room name is user.id)
        io.to(expert.id).emit('notification', socketData);
        // Also emit specific event if frontend listens for it
        io.to(expert.id).emit('project_match', socketData);

        console.log(`[MatchingService] Emitted socket notification to user ${expert.id}`);
    }
};

module.exports = {
    processProjectMatches,
    findMatchingExperts
};
