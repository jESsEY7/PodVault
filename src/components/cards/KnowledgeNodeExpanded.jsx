import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Brain, Quote, TrendingUp } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function KnowledgeNodeExpanded({ episode, summaryData, onClose }) {
    if (!summaryData) return null;

    const sentimentColor = summaryData.sentiment.label === 'positive' ? '#10B981' :
        summaryData.sentiment.label === 'negative' ? '#EF4444' : '#F59E0B';

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0C100E]/80 backdrop-blur-md"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="w-full max-w-2xl bg-[#1C1F1E] border border-[#364442] rounded-3xl overflow-hidden shadow-2xl relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="relative h-48">
                        <img
                            src={episode.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80'}
                            alt={episode.title}
                            className="w-full h-full object-cover opacity-40"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1C1F1E] to-transparent" />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-[#F5F0EA] transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="absolute bottom-6 left-8 right-8">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-[#C2AD90] text-[#0C100E] text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                    AI Insight
                                </span>
                                <span className="text-[#C2AD90] text-xs font-medium flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" />
                                    Knowledge Node Unlocked
                                </span>
                            </div>
                            <h2 className="text-2xl font-bold text-[#F5F0EA] leading-tight">{episode.title}</h2>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="px-8 pb-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {/* Sentiment Analysis */}
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#0C100E] border border-[#364442]">
                                <TrendingUp className="w-6 h-6" style={{ color: sentimentColor }} />
                            </div>
                            <div>
                                <p className="text-xs text-[#F5F0EA]/40 uppercase tracking-wider">Episode Tone</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-[#F5F0EA]">{summaryData.sentiment.tone}</span>
                                    <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${summaryData.sentiment.score * 100}%`, backgroundColor: sentimentColor }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nuanced Summary */}
                        <div className="space-y-3">
                            <h3 className="flex items-center gap-2 text-[#C2AD90] font-semibold text-sm uppercase tracking-wider">
                                <Brain className="w-4 h-4" />
                                Deep Dive Summary
                            </h3>
                            <div className="prose prose-invert prose-sm max-w-none text-[#F5F0EA]/80 leading-relaxed theme-prose">
                                <p dangerouslySetInnerHTML={{ __html: summaryData.nuanced_summary.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#F5F0EA]">$1</strong>').replace(/\*(.*?)\*/g, '<em class="text-[#C2AD90]">$1</em>') }} />
                            </div>
                        </div>

                        {/* Key Takeaways */}
                        <div className="space-y-3">
                            <h3 className="flex items-center gap-2 text-[#C2AD90] font-semibold text-sm uppercase tracking-wider">
                                <Quote className="w-4 h-4" />
                                Key Takeaways
                            </h3>
                            <ul className="grid gap-3">
                                {summaryData.key_takeaways.map((point, i) => (
                                    <motion.li
                                        key={i}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 + (i * 0.1) }}
                                        className="flex items-start gap-3 p-3 bg-[#0C100E]/50 rounded-xl border border-[#364442]/30"
                                    >
                                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#C2AD90]/10 flex items-center justify-center text-[#C2AD90] text-xs font-bold mt-0.5">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm text-[#F5F0EA]/80">{point}</span>
                                    </motion.li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-[#364442] bg-[#1C1F1E] flex justify-end">
                        <Button onClick={onClose} variant="outline" className="text-[#F5F0EA] border-[#364442] hover:bg-white/5">
                            Close Insight
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
