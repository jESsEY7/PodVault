import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, RotateCw, Download, Check, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useOfflineVault } from '../../hooks/useOfflineVault';
import ContentGate from '../ui/ContentGate';
import { useAuth } from '../../lib/AuthContext';

export default function PodcastCard({ podcast, index = 0 }) {
    const [isSyncing, setIsSyncing] = useState(false);
    const { isAuthenticated } = useAuth();
    const isPremium = podcast.tier === 'premium';

    // Check if this card represents a playable item (has audio_url)
    // The prop is named 'podcast' but might be an episode/track in some contexts
    const isPlayable = !!podcast.audio_url;

    const {
        vaultStatus,
        saveToVault,
        removeFromVault
    } = useOfflineVault(podcast.id, podcast.audio_url);

    const handleSync = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!podcast.remote_id) return;

        setIsSyncing(true);
        try {
            const response = await fetch('http://localhost:8000/api/ingest/sync/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ remote_id: podcast.remote_id }),
            });
            const data = await response.json();
            console.log('Sync result:', data);
        } catch (error) {
            console.error('Sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleVault = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (vaultStatus === 'saved') {
            removeFromVault();
        } else {
            saveToVault();
        }
    };

    return (
        <ContentGate isPremium={isPremium} compact={true}>
            <Link to={createPageUrl(`PodcastDetail?id=${podcast.id}`)} className="group relative block">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative aspect-square rounded-xl overflow-hidden bg-[#0C100E]"
                >
                    <img
                        src={podcast.cover_url || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80'}
                        alt={podcast.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0C100E]/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        {/* Sync Button (Existing) */}
                        <button
                            onClick={handleSync}
                            disabled={isSyncing}
                            className={`p-2 rounded-full bg-[#0C100E]/50 backdrop-blur-sm hover:bg-[#C2AD90] text-[#F5F0EA] hover:text-[#0C100E] transition-colors ${isSyncing ? 'animate-spin' : ''}`}
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>

                        {/* Vault/Download Button (New) */}
                        {isPlayable && (
                            <button
                                onClick={handleVault}
                                className={`p-2 rounded-full backdrop-blur-sm transition-colors ${vaultStatus === 'saved'
                                    ? 'bg-[#C2AD90] text-[#0C100E]'
                                    : 'bg-[#0C100E]/50 text-[#F5F0EA] hover:bg-[#C2AD90] hover:text-[#0C100E]'
                                    }`}
                            >
                                {vaultStatus === 'downloading' ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                ) : vaultStatus === 'saved' ? (
                                    <Check className="w-4 h-4" />
                                ) : (
                                    <Download className="w-4 h-4" />
                                )}
                            </button>
                        )}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        <h3 className="text-[#F5F0EA] font-bold line-clamp-1 mb-1">{podcast.title}</h3>
                        <p className="text-[#F5F0EA]/60 text-xs line-clamp-1 mb-3">{podcast.author || 'Unknown'}</p>

                        <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                            <span className="text-[10px] uppercase tracking-wider text-[#C2AD90] font-bold bg-[#C2AD90]/10 px-2 py-1 rounded">
                                {podcast.category || 'Podcast'}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-[#C2AD90] flex items-center justify-center transform hover:scale-110 transition-transform">
                                <Play className="w-3.5 h-3.5 text-[#0C100E] fill-current" />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
        </ContentGate>
    );
}
