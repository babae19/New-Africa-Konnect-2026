const { createProject, getProjectById } = require('./controllers/projectController');
const { createContract, updateContractStatus } = require('./models/contractModel'); // Direct model access for speed
const { query } = require('./database/db');

// Mock req/res for controller testing
const mockReq = (body = {}, user = {}) => ({
    body,
    user,
    params: {},
    app: { get: () => null } // mock storage for io
});

const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.data = data;
        return res;
    };
    return res;
};

async function verifyAuditFixes() {
    console.log('🚀 Starting Audit Fix Verification...');

    try {
        // 1. Setup Test User
        const userRes = await query(`SELECT id FROM users LIMIT 1`);
        const userId = userRes.rows[0].id;
        console.log(`👤 Using Test User ID: ${userId}`);

        // 2. Verify Project Deadline & Duration
        console.log('\n📅 Verifying Project Deadline...');
        const deadline = new Date('2026-12-31').toISOString();
        const duration = '6 months';

        const projectData = {
            clientId: userId,
            title: 'Audit Test Project ' + Date.now(),
            description: 'Testing audit fields',
            budget: 5000,
            status: 'draft',
            techStack: ['Node.js'],
            deadline, // NEW FIELD
            duration  // NEW FIELD
        };

        // Creating project directly via DB query to ensure model handles it
        // (Simulating controller call to model)
        const { createProject } = require('./models/projectModel');
        const project = await createProject(projectData);

        if (project.deadline && project.duration === duration) {
            console.log('✅ Project created with Deadline and Duration!');
        } else {
            console.error('❌ FAILED: Project missing deadline or duration', project);
        }

        // 3. Verify Digital Signature Metadata
        console.log('\n✍️  Verifying Digital Signature...');
        const contractData = {
            projectId: project.id,
            expertId: userId, // Self-contract for testing
            clientId: userId,
            terms: 'Sign me',
            amount: 1000,
            status: 'pending'
        };

        const { createContract } = require('./models/contractModel');
        const contract = await createContract(contractData);

        const metadata = {
            ip: '127.0.0.1',
            userAgent: 'AuditScript/1.0',
            timestamp: new Date().toISOString(),
            consent: true
        };

        const { updateContractStatus } = require('./models/contractModel');
        const signedContract = await updateContractStatus(contract.id, 'signed', metadata);

        if (signedContract.signature_metadata && signedContract.signature_metadata.ip === '127.0.0.1') {
            console.log('✅ Contract signed with Metadata!');
            console.log('   Metadata:', JSON.stringify(signedContract.signature_metadata));
        } else {
            console.error('❌ FAILED: Contract missing signature metadata', signedContract);
        }

        console.log('\n✨ Verification Complete!');
        process.exit(0);

    } catch (error) {
        console.error('💥 Verification Failed:', error);
        process.exit(1);
    }
}

verifyAuditFixes();
