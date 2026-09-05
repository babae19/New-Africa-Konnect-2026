const {
    createEscrowAccount,
    getEscrowByProject,
    updateEscrowBalance
} = require('../models/escrowModel');

const {
    createReleaseRequest,
    approveRelease,
    markAsReleased,
    getReleasesByEscrow
} = require('../models/paymentReleaseModel');

const { createInvoice } = require('../models/invoiceModel');
const { getProjectById } = require('../models/projectModel');
const { sendNotification } = require('../services/notificationService');
const { createPaymentIntent, transferFunds } = require('../services/paymentGatewayService');

// Initialize escrow for a project
exports.initEscrow = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { amount } = req.body; // Usually project budget

        // Check if escrow already exists
        const existing = await getEscrowByProject(projectId);
        if (existing) {
            return res.status(400).json({ message: 'Escrow account already exists' });
        }

        const escrow = await createEscrowAccount(projectId, amount);

        // Notify expert
        const project = await getProjectById(projectId);
        if (project.selected_expert_id) {
            await sendNotification(project.selected_expert_id, 'payment', {
                message: `Escrow account funded for ${project.title}`,
                amount: amount
            });
        }

        // Get releases
        const releases = await getReleasesByEscrow(escrow.id);

        res.json({
            ...escrow,
            releases
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get escrow details
exports.getEscrow = async (req, res) => {
    try {
        const { projectId } = req.params;
        const escrow = await getEscrowByProject(projectId);

        if (!escrow) {
            return res.status(404).json({ message: 'Escrow not found' });
        }

        // Get releases
        const releases = await getReleasesByEscrow(escrow.id);

        res.json({
            ...escrow,
            releases
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Request release
exports.requestRelease = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { milestoneId, amount } = req.body;

        const escrow = await getEscrowByProject(projectId);
        if (!escrow) {
            return res.status(404).json({ message: 'Escrow not found' });
        }

        // Calculate fees
        const platformFeePercent = parseFloat(escrow.platform_fee_percent);
        const platformFee = (amount * platformFeePercent) / 100;
        const expertReceives = amount - platformFee;

        const release = await createReleaseRequest({
            escrowAccountId: escrow.id,
            milestoneId,
            amount,
            platformFee,
            expertReceives,
            requestedBy: req.user.id
        });

        // Notify client to approve
        const project = await getProjectById(projectId);
        await sendNotification(project.client_id, 'payment', {
            message: `Payment release requested for ${project.title}`,
            amount: amount,
            actionUrl: `/projects/${projectId}/payments`
        });

        res.status(201).json(release);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Approve release
exports.approveRelease = async (req, res) => {
    try {
        const { projectId, releaseId } = req.params;

        // Verify ownership/client role
        const project = await getProjectById(projectId);
        if (project.client_id !== req.user.id) {
            return res.status(403).json({ message: 'Only client can approve releases' });
        }

        // 1. Mark as approved in DB
        const release = await approveRelease(releaseId, req.user.id);

        // 2. Process Transfer (Mock)
        await transferFunds(release.expert_receives, 'expert_account_id');

        // 3. Mark as Released
        const finalRelease = await markAsReleased(releaseId);

        // 4. Update Escrow Balance
        await updateEscrowBalance(release.escrow_account_id, release.amount);

        // 5. Generate Invoice
        await createInvoice({
            projectId,
            amount: release.amount,
            platformFee: release.platform_fee,
            issuedTo: req.user.id
        });

        // Notify Expert
        await sendNotification(project.selected_expert_id, 'payment_released', {
            amount: release.expert_receives,
            projectTitle: project.title
        });

        res.json(finalRelease);
    } catch (error) {
        console.error('Approve release error:', error);
        res.status(500).json({ message: error.message });
    }
};
