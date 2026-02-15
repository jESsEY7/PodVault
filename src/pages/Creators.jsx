import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { BadgeCheck, Users, ExternalLink, Mic2 } from 'lucide-react';

export default function Creators() {
    const { data: creators = [] } = useQuery({
        queryKey: ['all-creators'],
        queryFn: () => apiClient.Creator.list('-created_date', 50),
    });

    const placeholderAvatars = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
    ];

    return (
        <div className="min-h-screen bg-[#0C100E] pt-12 pb-32">
            <div className="max-w-[1400px] mx-auto px-5 md:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <Mic2 className="w-6 h-6 text-[#C2AD90]" />
                        <h1 className="text-3xl md:text-4xl font-bold text-[#F5F0EA]">Creators</h1>
                    </div>
                    <p className="text-[#F5F0EA]/40 text-sm">The voices behind the vault</p>
                </motion.div>

                {creators.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {creators.map((creator, i) => (
                            <motion.div
                                key={creator.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="glass rounded-2xl p-6 group hover:glow-sandstone transition-all duration-500"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative w-16 h-16 flex-shrink-0">
                                        <div className="w-full h-full rounded-xl overflow-hidden">
                                            <img
                                                src={creator.avatar_url || placeholderAvatars[i % placeholderAvatars.length]}
                                                alt={creator.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        {creator.is_verified && (
                                            <BadgeCheck className="absolute -bottom-1 -right-1 w-5 h-5 text-[#C2AD90] bg-[#0C100E] rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-[#F5F0EA] group-hover:text-[#C2AD90] transition-colors">
                                            {creator.name}
                                        </h3>
                                        {creator.categories?.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                {creator.categories.slice(0, 3).map(cat => (
                                                    <span key={cat} className="text-[10px] uppercase tracking-wider text-[#97754D] bg-[#97754D]/10 px-2 py-0.5 rounded">
                                                        {cat}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        {creator.bio && (
                                            <p className="text-xs text-[#F5F0EA]/40 mt-2 line-clamp-2">{creator.bio}</p>
                                        )}
                                        <div className="flex items-center gap-4 mt-3">
                                            {creator.follower_count > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-[#F5F0EA]/30">
                                                    <Users className="w-3 h-3" />
                                                    {creator.follower_count.toLocaleString()}
                                                </span>
                                            )}
                                            {creator.social_links?.website && (
                                                <a
                                                    href={creator.social_links.website}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-xs text-[#C2AD90]/50 hover:text-[#C2AD90]"
                                                >
                                                    <ExternalLink className="w-3 h-3" />
                                                    Website
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24">
                        <div className="w-20 h-20 rounded-2xl glass mx-auto flex items-center justify-center mb-4">
                            <Mic2 className="w-8 h-8 text-[#C2AD90]/30" />
                        </div>
                        <p className="text-[#F5F0EA]/40 text-sm">No creators yet</p>
                        <p className="text-[#F5F0EA]/20 text-xs mt-1">Creators will appear here once they join the vault</p>
                    </div>
                )}
            </div>
        </div>
    );
}