import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, Crown, Users } from 'lucide-react';
import PodcastCard from '../components/cards/PodcastCard';
import TipCreatorModal from '../components/social/TipCreatorModal';
import EnhancedEpisodeCard from '../components/cards/EnhancedEpisodeCard';
import SubscriptionTiers from '../components/creator/SubscriptionTiers';

export default function CreatorProfilePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const creatorId = urlParams.get('id');
    const [showTipModal, setShowTipModal] = useState(false);

    const { data: creator, isLoading } = useQuery({
        queryKey: ['creator', creatorId],
        queryFn: async () => {
            const creators = await apiClient.Creator.filter({ id: creatorId });
            return creators[0];
        },
        enabled: !!creatorId,
    });

    const { data: podcasts = [] } = useQuery({
        queryKey: ['creator-podcasts', creator?.name],
        queryFn: () => apiClient.Podcast.filter({ creator_name: creator.name }),
        enabled: !!creator?.name,
    });

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['creator-subscriptions', creatorId],
        queryFn: () => apiClient.CreatorSubscription.filter({ creator_id: creatorId }),
        enabled: !!creatorId,
    });

    const { data: merchandise = [] } = useQuery({
        queryKey: ['creator-merch', creatorId],
        queryFn: () => apiClient.Merchandise.filter({ creator_id: creatorId, is_available: true }),
        enabled: !!creatorId,
    });

    const { data: episodes = [] } = useQuery({
        queryKey: ['creator-episodes', creator?.name],
        queryFn: () => apiClient.Episode.list('-plays', 20),
        enabled: !!creator?.name,
    });

    // Get top episodes by engagement
    const topEpisodes = episodes
        .filter(e => e.podcast_title && podcasts.some(p => p.title === e.podcast_title))
        .sort((a, b) => (b.plays + b.likes * 10) - (a.plays + a.likes * 10))
        .slice(0, 6);

    if (isLoading) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-[#C2AD90] animate-pulse">Loading...</div>
            </div>
        );
    }

    if (!creator) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-[#F5F0EA]/40">Creator not found</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-32">
            {/* Hero Section */}
            <div className="relative h-80 overflow-hidden">
                <img
                    src={creator.cover_url || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80'}
                    alt={creator.name}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C100E] via-[#0C100E]/60 to-transparent" />
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-20 relative z-10">
                <div className="flex flex-col md:flex-row gap-6 items-start mb-12">
                    <img
                        src={creator.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80'}
                        alt={creator.name}
                        className="w-32 h-32 rounded-2xl border-4 border-[#0C100E] shadow-2xl"
                    />
                    <div className="flex-1">
                        <h1 className="text-4xl font-bold text-[#F5F0EA] mb-2">{creator.name}</h1>
                        <p className="text-[#F5F0EA]/60 mb-4">{creator.bio}</p>
                        <div className="flex items-center gap-2 text-sm text-[#F5F0EA]/40 mb-6">
                            <Users className="w-4 h-4" />
                            {creator.follower_count?.toLocaleString()} followers
                        </div>
                        <div className="flex gap-3">
                            <Button className="bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]">
                                Follow
                            </Button>
                            <Button
                                onClick={() => setShowTipModal(true)}
                                className="bg-gradient-to-r from-[#C2AD90] to-[#97754D] text-[#0C100E]"
                            >
                                <DollarSign className="w-4 h-4 mr-2" />
                                Support Me
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Subscription Tiers */}
                {subscriptions.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-[#F5F0EA] mb-6">Premium Access</h2>
                        <div className="grid md:grid-cols-3 gap-4">
                            {subscriptions.map((sub) => (
                                <motion.div
                                    key={sub.id}
                                    whileHover={{ scale: 1.02 }}
                                    className="glass rounded-2xl p-6"
                                >
                                    <div className="flex items-center gap-2 mb-4">
                                        <Crown className="w-5 h-5 text-[#C2AD90]" />
                                        <h3 className="font-bold text-[#F5F0EA] capitalize">{sub.tier_name}</h3>
                                    </div>
                                    <div className="text-3xl font-bold text-[#C2AD90] mb-4">
                                        ${sub.price_monthly}<span className="text-sm text-[#F5F0EA]/40">/mo</span>
                                    </div>
                                    <ul className="space-y-2 mb-6">
                                        {sub.benefits?.map((benefit, i) => (
                                            <li key={i} className="text-sm text-[#F5F0EA]/70 flex items-start gap-2">
                                                <span className="text-[#C2AD90] mt-0.5">•</span>
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button className="w-full bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]">
                                        Subscribe
                                    </Button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Merchandise */}
                {merchandise.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-[#F5F0EA] mb-6">Merch & Tickets</h2>
                        <div className="grid md:grid-cols-4 gap-4">
                            {merchandise.map((item) => (
                                <motion.div
                                    key={item.id}
                                    whileHover={{ y: -5 }}
                                    className="glass rounded-2xl overflow-hidden"
                                >
                                    <img
                                        src={item.image_url || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&q=80'}
                                        alt={item.name}
                                        className="w-full aspect-square object-cover"
                                    />
                                    <div className="p-4">
                                        <h3 className="font-semibold text-[#F5F0EA] mb-1">{item.name}</h3>
                                        <p className="text-[#C2AD90] font-bold mb-3">${item.price}</p>
                                        <Button size="sm" className="w-full bg-[#364442] hover:bg-[#5D4429] text-[#F5F0EA]">
                                            <ShoppingBag className="w-3 h-3 mr-2" />
                                            {item.type === 'event_ticket' ? 'Get Ticket' : 'Buy Now'}
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Featured Podcasts */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-[#F5F0EA] mb-6">Featured Shows</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {podcasts.filter(p => p.is_featured).slice(0, 5).map((podcast, i) => (
                            <PodcastCard key={podcast.id} podcast={podcast} index={i} />
                        ))}
                    </div>
                </div>

                {/* Top Episodes */}
                {topEpisodes.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-bold text-[#F5F0EA] mb-6">Top Episodes</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {topEpisodes.map((episode, i) => (
                                <EnhancedEpisodeCard key={episode.id} episode={episode} index={i} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Subscription Tiers */}
                <div className="mb-12">
                    <h2 className="text-2xl font-bold text-[#F5F0EA] mb-6">Support This Creator</h2>
                    <SubscriptionTiers creatorId={creatorId} creatorName={creator.name} />
                </div>

                {/* All Shows */}
                <div>
                    <h2 className="text-2xl font-bold text-[#F5F0EA] mb-6">All Shows</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                        {podcasts.map((podcast, i) => (
                            <PodcastCard key={podcast.id} podcast={podcast} index={i} />
                        ))}
                    </div>
                </div>
            </div>

            <TipCreatorModal
                open={showTipModal}
                onClose={() => setShowTipModal(false)}
                creatorId={creatorId}
                creatorName={creator.name}
            />
        </div>
    );
}