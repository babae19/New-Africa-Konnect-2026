const {
    createContract,
    getContractById,
    getContractsByProject,
    getContractsByExpert,
    getContractsByClient,
    updateContractStatus,
    updateContract
} = require('../models/contractModel');
const { getProjectById } = require('../models/projectModel');

// Create new contract
exports.createContract = async (req, res) => {
    try {
        const { projectId, expertId, terms, amount } = req.body;
        const clientId = req.user.id;

        // Validate required fields
        if (!projectId || !expertId || !amount) {
            return res.status(400).json({ message: 'Project ID, expert ID, and amount are required' });
        }

        // Verify project belongs to client
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.client_id !== clientId && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to create contract for this project' });
        }

        // Verify expert is vetted
        const { getExpertProfile } = require('../models/expertModel');
        const expertProfile = await getExpertProfile(expertId);

        if (!expertProfile) {
            return res.status(404).json({ message: 'Expert profile not found' });
        }

        if (expertProfile.vetting_status !== 'verified') {
            return res.status(403).json({
                message: 'Cannot hire an expert who is not verified.',
                code: 'EXPERT_NOT_VERIFIED'
            });
        }

        const contract = await createContract({
            projectId,
            expertId,
            clientId,
            terms,
            amount,
            status: 'pending'
        });

        res.status(201).json(contract);
    } catch (error) {
        console.error('Create contract error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get contract by ID
exports.getContract = async (req, res) => {
    try {
        const { id } = req.params;

        const contract = await getContractById(id);

        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }

        // Check authorization
        if (contract.client_id !== req.user.id &&
            contract.expert_id !== req.user.id &&
            req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view this contract' });
        }

        res.json(contract);
    } catch (error) {
        console.error('Get contract error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get contracts by project
exports.getProjectContracts = async (req, res) => {
    try {
        const { projectId } = req.params;

        // Verify access to project
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const contracts = await getContractsByProject(projectId);

        res.json({
            count: contracts.length,
            contracts
        });
    } catch (error) {
        console.error('Get project contracts error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get user's contracts (expert or client)
exports.getUserContracts = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let contracts;
        if (role === 'expert') {
            contracts = await getContractsByExpert(userId);
        } else if (role === 'client') {
            contracts = await getContractsByClient(userId);
        } else {
            return res.status(400).json({ message: 'Invalid user role' });
        }

        res.json({
            count: contracts.length,
            contracts
        });
    } catch (error) {
        console.error('Get user contracts error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Sign contract
exports.signContract = async (req, res) => {
    try {
        const { id } = req.params;

        const contract = await getContractById(id);

        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }

        // Check if user is authorized to sign (either client or expert)
        if (contract.client_id !== req.user.id && contract.expert_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to sign this contract' });
        }

        // Update status to signed AND capture metadata
        // Request body should contain metadata like IP, user agent, consent timestamp
        const { signatureMetadata } = req.body;

        const updatedContract = await updateContractStatus(id, 'signed', signatureMetadata);

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.to(`project_${contract.project_id}`).emit('contract_updated', updatedContract);

            io.to(`project_${contract.project_id}`).emit('project_update', {
                id: contract.project_id,
                status: 'active', // Assuming signing makes it active
                contract_status: 'signed',
                updatedAt: new Date()
            });

            // Also notify via activity/message if needed
            io.to(`project_${contract.project_id}`).emit('activity_logged', {
                user: req.user.name || 'User',
                action: 'signed the contract',
                target: 'Agreement',
                timestamp: new Date()
            });
        }

        res.json(updatedContract);
    } catch (error) {
        console.error('Sign contract error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update contract status
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'signed', 'active', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid contract status' });
        }

        const contract = await getContractById(id);

        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }

        // Check authorization
        if (contract.client_id !== req.user.id &&
            contract.expert_id !== req.user.id &&
            req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this contract' });
        }

        const updatedContract = await updateContractStatus(id, status);

        res.json(updatedContract);
    } catch (error) {
        console.error('Update contract status error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update contract
exports.updateContract = async (req, res) => {
    try {
        const { id } = req.params;
        const { terms, amount, status } = req.body;

        const contract = await getContractById(id);

        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }

        // Only client can update contract details
        if (contract.client_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this contract' });
        }

        const updatedContract = await updateContract(id, {
            terms,
            amount,
            status
        });

        res.json(updatedContract);
    } catch (error) {
        console.error('Update contract error:', error);
        res.status(500).json({ message: error.message });
    }
};
