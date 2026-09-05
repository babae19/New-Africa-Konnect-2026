const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Upload file (Generic) - Stores in 'uploads' bucket
exports.uploadFile = async (req, res) => {
    try {
        let { projectId, name, type, size, data } = req.body;
        let buffer, contentType;

        // Handle Multipart/Form-Data (Multer)
        if (req.file) {
            buffer = req.file.buffer;
            contentType = req.file.mimetype;
            name = name || req.file.originalname;
            size = size || req.file.size;
        }
        // Handle Base64 (JSON)
        else if (data) {
            const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                contentType = matches[1];
                buffer = Buffer.from(matches[2], 'base64');
            } else {
                return res.status(400).json({ message: "Invalid data format" });
            }
        } else {
            return res.status(400).json({ message: "No file data provided" });
        }

        if (!projectId) return res.status(400).json({ message: "Project ID is required" });

        const filename = `${projectId}/${uuidv4()}-${name}`; // Organize by project

        const { data: uploadData, error } = await supabase
            .storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: contentType || type,
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);

        // Save metadata to DB (using existing model)
        const { createFile } = require('../models/fileModel');
        const fileRecord = await createFile({
            projectId,
            name,
            type: contentType,
            size,
            url: publicUrl, // Storing URL is key
            uploadedBy: req.user ? req.user.name : 'System'
        });

        // Real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(`project_${projectId}`).emit('file_uploaded', fileRecord);
        }

        res.status(201).json(fileRecord);

    } catch (error) {
        console.error('Supabase Upload Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Upload Image (Profile/Assets) - Returns URL directly
exports.uploadImage = async (req, res) => {
    try {
        const { data, name } = req.body;
        if (!data) return res.status(400).json({ message: 'No image data' });

        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches) return res.status(400).json({ message: 'Invalid base64' });

        const type = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const extension = type.split('/')[1] || 'png';
        const filename = `images/${uuidv4()}.${extension}`;

        const { error } = await supabase
            .storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: type,
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);

        res.json({ url: publicUrl });

    } catch (error) {
        console.error('Supabase Image Upload Error:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.getProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { getFilesByProject } = require('../models/fileModel');
        const files = await getFilesByProject(projectId);
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Download File - Redirect to Public URL
exports.downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { getFileById } = require('../models/fileModel');
        const file = await getFileById(id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // If it's a Supabase URL, redirect
        if (file.url.startsWith('http')) {
            return res.redirect(file.url);
        }

        // Legacy local file handling (optional, if mixed content)
        res.status(400).json({ message: 'File is not accessible via Supabase' });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete File
exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { getFileById, deleteFile } = require('../models/fileModel');

        const file = await getFileById(id);
        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        // Try to delete from Supabase if it's a supabase URL
        if (file.url.includes('supabase')) {
            try {
                // Extract path from URL - URL is like .../storage/v1/object/public/uploads/path/to/file
                const path = file.url.split('/uploads/')[1];
                if (path) {
                    await supabase.storage.from('uploads').remove([path]);
                }
            } catch (err) {
                console.error('Supabase delete error (non-fatal):', err);
            }
        }

        await deleteFile(id);
        res.json({ message: 'File deleted' });

    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ message: error.message });
    }
};
