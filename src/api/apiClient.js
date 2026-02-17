import axios from 'axios';

const API_BASE_URL = '/api';

export const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token
axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});



// TOGGLE THIS TO USE MOCK DATA INSTEAD OF REAL BACKEND
const USE_MOCK_DATA = false;

// Mock Data Store with Weighted Logic
const MOCK_DATA = {
    user: {
        id: 1,
        username: 'jesse_developer',
        email: 'jesse@podvault.dev',
        preferred_categories: ['Technology', 'Business', 'Health'],
        topics_to_avoid: ['politics'],
        preferred_duration: 'medium',
        interest_vector: {
            'Technology': 0.8,
            'Business': 0.6,
            'Health': 0.5,
            'Finance': 0.3
        }
    },
    // Taddy-aligned Mock Episodes
    episodes: Array.from({ length: 20 }).map((_, i) => {
        const category = ['Technology', 'Health', 'Business', 'Finance', 'Comedy'][i % 5];
        const durationSecs = 1200 + (i * 100);
        const podcastTitle = `The ${category} Insider`;
        const authorName = `Creator ${i % 5}`;
        const coverImage = `https://picsum.photos/seed/${i + 100}/300/300`;

        return {
            id: `mock-ep-${i}`,
            uuid: `taddy-mock-uuid-${i}`, // Taddy-style UUID
            title: `Ep ${i + 1}: The Future of ${category}`,
            description: `In this episode, we explore how ${category} is evolving. We analyze trends, interview experts, and discuss the impact on daily life.`,
            audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
            duration: durationSecs,
            duration_minutes: Math.round(durationSecs / 60), // Required by EpisodeRow
            datePublished: new Date(Date.now() - (i * 86400000)).toISOString(), // Taddy field name
            published_at: new Date(Date.now() - (i * 86400000)).toISOString(), // Our internal model field
            podcast_id: `mock-pod-${i % 5}`,
            podcast_title: podcastTitle, // Required by EpisodeRow
            cover_image: coverImage, // Required by EpisodeRow (flat)
            tier: 'free', // Required by EpisodeRow

            podcast: {
                id: `mock-pod-${i % 5}`,
                title: podcastTitle,
                cover_image: coverImage,
                cover_url: coverImage, // Required by PodcastCard
                authorName: authorName, // Taddy field
                author: authorName // Required by PodcastCard
            },
            genres: [category], // Taddy field
            category: category,
            transcript_url: null,
            chapters_url: null,
            plays: 1000 + (i * 50),
            likes: 50 + (i * 2),
            tags: [category, 'Future', 'Innovation']
        };
    }),
    interactions: {
        likes: [],
        follows: [],
        activities: [],
        preferences: [
            { episode_id: 'mock-ep-0', feedback_type: 'like', created_by: 'jesse@podvault.dev' }
        ]
    }
};

// Simulation Logic for "Verified Play" & Weighted Interest
const simulateWeightedInterest = (category, weight = 0.1) => {
    if (!category) return;
    const currentWeight = MOCK_DATA.user.interest_vector[category] || 0;
    MOCK_DATA.user.interest_vector[category] = Math.min(currentWeight + weight, 2.0); // Cap at 2.0
    console.log(`[MOCK AI] Boosted interest in ${category} by ${weight}. New Vector:`, MOCK_DATA.user.interest_vector);
};

// Sort episodes based on user interest vector
const sortEpisodesByInterest = (episodes) => {
    return [...episodes].sort((a, b) => {
        const scoreA = (MOCK_DATA.user.interest_vector[a.category] || 0) + (a.plays / 10000);
        const scoreB = (MOCK_DATA.user.interest_vector[b.category] || 0) + (b.plays / 10000);
        return scoreB - scoreA;
    });
};

