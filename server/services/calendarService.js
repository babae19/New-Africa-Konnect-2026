const crypto = require('crypto');

const getAccessToken = async () => {
    if (process.env.GOOGLE_CALENDAR_ACCESS_TOKEN) return process.env.GOOGLE_CALENDAR_ACCESS_TOKEN;
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
        const error = new Error('Google Meet is not configured. Add Google Calendar OAuth credentials on the server.');
        error.code = 'GOOGLE_MEET_NOT_CONFIGURED';
        throw error;
    }
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: GOOGLE_CLIENT_ID, client_secret: GOOGLE_CLIENT_SECRET, refresh_token: GOOGLE_REFRESH_TOKEN, grant_type: 'refresh_token' })
    });
    if (!response.ok) throw new Error('Google authorization could not be refreshed. Reconnect the Google Calendar account.');
    return (await response.json()).access_token;
};

const createCalendarEvent = async ({ summary, description, startTime, endTime, attendees = [] }) => {
    const token = await getAccessToken();
    const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || 'primary');
    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            summary, description,
            start: { dateTime: new Date(startTime).toISOString() },
            end: { dateTime: new Date(endTime).toISOString() },
            attendees: attendees.filter(Boolean).map(email => ({ email })),
            conferenceData: { createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } } }
        })
    });
    if (!response.ok) {
        console.error('Google Calendar API error:', response.status, await response.text());
        throw new Error('Google Meet could not be created. Verify Calendar API access and try again.');
    }
    const event = await response.json();
    const meetingLink = event.hangoutLink || event.conferenceData?.entryPoints?.find(point => point.entryPointType === 'video')?.uri;
    if (!meetingLink) throw new Error('Google created the calendar event without a Meet link.');
    return { id: event.id, status: event.status, htmlLink: event.htmlLink, meetingLink };
};

const generateMeetingLink = async details => (await createCalendarEvent(details)).meetingLink;
const sendInvite = async () => true;

module.exports = {
    createCalendarEvent,
    generateMeetingLink,
    sendInvite
};
