import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import HeroSection from '../components/home/HeroSection';
import FeaturedCarousel from '../components/home/FeaturedCarousel';
import ShowCarousel from '../components/ShowCarousel';
import CategoryPills from '../components/home/CategoryPills';
import PodcastGrid from '../components/home/PodcastGrid';
import TrendingSection from '../components/home/TrendingSection';
import CreatorsRow from '../components/home/CreatorsRow';
import PersonalizedFeed from '../components/recommendations/PersonalizedFeed';
import { motion } from 'framer-motion';
import { MOCK_PODCAST_DATA } from '../mock/podcastData';

export default function Home() {
    const [activeCategory, setActiveCategory] = useState('All');

    // Fetch Data using React Query

    const { data: podcastsData, isLoading: loadingPodcasts } = useQuery({
        queryKey: ['podcasts', activeCategory],
        queryFn: async () => {
            if (activeCategory === 'All') {
                return apiClient.Podcast.list();
            }
            // All category pills (News, Technology, Business, etc.)
            // are matched by slug on the backend
            return apiClient.Podcast.filter({ category: activeCategory });
        }
    });


    const { data: trendingData, isLoading: loadingTrending } = useQuery({
        queryKey: ['trending'],
        queryFn: () => apiClient.Episode.list('trending') // Assuming 'trending' can be handled by list or a specific endpoint
    });

    const { data: creatorsData, isLoading: loadingCreators } = useQuery({
        queryKey: ['creators'],
        queryFn: () => apiClient.Creator.list()
    });

    const loading = loadingPodcasts || loadingTrending || loadingCreators;

    // Fallback to empty arrays
    const podcasts = podcastsData?.results || [];
    const creators = creatorsData?.results || [];
    const episodes = trendingData?.results || [];

    const filteredPodcasts = podcasts; // Filtering is now done via API or we can refine client-side if needed
    // If API returns all, we might still need client-side filter if the API didn't handle it perfectly or if we want to be safe
    // But for now let's assume API handles it or we just use the result.

    // NOTE: If using real data, ensure your backend has CORS enabled and is running!

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0C100E] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C2AD90] mx-auto mb-4"></div>
                    <p className="text-[#F5F0EA] animate-pulse">Inhaling podcasts...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0C100E]">
            <HeroSection />

            <div className="relative z-10 -mt-20 pb-32">
                {/* Content sections */}
                <div className="max-w-[1400px] mx-auto px-5 md:px-8 space-y-16">
                    {/* Featured */}
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <FeaturedCarousel podcasts={podcasts} />
                    </motion.section>

                    {/* Shows You Might Like (New Carousel) */}
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <ShowCarousel title="Shows you might like" shows={podcasts} to="/Explore" />
                    </motion.section>

                    {/* Personalized Recommendations */}
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <PersonalizedFeed />
                    </motion.section>

                    {/* Category filter + Grid */}
                    <section>
                        <div className="flex items-center gap-6 border-b border-white/10 mb-8">
                            <button
                                onClick={() => setActiveCategory('All')}
                                className={`pb-4 text-lg font-bold transition-colors relative ${activeCategory !== 'Clubs' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                            >
                                Discover
                                {activeCategory !== 'Clubs' && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#C2AD90] rounded-t-full" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveCategory('Clubs')}
                                className={`pb-4 text-lg font-bold transition-colors relative ${activeCategory === 'Clubs' ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                            >
                                Clubs
                                {activeCategory === 'Clubs' && (
                                    <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#C2AD90] rounded-t-full" />
                                )}
                            </button>
                        </div>

                        {activeCategory === 'Clubs' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Mock Club Cards */}
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C2AD90] to-orange-500 flex items-center justify-center text-black font-bold">
                                                NC
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white group-hover:text-[#C2AD90] transition-colors">Nairobi Crypto Club</h3>
                                                <p className="text-xs text-white/50">1.2k Members • Active Now</p>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-black/40 rounded-lg flex gap-3 items-center">
                                                <div className="w-8 h-8 rounded bg-gray-800 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-white line-clamp-1">Bitcoin in Africa: 2026 Outlook</p>
                                                    <p className="text-xs text-[#C2AD90]">Recommended by 5 members</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <CategoryPills active={activeCategory} onSelect={setActiveCategory} />
                                <div className="mt-8">
                                    <PodcastGrid
                                        podcasts={filteredPodcasts}
                                        title="Discover"
                                        subtitle="Curated for your ears"
                                    />
                                </div>
                            </>
                        )}
                    </section>

                    {/* Top Creators */}
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <CreatorsRow creators={creators} />
                    </motion.section>

                    {/* Trending Episodes */}
                    <motion.section
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <TrendingSection episodes={episodes} />
                    </motion.section>

                    {/* Footer */}
                    <footer className="border-t border-white/5 pt-12 pb-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div>
                                <h3 className="text-xl font-bold text-gradient">The Podcast Vault</h3>
                                <p className="text-xs text-[#F5F0EA]/30 mt-1">Where sound becomes intelligence</p>
                            </div>
                            <div className="flex gap-8 text-xs text-[#F5F0EA]/30">
                                <span className="hover:text-[#C2AD90] cursor-pointer transition-colors">About</span>
                                <span className="hover:text-[#C2AD90] cursor-pointer transition-colors">Creators</span>
                                <span className="hover:text-[#C2AD90] cursor-pointer transition-colors">Privacy</span>
                                <span className="hover:text-[#C2AD90] cursor-pointer transition-colors">Terms</span>
                            </div>
                        </div>
                        <p className="text-center text-[#F5F0EA]/15 text-xs mt-8">© 2026 The Podcast Vault. All rights reserved.</p>
                    </footer>
                </div>
            </div>
        </div>
    );
}
