import ConnectyCube from 'connectycube';

const credentials = {
  appId: import.meta.env.VITE_CONNECTYCUBE_APP_ID,
  authKey: import.meta.env.VITE_CONNECTYCUBE_AUTH_KEY,
  authSecret: import.meta.env.VITE_CONNECTYCUBE_AUTH_SECRET
};

const config = {
  debug: { mode: 1 }, // Set to 0 in production
  conference: { server: 'wss://janus.connectycube.com:8089' }
};

ConnectyCube.init(credentials, config);

export const createConnectyCubeSession = async (userData) => {
  try {
    const session = await ConnectyCube.createSession();
    
    // Deterministic login based on app user ID
    const userCredentials = {
      login: `user_${userData.id.replace(/-/g, '_')}`,
      password: `pass_${userData.id.slice(0, 8)}`,
      full_name: userData.name || 'User',
      external_id: userData.id
    };

    try {
      // Try to login
      const loggedInUser = await ConnectyCube.login(userCredentials);
      return loggedInUser;
    } catch (loginError) {
      // If login fails, try to signup then login
      await ConnectyCube.users.signup(userCredentials);
      const loggedInUser = await ConnectyCube.login(userCredentials);
      return loggedInUser;
    }
  } catch (error) {
    console.error('ConnectyCube session error:', error);
    throw error;
  }
};

export const createMeeting = async (title, attendeeIds = []) => {
  const params = {
    name: title,
    attendees: attendeeIds.map(id => ({ id })),
    record: false,
    chat: true
  };

  return ConnectyCube.meetings.create(params);
};

export default ConnectyCube;
