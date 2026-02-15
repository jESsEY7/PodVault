import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Music, Sparkles, Calendar, Clock, ListMusic } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import PodcastCard from '../components/cards/PodcastCard';
import EpisodeRow from '../components/cards/EpisodeRow';
import { Button } from "@/components/ui/button";

export default function SmartPlaylists() {
    const [activeTab, setActiveTab] = useState('daily');
    const [customPrompt, setCustomPrompt] = useState('');
    const [generating, setGenerating] = useState(false);

    // Mock data for Daily Mix and Weekly Digest (in real app, fetched from API)
    const { data: dailyMix = [] } = useQuery({
        queryKey: ['daily-mix'],
        queryFn: () => apiClient.Episode.list('-published_date', 5),
    });

    const { data: weeklyDigest = [] } = useQuery({
        queryKey: ['weekly-digest'],
        queryFn: () => apiClient.Podcast.list('-rank', 4),
    });

    const handleCreateCustom = async (e) => {
        e.preventDefault();
        setGenerating(true);
        // Simulate AI generation delay
        setTimeout(() => {
            setGenerating(false);
            setCustomPrompt('');
        }, 2000);
    };

    return (
        <div className="min-h-screen bg-[#0C100E] pb-32 pt-24 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 text-[#C2AD90] mb-2">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-sm font-bold uppercase tracking-wider">AI-Curated</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-[#F5F0EA]">Smart Playlists</h1>
                        <p className="text-[#F5F0EA]/60 mt-2 max-w-xl">
                            Personalized mixes generated daily based on your listening habits, interests, and the latest trending topics in Kenya.
                        </p>
                    </div>
                    <Button className="bg-[#C2AD90] text-[#0C100E] hover:bg-[#A9937D] gap-2">
                        <Plus className="w-4 h-4" /> Create Custom Mix
                    </Button>
                </div>

                {/* Featured Mixes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Daily Mix Card */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass p-8 rounded-3xl relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-[#C2AD90]/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-[#C2AD90]/20" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-full bg-[#C2AD90] flex items-center justify-center mb-6 shadow-lg shadow-[#C2AD90]/20">
                                <Clock className="w-6 h-6 text-[#0C100E]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#F5F0EA] mb-2">Daily Drive</h2>
                            <p className="text-[#F5F0EA]/50 text-sm mb-6 line-clamp-2">
                                A perfectly timed mix of news, tech updates, and comedy for your morning commute.
                            </p>
                            <div className="flex items-center gap-4">
                                <Button size="icon" className="rounded-full w-12 h-12 bg-[#F5F0EA] text-[#0C100E] hover:bg-white hover:scale-105 transition-all">
                                    <Play className="w-5 h-5 fill-current ml-1" />
                                </Button>
                                <span className="text-xs font-medium text-[#F5F0EA]/40 uppercase tracking-wider">45 mins • 5 Tracks</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Weekly Digest Card */}
                    <motion.div
                        whileHover={{ y: -5 }}
                        className="glass p-8 rounded-3xl relative overflow-hidden group cursor-pointer"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-[#364442]/30 rounded-full blur-3xl -mr-16 -mt-16 transition-all group-hover:bg-[#364442]/40" />
                        <div className="relative z-10">
                            <div className="w-12 h-12 rounded-full bg-[#364442] flex items-center justify-center mb-6 shadow-lg">
                                <Calendar className="w-6 h-6 text-[#F5F0EA]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#F5F0EA] mb-2">Weekly Digest</h2>
                            <p className="text-[#F5F0EA]/50 text-sm mb-6 line-clamp-2">
                                Catch up on the week's most-discussed topics and viral moments from your favorite creators.
                            </p>
                            <div className="flex items-center gap-4">
                                <Button size="icon" className="rounded-full w-12 h-12 bg-[#F5F0EA] text-[#0C100E] hover:bg-white hover:scale-105 transition-all">
                                    <Play className="w-5 h-5 fill-current ml-1" />
                                </Button>
                                <span className="text-xs font-medium text-[#F5F0EA]/40 uppercase tracking-wider">2 hrs • 8 Episodes</span>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* AI Generator Section */}
                <div className="glass rounded-3xl p-1 bg-gradient-to-br from-white/5 to-white/0">
                    <div className="bg-[#0C100E]/80 backdrop-blur-xl rounded-[22px] p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#C2AD90]/5 via-transparent to-[#364442]/10" />

                        <div className="relative z-10 max-w-2xl mx-auto">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C2AD90] to-[#5D4429] mx-auto mb-6 flex items-center justify-center shadow-2xl">
                                <Sparkles className="w-8 h-8 text-[#0C100E]" />
                            </div>
                            <h2 className="text-3xl font-bold text-[#F5F0EA] mb-4">Design Your Vibe</h2>
                            <p className="text-[#F5F0EA]/60 mb-8">
                                Tell our AI what you're in the mood for, and we'll craft a custom playlist instantly.
                            </p>

                            <form onSubmit={handleCreateCustom} className="relative">
                                <input
                                    type="text"
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder="e.g., 'Upbeat afro-house for a workout' or 'Deep financial insights'"
                                    className="w-full bg-[#1C1F1E] border border-[#364442] rounded-2xl py-5 pl-6 pr-32 text-[#F5F0EA] placeholder:text-[#F5F0EA]/20 focus:outline-none focus:border-[#C2AD90] transition-colors"
                                />
                                <Button
                                    type="submit"
                                    disabled={!customPrompt || generating}
                                    className="absolute right-2 top-2 bottom-2 bg-[#C2AD90] text-[#0C100E] hover:bg-[#A9937D] px-6 rounded-xl font-semibold"
                                >
                                    {generating ? 'Crafting...' : 'Generate'}
                                </Button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <div className="space-y-8">
                    <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex gap-8">
                            {['daily', 'weekly', 'saved'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-sm font-bold uppercase tracking-wider pb-4 -mb-4 border-b-2 transition-colors ${activeTab === tab
                                            ? 'text-[#C2AD90] border-[#C2AD90]'
                                            : 'text-[#F5F0EA]/40 border-transparent hover:text-[#F5F0EA]'
                                        }`}
                                >
                                    {tab === 'daily' ? 'Your Daily Mix' : tab === 'weekly' ? 'Weekly Discovery' : 'Saved Playlists'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4">
                        {dailyMix.map((episode, i) => (
                            <EpisodeRow key={episode.id} episode={episode} index={i} />
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