// Helper to mimic the base44 SDK entity pattern
const createEntityHandler = (entityName) => ({
    list: async (ordering = '', limit = 100, offset = 0) => {
        if (USE_MOCK_DATA) {
            if (entityName === 'episodes') {
                console.log('[MOCK] Returning customized episode feed');
                let results = sortEpisodesByInterest(MOCK_DATA.episodes);
                return {
                    count: results.length,
                    next: null,
                    previous: null,
                    results: results.slice(offset, offset + limit)
                };
            }
            if (entityName === 'podcasts') {
                console.log('[MOCK] Returning mock podcasts');
                const podcasts = [...new Map(MOCK_DATA.episodes.map(item => [item.podcast.id, item.podcast])).values()];
                return {
                    count: podcasts.length,
                    next: null,
                    previous: null,
                    results: podcasts.slice(offset, offset + limit)
                };
            }
            // Default mock response for other entities to prevent network errors
            console.warn(`[MOCK] No mock data defined for list ${entityName}, returning empty.`);
            return { count: 0, next: null, previous: null, results: [] };
        }
        const response = await axiosInstance.get(`/${entityName}/`, {
            params: { ordering, limit, offset }
        });
        return response.data;
    },
    filter: async (filters = {}, ordering = '', limit = 100, offset = 0) => {
        if (USE_MOCK_DATA) {
            console.log(`[MOCK] Filtering ${entityName} with params:`, filters);
            if (entityName === 'user-activities') return MOCK_DATA.interactions.activities;
            if (entityName === 'likes') return MOCK_DATA.interactions.likes;
            if (entityName === 'follows') return MOCK_DATA.interactions.follows;
            if (entityName === 'user-preferences') return MOCK_DATA.interactions.preferences;
            if (entityName === 'playlists') {
                return [
                    { id: 'pl-1', name: 'My Favorites', is_public: true, episode_ids: ['mock-ep-0'], created_by: 'jesse@podvault.dev' },
                    { id: 'pl-2', name: 'Tech Daily', is_public: false, episode_ids: ['mock-ep-1', 'mock-ep-2'], created_by: 'jesse@podvault.dev' }
                ];
            }
            return [];
        }
        const response = await axiosInstance.get(`/${entityName}/`, {
            params: { ...filters, ordering, limit, offset }
        });
        return response.data;
    },
    get: async (id) => {
        if (USE_MOCK_DATA) {
            if (entityName === 'episodes') {
                const ep = MOCK_DATA.episodes.find(e => e.id === id) || MOCK_DATA.episodes[0];
                simulateWeightedInterest(ep.category, 0.05);
                return ep;
            }
            if (entityName === 'podcasts') {
                const ep = MOCK_DATA.episodes.find(e => e.podcast.id === id);
                return ep ? ep.podcast : MOCK_DATA.episodes[0].podcast;
            }
            console.warn(`[MOCK] No mock data defined for get ${entityName} ${id}, returning generic.`);
            return { id, title: `Mock ${entityName} ${id}`, description: 'This is a mock item.' };
        }
        const response = await axiosInstance.get(`/${entityName}/${id}/`);
        return response.data;
    },
    create: async (data) => {
        if (USE_MOCK_DATA) {
            console.log(`[MOCK] Creating ${entityName}:`, data);

            // Handle Interaction Creation
            if (entityName === 'user-activities' && data.action === 'like') {
                // Boost category significantly on like
                const ep = MOCK_DATA.episodes.find(e => e.id === data.episode_id);
                if (ep) simulateWeightedInterest(ep.category, 0.5);
            }
            if (entityName === 'likes') {
                MOCK_DATA.interactions.likes.push(data);
                const ep = MOCK_DATA.episodes.find(e => e.id === data.episode_id);
                if (ep) simulateWeightedInterest(ep.category, 0.3);
            }

            return { id: 'mock-new-id', ...data };
        }
        const response = await axiosInstance.post(`/${entityName}/`, data);
        return response.data;
    },
    update: async (id, data) => {
        if (USE_MOCK_DATA) {
            console.log(`[MOCK] Updating ${entityName} ${id}:`, data);
            return { id, ...data };
        }
        const response = await axiosInstance.patch(`/${entityName}/${id}/`, data);
        return response.data;
    },
    delete: async (id) => {
        if (USE_MOCK_DATA) {
            console.log(`[MOCK] Deleting ${entityName} ${id}`);
            return { success: true };
        }
        const response = await axiosInstance.delete(`/${entityName}/${id}/`);
        return response.data;
    }
});

