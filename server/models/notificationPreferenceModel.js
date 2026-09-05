const { query } = require('../database/db');

/**
 * Get user notification preferences
 */
const getUserPreferences = async (userId) => {
    const text = `
        SELECT * FROM notification_preferences
        WHERE user_id = $1
    `;
    const result = await query(text, [userId]);

    // Create default preferences if none exist
    if (result.rows.length === 0) {
        return createDefaultPreferences(userId);
    }

    return result.rows[0];
};

/**
 * Create default preferences for a user
 */
const createDefaultPreferences = async (userId) => {
    const text = `
        INSERT INTO notification_preferences (
            user_id, project_matching, email_enabled, push_enabled, 
            project_updates, messages, payments, marketing
        )
        VALUES ($1, true, true, true, true, true, true, true)
        RETURNING *
    `;
    const result = await query(text, [userId]);
    return result.rows[0];
};

/**
 * Update user notification preferences
 */
const updatePreferences = async (userId, preferences) => {
    const {
        // Matching specific
        project_matching,
        match_threshold,
        budget_min,
        budget_max,
        preferred_skills,
        preferred_project_types,
        notification_frequency,

        // Channels
        email_enabled,
        push_enabled,

        // General (Existing)
        project_updates,
        messages,
        payments,
        marketing
    } = preferences;

    const text = `
        UPDATE notification_preferences
        SET 
            -- Compulsary checks/coalesce for all fields to allow partial updates
            project_matching = COALESCE($2, project_matching),
            match_threshold = COALESCE($3, match_threshold),
            budget_min = COALESCE($4, budget_min),
            budget_max = COALESCE($5, budget_max),
            preferred_skills = COALESCE($6, preferred_skills),
            preferred_project_types = COALESCE($7, preferred_project_types),
            notification_frequency = COALESCE($8, notification_frequency),
            
            email_enabled = COALESCE($9, email_enabled),
            push_enabled = COALESCE($10, push_enabled),
            
            project_updates = COALESCE($11, project_updates),
            messages = COALESCE($12, messages),
            payments = COALESCE($13, payments),
            marketing = COALESCE($14, marketing),
            
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1
        RETURNING *
    `;

    const values = [
        userId,
        project_matching,
        match_threshold,
        budget_min,
        budget_max,
        preferred_skills,
        preferred_project_types,
        notification_frequency,
        email_enabled,
        push_enabled,
        project_updates,
        messages,
        payments,
        marketing
    ];

    const result = await query(text, values);

    // Handle case where update is called before create
    if (result.rows.length === 0) {
        await createDefaultPreferences(userId);
        // Recursive call to update after creation (careful with infinite loops, but here it's safe as createDefault works)
        return updatePreferences(userId, preferences);
    }

    return result.rows[0];
};

/**
 * Check if user wants notifications for a specific type
 */
const shouldNotify = async (userId, notificationType) => {
    const preferences = await getUserPreferences(userId);

    const typeMap = {
        'project_update': preferences.project_updates,
        'message': preferences.messages,
        'payment': preferences.payments,
        'marketing': preferences.marketing,
        'project_match': preferences.project_matching
    };

    return typeMap[notificationType] !== false;
};

module.exports = {
    getUserPreferences,
    createDefaultPreferences,
    updatePreferences,
    shouldNotify
};
