const assert = require('assert');
const path = require('path');
const fs = require('fs');

process.env.JWT_SECRET = 'production-smoke-test-secret-with-sufficient-length';
process.env.NODE_ENV = 'test';

const serverRoot = path.resolve(__dirname, '..');
const userModelPath = require.resolve(path.join(serverRoot, 'models/userModel'));
const expertModelPath = require.resolve(path.join(serverRoot, 'models/expertModel'));
const emailServicePath = require.resolve(path.join(serverRoot, 'services/emailService'));
const auditLoggerPath = require.resolve(path.join(serverRoot, 'middleware/auditLogger'));

const users = new Map([
    ['client@example.com', {
        id: '11111111-1111-4111-8111-111111111111', name: 'Test Client',
        email: 'client@example.com', role: 'client', password_hash: 'valid', email_verified: true
    }],
    ['expert@example.com', {
        id: '22222222-2222-4222-8222-222222222222', name: 'Test Expert',
        email: 'expert@example.com', role: 'expert', password_hash: 'valid', email_verified: true
    }]
]);
const sessions = [];

const userModelMock = {
    createUser: async () => null,
    findUserByEmail: async email => users.get(email),
    findUserById: async id => [...users.values()].find(user => user.id === id),
    verifyPassword: async (password, hash) => password === 'Correct1!' && hash === 'valid',
    generateVerificationToken: async () => ({ token: 'verification-token' }),
    verifyEmail: async () => null,
    updateLastLogin: async () => {},
    createSession: async (userId, tokens) => {
        const session = { id: `session-${sessions.length + 1}`, user_id: userId, ...tokens };
        sessions.push(session);
        return session;
    },
    getActiveSessions: async () => sessions,
    revokeSession: async () => null,
    revokeOtherSessions: async (userId, currentId) => {
        const revoked = sessions.filter(session => session.user_id === userId && session.id !== currentId);
        for (const session of revoked) sessions.splice(sessions.indexOf(session), 1);
        return revoked;
    },
    updatePassword: async () => {},
    generatePasswordResetToken: async () => ({}),
    verifyPasswordResetToken: async () => null,
    updateUser: async () => null,
    revokeSessionByToken: async token => {
        const index = sessions.findIndex(session => session.token === token || session.refreshToken === token);
        return index >= 0 ? sessions.splice(index, 1)[0] : null;
    },
    findSessionByToken: async token => sessions.find(session => session.token === token || session.refreshToken === token),
    updateSessionActivity: async () => {}
};

require.cache[userModelPath] = { id: userModelPath, filename: userModelPath, loaded: true, exports: userModelMock };
require.cache[expertModelPath] = { id: expertModelPath, filename: expertModelPath, loaded: true, exports: {
    createExpertProfile: async () => ({}), getExpertProfile: async () => ({ completeness_percentage: 100 })
} };
require.cache[emailServicePath] = { id: emailServicePath, filename: emailServicePath, loaded: true, exports: {
    sendVerificationEmail: async () => {}, sendWelcomeEmail: async () => {}, sendPasswordResetEmail: async () => {}
} };
require.cache[auditLoggerPath] = { id: auditLoggerPath, filename: auditLoggerPath, loaded: true, exports: {
    logAuth: async () => {}, AUDIT_ACTIONS: { LOGIN_SUCCESS: 'login', LOGIN_FAILED: 'failed', LOGOUT: 'logout' }
} };

const authController = require(path.join(serverRoot, 'controllers/authController'));
const { authorize } = require(path.join(serverRoot, 'middleware/authMiddleware'));

const response = () => ({
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
});

async function login(email, password = 'Correct1!') {
    const req = { body: { email, password }, ip: '127.0.0.1', headers: { 'user-agent': 'smoke-test' } };
    const res = response();
    await authController.loginUser(req, res);
    return res;
}

async function run() {
    const client = await login('client@example.com');
    assert.equal(client.statusCode, 200);
    assert.equal(client.body.role, 'client');
    assert.ok(client.body.token && client.body.refreshToken);

    const expert = await login('expert@example.com');
    assert.equal(expert.statusCode, 200);
    assert.equal(expert.body.role, 'expert');
    assert.ok(expert.body.token && expert.body.refreshToken);

    const rejected = await login('client@example.com', 'wrong');
    assert.equal(rejected.statusCode, 401);

    let clientAllowed = false;
    authorize('client')({ user: users.get('client@example.com') }, response(), () => { clientAllowed = true; });
    assert.equal(clientAllowed, true);
    const blocked = response();
    authorize('client')({ user: users.get('expert@example.com') }, blocked, () => {});
    assert.equal(blocked.statusCode, 403);

    // Ensure "revoke others" retains the token making the request.
    await login('client@example.com');
    const current = sessions.find(session => session.user_id === users.get('client@example.com').id);
    const revokeRes = response();
    await authController.revokeAllOtherSessions({
        user: users.get('client@example.com'), headers: { authorization: `Bearer ${current.token}` }
    }, revokeRes);
    assert.equal(revokeRes.statusCode, 200);
    assert.ok(sessions.some(session => session.id === current.id));

    const apiSource = fs.readFileSync(path.resolve(serverRoot, '../src/lib/api.js'), 'utf8');
    assert.match(apiSource, /`\/projects\/\$\{projectId\}\/escrow`/);
    assert.match(apiSource, /`\/projects\/\$\{projectId\}\/releases\/\$\{releaseId\}\/approve`/);
    assert.match(apiSource, /approveRelease:[\s\S]*?method: 'PUT'/);

    console.log('Production smoke checks passed: client login, expert login, role guards, session retention, and payment API contracts.');
}

run().catch(error => {
    console.error(error);
    process.exit(1);
});
