import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import EpisodeRow from '../components/cards/EpisodeRow';
import PodcastCard from '../components/cards/PodcastCard';
import { motion } from 'framer-motion';
import { Library as LibraryIcon, Clock, BookmarkPlus } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function Library() {
    const { data: podcasts = [] } = useQuery({
        queryKey: ['library-podcasts'],
        queryFn: () => apiClient.Podcast.list('-created_date', 50),
    });

    const { data: episodes = [] } = useQuery({
        queryKey: ['library-episodes'],
        queryFn: () => apiClient.Episode.list('-published_at', 50),
    });

    return (
        <div className="min-h-screen bg-[#0C100E] pt-12 pb-32">
            <div className="max-w-[1400px] mx-auto px-5 md:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <LibraryIcon className="w-6 h-6 text-[#C2AD90]" />
                        <h1 className="text-3xl md:text-4xl font-bold text-[#F5F0EA]">Your Library</h1>
                    </div>
                    <p className="text-[#F5F0EA]/40 text-sm">Your personal podcast collection</p>
                </motion.div>

                <Tabs defaultValue="shows" className="w-full">
                    <TabsList className="bg-transparent border-b border-white/5 rounded-none w-full justify-start gap-4 h-auto pb-0">
                        <TabsTrigger
                            value="shows"
                            className="data-[state=active]:bg-transparent data-[state=active]:text-[#C2AD90] data-[state=active]:border-b-2 data-[state=active]:border-[#C2AD90] text-[#F5F0EA]/40 rounded-none pb-3 px-1"
                        >
                            Shows
                        </TabsTrigger>
                        <TabsTrigger
                            value="episodes"
                            className="data-[state=active]:bg-transparent data-[state=active]:text-[#C2AD90] data-[state=active]:border-b-2 data-[state=active]:border-[#C2AD90] text-[#F5F0EA]/40 rounded-none pb-3 px-1"
                        >
                            Episodes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="shows" className="mt-8">
                        {podcasts.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                {podcasts.map((p, i) => (
                                    <PodcastCard key={p.id} podcast={p} index={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24">
                                <div className="w-16 h-16 rounded-2xl glass mx-auto flex items-center justify-center mb-4">
                                    <BookmarkPlus className="w-7 h-7 text-[#C2AD90]/40" />
                                </div>
                                <p className="text-[#F5F0EA]/40 text-sm mb-1">Your library is empty</p>
                                <p className="text-[#F5F0EA]/20 text-xs">Explore and add podcasts to get started</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="episodes" className="mt-8">
                        {episodes.length > 0 ? (
                            <div className="glass rounded-2xl p-2 divide-y divide-white/5">
                                {episodes.map((ep, i) => (
                                    <EpisodeRow key={ep.id} episode={ep} index={i} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24">
                                <div className="w-16 h-16 rounded-2xl glass mx-auto flex items-center justify-center mb-4">
                                    <Clock className="w-7 h-7 text-[#C2AD90]/40" />
                                </div>
                                <p className="text-[#F5F0EA]/40 text-sm mb-1">No episodes yet</p>
                                <p className="text-[#F5F0EA]/20 text-xs">Episodes you listen to will appear here</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}