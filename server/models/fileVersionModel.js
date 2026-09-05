const { query } = require('../database/db');

/**
 * Create a new file version
 */
const createFileVersion = async (versionData) => {
    const { fileId, versionNumber, filePath, fileSize, uploadedBy, changesDescription } = versionData;

    const text = `
        INSERT INTO file_versions (
            file_id, version_number, file_path, file_size, uploaded_by, changes_description
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
    `;

    const result = await query(text, [
        fileId, versionNumber, filePath, fileSize, uploadedBy, changesDescription
    ]);
    return result.rows[0];
};

/**
 * Get file versions
 */
const getFileVersions = async (fileId) => {
    const text = `
        SELECT v.*, u.name as uploader_name
        FROM file_versions v
        LEFT JOIN users u ON v.uploaded_by = u.id
        WHERE v.file_id = $1
        ORDER BY v.version_number DESC
    `;

    const result = await query(text, [fileId]);
    return result.rows;
};

module.exports = {
    createFileVersion,
    getFileVersions
};
