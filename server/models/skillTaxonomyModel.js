const { query } = require('../database/db');

/**
 * Get all skills
 */
const getAllSkills = async () => {
    const text = `
        SELECT * FROM skill_taxonomy
        WHERE is_active = TRUE
        ORDER BY category, subcategory, skill_name
    `;
    const result = await query(text);
    return result.rows;
};

/**
 * Get skills by category
 */
const getSkillsByCategory = async (category) => {
    const text = `
        SELECT * FROM skill_taxonomy
        WHERE category = $1 AND is_active = TRUE
        ORDER BY subcategory, skill_name
    `;
    const result = await query(text, [category]);
    return result.rows;
};

/**
 * Get all categories
 */
const getAllCategories = async () => {
    const text = `
        SELECT DISTINCT category
        FROM skill_taxonomy
        WHERE is_active = TRUE
        ORDER BY category
    `;
    const result = await query(text);
    return result.rows.map(row => row.category);
};

/**
 * Get subcategories by category
 */
const getSubcategories = async (category) => {
    const text = `
        SELECT DISTINCT subcategory
        FROM skill_taxonomy
        WHERE category = $1 AND is_active = TRUE AND subcategory IS NOT NULL
        ORDER BY subcategory
    `;
    const result = await query(text, [category]);
    return result.rows.map(row => row.subcategory);
};

/**
 * Search skills
 */
const searchSkills = async (searchTerm) => {
    const text = `
        SELECT * FROM skill_taxonomy
        WHERE is_active = TRUE
        AND (
            skill_name ILIKE $1 
            OR description ILIKE $1
            OR category ILIKE $1
            OR subcategory ILIKE $1
        )
        ORDER BY skill_name
        LIMIT 20
    `;
    const result = await query(text, [`%${searchTerm}%`]);
    return result.rows;
};

/**
 * Add new skill (admin only)
 */
const addSkill = async (skillData) => {
    const { category, subcategory, skillName, description } = skillData;

    const text = `
        INSERT INTO skill_taxonomy (category, subcategory, skill_name, description)
        VALUES ($1, $2, $3, $4)
        RETURNING *
    `;
    const result = await query(text, [category, subcategory, skillName, description]);
    return result.rows[0];
};

/**
 * Update skill (admin only)
 */
const updateSkill = async (id, skillData) => {
    const { category, subcategory, skillName, description, isActive } = skillData;

    const text = `
        UPDATE skill_taxonomy
        SET category = COALESCE($1, category),
            subcategory = COALESCE($2, subcategory),
            skill_name = COALESCE($3, skill_name),
            description = COALESCE($4, description),
            is_active = COALESCE($5, is_active)
        WHERE id = $6
        RETURNING *
    `;
    const result = await query(text, [category, subcategory, skillName, description, isActive, id]);
    return result.rows[0];
};

/**
 * Deactivate skill (admin only)
 */
const deactivateSkill = async (id) => {
    const text = `
        UPDATE skill_taxonomy
        SET is_active = FALSE
        WHERE id = $1
        RETURNING *
    `;
    const result = await query(text, [id]);
    return result.rows[0];
};

module.exports = {
    getAllSkills,
    getSkillsByCategory,
    getAllCategories,
    getSubcategories,
    searchSkills,
    addSkill,
    updateSkill,
    deactivateSkill
};
