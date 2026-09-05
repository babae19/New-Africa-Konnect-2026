const { query } = require('../database/db');

// Check if expert profile is complete and verified
const checkProfileStatus = async (req, res, next) => {
    try {
        if (req.user.role !== 'expert') {
            return next(); // Skip for clients/admins? Or error? 
            // If route is authorize('expert'), then non-experts are already blocked usually.
            // But if mixed route, we should care.
            // For respondToInvite, only experts call it.
        }

        const text = 'SELECT * FROM expert_profiles WHERE user_id = $1';
        const result = await query(text, [req.user.id]);
        const profile = result.rows[0];

        if (!profile) {
            return res.status(403).json({
                message: 'Incomplete Profile',
                action: 'create_profile'
            });
        }

        // Check required fields (completeness)
        const requiredFields = ['title', 'skills', 'hourly_rate', 'bio'];
        const missingFields = requiredFields.filter(field => !profile[field]);

        if (missingFields.length > 0) {
            return res.status(403).json({
                message: `Profile incomplete. Missing: ${missingFields.join(', ')}`,
                action: 'complete_profile'
            });
        }

        // Ensure not rejected
        if (profile.vetting_status === 'rejected') {
            return res.status(403).json({ message: 'Expert profile is suspended or rejected.' });
        }

        // Optional: Require 'verified' status for certain actions?
        // For now, we enforce completeness. Step2Match filters for 'verified'.

        req.expertProfile = profile;
        next();
    } catch (error) {
        console.error('Profile check error:', error);
        res.status(500).json({ message: 'Server error checking profile status' });
    }
};

module.exports = { checkProfileStatus };
