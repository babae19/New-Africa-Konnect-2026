const { query } = require('../database/db');

/**
 * Require user to be a participant (client or expert) on the project
 */
const requireProjectParticipant = async (req, res, next) => {
    try {
        let projectId = req.params.projectId || req.body.projectId;
        const resourceId = req.params.id || req.params.fileId;

        // If no direct projectId, try to look it up from sub-resources
        if (!projectId && resourceId) {
            // Check if it's a task, milestone or file
            const lookupQueries = [
                { table: 'project_tasks', id: resourceId },
                { table: 'project_milestones', id: resourceId },
                { table: 'files', id: resourceId }
            ];

            for (const lookup of lookupQueries) {
                const checkRes = await query(`SELECT project_id FROM ${lookup.table} WHERE id = $1`, [lookup.id]);
                if (checkRes.rows.length > 0) {
                    projectId = checkRes.rows[0].project_id;
                    break;
                }
            }
        }

        if (!projectId) {
            return res.status(400).json({ message: 'Project context required for this action' });
        }

        const text = `
            SELECT client_id, selected_expert_id 
            FROM projects 
            WHERE id = $1
        `;
        const result = await query(text, [projectId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const project = result.rows[0];

        const isClient = project.client_id === req.user.id;
        const isExpert = project.selected_expert_id === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isClient && !isExpert && !isAdmin) {
            return res.status(403).json({
                message: 'Access denied. You are not a participant in this project.'
            });
        }

        req.projectParticipant = { isClient, isExpert };
        next();
    } catch (error) {
        console.error('Participant middleware error debug:', error);
        if (error.code === '22P02') {
            return res.status(400).json({ message: 'Invalid Project ID format' });
        }
        res.status(500).json({ message: 'Server error checking project participation' });
    }
};

/**
 * Require an active contract (or at least signed/active/completed) 
 * AND strictly enforce that the project is not just in 'draft' or 'posted' state 
 * effectively gating collaboration.
 */
const requireActiveContract = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.params.id || req.body.projectId;

        // Check project state first (cheaper)
        const projectText = 'SELECT state FROM projects WHERE id = $1';
        const projectRes = await query(projectText, [projectId]);

        if (projectRes.rows.length === 0) return res.status(404).json({ message: 'Project not found' });

        const state = projectRes.rows[0].state;
        const allowedStates = ['contracted', 'active', 'completed'];

        if (!allowedStates.includes(state)) {
            // Relax check: If contract exists and is signed, maybe we allow it even if state lag?
            // But strict audit says "Activated ONLY after contract execution".

            // Double check contracts table just in case state machine is out of sync
            const contractText = `
                SELECT status FROM contracts 
                WHERE project_id = $1 AND status IN ('signed', 'active', 'completed')
             `;
            const contractRes = await query(contractText, [projectId]);

            if (contractRes.rows.length === 0) {
                return res.status(403).json({
                    message: 'Collaboration Hub is locked. Active contract required.',
                    code: 'NO_ACTIVE_CONTRACT'
                });
            }
        }

        next();
    } catch (error) {
        console.error('Active contract middleware error:', error);
        res.status(500).json({ message: 'Server error checking contract status' });
    }
};

module.exports = {
    requireProjectParticipant,
    requireActiveContract
};
