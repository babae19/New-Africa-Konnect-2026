const { getMarketplaceProjects } = require('../models/marketplaceModel');

// Get marketplace projects (open for bidding)
const getMarketplace = async (req, res) => {
    try {
        // Both experts and clients can access marketplace
        if (req.user.role !== 'expert' && req.user.role !== 'client') {
            return res.status(403).json({ message: 'Access denied: Only experts and clients can browse the marketplace' });
        }

        const filters = {
            search: req.query.search,
            minBudget: req.query.minBudget,
            maxBudget: req.query.maxBudget,
            skills: req.query.skills,
            minDuration: req.query.minDuration,
            maxDuration: req.query.maxDuration,
            complexity: req.query.complexity,
            postedAfter: req.query.postedAfter,
            sortBy: req.query.sortBy || 'recent'
        };

        const projects = await getMarketplaceProjects(filters);

        res.json({
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error('Get marketplace error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getMarketplace
};
