const { query } = require('../database/db');

// Create expert profile
const createExpertProfile = async (profileData) => {
    const {
        userId,
        title,
        bio,
        location,
        skills = [],
        hourlyRate,
        profileImageUrl,
        certifications = []
    } = profileData;

    const text = `
        INSERT INTO expert_profiles 
        (user_id, title, bio, location, skills, hourly_rate, profile_image_url, certifications, vetting_status, country, city, company, services, documents)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'approved', $9, $10, $11, $12, $13)
        RETURNING *
    `;
    const values = [
        userId, title, bio, location, skills, hourlyRate, profileImageUrl,
        JSON.stringify(certifications),
        profileData.country || null,
        profileData.city || null,
        profileData.company || null,
        profileData.services ? JSON.stringify(profileData.services) : JSON.stringify([]),
        profileData.documents ? JSON.stringify(profileData.documents) : JSON.stringify([])
    ];

    try {
        const result = await query(text, values);
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            throw new Error('Expert profile already exists for this user');
        }
        throw error;
    }
};

// Get expert profile by user ID
const getExpertProfile = async (userId) => {
    const text = `
        SELECT ep.*, u.name, u.email
        FROM expert_profiles ep
        JOIN users u ON ep.user_id = u.id
        WHERE ep.user_id = $1
    `;
    const result = await query(text, [userId]);
    return result.rows[0];
};

// Get expert profile by profile ID
const getExpertProfileById = async (profileId) => {
    const text = `
        SELECT ep.*, u.name, u.email
        FROM expert_profiles ep
        JOIN users u ON ep.user_id = u.id
        WHERE ep.id = $1
    `;
    const result = await query(text, [profileId]);
    return result.rows[0];
};

// Update expert profile
const updateExpertProfile = async (userId, profileData) => {
    const {
        title,
        bio,
        location,
        skills,
        hourlyRate,
        profileImageUrl,
        certifications,
        country,
        city,
        company,
        services,
        documents
    } = profileData;

    const text = `
        UPDATE expert_profiles 
        SET 
            title = COALESCE($1, title),
            bio = COALESCE($2, bio),
            location = COALESCE($3, location),
            skills = COALESCE($4, skills),
            hourly_rate = COALESCE($5, hourly_rate),
            profile_image_url = COALESCE($6, profile_image_url),
            certifications = COALESCE($7, certifications),
            country = COALESCE($8, country),
            city = COALESCE($9, city),
            company = COALESCE($10, company),
            services = COALESCE($11, services),
            documents = COALESCE($12, documents)
        WHERE user_id = $13
        RETURNING *
    `;
    const values = [
        title, bio, location, skills, hourlyRate, profileImageUrl,
        certifications ? JSON.stringify(certifications) : null,
        country, city, company,
        services ? JSON.stringify(services) : null,
        documents ? JSON.stringify(documents) : null,
        userId
    ];
    const result = await query(text, values);
    return result.rows[0];
};

