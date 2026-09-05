const express = require('express');
const router = express.Router();
const {
    createContract,
    getContract,
    getProjectContracts,
    getUserContracts,
    signContract,
    updateStatus,
    updateContract
} = require('../controllers/contractController');
const { protect } = require('../middleware/authMiddleware');
const { validateContract, validateId } = require('../middleware/validationMiddleware');

// All routes require authentication
router.use(protect);

// Create contract
router.post('/', validateContract, createContract);

// Get user's contracts
router.get('/user', getUserContracts);

// Get specific contract
router.get('/:id', validateId, getContract);

// Get contracts for a project
router.get('/project/:projectId', validateId, getProjectContracts);

// Sign contract
router.put('/:id/sign', validateId, signContract);

// Update contract status
router.put('/:id/status', validateId, updateStatus);

// Update contract
router.put('/:id', validateId, validateContract, updateContract);

module.exports = router;
