import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import PodcastCard from '../components/cards/PodcastCard';
import EpisodeRow from '../components/cards/EpisodeRow';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X } from 'lucide-react';

export default function Search() {
    const [query, setQuery] = useState('');

    const { data: podcasts = [] } = useQuery({
        queryKey: ['search-podcasts'],
        queryFn: () => apiClient.Podcast.list('-created_date', 50),
    });

    const { data: episodes = [] } = useQuery({
        queryKey: ['search-episodes'],
        queryFn: () => apiClient.Episode.list('-published_at', 50),
    });

    const q = query.toLowerCase().trim();

    const filteredPodcasts = useMemo(() => {
        if (!q) return [];
        return podcasts.filter(p =>
            p.title?.toLowerCase().includes(q) ||
            p.creator_name?.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.tags?.some(t => t.toLowerCase().includes(q))
        );
    }, [q, podcasts]);

    const filteredEpisodes = useMemo(() => {
        if (!q) return [];
        return episodes.filter(e =>
            e.title?.toLowerCase().includes(q) ||
            e.podcast_title?.toLowerCase().includes(q) ||
            e.tags?.some(t => t.toLowerCase().includes(q))
        );
    }, [q, episodes]);

    return (
        <div className="min-h-screen bg-[#0C100E] pt-12 pb-32">
            <div className="max-w-[1400px] mx-auto px-5 md:px-8">
                {/* Search header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <h1 className="text-3xl md:text-4xl font-bold text-[#F5F0EA] mb-6">Search</h1>
                    <div className="relative max-w-xl">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#C2AD90]/60" />
                        <input
                            type="text"
                            placeholder="Search podcasts, episodes, creators..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="w-full pl-12 pr-12 py-4 glass rounded-2xl bg-transparent text-[#F5F0EA] placeholder:text-[#F5F0EA]/30 focus:outline-none focus:ring-1 focus:ring-[#C2AD90]/30 text-sm"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#F5F0EA]/40 hover:text-[#F5F0EA]"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </motion.div>

                <AnimatePresence mode="wait">
                    {!q ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-24"
                        >
                            <div className="w-20 h-20 rounded-full glass mx-auto flex items-center justify-center mb-6">
                                <SearchIcon className="w-8 h-8 text-[#C2AD90]/40" />
                            </div>
                            <p className="text-[#F5F0EA]/30 text-sm">Start typing to discover content</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="results"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="space-y-12"
                        >
                            {filteredPodcasts.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold text-[#F5F0EA]/70 mb-4">
                                        Podcasts ({filteredPodcasts.length})
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                        {filteredPodcasts.map((p, i) => (
                                            <PodcastCard key={p.id} podcast={p} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredEpisodes.length > 0 && (
                                <div>
                                    <h2 className="text-lg font-semibold text-[#F5F0EA]/70 mb-4">
                                        Episodes ({filteredEpisodes.length})
                                    </h2>
                                    <div className="glass rounded-2xl p-2 divide-y divide-white/5">
                                        {filteredEpisodes.map((ep, i) => (
                                            <EpisodeRow key={ep.id} episode={ep} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {filteredPodcasts.length === 0 && filteredEpisodes.length === 0 && (
                                <div className="text-center py-20">
                                    <p className="text-[#F5F0EA]/30 text-sm">No results for &quot;{query}&quot;</p>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}