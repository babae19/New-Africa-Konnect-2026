const API_URL = import.meta.env.VITE_API_URL || 'https://africa-konnect-api.onrender.com/api';

const getHeaders = (contentType = 'application/json') => {
    const headers = {};
    if (contentType) {
        headers['Content-Type'] = contentType;
    }
    const user = JSON.parse(localStorage.getItem('userInfo'));
    if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
    }
    return headers;
};


// Debug Helper
const debugLog = (type, ...args) => {
    if (import.meta.env.DEV && localStorage.getItem('DEBUG') === 'true') {
        const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        console.log(`%c[API ${type}] ${timestamp}`, 'color: #00bcd4; font-weight: bold;', ...args);
    }
};

// Auth management
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};



// Wrapper for fetch to handle logging and automatic token refresh
const apiRequest = async (endpoint, options = {}) => {
    const url = `${API_URL}${endpoint}`;

    let bodyPreview = '';
    if (options.body) {
        try {
            if (typeof options.body === 'string') {
                bodyPreview = JSON.parse(options.body);
            } else {
                bodyPreview = options.body instanceof FormData ? '[FormData]' : '[Binary/Other]';
            }
        } catch (e) {
            bodyPreview = '[Parse Error]';
        }
    }

    debugLog('REQ', options.method || 'GET', endpoint, bodyPreview);

    // Automatically handle FormData headers
    if (options.body instanceof FormData) {
        if (options.headers && options.headers['Content-Type']) {
            delete options.headers['Content-Type'];
        }
    }

    try {
        const response = await fetch(url, options);
        debugLog('RES', response.status, endpoint);

        // Handle 401 Unauthorized - Attempt Automatic Refresh
        if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
            const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const refreshToken = userInfo.refreshToken;

            if (refreshToken) {
                if (isRefreshing) {
                    // Queue this request for when refresh finishes
                    return new Promise((resolve, reject) => {
                        failedQueue.push({ resolve, reject });
                    }).then(token => {
                        const newOptions = { ...options };
                        newOptions.headers = { ...newOptions.headers, 'Authorization': `Bearer ${token}` };
                        return apiRequest(endpoint, newOptions);
                    }).catch(err => {
                        throw err;
                    });
                }

                isRefreshing = true;

                try {
                    debugLog('AUTH', 'Attempting token refresh...');
                    const refreshRes = await fetch(`${API_URL}/auth/refresh-token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ refreshToken })
                    });

                    if (refreshRes.ok) {
                        const { token: newToken, refreshToken: newRefreshToken } = await refreshRes.json();
                        debugLog('AUTH', 'Refresh successful, retrying request');
                        
                        // Update storage
                        const newUserInfo = { ...userInfo, token: newToken, refreshToken: newRefreshToken };
                        localStorage.setItem('userInfo', JSON.stringify(newUserInfo));
                        
                        // Trigger event for Context to update state
                        window.dispatchEvent(new CustomEvent('auth-token-refreshed', { detail: newUserInfo }));

                        processQueue(null, newToken);
                        isRefreshing = false;

                        // Retry original request with new token
                        const retryOptions = { ...options };
                        retryOptions.headers = { ...retryOptions.headers, 'Authorization': `Bearer ${newToken}` };
                        return apiRequest(endpoint, retryOptions);
                    } else {
                        debugLog('AUTH', 'Refresh failed - session dead');
                        processQueue(new Error('Session expired'), null);
                        isRefreshing = false;
                        return handleResponse(response); // Fall through to logout logic
                    }
                } catch (refreshErr) {
                    isRefreshing = false;
                    processQueue(refreshErr, null);
                    throw refreshErr;
                }
            }
        }

        return handleResponse(response);
    } catch (error) {
        if (import.meta.env.DEV) {
            console.error(`API Error (${endpoint}):`, error);
        }
        
        // Handle network errors (Failed to fetch)
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            const networkError = new Error('Network error: Could not connect to the Africa Konnect server. Please check your internet connection or ensuring the backend is running.');
            networkError.isNetworkError = true;
            throw networkError;
        }
        
        throw error;
    }
};

export const api = {
    API_URL,
    // Auth
    auth: {
        register: async (data) => apiRequest('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
        login: async (data) => apiRequest('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }),
        getProfile: async () => apiRequest('/auth/profile', {
            headers: getHeaders(),
        }),
        updateProfile: async (data) => apiRequest('/auth/profile', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getPublicProfile: async (id) => apiRequest(`/auth/users/${id}/public`, {
            headers: getHeaders(),
        }),
        verifyEmail: async (token) => apiRequest('/auth/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        }),
        resendVerification: async () => apiRequest('/auth/resend-verification', {
            method: 'POST',
            headers: getHeaders(),
        }),
        refreshToken: async (refreshToken) => apiRequest('/auth/refresh-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
        }),
        getSessions: async () => apiRequest('/auth/sessions', {
            headers: getHeaders(),
        }),
        revokeSession: async (sessionId) => apiRequest('/auth/sessions/' + sessionId, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
        revokeOtherSessions: async () => apiRequest('/auth/sessions/revoke-others', {
            method: 'POST',
            headers: getHeaders(),
        }),
        logout: async () => apiRequest('/auth/logout', {
            method: 'POST',
            headers: getHeaders(),
        }),
        forgotPassword: async (email) => apiRequest('/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        }),
        resetPassword: async (token, newPassword) => apiRequest('/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
        }),
        oauthDecision: async (data) => apiRequest('/auth/oauth/decision', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
    },

    // Projects
    projects: {
        create: async (data) => apiRequest('/projects', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getOrCreateInquiry: async (expertId) => apiRequest('/projects/inquiry', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ expertId }),
        }),
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiRequest(`/projects?${queryString}`, {
                headers: getHeaders(),
            });
        },
        getById: async (id) => apiRequest(`/projects/${id}`, {
            headers: getHeaders(),
        }),
        getOne: async (id) => apiRequest(`/projects/${id}`, {
            headers: getHeaders(),
        }),
        getInvitedProjects: async () => apiRequest('/projects/expert/invites', {
            headers: getHeaders(),
        }),
        getClientProjects: async (clientId) => apiRequest(`/projects/client/${clientId}`, {
            headers: getHeaders(),
        }),
        getMine: async () => {
            // Retrieve self client ID from token or use generic "me" endpoint if available
            // Since endpoint is /projects/client/:clientId, and we have user info in localStorage
            const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
            if (!user.id) throw new Error('User not found');

            // Reuse getClientProjects
            return apiRequest(`/projects/client/${user.id}`, {
                headers: getHeaders(),
            });
        },
        update: async (id, data) => apiRequest(`/projects/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        delete: async (id) => apiRequest(`/projects/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
        invite: async (id, expertId) => apiRequest(`/projects/${id}/invite`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ expertId }),
        }),
        inviteMember: async (id, email, role = 'member') => apiRequest(`/projects/${id}/members`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email, role }),
        }),
        respond: async (id, status) => apiRequest(`/projects/${id}/invite`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        }),
        respondToInvite: async (id, status) => apiRequest(`/projects/${id}/invite`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        }),
        // Marketplace
        getMarketplace: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiRequest(`/projects/marketplace?${queryString}`, {
                headers: getHeaders(),
            });
        },
        getOpen: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiRequest(`/projects/marketplace?${queryString}`, {
                headers: getHeaders(),
            });
        },
        // Bidding
        submitBid: async (projectId, bidData) => apiRequest(`/projects/${projectId}/bids`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(bidData),
        }),
        getBids: async (projectId, params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiRequest(`/projects/${projectId}/bids?${queryString}`, {
                headers: getHeaders(),
            });
        },
        acceptBid: async (projectId, bidId) => apiRequest(`/projects/${projectId}/bids/${bidId}/accept`, {
            method: 'PUT',
            headers: getHeaders(),
        }),
        rejectBid: async (projectId, bidId) => apiRequest(`/projects/${projectId}/bids/${bidId}/reject`, {
            method: 'PUT',
            headers: getHeaders(),
        }),
    },

    savedSearches: {
        create: async (data) => apiRequest('/saved-searches', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        list: async () => apiRequest('/saved-searches', {
            headers: getHeaders(),
        }),
        update: async (id, data) => apiRequest(`/saved-searches/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        delete: async (id) => apiRequest(`/saved-searches/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
        execute: async (id) => apiRequest(`/saved-searches/${id}/execute`, {
            method: 'POST',
            headers: getHeaders(),
        }),
    },

    bidTemplates: {
        create: async (data) => apiRequest('/bid-templates', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        list: async () => apiRequest('/bid-templates', {
            headers: getHeaders(),
        }),
        update: async (id, data) => apiRequest(`/bid-templates/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        delete: async (id) => apiRequest(`/bid-templates/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
        apply: async (id, projectId) => apiRequest(`/bid-templates/${id}/apply/${projectId}`, {
            method: 'POST',
            headers: getHeaders(),
        }),
    },

    availability: {
        set: async (data) => apiRequest('/availability', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getMine: async () => apiRequest('/availability', {
            headers: getHeaders(),
        }),
        getByExpert: async (expertId) => apiRequest(`/availability/${expertId}`, {
            headers: getHeaders(),
        }),
        delete: async (id) => apiRequest(`/availability/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
    },

    notificationPreferences: {
        get: async () => apiRequest('/notification-preferences', {
            headers: getHeaders(),
        }),
        update: async (data) => apiRequest('/notification-preferences', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
    },

    // Bids
    bids: {
        getMyBids: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiRequest(`/experts/my-bids?${queryString}`, {
                headers: getHeaders(),
            });
        },
        updateBid: async (bidId, bidData) => apiRequest(`/bids/${bidId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(bidData),
        }),
        withdrawBid: async (bidId) => apiRequest(`/bids/${bidId}/withdraw`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
    },

    // Experts
    experts: {
        getAll: async (params = {}) => {
            const queryString = new URLSearchParams(params).toString();
            return apiRequest(`/experts?${queryString}`, {
                headers: getHeaders(),
            });
        },
        getInvitations: async () => apiRequest('/projects/expert/invites', {
            headers: getHeaders(),
        }),
        createProfile: async (data) => apiRequest('/experts/profile', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getProfile: async (userId) => apiRequest(`/experts/profile/${userId}`, {
            headers: getHeaders(),
        }),
        updateProfile: async (userId, data) => apiRequest(`/experts/profile/${userId}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getCompleteness: async (userId) => apiRequest(`/experts/profile/${userId}/completeness`, {
            headers: getHeaders(),
        }),
        updateCompleteness: async () => apiRequest('/experts/profile/completeness', {
            method: 'POST',
            headers: getHeaders(),
        }),
        addPortfolio: async (data) => apiRequest('/experts/portfolio', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        removePortfolio: async (itemId) => apiRequest(`/experts/portfolio/${itemId}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
        updateAvailability: async (calendar) => apiRequest('/experts/availability', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ calendar }),
        }),
        setRateRange: async (min, max, currency = 'USD') => apiRequest('/experts/rate-range', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ min, max, currency }),
        }),
        updateSkills: async (skillCategories) => apiRequest('/experts/skills', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ skillCategories }),
        }),
        getSkills: async () => apiRequest('/experts/skills', {
            headers: getHeaders(),
        }),
        getCategories: async () => apiRequest('/experts/skills/categories', {
            headers: getHeaders(),
        }),
        searchSkills: async (query) => apiRequest(`/experts/skills/search?q=${encodeURIComponent(query)}`, {
            headers: getHeaders(),
        }),
    },

    // Transactions
    transactions: {
        fund: async (projectId, amount) => apiRequest(`/projects/${projectId}/fund`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ amount }),
        }),
        release: async (projectId, amount) => apiRequest(`/projects/${projectId}/release`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ amount }),
        }),
        getHistory: async (projectId) => apiRequest(`/projects/${projectId}/transactions`, {
            headers: getHeaders(),
        }),
    },

    // Messages
    messages: {
        getMessages: async (projectId) => apiRequest(`/messages/project/${projectId}`, {
            headers: getHeaders(),
        }),
        getDirect: async (userId) => apiRequest(`/messages/direct/${userId}`, {
            headers: getHeaders(),
        }),
        getDirectChatUsers: async () => apiRequest('/messages/direct', {
            headers: getHeaders(),
        }),
        sendDirect: async (toUserId, content) => apiRequest('/messages', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ receiverId: toUserId, content }),
        }),
        send: async (projectId, content, receiverId) => apiRequest('/messages', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ projectId, content, receiverId }),
        }),
        getUnread: async () => apiRequest('/messages/unread', {
            headers: getHeaders(),
        }),
        markRead: async (id) => apiRequest(`/messages/${id}/read`, {
            method: 'PUT',
            headers: getHeaders(),
        }),
        markProjectRead: async (projectId) => apiRequest(`/messages/project/${projectId}/read`, {
            method: 'PUT',
            headers: getHeaders(),
        }),
    },


    // Tasks
    tasks: {
        create: async (projectId, data) => apiRequest(`/projects/${projectId}/tasks`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getByProject: async (projectId) => apiRequest(`/projects/${projectId}/tasks`, {
            headers: getHeaders(),
        }),
        update: async (id, data) => apiRequest(`/tasks/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        delete: async (id) => apiRequest(`/tasks/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
    },

    // Milestones
    milestones: {
        create: async (projectId, data) => apiRequest(`/projects/${projectId}/milestones`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getByProject: async (projectId) => apiRequest(`/projects/${projectId}/milestones`, {
            headers: getHeaders(),
        }),
        update: async (id, data) => apiRequest(`/milestones/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
    },

    // Files
    files: {
        upload: async (data, projectId = null) => {
            // Check if it's FormData (has binary)
            if (data instanceof FormData) {
                // Ensure projectId is included in FormData if provided
                if (projectId && !data.has('projectId')) {
                    data.append('projectId', projectId);
                }

                const userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null;
                const token = userInfo?.token;

                const response = await fetch(`${API_URL}/files`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Browser sets Content-Type automatically for FormData
                    },
                    body: data,
                });

                if (!response.ok) {
                    const errData = await handleResponse(response).catch(() => ({}));
                    throw new Error(errData.message || 'File upload failed');
                }
                return response.json();
            }

            // JSON upload (metadata only or base64)
            return apiRequest(`/files`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ ...data, projectId: projectId || data.projectId }),
            });
        },
        getByProject: async (projectId) => apiRequest(`/projects/${projectId}/files`, {
            headers: getHeaders(),
        }),
        getFiles: async (projectId) => apiRequest(`/files/project/${projectId}`, {
            headers: getHeaders(),
        }),
        uploadImage: async (fileData) => apiRequest('/files/upload', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(fileData),
        }),
        addVersion: async (fileId, data) => apiRequest(`/files/${fileId}/versions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getVersions: async (fileId) => apiRequest(`/files/${fileId}/versions`, {
            headers: getHeaders(),
        }),
        download: async (id) => apiRequest(`/files/${id}/download`, {
            headers: getHeaders(),
        }),
        delete: async (id) => apiRequest(`/files/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
    },

    // Contracts
    contracts: {
        create: async (data) => apiRequest('/contracts', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        get: async (id) => apiRequest(`/contracts/${id}`, {
            headers: getHeaders(),
        }),
        getByProject: async (projectId) => apiRequest(`/contracts/project/${projectId}`, {
            headers: getHeaders(),
        }),
        getUserContracts: async () => apiRequest('/contracts/user', {
            headers: getHeaders(),
        }),
        sign: async (id, metadata = null) => apiRequest(`/contracts/${id}/sign`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ signatureMetadata: metadata }),
        }),
        update: async (id, data) => apiRequest(`/contracts/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
    },

    // Interviews
    interviews: {
        schedule: async (data) => apiRequest('/interviews', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getByProject: async (projectId) => apiRequest(`/interviews/project/${projectId}`, {
            headers: getHeaders(),
        }),
        getMyInterviews: async () => apiRequest('/interviews/my', {
            headers: getHeaders(),
        }),
        updateStatus: async (id, status) => apiRequest(`/interviews/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        }),
    },

    // Notifications
    notifications: {
        getAll: async (limit = 20, offset = 0) => apiRequest(`/notifications?limit=${limit}&offset=${offset}`, {
            headers: getHeaders(),
        }),
        markRead: async (id) => apiRequest(`/notifications/${id}/read`, {
            method: 'PUT',
            headers: getHeaders(),
        }),
        delete: async (id) => apiRequest(`/notifications/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        }),
        getPreferences: async () => apiRequest('/notifications/preferences', {
            headers: getHeaders(),
        }),
        updatePreferences: async (data) => apiRequest('/notifications/preferences', {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        }),
    },

    // Payments
    payments: {
        initEscrow: (projectId, amount) => apiRequest(`/payments/${projectId}/escrow`, {
            method: 'POST',
            body: JSON.stringify({ amount }),
            headers: getHeaders(),
        }),
        getEscrow: (projectId) => apiRequest(`/payments/${projectId}/escrow`, {
            headers: getHeaders(),
        }),
        requestRelease: (projectId, data) => apiRequest(`/payments/${projectId}/release`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: getHeaders(),
        }),
        approveRelease: (projectId, releaseId) => apiRequest(`/payments/${projectId}/release/${releaseId}/approve`, {
            method: 'POST',
            headers: getHeaders(),
        })
    },

    // AI Features (Now securely proxied via backend RapidAPI)
    ai: {
        chat: async (message, context = {}) => apiRequest('/ai/chat', {
            method: 'POST',
            body: JSON.stringify({ message, context }),
            headers: getHeaders(),
        }),
        chatStream: async (message, context, onChunk) => {
            const url = `${API_URL}/ai/chat-stream`;
            const options = {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ message, context })
            };
            try {
                const response = await fetch(url, options);
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = "";

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.replace('data: ', '').trim();
                            if (dataStr === '[DONE]') break;
                            try {
                                const parsed = JSON.parse(dataStr);
                                if (parsed.error) throw new Error(parsed.error);
                                if (parsed.text) {
                                    fullText += parsed.text;
                                    if (onChunk) onChunk(parsed.text);
                                }
                            } catch (e) { }
                        }
                    }
                }
                return fullText;
            } catch (err) {
                console.error("API Stream Error:", err);
                throw err;
            }
        },
        collaborationHelp: async (project) => apiRequest('/ai/collaboration-help', {
            method: 'POST',
            body: JSON.stringify({ project }),
            headers: getHeaders(),
        }),
        generateProject: async (title, description = '') => apiRequest('/ai/generate-project', {
            method: 'POST',
            body: JSON.stringify({ title, description }),
            headers: getHeaders(),
        }),
        analyzeDocument: async (fileData) => apiRequest('/ai/analyze-document', {
            method: 'POST',
            body: JSON.stringify({ fileData }),
            headers: getHeaders(),
        }),
        generateProposal: async (project, expert) => apiRequest('/ai/generate-proposal', {
            method: 'POST',
            body: JSON.stringify({ project, expert }),
            headers: getHeaders(),
        }),
        generateInterview: async (project, expert) => apiRequest('/ai/generate-interview', {
            method: 'POST',
            body: JSON.stringify({ project, expert }),
            headers: getHeaders(),
        }),
        draftContract: async (data, onChunk) => {
            const response = await apiRequest('/ai/draft-contract', {
                method: 'POST',
                body: JSON.stringify(data),
                headers: getHeaders(),
            });
            // Simulate typing stream for UX
            if (response && response.contract && onChunk) {
                const fullText = response.contract;
                const chunkSize = 20;
                for (let i = 0; i < fullText.length; i += chunkSize) {
                    onChunk(fullText.slice(i, i + chunkSize));
                    await new Promise(r => setTimeout(r, 10));
                }
            }
            return response;
        },
        matchExperts: async (projectData, experts) => apiRequest('/ai/match', {
            method: 'POST',
            body: JSON.stringify({ projectDescription: projectData.projectDescription, requirements: projectData.requirements, experts }),
            headers: getHeaders(),
        }),
        analyzeBids: async (project, bids) => apiRequest('/ai/analyze-bids', {
            method: 'POST',
            body: JSON.stringify({ project, bids }),
            headers: getHeaders(),
        })
    },

    // Applications
    applications: {
        apply: async (projectId, data) => apiRequest(`/applications/${projectId}/apply`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data),
        }),
        getByProject: async (projectId) => apiRequest(`/applications/project/${projectId}`, {
            headers: getHeaders(),
        }),
        getMyApplications: async () => apiRequest('/applications/my', {
            headers: getHeaders(),
        }),
        updateStatus: async (id, status) => apiRequest(`/applications/${id}/status`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify({ status }),
        }),
    },
};

const handleResponse = async (response) => {
    let data;
    const contentType = response.headers.get("content-type");

    try {
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = { message: await response.text() };
        }
    } catch (err) {
        // Fallback if parsing fails
        data = { message: response.statusText || 'Unknown Error' };
    }

    if (!response.ok) {
        // Handle 401 errors (authentication failures)
        if (response.status === 401) {
            const hasUserInfo = localStorage.getItem('userInfo');

            if (hasUserInfo) {
                // If we reached here, automatic refresh already failed or wasn't possible
                localStorage.removeItem('userInfo');
                window.dispatchEvent(new CustomEvent('auth-logout'));

                const publicPaths = ['/', '/signup', '/signin', '/experts', '/about', '/how-it-works', '/pricing'];
                const currentPath = window.location.pathname;

                if (!publicPaths.includes(currentPath) && !currentPath.startsWith('/expert/')) {
                    console.warn('Session expired. Redirecting to sign in...');
                    window.location.href = '/signin';
                }
            }
        }

        const errorMessage = data.message || data.error || `Error ${response.status}: ${response.statusText}`;
        if (import.meta.env.DEV) {
            console.error("API Response Error:", errorMessage);
        }
        throw new Error(errorMessage);
    }
    return data;
};
