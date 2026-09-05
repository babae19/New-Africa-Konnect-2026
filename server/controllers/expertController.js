const {
    createExpertProfile,
    getExpertProfile,
    updateExpertProfile,
    getAllExperts,
    updateVettingStatus,
    updateProfileCompleteness,
    addPortfolioItem,
    removePortfolioItem,
    updateAvailability,
    setRateRange,
    updateSkillCategories,
    logProfileChange,
    getProfileChangeLog
} = require('../models/expertModel');
const { updateUser } = require('../models/userModel');
const { getAllSkills, getSkillsByCategory, getAllCategories, searchSkills } = require('../models/skillTaxonomyModel');

// Create expert profile
exports.createProfile = async (req, res) => {
    try {
        const { title, bio, location, skills, hourlyRate, profileImageUrl, profile_image_url, certifications } = req.body;
        const userId = req.user.id;
        const unifiedProfileImageUrl = profile_image_url || profileImageUrl;

        // Check if user is an expert
        if (req.user.role !== 'expert') {
            return res.status(403).json({ message: 'Only experts can create expert profiles' });
        }

        // Check if profile already exists
        const existingProfile = await getExpertProfile(userId);
        if (existingProfile) {
            return res.status(400).json({ message: 'Expert profile already exists' });
        }

        const profile = await createExpertProfile({
            userId,
            title,
            bio,
            location,
            skills,
            hourlyRate,
            profileImageUrl: unifiedProfileImageUrl,
            certifications
        });

        // Sync with base users table
        await updateUser(userId, { profileImageUrl: unifiedProfileImageUrl, bio });

        // Emit event to notify clients about the new expert
        const io = req.app.get('io');
        if (io) {
            io.emit('new_expert', {
                ...profile,
                name: req.user.name,
                email: req.user.email
            });
        }

        res.status(201).json({
            ...profile,
            profile_image_url: profile.profile_image_url || profile.profileImageUrl
        });
    } catch (error) {
        console.error('Create profile error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get expert profile
exports.getProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;

        const profile = await getExpertProfile(userId);

        if (!profile) {
            return res.status(404).json({ message: 'Expert profile not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update expert profile
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;

        // Ensure user can only update their own profile
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this profile' });
        }

        const { title, bio, location, skills, hourlyRate, profileImageUrl, profile_image_url, certifications, company, website, country, city } = req.body;
        const unifiedProfileImageUrl = profile_image_url || profileImageUrl;

        const profile = await updateExpertProfile(userId, {
            title,
            bio,
            location,
            skills,
            hourlyRate,
            profileImageUrl: unifiedProfileImageUrl,
            certifications,
            company,
            website,
            country,
            city
        });

        if (!profile) {
            return res.status(404).json({ message: 'Expert profile not found' });
        }

        // Sync with base users table
        await updateUser(userId, { profileImageUrl: unifiedProfileImageUrl, bio });

        // Emit update event
        const io = req.app.get('io');
        if (io) {
            io.emit('expert_updated', profile);
        }

        res.json({
            ...profile,
            profile_image_url: profile.profile_image_url || profile.profileImageUrl
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all experts
exports.getAllExperts = async (req, res) => {
    try {
        const { vettingStatus, skills, location, minRate, maxRate, limit, offset } = req.query;

        const filters = {
            vettingStatus: vettingStatus === 'all' ? undefined : (vettingStatus || undefined), // Return all if undefined or 'all'
            skills: skills ? skills.split(',') : undefined,
            location,
            minRate: minRate ? parseFloat(minRate) : undefined,
            maxRate: maxRate ? parseFloat(maxRate) : undefined,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        };

        const expertsData = await getAllExperts(filters);

        const expertsWithNames = expertsData.map(e => ({
            ...e,
            profile_image_url: e.profile_image_url || e.profileImageUrl,
            company: e.company || null,
            title: e.title || 'Expert'
        }));

        res.json({
            count: expertsWithNames.length,
            experts: expertsWithNames
        });
    } catch (error) {
        console.error('Get all experts error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update vetting status (admin only)
exports.updateVettingStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        if (!['pending', 'in_progress', 'approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid vetting status' });
        }

        const profile = await updateVettingStatus(userId, status);

        if (!profile) {
            return res.status(404).json({ message: 'Expert profile not found' });
        }

        res.json(profile);
    } catch (error) {
        console.error('Update vetting status error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get profile completeness
exports.getProfileCompleteness = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;
        const profile = await getExpertProfile(userId);

        if (!profile) {
            return res.status(404).json({ message: 'Expert profile not found' });
        }

        res.json({
            completeness: profile.profile_completeness || 0,
            lastUpdate: profile.last_profile_update
        });
    } catch (error) {
        console.error('Get profile completeness error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update profile completeness
exports.updateCompleteness = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await updateProfileCompleteness(userId);

        if (!profile) {
            return res.status(404).json({ message: 'Expert profile not found' });
        }

        res.json({
            completeness: profile.profile_completeness,
            message: `Profile is ${profile.profile_completeness}% complete`
        });
    } catch (error) {
        console.error('Update completeness error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Add portfolio item
exports.addPortfolio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, title, description, url, imageUrl } = req.body;

        if (!type || !title) {
            return res.status(400).json({ message: 'Type and title are required' });
        }

        const profile = await addPortfolioItem(userId, {
            type,
            title,
            description,
            url,
            imageUrl
        });

        // Log change
        await logProfileChange(userId, { action: 'add_portfolio', item: title });

        res.json({
            message: 'Portfolio item added successfully',
            portfolioItems: profile.portfolio_items,
            completeness: profile.profile_completeness
        });
    } catch (error) {
        console.error('Add portfolio error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Remove portfolio item
exports.removePortfolio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { itemId } = req.params;

        const profile = await removePortfolioItem(userId, itemId);

        // Log change
        await logProfileChange(userId, { action: 'remove_portfolio', itemId });

        res.json({
            message: 'Portfolio item removed successfully',
            portfolioItems: profile.portfolio_items,
            completeness: profile.profile_completeness
        });
    } catch (error) {
        console.error('Remove portfolio error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update availability
exports.updateAvailability = async (req, res) => {
    try {
        const userId = req.user.id;
        const { calendar } = req.body;

        if (!calendar) {
            return res.status(400).json({ message: 'Calendar data is required' });
        }

        const profile = await updateAvailability(userId, calendar);

        // Log change
        await logProfileChange(userId, { action: 'update_availability' });

        res.json({
            message: 'Availability updated successfully',
            availabilityCalendar: profile.availability_calendar,
            completeness: profile.profile_completeness
        });
    } catch (error) {
        console.error('Update availability error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Set rate range
exports.setRateRange = async (req, res) => {
    try {
        const userId = req.user.id;
        const { min, max, currency } = req.body;

        if (!min || !max) {
            return res.status(400).json({ message: 'Min and max rates are required' });
        }

        if (min > max) {
            return res.status(400).json({ message: 'Min rate cannot be greater than max rate' });
        }

        const profile = await setRateRange(userId, { min, max, currency });

        // Log change
        await logProfileChange(userId, { action: 'update_rate_range', min, max, currency });

        res.json({
            message: 'Rate range updated successfully',
            rateMin: profile.rate_min,
            rateMax: profile.rate_max,
            rateCurrency: profile.rate_currency,
            completeness: profile.profile_completeness
        });
    } catch (error) {
        console.error('Set rate range error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update skill categories
exports.updateSkills = async (req, res) => {
    try {
        const userId = req.user.id;
        const { skillCategories } = req.body;

        if (!skillCategories || !Array.isArray(skillCategories)) {
            return res.status(400).json({ message: 'Skill categories must be an array' });
        }

        const profile = await updateSkillCategories(userId, skillCategories);

        // Log change
        await logProfileChange(userId, { action: 'update_skills', count: skillCategories.length });

        res.json({
            message: 'Skills updated successfully',
            skillCategories: profile.skill_categories,
            completeness: profile.profile_completeness
        });
    } catch (error) {
        console.error('Update skills error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get profile change log
exports.getChangeLog = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.id;

        // Only allow viewing own log or admin
        if (req.user.id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const changeLog = await getProfileChangeLog(userId);

        res.json({
            count: changeLog.length,
            changes: changeLog
        });
    } catch (error) {
        console.error('Get change log error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all skill taxonomy
exports.getAllSkills = async (req, res) => {
    try {
        const skills = await getAllSkills();

        res.json({
            count: skills.length,
            skills
        });
    } catch (error) {
        console.error('Get all skills error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get skills by category
exports.getSkillsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const skills = await getSkillsByCategory(category);

        res.json({
            category,
            count: skills.length,
            skills
        });
    } catch (error) {
        console.error('Get skills by category error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all categories
exports.getCategories = async (req, res) => {
    try {
        const categories = await getAllCategories();

        res.json({
            count: categories.length,
            categories
        });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Search skills
exports.searchSkills = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.length < 2) {
            return res.status(400).json({ message: 'Search term must be at least 2 characters' });
        }

        const skills = await searchSkills(q);

        res.json({
            query: q,
            count: skills.length,
            skills
        });
    } catch (error) {
        console.error('Search skills error:', error);
        res.status(500).json({ message: error.message });
    }
};
