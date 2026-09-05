const notificationPreferenceModel = require('../models/notificationPreferenceModel');

exports.getPreferences = async (req, res) => {
    try {
        const preferences = await notificationPreferenceModel.getUserPreferences(req.user.id);
        res.json(preferences);
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updatePreferences = async (req, res) => {
    try {
        const preferences = await notificationPreferenceModel.updatePreferences(req.user.id, req.body);
        res.json(preferences);
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ message: error.message });
    }
};
