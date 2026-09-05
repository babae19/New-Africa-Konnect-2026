const { query } = require('../database/db');

// Create file
const createFile = async (fileData) => {
    const { projectId, name, type, size, data, uploadedBy } = fileData;

    const text = `
        INSERT INTO files (project_id, name, type, size, data, uploaded_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, project_id, name, type, size, uploaded_by, uploaded_at
    `; // Don't return data to keep response light

    const values = [projectId, name, type, size, data, uploadedBy];

    const result = await query(text, values);
    return result.rows[0];
};

// Get files by project
const getFilesByProject = async (projectId) => {
    const text = `
        SELECT id, project_id, name, type, size, uploaded_by, uploaded_at 
        FROM files 
        WHERE project_id = $1 
        ORDER BY uploaded_at DESC
    `; // Exclude data column for list
    const result = await query(text, [projectId]);
    return result.rows;
};

// Get file content
const getFileById = async (id) => {
    const text = 'SELECT * FROM files WHERE id = $1';
    const result = await query(text, [id]);
    return result.rows[0];
};

// Delete file
const deleteFile = async (id) => {
    const text = 'DELETE FROM files WHERE id = $1 RETURNING id';
    const result = await query(text, [id]);
    return result.rows[0];
};

module.exports = {
    createFile,
    getFilesByProject,
    getFileById,
    deleteFile
};
