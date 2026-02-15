import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Bookmark, BookmarkCheck, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Button } from "@/components/ui/button";
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';

export default function EnhancedEpisodeCard({ episode, index = 0 }) {
    const [saved, setSaved] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const user = await apiClient.auth.me();
            if (!saved) {
                await apiClient.Like.create({
                    episode_id: episode.id,
                    episode_title: episode.title,
                    podcast_title: episode.podcast_title
                });
                toast.success('Saved to library');
            }
            setSaved(!saved);
        } catch (error) {
            toast.error('Please log in to save episodes');
        }
    };

    const placeholderImage = 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&q=80';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5 }}
        >
            <Link to={createPageUrl(`EpisodePlayer?id=${episode.id}`)}>
                <div className="glass rounded-2xl overflow-hidden group cursor-pointer">
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden">
                        <img
                            src={episode.cover_image || placeholderImage}
                            alt={episode.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0C100E] to-transparent opacity-60" />

                        {/* Play button overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-14 h-14 rounded-full bg-[#C2AD90] flex items-center justify-center shadow-2xl">
                                <Play className="w-6 h-6 text-[#0C100E] fill-current ml-1" />
                            </div>
                        </div>

                        {/* Duration badge */}
                        {episode.duration_minutes && (
                            <div className="absolute top-3 right-3 bg-[#0C100E]/80 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#C2AD90]" />
                                <span className="text-xs text-[#F5F0EA]">{episode.duration_minutes}m</span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                        <h3 className="font-semibold text-[#F5F0EA] mb-1 line-clamp-2 group-hover:text-[#C2AD90] transition-colors">
                            {episode.title}
                        </h3>
                        <p className="text-xs text-[#F5F0EA]/40 mb-2">{episode.podcast_title || 'Podcast'}</p>

                        {/* Summary snippet */}
                        {episode.description && (
                            <p className="text-xs text-[#F5F0EA]/30 line-clamp-2 mb-3">
                                {episode.description}
                            </p>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                className="flex-1 bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E] text-xs"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.location.href = createPageUrl(`EpisodePlayer?id=${episode.id}`);
                                }}
                            >
                                <Play className="w-3 h-3 mr-1" />
                                Play Now
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className={`border-[#364442] ${saved ? 'bg-[#C2AD90]/10 text-[#C2AD90]' : 'text-[#F5F0EA]/70'} hover:bg-[#364442]/20`}
                                onClick={handleSave}
                            >
                                {saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}