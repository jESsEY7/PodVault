import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import CategoryPills from '../components/home/CategoryPills';
import PodcastGrid from '../components/home/PodcastGrid';
import EpisodeRow from '../components/cards/EpisodeRow';
import AIDiscoveryChat from '../components/discovery/AIDiscoveryChat';
import KnowledgeNodeCard from '../components/cards/KnowledgeNodeCard';
import { motion } from 'framer-motion';
import { Compass, Clock, Brain } from 'lucide-react';

export default function Explore() {
    const [activeCategory, setActiveCategory] = useState('All');

    const { data: podcastsData, isLoading: loadingPodcasts, error: podcastError } = useQuery({
        queryKey: ['explore-podcasts'],
        queryFn: () => apiClient.Podcast.list('-created_date', 100),
    });
    const podcasts = (podcastsData && Array.isArray(podcastsData.results)) ? podcastsData.results : [];

    const { data: episodesData, isLoading: loadingEpisodes, error: episodeError } = useQuery({
        queryKey: ['explore-episodes'],
        queryFn: () => apiClient.Episode.list('-published_at', 100),
    });
    const episodes = (episodesData && Array.isArray(episodesData.results)) ? episodesData.results : [];

    console.log('[Explore] Data Debug:', {
        podcastsData,
        episodesData,
        podcastsCount: podcasts.length,
        episodesCount: episodes.length,
        loading: loadingPodcasts || loadingEpisodes,
        errors: { podcastError, episodeError }
    });

    const filtered = activeCategory === 'All'
        ? podcasts
        : podcasts.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase());

    const SkeletonLoader = () => (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-16 animate-pulse">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-square bg-[#364442]/20 rounded-2xl border border-[#364442]/30"></div>
            ))}
        </div>
    );

    if (loadingPodcasts || loadingEpisodes) {
        return (
            <div className="min-h-screen bg-[#0C100E] pt-12 pb-32 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#C2AD90] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[#F5F0EA]/60 animate-pulse">Loading Vault Content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0C100E] pt-12 pb-32">
            <div className="max-w-[1400px] mx-auto px-5 md:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Compass className="w-6 h-6 text-[#C2AD90]" />
                        <h1 className="text-3xl md:text-4xl font-bold text-[#F5F0EA]">Explore</h1>
                    </div>
                    <p className="text-[#F5F0EA]/40 text-sm">Dive deeper into the vault</p>
                </motion.div>

                {/* AI Discovery */}
                <div className="mb-10">
                    <AIDiscoveryChat />
                </div>

                {/* Categories */}
                <div className="mb-10">
                    <CategoryPills active={activeCategory} onSelect={setActiveCategory} />
                </div>

                {/* Podcast grid */}
                <div className="mb-16">
                    <PodcastGrid podcasts={filtered} title="All Shows" subtitle={`${filtered.length} shows available`} />
                </div>

                {/* Knowledge Nodes */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-[#C2AD90]/10 flex items-center justify-center">
                            <Brain className="w-4 h-4 text-[#C2AD90]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#F5F0EA]">Knowledge Nodes</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {episodes.slice(0, 8).map((ep, i) => (
                            <KnowledgeNodeCard key={ep.id} episode={ep} index={i} />
                        ))}
                    </div>
                </motion.div>

                {/* Latest episodes */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-[#97754D]/10 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-[#97754D]" />
                        </div>
                        <h2 className="text-2xl font-bold text-[#F5F0EA]">Latest Episodes</h2>
                    </div>
                    <div className="glass rounded-2xl p-2 divide-y divide-white/5">
                        {episodes.length > 0 ? (
                            episodes.map((ep, i) => <EpisodeRow key={ep.id} episode={ep} index={i} />)
                        ) : (
                            <div className="p-8 text-center text-[#F5F0EA]/40 text-sm">
                                No episodes published yet.
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}