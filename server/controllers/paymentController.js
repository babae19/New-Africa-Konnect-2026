const {
    createEscrowAccount,
    getEscrowByProject,
    updateEscrowBalance
} = require('../models/escrowModel');

const {
    createReleaseRequest,
    getReleaseById,
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
        const fundingAmount = Number(amount);
        if (!Number.isFinite(fundingAmount) || fundingAmount <= 0) {
            return res.status(400).json({ message: 'A positive escrow amount is required' });
        }

        const project = await getProjectById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.client_id !== req.user.id) {
            return res.status(403).json({ message: 'Only the project client can fund escrow' });
        }

        // Check if escrow already exists
        const existing = await getEscrowByProject(projectId);
        if (existing) {
            return res.status(400).json({ message: 'Escrow account already exists' });
        }

        const escrow = await createEscrowAccount(projectId, fundingAmount);

        // Notify expert
        if (project.selected_expert_id) {
            await sendNotification(project.selected_expert_id, 'payment_received', {
                message: `Escrow account funded for ${project.title}`,
                amount: fundingAmount
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
        const project = await getProjectById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        const canView = project.client_id === req.user.id || project.selected_expert_id === req.user.id || req.user.role === 'admin';
        if (!canView) return res.status(403).json({ message: 'Not authorized to view this escrow' });

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
        const releaseAmount = Number(amount);
        if (!Number.isFinite(releaseAmount) || releaseAmount <= 0) {
            return res.status(400).json({ message: 'A positive release amount is required' });
        }

        const project = await getProjectById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.selected_expert_id !== req.user.id && project.client_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only project participants can request a release' });
        }

        const escrow = await getEscrowByProject(projectId);
        if (!escrow) {
            return res.status(404).json({ message: 'Escrow not found' });
        }
        const remainingBalance = Number(escrow.total_amount) - Number(escrow.released_amount || 0);
        if (releaseAmount > remainingBalance) {
            return res.status(400).json({ message: 'Release amount exceeds the available escrow balance' });
        }

        // Calculate fees
        const platformFeePercent = parseFloat(escrow.platform_fee_percent);
        const platformFee = (releaseAmount * platformFeePercent) / 100;
        const expertReceives = releaseAmount - platformFee;

        const release = await createReleaseRequest({
            escrowAccountId: escrow.id,
            milestoneId,
            amount: releaseAmount,
            platformFee,
            expertReceives,
            requestedBy: req.user.id
        });

        // Notify client to approve
        await sendNotification(project.client_id, 'payment_received', {
            message: `Payment release requested for ${project.title}`,
            amount: releaseAmount,
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
        if (!project) return res.status(404).json({ message: 'Project not found' });
        if (project.client_id !== req.user.id) {
            return res.status(403).json({ message: 'Only client can approve releases' });
        }

        const escrow = await getEscrowByProject(projectId);
        if (!escrow) return res.status(404).json({ message: 'Escrow not found' });
        const pendingRelease = await getReleaseById(releaseId);
        if (!pendingRelease || pendingRelease.escrow_account_id !== escrow.id) {
            return res.status(404).json({ message: 'Payment release not found for this project' });
        }
        if (pendingRelease.status !== 'pending') {
            return res.status(409).json({ message: 'This payment release has already been processed' });
        }

        // 1. Mark as approved in DB
        const release = await approveRelease(releaseId, req.user.id);
        if (!release) return res.status(409).json({ message: 'This payment release has already been processed' });

        // 2. Process Transfer (Mock)
        await transferFunds(release.expert_receives, 'expert_account_id');

        // 3. Mark as Released
        const finalRelease = await markAsReleased(releaseId);

        // 4. Update Escrow Balance
        const updatedEscrow = await updateEscrowBalance(release.escrow_account_id, release.amount);
        if (!updatedEscrow) {
            return res.status(409).json({ message: 'Escrow balance changed before this release could be completed' });
        }

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
