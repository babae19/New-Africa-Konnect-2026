const crypto = require('crypto');

const normalizeDomain = value => String(value || 'meet.jit.si')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');

/** Create an unguessable Jitsi room URL without paid APIs or OAuth. */
const createMeetingRoom = ({ projectId, purpose = 'meeting' } = {}) => {
    if (!projectId) throw new Error('Project ID is required to create a meeting room.');

    const domain = normalizeDomain(process.env.JITSI_DOMAIN);
    const projectPart = String(projectId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
    const purposePart = String(purpose).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'meeting';
    const secret = crypto.randomBytes(18).toString('hex');
    const roomName = `AfricaKonnect-${purposePart}-${projectPart}-${secret}`;

    return { provider: 'Jitsi Meet', roomName, meetingLink: `https://${domain}/${roomName}` };
};

module.exports = { createMeetingRoom, normalizeDomain };
