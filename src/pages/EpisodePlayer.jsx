import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Pause, SkipBack, SkipForward, Heart, Share2, FileText, Clock, Users, Scissors } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index.js';
import { Slider } from '@/components/ui/slider';
import CommentSection from '../components/comments/CommentSection';
import CreateSessionModal from '../components/sessions/CreateSessionModal';
import ClipGenerator from '../components/clips/ClipGenerator';
import EnhancedEpisodePlayer from '../components/player/EnhancedEpisodePlayer';

export default function EpisodePlayer() {
    const params = new URLSearchParams(window.location.search);
    const episodeId = params.get('id');
    const [showTranscript, setShowTranscript] = useState(false);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [showClipGenerator, setShowClipGenerator] = useState(false);
    const [showEnhancedPlayer, setShowEnhancedPlayer] = useState(true);

    const { data: episode, isLoading } = useQuery({
        queryKey: ['episode', episodeId],
        queryFn: () => apiClient.Episode.get(episodeId),
    });

    const totalDuration = (episode?.duration_minutes || 45) * 60;
    const placeholderImage = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80';


    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0C100E] flex items-center justify-center">
                <div className="flex items-end gap-1">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className={`w-1 bg-[#C2AD90]/60 rounded-full soundbar`} style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                </div>
            </div>
        );
    }

    if (!episode) {
        return (
            <div className="min-h-screen bg-[#0C100E] flex items-center justify-center">
                <p className="text-[#F5F0EA]/40">Episode not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0C100E] pb-32">
            {/* Background gradient */}
            <div className="fixed inset-0 z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-10 blur-3xl scale-110"
                    style={{ backgroundImage: `url('${episode.cover_image || placeholderImage}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0C100E]/80 to-[#0C100E]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-5 pt-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-12">
                    <Link
                        to={episode.podcast_id ? createPageUrl(`PodcastDetail?id=${episode.podcast_id}`) : createPageUrl('Home')}
                        className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[#F5F0EA]/70 hover:text-[#F5F0EA] transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <span className="text-xs text-[#F5F0EA]/30 uppercase tracking-wider">Now Playing</span>
                    <button className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[#F5F0EA]/70 hover:text-[#C2AD90] transition-colors">
                        <Share2 className="w-5 h-5" />
                    </button>
                </div>

                {/* Artwork */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                    className="relative mx-auto w-64 h-64 md:w-80 md:h-80 mb-10"
                >
                    <div className="w-full h-full rounded-3xl overflow-hidden shadow-2xl border border-white/5 transition-all duration-500">
                        <img
                            src={episode.cover_image || placeholderImage}
                            alt={episode.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </motion.div>

                {/* Episode info */}
                <div className="text-center mb-8">
                    <h1 className="text-xl md:text-2xl font-bold text-[#F5F0EA] mb-2">{episode.title}</h1>
                    <p className="text-sm text-[#C2AD90]/70">{episode.podcast_title || 'Podcast'}</p>
                    {episode.season && episode.episode_number && (
                        <p className="text-xs text-[#F5F0EA]/25 mt-1">
                            S{episode.season} • E{episode.episode_number}
                        </p>
                    )}
                </div>

                {/* Enhanced Player Controls */}
                <div className="flex items-center justify-center gap-8 mb-10">
                    <button
                        onClick={() => setShowEnhancedPlayer(true)}
                        className="w-16 h-16 rounded-full bg-[#C2AD90] flex items-center justify-center shadow-[0_0_40px_rgba(194,173,144,0.3)] hover:bg-[#97754D] transition-all duration-300"
                    >
                        <Play className="w-7 h-7 text-[#0C100E] fill-current ml-1" />
                    </button>
                    <p className="text-[#F5F0EA]/40 text-sm">Tap to open immersive player</p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-6 mb-10">
                    <button className="flex flex-col items-center gap-1 text-[#F5F0EA]/30 hover:text-[#C2AD90] transition-colors">
                        <Heart className="w-5 h-5" />
                        <span className="text-[10px]">Like</span>
                    </button>
                    <button
                        onClick={() => setShowSessionModal(true)}
                        className="flex flex-col items-center gap-1 text-[#F5F0EA]/30 hover:text-[#C2AD90] transition-colors"
                    >
                        <Users className="w-5 h-5" />
                        <span className="text-[10px]">Group Listen</span>
                    </button>
                    <button
                        onClick={() => setShowClipGenerator(true)}
                        className="flex flex-col items-center gap-1 text-[#F5F0EA]/30 hover:text-[#C2AD90] transition-colors"
                    >
                        <Scissors className="w-5 h-5" />
                        <span className="text-[10px]">Share Clip</span>
                    </button>
                    <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className={`flex flex-col items-center gap-1 transition-colors ${showTranscript ? 'text-[#C2AD90]' : 'text-[#F5F0EA]/30 hover:text-[#C2AD90]'}`}
                    >
                        <FileText className="w-5 h-5" />
                        <span className="text-[10px]">Transcript</span>
                    </button>
                </div>

                {/* Transcript/Summary */}
                {showTranscript && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-6 mb-10"
                    >
                        <h3 className="text-sm font-semibold text-[#C2AD90] mb-3">Episode Summary</h3>
                        <p className="text-sm text-[#F5F0EA]/50 leading-relaxed">
                            {episode.transcript_summary || episode.description || 'No transcript available for this episode.'}
                        </p>
                    </motion.div>
                )}

                {/* Episode details */}
                {episode.description && (
                    <div className="glass rounded-2xl p-6">
                        <h3 className="text-sm font-semibold text-[#F5F0EA]/70 mb-3">About this episode</h3>
                        <p className="text-sm text-[#F5F0EA]/40 leading-relaxed">{episode.description}</p>
                        {episode.duration_minutes && (
                            <div className="flex items-center gap-2 mt-4 text-xs text-[#F5F0EA]/25">
                                <Clock className="w-3 h-3" />
                                {episode.duration_minutes} minutes
                            </div>
                        )}
                    </div>
                )}

                {/* Comments */}
                <CommentSection episodeId={episodeId} />
            </div>

            <CreateSessionModal
                open={showSessionModal}
                onClose={() => setShowSessionModal(false)}
                episodeId={episodeId}
                episodeTitle={episode.title}
            />

            <ClipGenerator
                episode={episode}
                open={showClipGenerator}
                onClose={() => setShowClipGenerator(false)}
            />

            <AnimatePresence>
                {showEnhancedPlayer && (
                    <EnhancedEpisodePlayer
                        episode={episode}
                        onClose={() => setShowEnhancedPlayer(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}