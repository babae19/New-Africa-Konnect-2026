const {
    createContract,
    getContractById,
    getContractsByProject,
    getContractsByExpert,
    getContractsByClient,
    updateContractStatus,
    updateContract,
    signContractParty
} = require('../models/contractModel');
const { getProjectById, updateProject, isMember } = require('../models/projectModel');

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

        if (!['verified', 'approved'].includes(expertProfile.vetting_status)) {
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

        const isParticipant = project.client_id === req.user.id ||
            (project.selected_expert_id === req.user.id && project.expert_status === 'accepted') ||
            await isMember(projectId, req.user.id);
        if (!isParticipant && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view contracts for this project' });
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
        if (contract.locked_at) {
            return res.status(409).json({ message: 'This contract is fully signed and cannot be changed' });
        }

        const party = contract.client_id === req.user.id ? 'client' : 'expert';
        const signatureMetadata = {
            ...(req.body.signatureMetadata || req.body || {}),
            signerId: req.user.id,
            signerName: req.user.name,
            party,
            signedAt: new Date().toISOString(),
            userAgent: req.headers['user-agent'],
            ip: req.ip
        };

        const updatedContract = await signContractParty(id, party, signatureMetadata);
        if (!updatedContract) {
            return res.status(409).json({ message: 'You have already signed this contract or it is locked' });
        }

        if (updatedContract.status === 'signed') {
            await updateProject(contract.project_id, { status: 'active' });
        }

        // Emit socket event for real-time updates
        const io = req.app.get('io');
        if (io) {
            io.to(`project_${contract.project_id}`).emit('contract_updated', updatedContract);

            if (updatedContract.status === 'signed') {
                io.to(`project_${contract.project_id}`).emit('project_update', {
                    id: contract.project_id,
                    status: 'active',
                    contract_status: updatedContract.status,
                    updatedAt: new Date()
                });
            }

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

        if (!['completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Contracts become signed and active only through the signing and funding workflows' });
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
        const { terms, amount } = req.body;

        if (terms !== undefined && (typeof terms !== 'string' || terms.length > 10000)) {
            return res.status(400).json({ message: 'Terms must be text no longer than 10000 characters' });
        }
        if (amount !== undefined && (!Number.isFinite(Number(amount)) || Number(amount) < 0)) {
            return res.status(400).json({ message: 'Amount must be a positive number' });
        }

        const contract = await getContractById(id);

        if (!contract) {
            return res.status(404).json({ message: 'Contract not found' });
        }

        // Both named parties may collaborate on a draft until both have signed.
        if (contract.client_id !== req.user.id && contract.expert_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to update this contract' });
        }

        if (contract.locked_at || contract.status === 'signed' || contract.client_signed_at || contract.expert_signed_at) {
            return res.status(409).json({ message: 'A signed contract cannot be edited' });
        }

        const updatedContract = await updateContract(id, {
            terms,
            amount
        });

        if (!updatedContract) return res.status(409).json({ message: 'Contract is locked' });

        const io = req.app.get('io');
        if (io) io.to(`project_${contract.project_id}`).emit('contract_updated', updatedContract);

        res.json(updatedContract);
    } catch (error) {
        console.error('Update contract error:', error);
        res.status(500).json({ message: error.message });
    }
};
