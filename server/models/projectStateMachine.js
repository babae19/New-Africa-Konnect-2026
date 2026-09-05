const { query } = require('../database/db');

// valid states
const STATES = {
    DRAFT: 'draft',
    SUBMITTED: 'submitted',
    EXPERT_REVIEW: 'expert_review',
    ACCEPTED: 'accepted',
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REJECTED: 'rejected'
};

// valid transitions
const TRANSITIONS = {
    [STATES.DRAFT]: [STATES.SUBMITTED, STATES.CANCELLED],
    [STATES.SUBMITTED]: [STATES.EXPERT_REVIEW, STATES.CANCELLED],
    [STATES.EXPERT_REVIEW]: [STATES.ACCEPTED, STATES.REJECTED, STATES.CANCELLED],
    [STATES.ACCEPTED]: [STATES.ACTIVE, STATES.CANCELLED],
    [STATES.ACTIVE]: [STATES.COMPLETED, STATES.CANCELLED],
    [STATES.COMPLETED]: [], // Terminal state
    [STATES.CANCELLED]: [], // Terminal state
    [STATES.REJECTED]: [STATES.DRAFT] // Can go back to draft to edit and resubmit
};

/**
 * Validate if a state transition is allowed
 */
const canTransition = (fromState, toState) => {
    const allowed = TRANSITIONS[fromState] || [];
    return allowed.includes(toState);
};

/**
 * Transition a project to a new state and log the transition
 */
const transitionState = async (projectId, toState, userId, reason = null, metadata = {}) => {
    try {
        // Get current state
        const currentRes = await query('SELECT state FROM projects WHERE id = $1', [projectId]);
        if (currentRes.rows.length === 0) {
            throw new Error('Project not found');
        }
        const fromState = currentRes.rows[0].state;

        // Validate transition
        if (fromState !== toState && !canTransition(fromState, toState)) {
            // Allow 'force' transition for admins if needed, but for now strict
            throw new Error(`Invalid state transition from ${fromState} to ${toState}`);
        }

        // If no change, return
        if (fromState === toState) {
            return { state: toState, message: 'State unchanged' };
        }

        // Begin transaction
        await query('BEGIN');

        // Update project state
        const updateText = `
            UPDATE projects 
            SET state = $2, 
                rejection_reason = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
        `;
        const projectResult = await query(updateText, [
            projectId,
            toState,
            toState === STATES.REJECTED ? reason : null
        ]);

        // Log transition
        const logText = `
            INSERT INTO project_state_transitions 
            (project_id, from_state, to_state, triggered_by, reason, metadata)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
        await query(logText, [
            projectId,
            fromState,
            toState,
            userId,
            reason,
            JSON.stringify(metadata)
        ]);

        await query('COMMIT');

        return projectResult.rows[0];
    } catch (error) {
        await query('ROLLBACK');
        throw error;
    }
};

/**
 * Get state history for a project
 */
const getStateHistory = async (projectId) => {
    const text = `
        SELECT t.*, u.name as triggered_by_name
        FROM project_state_transitions t
        LEFT JOIN users u ON t.triggered_by = u.id
        WHERE t.project_id = $1
        ORDER BY t.created_at DESC
    `;
    const result = await query(text, [projectId]);
    return result.rows;
};

module.exports = {
    STATES,
    transitionState,
    canTransition,
    getStateHistory
};
