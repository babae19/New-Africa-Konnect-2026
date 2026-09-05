const { query } = require('../database/db');

/**
 * Generate invoice
 */
const createInvoice = async (invoiceData) => {
    const { projectId, amount, platformFee, issuedTo } = invoiceData;

    // Simple invoice number generation logic
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const invoiceNumber = `INV-${dateStr}-${randomStr}`;

    const totalAmount = parseFloat(amount) + parseFloat(platformFee || 0);

    const text = `
        INSERT INTO invoices (
            project_id, invoice_number, amount, platform_fee, 
            total_amount, issued_to, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, 'pending')
        RETURNING *
    `;

    const result = await query(text, [
        projectId, invoiceNumber, amount, platformFee || 0, totalAmount, issuedTo
    ]);
    return result.rows[0];
};

/**
 * Get invoices for a project
 */
const getInvoicesByProject = async (projectId) => {
    const text = `
        SELECT * FROM invoices
        WHERE project_id = $1
        ORDER BY issued_at DESC
    `;
    const result = await query(text, [projectId]);
    return result.rows;
};

/**
 * Get invoice by number
 */
const getInvoiceByNumber = async (invoiceNumber) => {
    const text = `
        SELECT i.*, p.title as project_title, u.name as client_name, u.email as client_email
        FROM invoices i
        JOIN projects p ON i.project_id = p.id
        JOIN users u ON i.issued_to = u.id
        WHERE i.invoice_number = $1
    `;
    const result = await query(text, [invoiceNumber]);
    return result.rows[0];
};

module.exports = {
    createInvoice,
    getInvoicesByProject,
    getInvoiceByNumber
};
