const { query } = require('../database/db');

// Create a new saved search
const createSavedSearch = async (userId, searchData) => {
    const { name, filters, notificationEnabled } = searchData;
    const text = `
        INSERT INTO saved_searches (user_id, name, filters, notification_enabled)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const values = [userId, name, filters, notificationEnabled || false];
    const result = await query(text, values);
    return result.rows[0];
};

// Get all saved searches for a user
const getSavedSearchesByUser = async (userId) => {
    const text = `
        SELECT * FROM saved_searches
        WHERE user_id = $1
        ORDER BY last_used DESC, created_at DESC
    `;
    const result = await query(text, [userId]);
    return result.rows;
};

// Get a specific saved search
const getSavedSearchById = async (id) => {
    const text = `SELECT * FROM saved_searches WHERE id = $1`;
    const result = await query(text, [id]);
    return result.rows[0];
};

// Update a saved search
const updateSavedSearch = async (id, updateData) => {
    const { name, filters, notificationEnabled } = updateData;
    const text = `
        UPDATE saved_searches
        SET name = COALESCE($1, name),
            filters = COALESCE($2, filters),
            notification_enabled = COALESCE($3, notification_enabled),
            last_used = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING *
    `;
    const values = [name, filters, notificationEnabled, id];
    const result = await query(text, values);
    return result.rows[0];
};

// Delete a saved search
const deleteSavedSearch = async (id) => {
    const text = `DELETE FROM saved_searches WHERE id = $1 RETURNING *`;
    const result = await query(text, [id]);
    return result.rows[0];
};

// Update last used timestamp
const updateLastUsed = async (id) => {
    const text = `
        UPDATE saved_searches
        SET last_used = CURRENT_TIMESTAMP
        WHERE id = $1
    `;
    await query(text, [id]);
};

module.exports = {
    createSavedSearch,
    getSavedSearchesByUser,
    getSavedSearchById,
    updateSavedSearch,
    deleteSavedSearch,
    updateLastUsed
};
