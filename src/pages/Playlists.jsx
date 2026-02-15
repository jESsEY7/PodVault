import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Plus, Music, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import CreatePlaylistModal from '../components/playlists/CreatePlaylistModal';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index.js';

export default function PlaylistsPage() {
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data: playlists = [], isLoading, refetch } = useQuery({
        queryKey: ['playlists'],
        queryFn: async () => {
            const user = await apiClient.auth.me();
            return apiClient.Playlist.filter({ created_by: user.email }, '-created_date');
        },
    });

    return (
        <div className="min-h-screen pt-20 pb-32 px-6">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-8"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C2AD90] to-[#97754D] flex items-center justify-center">
                            <Music className="w-5 h-5 text-[#0C100E]" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-[#F5F0EA]">My Playlists</h1>
                            <p className="text-[#F5F0EA]/40 text-sm mt-1">Create and share your collections</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Playlist
                    </Button>
                </motion.div>

                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="glass rounded-2xl p-6 animate-pulse">
                                <div className="w-full aspect-square bg-[#364442]/40 rounded-xl mb-4" />
                                <div className="h-4 bg-[#364442]/40 rounded mb-2" />
                                <div className="h-3 bg-[#364442]/40 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : playlists.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center">
                        <Music className="w-16 h-16 text-[#364442] mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-[#F5F0EA] mb-2">No playlists yet</h3>
                        <p className="text-[#F5F0EA]/40 mb-6">Start creating your first playlist!</p>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Playlist
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                        {playlists.map((playlist, i) => (
                            <motion.div
                                key={playlist.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Link to={createPageUrl(`PlaylistDetail?id=${playlist.id}`)}>
                                    <div className="glass rounded-2xl p-6 hover:bg-white/10 transition cursor-pointer group">
                                        <div className="w-full aspect-square bg-gradient-to-br from-[#364442] to-[#5D4429] rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
                                            <Music className="w-12 h-12 text-[#C2AD90]/30" />
                                            {!playlist.is_public && (
                                                <div className="absolute top-2 right-2">
                                                    <Lock className="w-4 h-4 text-[#C2AD90]" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-[#F5F0EA] font-semibold truncate group-hover:text-[#C2AD90] transition">
                                            {playlist.name}
                                        </h3>
                                        <p className="text-xs text-[#F5F0EA]/40 mt-1">
                                            {playlist.episode_ids?.length || 0} episodes
                                        </p>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <CreatePlaylistModal
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={refetch}
            />
        </div>
    );
}