export const apiClient = {
    Podcast: createEntityHandler('podcasts'),
    Episode: {
        ...createEntityHandler('episodes'),
        getSummary: async (id) => {
            if (USE_MOCK_DATA) {
                return {
                    nuanced_summary: `[MOCK] This episode dives deep into the **transformative power of habit formation**, exploring how small, consistent actions can compound into massive personal growth. \n\nThe host and guest discuss the *neurological loops* that govern our behaviors and offer practical strategies to **break bad habits** while building new, empowering ones.`,
                    key_takeaways: [
                        "Habits are the compound interest of self-improvement.",
                        "Focus on systems, not just goals.",
                        "Identity-based habits are the most effective way to change.",
                        "The 'Two-Minute Rule' stops procrastination."
                    ],
                    sentiment: {
                        score: 0.85,
                        tone: "Inspirational & Practical",
                        label: "positive"
                    }
                };
            }
            // Mock response for AI summary
            return {
                nuanced_summary: `This episode dives deep into the **transformative power of habit formation**, exploring how small, consistent actions can compound into massive personal growth. \n\nThe host and guest discuss the *neurological loops* that govern our behaviors and offer practical strategies to **break bad habits** while building new, empowering ones.`,
                key_takeaways: [
                    "Habits are the compound interest of self-improvement.",
                    "Focus on systems, not just goals.",
                    "Identity-based habits are the most effective way to change.",
                    "The 'Two-Minute Rule' stops procrastination."
                ],
                sentiment: {
                    score: 0.85,
                    tone: "Inspirational & Practical",
                    label: "positive"
                }
            };
        },
        generateSummary: async (id, force = false) => {
            if (USE_MOCK_DATA) {
                return "This is a mock AI summary generated by the client.";
            }
            const response = await axiosInstance.post(`/episodes/${id}/generate-summary/`, { force });
            return response.data.summary;
        },
        recordPlay: async (id) => {
            if (USE_MOCK_DATA) return;
            // Fire and forget, or return status
            return await axiosInstance.post(`/episodes/${id}/record-play/`);
        }
    },
    Creator: createEntityHandler('creators'),
    UserPreference: createEntityHandler('user-preferences'),
    Playlist: createEntityHandler('playlists'),
    ListeningSession: createEntityHandler('listening-sessions'),
    Comment: createEntityHandler('comments'),
    Like: createEntityHandler('likes'),
    Follow: createEntityHandler('follows'),
    Tip: createEntityHandler('tips'),
    Merchandise: createEntityHandler('merchandise'),
    CreatorSubscription: createEntityHandler('creator-subscriptions'),
    ChatMessage: createEntityHandler('chat-messages'),
    UserActivity: createEntityHandler('user-activities'),
    Wallet: {
        get: async () => {
            if (USE_MOCK_DATA) return { balance: 45200, pending_balance: 12500, currency: 'KES' };
            const response = await axiosInstance.get('/wallet/');
            return response.data;
        },
        getTransactions: async () => {
            if (USE_MOCK_DATA) return [];
            const response = await axiosInstance.get('/transactions/');
            return response.data;
        },
        withdraw: async (amount, phoneNumber) => {
            if (USE_MOCK_DATA) {
                console.log(`[MOCK PAYOUT] Initiating M-Pesa B2C for KES ${amount} to ${phoneNumber}`);
                return {
                    success: true,
                    transaction_id: 'WS' + Math.floor(Math.random() * 1000000),
                    message: 'Hypothetical M-Pesa Payout Successful'
                };
            }
            const response = await axiosInstance.post('/wallet/', { amount, phone: phoneNumber });
            return response.data;
        }
    },

    integrations: {
        Core: {
            InvokeLLM: async (params) => {
                console.log('[apiClient] InvokeLLM called with:', params);
                // Dummy response for semantic search
                return "This is a generated summary of the podcast episode, highlighting key topics and insights discussed by the host and guests.";
            }
        },
        Ingest: {
            RSS: async (feedUrl) => {
                const response = await axiosInstance.post('/ingest/', { feed_url: feedUrl });
                return response.data;
            }
        }
    },

    auth: {
        me: async () => {
            if (USE_MOCK_DATA) {
                console.log('[MOCK] Returning mock user');
                return MOCK_DATA.user;
            }
            const token = localStorage.getItem('access_token');
            if (!token) {
                return null;
            }
            try {
                const response = await axiosInstance.get('/auth/me/');
                return response.data;
            } catch (error) {
                // If token is invalid (401), we should probably clear it and return null
                if (error.response && error.response.status === 401) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    return null;
                }
                throw error;
            }
        },
        login: async (credentials) => {
            if (USE_MOCK_DATA) {
                return { access: 'mock-token', refresh: 'mock-refresh', user: MOCK_DATA.user };
            }
            const response = await axiosInstance.post('/auth/login/', credentials);
            return response.data;
        },
        updateMe: async (data) => {
            if (USE_MOCK_DATA) {
                return { ...MOCK_DATA.user, ...data };
            }
            const response = await axiosInstance.patch('/auth/me/', data);
            return response.data;
        },
        logout: async () => {
            // Implementation depends on backend logout strategy
            localStorage.removeItem('access_token');
        },
        connectSpotify: async () => {
            if (USE_MOCK_DATA) {
                console.log('[MOCK] Connecting to Spotify...');
                // Simulate a redirect URL for testing UI logic
                return { url: 'https://accounts.spotify.com/authorize?mock=true' };
            }
            const response = await axiosInstance.get('/ingest/spotify/login/');
            return response.data;
        }
    }
};

export default apiClient;
