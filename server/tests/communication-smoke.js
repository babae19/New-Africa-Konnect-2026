const assert = require('node:assert/strict');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const client = { id: '11111111-1111-4111-8111-111111111111', role: 'client', name: 'Client' };
const expert = { id: '22222222-2222-4222-8222-222222222222', role: 'expert', name: 'Expert' };
const projectId = '33333333-3333-4333-8333-333333333333';
const project = { id: projectId, client_id: client.id, client_name: client.name, title: 'Private project', status: 'draft', expert_status: null };
const sent = [];
const notifications = [];
const emitted = [];
const io = { to: room => ({ emit: (event, value) => emitted.push({ room, event, value }) }) };
const mock = (modulePath, exports) => {
    const filename = require.resolve(path.join(root, modulePath));
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
};
mock('models/userModel', { findUserById: async id => [client, expert].find(user => user.id === id) });
mock('models/projectModel', {
    getProjectById: async () => project,
    isMember: async () => false,
    assignExpert: async (id, expertId) => {
        if (project.expert_status === 'pending') return null;
        Object.assign(project, { selected_expert_id: expertId, expert_status: 'pending' });
        return { ...project };
    },
    updateExpertStatus: async (id, status) => ({ ...project, expert_status: status }),
    addMember: async () => null,
    getProjectMembers: async () => [{ user_id: client.id }]
});
mock('models/projectStateMachine', {
    getStateHistory: async () => [{ to_state: 'draft' }],
    transitionState: async (id, state) => ({ ...project, status: state })
});
mock('models/messageModel', {
    createMessage: async data => { const message = { id: String(sent.length + 1), ...data }; sent.push(message); return message; },
    getMessagesByProject: async () => [], getMessageById: async () => null,
    markAsRead: async () => null, markProjectMessagesAsRead: async () => [],
    getUnreadCount: async () => 0, getAllUnreadMessages: async () => [],
    getDirectMessages: async () => sent, getDirectChatUsers: async () => [], deleteMessage: async () => null
});
mock('models/contractModel', { getContractsByProject: async () => [], createContract: async () => ({}) });
mock('models/notificationModel', { createNotification: async fields => {
    const notification = { id: String(notifications.length + 1), ...fields };
    notifications.push(notification);
    return notification;
} });
mock('models/notificationPreferenceModel', { getUserPreferences: async () => ({ email_enabled: false }) });
mock('services/emailService', { sendNotificationEmail: async () => null });
mock('services/projectMatchingService', { processProjectMatches: async () => null });
const messages = require('../controllers/messageController');
const projects = require('../controllers/projectController');
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const request = (user, body, params = {}) => ({ user, body, params, app: { get: () => io } });

async function run() {
    const clientMessage = response();
    await messages.sendMessage(request(client, { receiverId: expert.id, content: 'Hello' }), clientMessage);
    assert.equal(clientMessage.statusCode, 201);
    const expertReply = response();
    await messages.sendMessage(request(expert, { receiverId: client.id, content: 'Hello back' }), expertReply);
    assert.equal(expertReply.statusCode, 201);
    assert.equal(sent.length, 2);
    assert.ok(emitted.some(item => item.room === `user_${expert.id}` && item.event === 'new_direct_message'));
    // Notification writes match the real notifications table's title/message/link columns.
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(notifications[0].type, 'message_received');
    assert.match(notifications[0].link, /view=messages/);
    const selfMessage = response();
    await messages.sendMessage(request(expert, { receiverId: expert.id, content: 'No' }), selfMessage);
    assert.equal(selfMessage.statusCode, 400);

    const invite = response();
    await projects.inviteExpert(request(client, { expertId: expert.id }, { id: projectId }), invite);
    assert.equal(invite.statusCode, 200);
    assert.equal(project.expert_status, 'pending');
    assert.ok(emitted.some(item => item.room === `user_${expert.id}` && item.event === 'project_invite'));
    assert.ok(notifications.some(item => item.type === 'project_invite' && item.link.endsWith('/expert-dashboard')));
    const duplicate = response();
    await projects.inviteExpert(request(client, { expertId: expert.id }, { id: projectId }), duplicate);
    assert.equal(duplicate.statusCode, 409);
    const view = response();
    await projects.getProject(request(expert, {}, { id: projectId }), view);
    assert.equal(view.statusCode, 200);
    const stranger = response();
    await projects.getProject(request({ id: '44444444-4444-4444-8444-444444444444', role: 'expert' }, {}, { id: projectId }), stranger);
    assert.equal(stranger.statusCode, 403);
    const hiddenMembers = response();
    await projects.getMembers(request({ id: '44444444-4444-4444-8444-444444444444', role: 'expert' }, {}, { id: projectId }), hiddenMembers);
    assert.equal(hiddenMembers.statusCode, 403);
    const hiddenHistory = response();
    await projects.getHistory(request({ id: '44444444-4444-4444-8444-444444444444', role: 'expert' }, {}, { id: projectId }), hiddenHistory);
    assert.equal(hiddenHistory.statusCode, 403);
    console.log('Communication smoke checks passed: bidirectional DMs, invitation consent, duplicate rejection, and private project access controls.');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