// Get all experts with optional filters
const getAllExperts = async (filters = {}) => {
    let text = `
        SELECT ep.*, u.name, u.email, COALESCE(ep.profile_image_url, u.profile_image_url) as profile_image_url
        FROM expert_profiles ep
        JOIN users u ON ep.user_id = u.id
        WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    // Filter by vetting status
    if (filters.vettingStatus) {
        text += ` AND ep.vetting_status = $${paramCount}`;
        values.push(filters.vettingStatus);
        paramCount++;
    }

    // Filter by skills
    if (filters.skills && filters.skills.length > 0) {
        text += ` AND ep.skills && $${paramCount}`;
        values.push(filters.skills);
        paramCount++;
    }

    // Filter by location
    if (filters.location) {
        text += ` AND ep.location ILIKE $${paramCount}`;
        values.push(`%${filters.location}%`);
        paramCount++;
    }

    // Filter by hourly rate range
    if (filters.minRate) {
        text += ` AND ep.hourly_rate >= $${paramCount}`;
        values.push(filters.minRate);
        paramCount++;
    }

    if (filters.maxRate) {
        text += ` AND ep.hourly_rate <= $${paramCount}`;
        values.push(filters.maxRate);
        paramCount++;
    }

    text += ' ORDER BY ep.created_at DESC';

    // Pagination
    if (filters.limit) {
        text += ` LIMIT $${paramCount}`;
        values.push(filters.limit);
        paramCount++;
    }

    if (filters.offset) {
        text += ` OFFSET $${paramCount}`;
        values.push(filters.offset);
        paramCount++;
    }

    const result = await query(text, values);
    return result.rows;
};

// Update vetting status
const updateVettingStatus = async (userId, status) => {
    const text = `
        UPDATE expert_profiles 
        SET vetting_status = $1
        WHERE user_id = $2
        RETURNING *
    `;
    const result = await query(text, [status, userId]);
    return result.rows[0];
};

// Delete expert profile
const deleteExpertProfile = async (userId) => {
    const text = 'DELETE FROM expert_profiles WHERE user_id = $1 RETURNING *';
    const result = await query(text, [userId]);
    return result.rows[0];
};

// Get expert count by vetting status
const getExpertCountByStatus = async () => {
    const text = `
        SELECT vetting_status, COUNT(*) as count
        FROM expert_profiles
        GROUP BY vetting_status
    `;
    const result = await query(text);
    return result.rows;
};

/**
 * Calculate profile completeness percentage
 */
const calculateProfileCompleteness = (profile) => {
    const fields = {
        title: 8,
        bio: 12,
        location: 5,
        country: 5,
        city: 5,
        skills: 10,
        skill_categories: 5,
        hourly_rate: 10,
        rate_min: 5,
        rate_max: 5,
        profile_image_url: 10,
        portfolio_items: 10,
        availability_calendar: 10,
        documents: 10
    };

    let completeness = 0;

    for (const [field, weight] of Object.entries(fields)) {
        if (profile[field]) {
            // Check if array/object fields have content
            if (Array.isArray(profile[field])) {
                if (profile[field].length > 0) completeness += weight;
            } else if (typeof profile[field] === 'object') {
                if (Object.keys(profile[field]).length > 0) completeness += weight;
            } else {
                completeness += weight;
            }
        }
    }

    return Math.min(100, completeness);
};

/**
 * Update profile completeness
 */
const updateProfileCompleteness = async (userId) => {
    const profile = await getExpertProfile(userId);
    if (!profile) return null;

    const completeness = calculateProfileCompleteness(profile);

    const text = `
        UPDATE expert_profiles
        SET profile_completeness = $1
        WHERE user_id = $2
        RETURNING *
    `;
    const result = await query(text, [completeness, userId]);
    return result.rows[0];
};

/**
 * Add portfolio item
 */
const addPortfolioItem = async (userId, item) => {
    const { type, title, description, url, imageUrl } = item;

    const portfolioItem = {
        id: Date.now().toString(),
        type, // 'image', 'pdf', 'link'
        title,
        description,
        url,
        imageUrl,
        createdAt: new Date().toISOString()
    };

    const text = `
        UPDATE expert_profiles
        SET portfolio_items = portfolio_items || $1::jsonb,
            last_profile_update = NOW()
        WHERE user_id = $2
        RETURNING *
    `;
    const result = await query(text, [JSON.stringify([portfolioItem]), userId]);

    // Update completeness
    await updateProfileCompleteness(userId);

    return result.rows[0];
};

/**
 * Remove portfolio item
 */
const removePortfolioItem = async (userId, itemId) => {
    const profile = await getExpertProfile(userId);
    const portfolioItems = profile.portfolio_items || [];
    const updatedItems = portfolioItems.filter(item => item.id !== itemId);

    const text = `
        UPDATE expert_profiles
        SET portfolio_items = $1::jsonb,
            last_profile_update = NOW()
        WHERE user_id = $2
        RETURNING *
    `;
    const result = await query(text, [JSON.stringify(updatedItems), userId]);

    // Update completeness
    await updateProfileCompleteness(userId);

    return result.rows[0];
};

/**
 * Update availability calendar
 */
const updateAvailability = async (userId, calendar) => {
    const text = `
        UPDATE expert_profiles
        SET availability_calendar = $1::jsonb,
            last_profile_update = NOW()
        WHERE user_id = $2
        RETURNING *
    `;
    const result = await query(text, [JSON.stringify(calendar), userId]);

    // Update completeness
    await updateProfileCompleteness(userId);

    return result.rows[0];
};

/**
 * Set rate range
 */
const setRateRange = async (userId, rateData) => {
    const { min, max, currency = 'USD' } = rateData;

    const text = `
        UPDATE expert_profiles
        SET rate_min = $1,
            rate_max = $2,
            rate_currency = $3,
            last_profile_update = NOW()
        WHERE user_id = $4
        RETURNING *
    `;
    const result = await query(text, [min, max, currency, userId]);

    // Update completeness
    await updateProfileCompleteness(userId);

    return result.rows[0];
};

/**
 * Update skill categories
 */
const updateSkillCategories = async (userId, skillCategories) => {
    const text = `
        UPDATE expert_profiles
        SET skill_categories = $1::jsonb,
            last_profile_update = NOW()
        WHERE user_id = $2
        RETURNING *
    `;
    const result = await query(text, [JSON.stringify(skillCategories), userId]);

    // Update completeness
    await updateProfileCompleteness(userId);

    return result.rows[0];
};

/**
 * Log profile change
 */
const logProfileChange = async (userId, changes) => {
    const changeLog = {
        timestamp: new Date().toISOString(),
        changes,
        userId
    };

    const text = `
        UPDATE expert_profiles
        SET profile_change_log = profile_change_log || $1::jsonb
        WHERE user_id = $2
        RETURNING *
    `;
    const result = await query(text, [JSON.stringify([changeLog]), userId]);
    return result.rows[0];
};

/**
 * Get profile change log
 */
const getProfileChangeLog = async (userId) => {
    const profile = await getExpertProfile(userId);
    return profile?.profile_change_log || [];
};

module.exports = {
    createExpertProfile,
    getExpertProfile,
    getExpertProfileById,
    updateExpertProfile,
    getAllExperts,
    updateVettingStatus,
    deleteExpertProfile,
    getExpertCountByStatus,
    calculateProfileCompleteness,
    updateProfileCompleteness,
    addPortfolioItem,
    removePortfolioItem,
    updateAvailability,
    setRateRange,
    updateSkillCategories,
    logProfileChange,
    getProfileChangeLog
};
