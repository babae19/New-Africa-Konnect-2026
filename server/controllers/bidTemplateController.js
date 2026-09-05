const {
    createBidTemplate,
    getBidTemplatesByExpert,
    getBidTemplateById,
    updateBidTemplate,
    deleteBidTemplate,
    incrementUsageCount
} = require('../models/bidTemplateModel');

// Create a new template
exports.createTemplate = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Template name is required' });
        }

        const template = await createBidTemplate(req.user.id, req.body);
        res.status(201).json(template);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get expert's templates
exports.getTemplates = async (req, res) => {
    try {
        const templates = await getBidTemplatesByExpert(req.user.id);
        res.json(templates);
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update template
exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await getBidTemplateById(id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        if (template.expert_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this template' });
        }

        const updatedTemplate = await updateBidTemplate(id, req.body);
        res.json(updatedTemplate);
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await getBidTemplateById(id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        if (template.expert_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete this template' });
        }

        await deleteBidTemplate(id);
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Apply template (placeholder for analytics/usage tracking)
exports.applyTemplate = async (req, res) => {
    try {
        const { id, projectId } = req.params;
        const template = await getBidTemplateById(id);

        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        if (template.expert_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to use this template' });
        }

        await incrementUsageCount(id);

        // Return the template data to be used by the frontend
        res.json(template);
    } catch (error) {
        console.error('Apply template error:', error);
        res.status(500).json({ message: error.message });
    }
};
