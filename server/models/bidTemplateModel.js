const { query } = require('../database/db');

// Create a new bid template
const createBidTemplate = async (expertId, templateData) => {
    const {
        name,
        coverLetterTemplate,
        proposedTimeline,
        proposedDuration,
        portfolioLinks,
        pricingStrategy,
        pricingValue,
        isDefault
    } = templateData;

    // If setting as default, unset other defaults for this expert
    if (isDefault) {
        await query(
            `UPDATE bid_templates SET is_default = false WHERE expert_id = $1`,
            [expertId]
        );
    }

    const text = `
        INSERT INTO bid_templates (
            expert_id, name, cover_letter_template, proposed_timeline, 
            proposed_duration, portfolio_links, pricing_strategy, 
            pricing_value, is_default
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
    `;
    const values = [
        expertId, name, coverLetterTemplate, proposedTimeline,
        proposedDuration, portfolioLinks, pricingStrategy,
        pricingValue, isDefault || false
    ];

    const result = await query(text, values);
    return result.rows[0];
};

// Get all templates for an expert
const getBidTemplatesByExpert = async (expertId) => {
    const text = `
        SELECT * FROM bid_templates
        WHERE expert_id = $1
        ORDER BY is_default DESC, created_at DESC
    `;
    const result = await query(text, [expertId]);
    return result.rows;
};

// Get a specific template
const getBidTemplateById = async (id) => {
    const text = `SELECT * FROM bid_templates WHERE id = $1`;
    const result = await query(text, [id]);
    return result.rows[0];
};

// Update a template
const updateBidTemplate = async (id, updateData) => {
    const {
        name,
        coverLetterTemplate,
        proposedTimeline,
        proposedDuration,
        portfolioLinks,
        pricingStrategy,
        pricingValue,
        isDefault
    } = updateData;

    // Get current template to check owner and handle default switching
    const current = await getBidTemplateById(id);
    if (!current) return null;

    if (isDefault) {
        await query(
            `UPDATE bid_templates SET is_default = false WHERE expert_id = $1 AND id != $2`,
            [current.expert_id, id]
        );
    }

    const text = `
        UPDATE bid_templates
        SET name = COALESCE($1, name),
            cover_letter_template = COALESCE($2, cover_letter_template),
            proposed_timeline = COALESCE($3, proposed_timeline),
            proposed_duration = COALESCE($4, proposed_duration),
            portfolio_links = COALESCE($5, portfolio_links),
            pricing_strategy = COALESCE($6, pricing_strategy),
            pricing_value = COALESCE($7, pricing_value),
            is_default = COALESCE($8, is_default),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
    `;
    const values = [
        name, coverLetterTemplate, proposedTimeline,
        proposedDuration, portfolioLinks, pricingStrategy,
        pricingValue, isDefault, id
    ];

    const result = await query(text, values);
    return result.rows[0];
};

// Delete a template
const deleteBidTemplate = async (id) => {
    const text = `DELETE FROM bid_templates WHERE id = $1 RETURNING *`;
    const result = await query(text, [id]);
    return result.rows[0];
};

// Increment usage count
const incrementUsageCount = async (id) => {
    const text = `
        UPDATE bid_templates
        SET usage_count = usage_count + 1
        WHERE id = $1
    `;
    await query(text, [id]);
};

module.exports = {
    createBidTemplate,
    getBidTemplatesByExpert,
    getBidTemplateById,
    updateBidTemplate,
    deleteBidTemplate,
    incrementUsageCount
};
