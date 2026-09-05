const {
    createTransaction,
    getTransactionsByProject,
    getProjectEscrowBalance
} = require('../models/transactionModel');
const { getProjectById, updateProject } = require('../models/projectModel');
const { getContractsByProject, updateContract } = require('../models/contractModel');
const { getIO } = require('../socket');

// Fund Escrow (Mock Payment)
exports.fundEscrow = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { amount } = req.body;
        const clientId = req.user.id;

        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Verify client ownership
        if (project.client_id !== clientId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Get contract
        const contracts = await getContractsByProject(projectId);
        const contract = contracts.find(c => c.status === 'signed' || c.status === 'active' || c.status === 'pending'); // Allow funding pending? usually signed.

        if (!contract) {
            return res.status(400).json({ message: 'No active/signed contract found to fund.' });
        }

        // Create Transaction
        const transaction = await createTransaction({
            projectId,
            contractId: contract.id,
            senderId: clientId,
            recipientId: contract.expert_id, // Funds technically go to "Escrow", but we mark recipient as expert for clarity or use a system account. Let's use expert ID but status 'held'. 
            // Simplified: 'escrow_funding' type implies held. Recipient is the ultimate destination.
            amount: parseFloat(amount),
            type: 'escrow_funding',
            status: 'completed', // Mock success
            description: 'Escrow funding for project'
        });

        // Update Contract/Project Status
        // If funding covers total, mark as active?
        // Let's just update contract to 'active' if it was signed.
        if (contract.status === 'signed') {
            await updateContract(contract.id, { status: 'active' });
        }

        // Create Notification for Expert
        const { sendNotification } = require('../services/notificationService');
        await sendNotification(
            contract.expert_id,
            'payment',
            {
                amount: amount,
                projectTitle: project.title,
                link: `/projects/${projectId}/payments`
            },
            req.app.get('io')
        );

        // Notify
        const io = getIO();
        io.to(`project_${projectId}`).emit('project_update', {
            projectId,
            type: 'funding_received',
            amount
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Fund escrow error:', error);
        res.status(500).json({ message: 'Server error funding escrow' });
    }
};

// Release Funds
exports.releaseFunds = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { amount } = req.body; // Optional partial release? Let's assume full or specified.
        const clientId = req.user.id;

        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.client_id !== clientId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Check balance
        const balance = await getProjectEscrowBalance(projectId);
        const releaseAmount = parseFloat(amount || balance); // Default to full balance if not specified

        if (releaseAmount > balance) {
            return res.status(400).json({ message: 'Insufficient escrow balance' });
        }

        // Get contract
        const contracts = await getContractsByProject(projectId);
        const contract = contracts[0]; // Assuming 1 active

        // Create Transaction
        const transaction = await createTransaction({
            projectId,
            contractId: contract ? contract.id : null,
            senderId: clientId, // Technically from Escrow, but tracked as from Client approval
            recipientId: contract ? contract.expert_id : project.selected_expert_id,
            amount: releaseAmount,
            type: 'payment_release',
            status: 'completed',
            description: 'Release of funds to expert'
        });

        // Create Notification for Expert
        const expertId = contract ? contract.expert_id : project.selected_expert_id;
        const { sendNotification } = require('../services/notificationService');
        await sendNotification(
            expertId,
            'payment_released',
            {
                amount: releaseAmount,
                projectTitle: project.title,
                link: `/projects/${projectId}/payments`
            },
            req.app.get('io')
        );

        const io = getIO();
        io.to(`project_${projectId}`).emit('project_update', {
            projectId,
            type: 'funds_released',
            amount: releaseAmount
        });

        res.json(transaction);
    } catch (error) {
        console.error('Release funds error:', error);
        res.status(500).json({ message: 'Server error releasing funds' });
    }
};

// Get History
exports.getHistory = async (req, res) => {
    try {
        const { projectId } = req.params;
        const transactions = await getTransactionsByProject(projectId);
        res.json(transactions);
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({ message: error.message });
    }
}
