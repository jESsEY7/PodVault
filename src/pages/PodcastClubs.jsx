import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { motion } from 'framer-motion';
import { Users, Headphones, MessageCircle, ArrowRight, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils/index';
import { Button } from "@/components/ui/button";

export default function PodcastClubs() {
    // Mock fetching active sessions
    const { data: activeSessions = [], isLoading } = useQuery({
        queryKey: ['active-sessions'],
        queryFn: () => apiClient.ListeningSession.list('-created_date', 20),
    });

    const categories = [
        { id: 'tech', name: 'Tech Talk', count: 12, color: '#3B82F6' },
        { id: 'finance', name: 'Money Matters', count: 8, color: '#10B981' },
        { id: 'comedy', name: 'Laughter Lounge', count: 25, color: '#F59E0B' },
        { id: 'culture', name: 'Nairobi Culture', count: 15, color: '#EC4899' },
    ];

    return (
        <div className="min-h-screen bg-[#0C100E] pt-24 pb-32 px-4 md:px-8">
            <div className="max-w-7xl mx-auto space-y-12">

                {/* Hero Section */}
                <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#1C1F1E] to-[#0C100E] border border-[#364442] p-8 md:p-12">
                    <div className="relative z-10 max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-[#C2AD90]/10 text-[#C2AD90] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                            <Radio className="w-4 h-4 animate-pulse" />
                            Live Now
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-[#F5F0EA] mb-6 leading-tight">
                            Join the Conversation. <br />
                            <span className="text-[#C2AD90]">Listen Together.</span>
                        </h1>
                        <p className="text-[#F5F0EA]/60 text-lg mb-8 max-w-lg">
                            Hop into live listening rooms, share reactions in real-time, and discover new perspectives with the community.
                        </p>
                        <Button className="bg-[#C2AD90] text-[#0C100E] hover:bg-[#A9937D] px-8 py-6 text-lg rounded-xl">
                            Start a Club
                        </Button>
                    </div>
                    {/* Abstract visual */}
                    <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-l from-[#C2AD90] to-transparent mix-blend-overlay" />
                    </div>
                </div>

                {/* Categories */}
                <div>
                    <h2 className="text-xl font-bold text-[#F5F0EA] mb-6">Explore Communities</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categories.map((cat) => (
                            <motion.div
                                key={cat.id}
                                whileHover={{ y: -5 }}
                                className="glass p-6 rounded-2xl cursor-pointer hover:bg-white/5 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${cat.color}20` }}>
                                    <Users className="w-5 h-5" style={{ color: cat.color }} />
                                </div>
                                <h3 className="font-bold text-[#F5F0EA] mb-1 group-hover:text-[#C2AD90] transition-colors">{cat.name}</h3>
                                <p className="text-xs text-[#F5F0EA]/40">{cat.count} Active Rooms</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Active Sessions Grid */}
                <div>
                    <h2 className="text-xl font-bold text-[#F5F0EA] mb-6 flex items-center gap-2">
                        <Headphones className="w-5 h-5 text-[#C2AD90]" />
                        Happening Now
                    </h2>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-48 glass rounded-2xl animate-pulse" />
                            ))}
                        </div>
                    ) : activeSessions.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeSessions.map((session, i) => (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="glass rounded-2xl p-6 group hover:border-[#C2AD90]/30 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-[#C2AD90]/10 text-[#C2AD90] text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                            {session.category || 'General'}
                                        </span>
                                        <div className="flex items-center gap-1 text-[#F5F0EA]/40 text-xs">
                                            <Users className="w-3 h-3" />
                                            {session.participant_count || 1}
                                        </div>
                                    </div>

                                    <h3 className="font-bold text-[#F5F0EA] text-lg mb-2 line-clamp-1 group-hover:text-[#C2AD90] transition-colors">
                                        {session.session_name}
                                    </h3>
                                    <p className="text-sm text-[#F5F0EA]/50 mb-6">
                                        Hosted by <span className="text-[#F5F0EA]/80">{session.host_name}</span>
                                    </p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center -space-x-2">
                                            {[...Array(3)].map((_, j) => (
                                                <div key={j} className="w-8 h-8 rounded-full bg-[#364442] border-2 border-[#0C100E]" />
                                            ))}
                                        </div>
                                        <Link
                                            to={createPageUrl(`GroupSession?id=${session.id}`)}
                                            className="w-10 h-10 rounded-full bg-[#F5F0EA] flex items-center justify-center text-[#0C100E]  hover:scale-110 transition-transform"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 glass rounded-3xl">
                            <MessageCircle className="w-12 h-12 text-[#F5F0EA]/20 mx-auto mb-4" />
                            <h3 className="text-[#F5F0EA] font-semibold mb-2">No active sessions</h3>
                            <p className="text-[#F5F0EA]/40 text-sm">Be the first to start a listening party!</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
