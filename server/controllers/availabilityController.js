const availabilityModel = require('../models/availabilityModel');

exports.setAvailability = async (req, res) => {
    try {
        const { dayOfWeek, startTime, endTime, timezone } = req.body;

        if (dayOfWeek === undefined || !startTime || !endTime || !timezone) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const slot = await availabilityModel.setAvailability(req.user.id, {
            dayOfWeek,
            startTime,
            endTime,
            timezone
        });

        res.status(201).json(slot);
    } catch (error) {
        console.error('Set availability error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getAvailability = async (req, res) => {
    try {
        const expertId = req.params.expertId || req.user.id;
        const slots = await availabilityModel.getExpertAvailability(expertId);
        res.json(slots);
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAvailability = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await availabilityModel.deleteAvailability(id, req.user.id);

        if (!deleted) {
            return res.status(404).json({ message: 'Availability slot not found or unauthorized' });
        }

        res.json({ message: 'Availability slot deleted' });
    } catch (error) {
        console.error('Delete availability error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getPublicAvailability = async (req, res) => {
    try {
        const { expertId } = req.params;
        const slots = await availabilityModel.getExpertAvailability(expertId);
        // Clean up response if needed for public view (e.g. remove internal IDs)
        res.json(slots);
    } catch (error) {
        console.error('Get public availability error:', error);
        res.status(500).json({ message: error.message });
    }
};
