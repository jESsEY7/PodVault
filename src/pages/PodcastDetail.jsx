import React, { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Users, Lock, Share2, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import EpisodeRow from '../components/cards/EpisodeRow';
import CastList from '../components/CastList';
import EnhancedEpisodePlayer from '../components/player/EnhancedEpisodePlayer';
import { axiosInstance } from '@/api/apiClient';

export default function PodcastDetail() {
    const params = new URLSearchParams(window.location.search);
    const podcastId = params.get('id');

    const [rssEpisodes, setRssEpisodes] = useState([]);
    const [rssLoading, setRssLoading] = useState(false);
    const [activeEpisode, setActiveEpisode] = useState(null);
    const [showPlayer, setShowPlayer] = useState(false);

    const { data: podcast, isLoading } = useQuery({
        queryKey: ['podcast', podcastId],
        queryFn: () => apiClient.Podcast.get(podcastId),
        enabled: !!podcastId,
    });

    const { data: episodesData } = useQuery({
        queryKey: ['podcast-episodes', podcastId],
        queryFn: () => apiClient.Episode.filter({ podcast_id: podcastId }, '-episode_number'),
        enabled: !!podcastId,
    });
    const dbEpisodes = episodesData?.results || [];

    // ── RSS auto-fetch ────────────────────────────────────────────────────────
    // When a podcast came from external search and has a custom_rss_url but no
    // DB episodes yet, parse the feed to surface real episodes with audio_url.
    useEffect(() => {
        const rssFeed = podcast?.custom_rss_url;
        if (!rssFeed || dbEpisodes.length > 0) return;

        let mounted = true;
        setRssLoading(true);

        fetch(`${axiosInstance.defaults.baseURL?.replace('/api/v1', '') ?? 'http://localhost:8000'}/api/ingest/ingest/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feed_url: rssFeed }),
        })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (!mounted || !data?.episodes) return;
                const shaped = data.episodes
                    .filter(ep => ep.audio_url)
                    .map((ep, i) => ({
                        id: `rss-${i}`,
                        title: ep.title,
                        description: ep.description,
                        audio_url: ep.audio_url,
                        duration_minutes: ep.duration ? Math.round(parseInt(ep.duration, 10) / 60) : null,
                        cover_image: podcast?.cover_image || null,
                        podcast_title: podcast?.title || '',
                        tier: 'free',
                    }));
                setRssEpisodes(shaped);
            })
            .catch(() => { })
            .finally(() => { if (mounted) setRssLoading(false); });

        return () => { mounted = false; };
    }, [podcast, dbEpisodes.length]);

    const episodes = dbEpisodes.length > 0 ? dbEpisodes : rssEpisodes;

    const uniqueCast = useMemo(() => {
        if (!episodes || !Array.isArray(episodes)) return [];
        const castMap = new Map();
        episodes.forEach(ep => {
            if (ep.cast) {
                ep.cast.forEach(person => {
                    if (!castMap.has(person.id)) castMap.set(person.id, person);
                });
            }
        });
        return Array.from(castMap.values());
    }, [episodes]);

    const placeholderImage = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80';

    const handlePlayEpisode = (ep) => {
        setActiveEpisode(ep);
        setShowPlayer(true);
    };

    const handlePlayAll = () => {
        if (episodes.length > 0) handlePlayEpisode(episodes[0]);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0C100E] flex items-center justify-center">
                <div className="flex items-end gap-1">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="w-1 bg-[#C2AD90]/60 rounded-full soundbar" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!podcast) {
        return (
            <div className="min-h-screen bg-[#0C100E] flex items-center justify-center">
                <p className="text-[#F5F0EA]/40">Podcast not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0C100E] pb-32">
            {/* Hero */}
            <div className="relative h-[50vh] md:h-[60vh]">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url('${podcast.cover_image || placeholderImage}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0C100E]/60 via-[#0C100E]/40 to-[#0C100E]" />

                <div className="absolute top-6 left-6 z-10">
                    <Link
                        to={createPageUrl('Home')}
                        className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[#F5F0EA]/70 hover:text-[#F5F0EA] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                    <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-end gap-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-36 h-36 md:w-44 md:h-44 rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 border-2 border-white/10"
                        >
                            <img
                                src={podcast.cover_image || placeholderImage}
                                alt={podcast.title}
                                className="w-full h-full object-cover"
                            />
                        </motion.div>

                        <div className="flex-1">
                            {podcast.tier === 'premium' && (
                                <span className="inline-flex items-center gap-1 glass rounded-lg px-3 py-1 text-[10px] text-[#C2AD90] uppercase tracking-wider mb-3">
                                    <Lock className="w-3 h-3" /> Premium
                                </span>
                            )}
                            <h1 className="text-3xl md:text-5xl font-bold text-[#F5F0EA] mb-2">{podcast.title}</h1>
                            <p className="text-sm text-[#C2AD90] mb-3">{podcast.creator_name}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#F5F0EA]/30">
                                {podcast.category && (
                                    <span className="glass rounded-lg px-3 py-1 uppercase tracking-wider">
                                        {podcast.category}
                                    </span>
                                )}
                                {podcast.subscriber_count > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {podcast.subscriber_count.toLocaleString()} subscribers
                                    </span>
                                )}
                                {rssEpisodes.length > 0 && dbEpisodes.length === 0 && (
                                    <span className="flex items-center gap-1 text-[#C2AD90]/70">
                                        <Radio className="w-3 h-3" /> Live RSS
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handlePlayAll}
                                disabled={episodes.length === 0}
                                className="flex items-center gap-2 bg-[#C2AD90] text-[#0C100E] px-6 py-3 rounded-xl font-semibold text-sm hover:bg-[#97754D] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Play className="w-4 h-4 fill-current" />
                                Play All
                            </button>
                            <button className="glass w-11 h-11 rounded-xl flex items-center justify-center text-[#C2AD90] hover:bg-white/10 transition-colors">
                                <Share2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="max-w-[1400px] mx-auto px-5 md:px-8 mt-8">
                {podcast.description && (
                    <p className="text-sm text-[#F5F0EA]/50 max-w-2xl leading-relaxed mb-10">
                        {podcast.description}
                    </p>
                )}

                <CastList castMembers={uniqueCast} />

                {podcast.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-10 mt-8">
                        {podcast.tags.map(tag => (
                            <span key={tag} className="text-[10px] uppercase tracking-wider text-[#97754D] bg-[#97754D]/10 px-3 py-1 rounded-lg">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}

                <h2 className="text-xl font-bold text-[#F5F0EA] mb-4 mt-8">
                    Episodes {episodes.length > 0 && `(${episodes.length})`}
                    {rssLoading && (
                        <span className="text-sm font-normal text-[#C2AD90]/50 ml-2">
                            Fetching from RSS…
                        </span>
                    )}
                </h2>

                {episodes.length > 0 ? (
                    <div className="glass rounded-2xl p-2 divide-y divide-white/5">
                        {episodes.map((ep, i) => (
                            <EpisodeDetailRow
                                key={ep.id}
                                episode={ep}
                                index={i}
                                onPlay={() => handlePlayEpisode(ep)}
                            />
                        ))}
                    </div>
                ) : rssLoading ? (
                    <div className="glass rounded-2xl p-10 text-center">
                        <div className="flex items-end gap-1 justify-center">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-1 bg-[#C2AD90]/40 rounded-full soundbar" style={{ animationDelay: `${i * 0.15}s` }} />
                            ))}
                        </div>
                        <p className="text-[#F5F0EA]/30 text-xs mt-3">Fetching episodes from RSS…</p>
                    </div>
                ) : (
                    <div className="glass rounded-2xl p-10 text-center">
                        <p className="text-[#F5F0EA]/40 text-sm">No episodes published yet</p>
                    </div>
                )}
            </div>

            {/* Immersive player overlay */}
            <AnimatePresence>
                {showPlayer && activeEpisode && (
                    <EnhancedEpisodePlayer
                        episode={activeEpisode}
                        onClose={() => setShowPlayer(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Per-episode row inside PodcastDetail ─────────────────────────────────────
function EpisodeDetailRow({ episode, index, onPlay }) {
    const placeholder = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&q=80';
    const hasDbId = episode.id && !String(episode.id).startsWith('rss-');

    const inner = (
        <div
            className="group flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 hover:bg-white/5 cursor-pointer"
            onClick={!hasDbId ? onPlay : undefined}
        >
            <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <img
                    src={episode.cover_image || placeholder}
                    alt={episode.title}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-[#0C100E]/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 text-[#C2AD90] fill-current" />
                </div>
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-[#F5F0EA] truncate group-hover:text-[#C2AD90] transition-colors">
                    {episode.title}
                </h4>
                <p className="text-xs text-[#F5F0EA]/40 truncate">
                    {episode.podcast_title || 'Episode'}
                    {episode.duration_minutes && ` · ${episode.duration_minutes}m`}
                </p>
            </div>

            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPlay(); }}
                className="w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-[#C2AD90]/20 hover:bg-[#C2AD90] text-[#C2AD90] hover:text-[#0C100E] flex-shrink-0"
            >
                <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
        </div>
    );

    if (hasDbId) {
        return (
            <Link to={createPageUrl(`EpisodePlayer?id=${episode.id}`)}>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.04 }}
                >
                    {inner}
                </motion.div>
            </Link>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.04 }}
        >
            {inner}
        </motion.div>
    );
}