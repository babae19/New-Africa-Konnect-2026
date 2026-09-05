const {
    createBid,
    getBidById,
    getBidsByProject,
    getBidsByExpert,
    updateBidStatus,
    updateBid,
    deleteBid,
    rejectOtherBids
} = require('../models/bidModel');
const { getProjectById, updateProject } = require('../models/projectModel');
const { createContract } = require('../models/contractModel');
const { NOTIFICATION_TYPES, emitNotification, emitToMultipleUsers } = require('../utils/biddingNotifications');
const { getIO } = require('../socket');

// Submit a bid on a project
exports.submitBid = async (req, res) => {
    try {
        const { projectId } = req.params;
        const expertId = req.user.id;
        const { bidAmount, proposedTimeline, proposedDuration, coverLetter, portfolioLinks } = req.body;

        // Verify user is an expert
        if (req.user.role !== 'expert') {
            return res.status(403).json({ message: 'Only experts can submit bids' });
        }

        // Verify project exists and is open for bidding
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (!project.open_for_bidding) {
            return res.status(400).json({ message: 'Project is not open for bidding' });
        }

        // Check if bidding deadline has passed
        if (project.bidding_deadline && new Date(project.bidding_deadline) < new Date()) {
            return res.status(400).json({ message: 'Bidding deadline has passed' });
        }

        // Validate bid amount is within budget range
        if (project.min_budget && bidAmount < project.min_budget) {
            return res.status(400).json({ message: `Bid amount must be at least $${project.min_budget}` });
        }
        if (project.max_budget && bidAmount > project.max_budget) {
            return res.status(400).json({ message: `Bid amount must not exceed $${project.max_budget}` });
        }

        // Create the bid
        const bid = await createBid({
            projectId,
            expertId,
            bidAmount,
            proposedTimeline,
            proposedDuration,
            coverLetter,
            portfolioLinks
        });

        // Send notification to client
        const io = getIO();
        if (io) {
            emitNotification(io, project.client_id, NOTIFICATION_TYPES.NEW_BID, {
                expertName: req.user.name,
                bidAmount: bidAmount.toLocaleString(),
                projectTitle: project.title,
                projectId: projectId
            });

            // Real-time broadcast to project room for monitoring
            io.to(`project_${projectId}`).emit('new_bid', {
                projectId,
                expertName: req.user.name,
                bidAmount: bidAmount
            });
        }

        res.status(201).json(bid);
    } catch (error) {
        console.error('Submit bid error:', error);
        if (error.code === '23505') { // Unique constraint violation
            return res.status(400).json({ message: 'You have already submitted a bid for this project' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Get all bids for a project (client only)
exports.getBidsForProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { status } = req.query;

        // Verify project exists
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        // Verify user is the project owner
        if (project.client_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to view bids for this project' });
        }

        const bids = await getBidsByProject(projectId, { status });

        res.json({ bids, count: bids.length });
    } catch (error) {
        console.error('Get bids error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get expert's own bids
exports.getMyBids = async (req, res) => {
    try {
        const expertId = req.user.id;
        const { status } = req.query;

        const bids = await getBidsByExpert(expertId, { status });

        res.json({ bids, count: bids.length });
    } catch (error) {
        console.error('Get my bids error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Accept a bid (client only)
exports.acceptBid = async (req, res) => {
    try {
        const { projectId, bidId } = req.params;

        // Get bid details
        const bid = await getBidById(bidId);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Verify project ownership
        const project = await getProjectById(projectId);
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        if (project.client_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to accept bids for this project' });
        }

        // Update bid status to accepted
        const acceptedBid = await updateBidStatus(bidId, 'accepted');

        // Update project with selected expert
        await updateProject(projectId, {
            selectedExpertId: bid.expert_id,
            status: 'in_progress',
            open_for_bidding: false
        });

        // Create a contract automatically
        const contract = await createContract({
            projectId: projectId,
            expertId: bid.expert_id,
            clientId: project.client_id,
            amount: bid.bid_amount,
            terms: `Project: ${project.title}\nBid Amount: $${bid.bid_amount}\nTimeline: ${bid.proposed_timeline}\nProposal Detail: ${bid.cover_letter}`,
            status: 'pending' // Pending client funding/escrow
        });

        // Reject all other bids
        await rejectOtherBids(projectId, bidId);

        // Send notifications
        const io = getIO();
        if (io) {
            // Notify accepted expert
            emitNotification(io, bid.expert_id, NOTIFICATION_TYPES.BID_ACCEPTED, {
                projectTitle: project.title,
                bidId: bidId,
                contractId: contract.id
            });

            // Notify project assignment
            emitNotification(io, bid.expert_id, NOTIFICATION_TYPES.PROJECT_ASSIGNED, {
                projectTitle: project.title,
                projectId: projectId,
                contractId: contract.id
            });

            // Get all rejected bids and notify experts
            const rejectedBids = await getBidsByProject(projectId, { status: 'rejected' });
            const rejectedExpertIds = rejectedBids.map(b => b.expert_id);
            if (rejectedExpertIds.length > 0) {
                emitToMultipleUsers(io, rejectedExpertIds, NOTIFICATION_TYPES.BID_REJECTED, {
                    projectTitle: project.title
                });
            }

            // Real-time update to the project room
            io.to(`project_${projectId}`).emit('project_update', {
                projectId,
                type: 'bid_accepted',
                bid: acceptedBid,
                contract: contract
            });
        }

        res.json({ 
            bid: acceptedBid, 
            contract: contract,
            message: 'Bid accepted and contract created successfully' 
        });
    } catch (error) {
        console.error('Accept bid error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Reject a bid (client only)
exports.rejectBid = async (req, res) => {
    try {
        const { projectId, bidId } = req.params;

        // Verify project ownership
        const project = await getProjectById(projectId);
        if (project.client_id !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to reject bids for this project' });
        }

        const rejectedBid = await updateBidStatus(bidId, 'rejected');

        // Send notification to expert
        const io = getIO();
        if (io) {
            const project = await getProjectById(projectId);
            emitNotification(io, rejectedBid.expert_id, NOTIFICATION_TYPES.BID_REJECTED, {
                projectTitle: project.title
            });
        }

        res.json({ bid: rejectedBid, message: 'Bid rejected' });
    } catch (error) {
        console.error('Reject bid error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Withdraw a bid (expert only)
exports.withdrawBid = async (req, res) => {
    try {
        const { bidId } = req.params;

        // Get bid details
        const bid = await getBidById(bidId);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Verify expert owns the bid
        if (bid.expert_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to withdraw this bid' });
        }

        // Can only withdraw pending bids
        if (bid.status !== 'pending') {
            return res.status(400).json({ message: 'Can only withdraw pending bids' });
        }

        const withdrawnBid = await updateBidStatus(bidId, 'withdrawn');

        res.json({ bid: withdrawnBid, message: 'Bid withdrawn successfully' });
    } catch (error) {
        console.error('Withdraw bid error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update a bid (expert only)
exports.updateBid = async (req, res) => {
    try {
        const { bidId } = req.params;
        const { bidAmount, proposedTimeline, proposedDuration, coverLetter, portfolioLinks } = req.body;

        // Get bid details
        const bid = await getBidById(bidId);
        if (!bid) {
            return res.status(404).json({ message: 'Bid not found' });
        }

        // Verify expert owns the bid
        if (bid.expert_id !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to update this bid' });
        }

        // Can only update pending bids
        if (bid.status !== 'pending') {
            return res.status(400).json({ message: 'Can only update pending bids' });
        }

        const updatedBid = await updateBid(bidId, {
            bidAmount,
            proposedTimeline,
            proposedDuration,
            coverLetter,
            portfolioLinks
        });

        res.json({ bid: updatedBid, message: 'Bid updated successfully' });
    } catch (error) {
        console.error('Update bid error:', error);
        res.status(500).json({ message: error.message });
    }
};
