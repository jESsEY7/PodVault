import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Heart, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function EpisodeRow({ episode, index = 0 }) {
    const placeholderImages = [
        'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&q=80',
        'https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=200&q=80',
        'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=200&q=80',
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05, duration: 0.4 }}
        >
            <Link
                to={createPageUrl(`EpisodePlayer?id=${episode.id}`)}
                className="group flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 hover:bg-white/5"
            >
                {/* Thumbnail */}
                <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden flex-shrink-0">
                    <img
                        src={episode.cover_image || placeholderImages[index % placeholderImages.length]}
                        alt={episode.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-[#0C100E]/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-[#C2AD90] fill-current" />
                    </div>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        {episode.tier === 'premium' && (
                            <Lock className="w-3 h-3 text-[#C2AD90] flex-shrink-0" />
                        )}
                        <h4 className="text-sm font-medium text-[#F5F0EA] truncate group-hover:text-[#C2AD90] transition-colors">
                            {episode.title}
                        </h4>
                    </div>
                    <p className="text-xs text-[#F5F0EA]/40 truncate">
                        {episode.podcast_title || 'Podcast'}
                    </p>
                    {episode.summary && (
                        <p className="text-[10px] text-[#F5F0EA]/60 mt-1 line-clamp-1">
                            {episode.summary}
                        </p>
                    )}
                </div>

                {/* Meta */}
                <div className="hidden md:flex items-center gap-4 text-[#F5F0EA]/30 text-xs">
                    {episode.duration_minutes && (
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {episode.duration_minutes}m
                        </span>
                    )}
                    {episode.likes > 0 && (
                        <span className="flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            {episode.likes}
                        </span>
                    )}
                </div>

                {/* Play indicator */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-[#C2AD90]/10">
                    <Play className="w-3.5 h-3.5 text-[#C2AD90] fill-current ml-0.5" />
                </div>
            </Link>
        </motion.div>
    );
}