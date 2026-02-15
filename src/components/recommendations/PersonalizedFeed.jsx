import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import EpisodeRow from '../cards/EpisodeRow';
import { Sparkles, Loader2 } from 'lucide-react';

export default function PersonalizedFeed() {
    const [page, setPage] = useState(1);
    const [allEpisodes, setAllEpisodes] = useState([]);
    const observerRef = useRef();
    const loadMoreRef = useRef();

    // Fetch user data and preferences
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => apiClient.auth.me(),
    });

    const { data: activities = [] } = useQuery({
        queryKey: ['user-activity'],
        queryFn: async () => {
            const user = await apiClient.auth.me();
            return apiClient.UserActivity.filter({ created_by: user.email }, '-created_date', 50);
        },
    });

    const { data: likes = [] } = useQuery({
        queryKey: ['user-likes'],
        queryFn: async () => {
            const user = await apiClient.auth.me();
            return apiClient.Like.filter({ created_by: user.email });
        },
    });

    const { data: follows = [] } = useQuery({
        queryKey: ['user-follows'],
        queryFn: async () => {
            const user = await apiClient.auth.me();
            return apiClient.Follow.filter({ created_by: user.email });
        },
    });

    const { data: preferences = [] } = useQuery({
        queryKey: ['user-preferences'],
        queryFn: async () => {
            const user = await apiClient.auth.me();
            return apiClient.UserPreference.filter({ created_by: user.email });
        },
    });

    // Fetch episodes with infinite scroll
    const { data: episodes = [], isLoading, isFetching } = useQuery({
        queryKey: ['episodes-feed', page],
        queryFn: () => apiClient.Episode.list('-published_at', 20, (page - 1) * 20),
    });

    // Enhanced recommendation scoring with user preferences
    const scoreEpisode = (episode) => {
        // Filter out disliked and not interested
        const dislikedIds = new Set(preferences.filter(p => p.feedback_type === 'dislike').map(p => p.episode_id));
        const notInterestedIds = new Set(preferences.filter(p => p.feedback_type === 'not_interested').map(p => p.episode_id));
        if (dislikedIds.has(episode.id) || notInterestedIds.has(episode.id)) return -1000;

        // Filter by avoided topics
        const topicsToAvoid = new Set(user?.topics_to_avoid || []);
        if (episode.tags?.some(tag => topicsToAvoid.has(tag.toLowerCase()))) return -1000;

        // Filter by preferred duration
        const preferredDuration = user?.preferred_duration || 'any';
        if (preferredDuration !== 'any') {
            const dur = episode.duration_minutes || 0;
            if (preferredDuration === 'short' && dur >= 20) return -500;
            if (preferredDuration === 'medium' && (dur < 20 || dur > 45)) return -500;
            if (preferredDuration === 'long' && dur < 45) return -500;
        }

        let score = 0;

        // Strong boost for explicit likes
        const likedByFeedback = preferences.filter(p => p.feedback_type === 'like').map(p => p.episode_id);
        if (likedByFeedback.includes(episode.id)) score += 150;

        // Boost if user liked/saved
        if (likes.some(l => l.episode_id === episode.id)) score += 100;

        // Boost if from followed creators
        const likedPodcasts = activities.filter(a => a.action === 'like').map(a => a.podcast_id);
        if (likedPodcasts.includes(episode.podcast_id)) score += 50;

        // Boost if in preferred categories
        const preferredCategories = user?.preferred_categories || [];
        if (preferredCategories.length > 0 && episode.category && preferredCategories.includes(episode.category)) {
            score += 40;
        }

        // Boost if similar tags to liked content
        const userPreferredTags = activities
            .map(a => episodes.find(e => e.id === a.episode_id)?.tags || [])
            .flat();
        const matchingTags = episode.tags?.filter(t => userPreferredTags.includes(t)).length || 0;
        score += matchingTags * 10;

        // Boost popular content
        score += (episode.plays || 0) / 100;
        score += (episode.likes || 0) * 2;

        // Boost recent content
        const daysOld = (Date.now() - new Date(episode.publish_date || episode.created_date).getTime()) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 20 - daysOld);

        return score;
    };

    // Merge and sort episodes when new page loads
    useEffect(() => {
        if (episodes.length > 0) {
            const newEpisodes = episodes.filter(e => !allEpisodes.some(ae => ae.id === e.id));
            const combined = [...allEpisodes, ...newEpisodes];

            // Sort by recommendation score
            const scored = combined.map(ep => ({
                ...ep,
                _score: scoreEpisode(ep)
            })).sort((a, b) => b._score - a._score);

            setAllEpisodes(scored);
        }
    }, [episodes]);

    // Infinite scroll observer
    useEffect(() => {
        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetching && episodes.length === 20) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observerRef.current.observe(loadMoreRef.current);
        }

        return () => observerRef.current?.disconnect();
    }, [isFetching, episodes.length]);

    if (isLoading && page === 1) {
        return (
            <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#C2AD90] animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C2AD90] to-[#97754D] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-[#0C100E]" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#F5F0EA]">Recommended For You</h2>
                    <p className="text-sm text-[#F5F0EA]/40 mt-1">Personalized based on your taste</p>
                </div>
            </div>

            <div className="space-y-2">
                {allEpisodes.map((episode, i) => (
                    <EpisodeRow key={episode.id} episode={episode} index={i} />
                ))}
            </div>

            <div ref={loadMoreRef} className="py-8 flex justify-center">
                {isFetching && <Loader2 className="w-6 h-6 text-[#C2AD90] animate-spin" />}
            </div>
        </div>
    );
}