import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { apiClient } from '@/api/apiClient';
import KnowledgeNodeExpanded from './KnowledgeNodeExpanded';

// Force HMR update
export default function KnowledgeNodeCard({ episode, index = 0 }) {
    const [aiSummary, setAiSummary] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedData, setExpandedData] = useState(null);
    const placeholderGuest = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80';

    useEffect(() => {
        if (episode.summary) {
            setAiSummary(episode.summary);
        } else if (!episode.transcript_summary && episode.description) {
            generateSummary();
        } else if (episode.transcript_summary) {
            setAiSummary(episode.transcript_summary);
        }
    }, [episode]);

    const generateSummary = async () => {
        try {
            const summary = await apiClient.Episode.generateSummary(episode.id);
            setAiSummary(summary);
        } catch (error) {
            console.error('Summary generation failed:', error);
        }
    };

    const handleExpand = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            const data = await apiClient.Episode.getSummary(episode.id);
            setExpandedData(data);
            setIsExpanded(true);
        } catch (error) {
            console.error('Failed to load expanded summary:', error);
        }
    };

    return (
        <>
            <KnowledgeNodeExpanded
                episode={episode}
                summaryData={expandedData}
                onClose={() => setIsExpanded(false)}
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -8, scale: 1.02 }}
            >
                <Link to={createPageUrl(`EpisodePlayer?id=${episode.id}`)}>
                    <div className="glass rounded-2xl overflow-hidden group cursor-pointer border border-[#364442]/30">
                        {/* Top: Duration & Category */}
                        <div className="bg-gradient-to-r from-[#364442]/50 to-[#5D4429]/50 px-4 py-2.5 flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest text-[#C2AD90] font-semibold">
                                {episode.tags?.[0] || 'Knowledge'}
                            </span>
                            <div className="flex items-center gap-1 text-[#F5F0EA]/60">
                                <Clock className="w-3 h-3" />
                                <span className="text-xs">{episode.duration_minutes || 45} mins</span>
                            </div>
                        </div>

                        {/* Middle: Guest Portrait */}
                        <div className="relative aspect-square overflow-hidden">
                            <img
                                src={episode.cover_image || placeholderGuest}
                                alt={episode.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0C100E] via-transparent to-transparent opacity-70" />

                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-[#0C100E]/0 group-hover:bg-[#0C100E]/60 transition-all duration-500 flex items-center justify-center">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    whileHover={{ scale: 1 }}
                                    className="w-16 h-16 rounded-full bg-[#C2AD90] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_40px_rgba(194,173,144,0.5)]"
                                >
                                    <svg className="w-7 h-7 text-[#0C100E] ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </motion.div>
                            </div>

                            {/* Episode title overlay */}
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-sm font-semibold text-[#F5F0EA] line-clamp-2 drop-shadow-lg">
                                    {episode.title}
                                </h3>
                            </div>
                        </div>

                        {/* Bottom: AI Summary or Semantic Preview */}
                        <div className="bg-[#0C100E]/80 px-4 py-3">
                            {aiSummary ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-1 text-[#C2AD90]/60">
                                        <Sparkles className="w-3 h-3" />
                                        <span className="text-[9px] uppercase tracking-wider">AI Summary</span>
                                    </div>
                                    <p className="text-xs text-[#F5F0EA]/70 line-clamp-2 leading-relaxed">{aiSummary}</p>
                                    <button
                                        onClick={handleExpand}
                                        className="text-[10px] text-[#C2AD90] hover:underline mt-1"
                                    >
                                        View Nuanced Analysis →
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center gap-3">
                                    {(episode.tags?.slice(0, 3) || ['Insight', 'Knowledge', 'Discovery']).map((tag, i) => (
                                        <React.Fragment key={i}>
                                            {i > 0 && <span className="text-[#C2AD90]/30">•</span>}
                                            <span className="text-xs text-[#C2AD90] font-medium capitalize">{tag}</span>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Link>
            </motion.div>
        </>
    );
}