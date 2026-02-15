import { axiosInstance } from '../api/apiClient';

export const PodcastService = {
    // 1. Fetch episodes for the feed
    getFeed: () => axiosInstance.get('/content/feed'),

    // 2. The "Smart" Stream URL (Checks permissions/tokens)
    getStreamData: (id) => axiosInstance.get(`/content/${id}/stream-token`),

    // 3. Sync offline progress when back online
    syncPlayback: (payload) => axiosInstance.post('/sync/progress', payload),
};

export const CreatorService = {
    // 4. M-Pesa Wallet & Analytics
    getDashboardStats: () => axiosInstance.get('/creator/analytics'),
    requestPayout: (amount) => axiosInstance.post('/creator/withdraw', { amount }),
};
