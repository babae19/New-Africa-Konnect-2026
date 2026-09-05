const {
    createSavedSearch: createSavedSearchModel,
    getSavedSearchesByUser: getSavedSearchesByUserModel,
    getSavedSearchById: getSavedSearchByIdModel,
    updateSavedSearch: updateSavedSearchModel,
    deleteSavedSearch: deleteSavedSearchModel,
    updateLastUsed: updateLastUsedModel
} = require('../models/savedSearchModel');
const { getMarketplaceProjects } = require('../models/marketplaceModel');

// Create a new saved search
const createSavedSearch = async (req, res) => {
    try {
        const { name, filters, notificationEnabled } = req.body;

        if (!name || !filters) {
            return res.status(400).json({ message: 'Name and filters are required' });
        }

        const savedSearch = await createSavedSearchModel(req.user.id, {
            name,
            filters,
            notificationEnabled
        });

        res.status(201).json(savedSearch);
    } catch (error) {
        console.error('Create saved search error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all saved searches for the current user
const getSavedSearches = async (req, res) => {
    try {
        const savedSearches = await getSavedSearchesByUserModel(req.user.id);
        res.json(savedSearches);
    } catch (error) {
        console.error('Get saved searches error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update a saved search
const updateSavedSearch = async (req, res) => {
    try {
        const { id } = req.params;
        const savedSearch = await getSavedSearchByIdModel(id);

        if (!savedSearch) {
            return res.status(404).json({ message: 'Saved search not found' });
        }

        if (savedSearch.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this saved search' });
        }

        const updatedSearch = await updateSavedSearchModel(id, req.body);
        res.json(updatedSearch);
    } catch (error) {
        console.error('Update saved search error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete a saved search
const deleteSavedSearch = async (req, res) => {
    try {
        const { id } = req.params;
        const savedSearch = await getSavedSearchByIdModel(id);

        if (!savedSearch) {
            return res.status(404).json({ message: 'Saved search not found' });
        }

        if (savedSearch.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this saved search' });
        }

        await deleteSavedSearchModel(id);
        res.json({ message: 'Saved search deleted successfully' });
    } catch (error) {
        console.error('Delete saved search error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Execute a saved search
const executeSavedSearch = async (req, res) => {
    try {
        const { id } = req.params;
        const savedSearch = await getSavedSearchByIdModel(id);

        if (!savedSearch) {
            return res.status(404).json({ message: 'Saved search not found' });
        }

        if (savedSearch.user_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to execute this saved search' });
        }

        // Update last used timestamp
        await updateLastUsedModel(id);

        // Execute search using marketplace model
        const filters = savedSearch.filters;
        const projects = await getMarketplaceProjects(filters);

        res.json({
            count: projects.length,
            projects,
            filters
        });
    } catch (error) {
        console.error('Execute saved search error:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createSavedSearch,
    getSavedSearches,
    updateSavedSearch,
    deleteSavedSearch,
    executeSavedSearch
};
