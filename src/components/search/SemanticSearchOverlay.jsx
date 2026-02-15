import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, Clock, Play } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from '@/api/apiClient';
import { createPageUrl } from '../../utils';
import { Link } from 'react-router-dom';

export default function SemanticSearchOverlay({ isOpen, onClose }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        try {
            const [episodes, podcasts] = await Promise.all([
                apiClient.Episode.list('-published_at', 50),
                apiClient.Podcast.list('-created_date', 50)
            ]);

            const aiResponse = await apiClient.integrations.Core.InvokeLLM({
                prompt: `User needs: "${query}"

Available Episodes:
${episodes.map(e => `ID: ${e.id}, Title: "${e.title}", Description: ${e.description || 'None'}, Duration: ${e.duration_minutes || 0} mins, Tags: ${e.tags?.join(', ') || 'none'}`).join('\n')}

Task: Find episodes and specific timestamps where this topic is discussed.
For each relevant episode, estimate likely timestamps where the topic appears (based on typical podcast structure).

Return JSON array of results with this format:
[
  {
    "episode_id": "ep_id",
    "episode_title": "Title",
    "podcast_title": "Show Name",
    "relevance_score": 0.95,
    "timestamps": [
      {"time": "12:30", "topic": "Brief description of what's discussed"},
      {"time": "28:45", "topic": "Another relevant moment"}
    ]
  }
]

Return up to 5 most relevant results.`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        results: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    episode_id: { type: "string" },
                                    episode_title: { type: "string" },
                                    podcast_title: { type: "string" },
                                    relevance_score: { type: "number" },
                                    timestamps: {
                                        type: "array",
                                        items: {
                                            type: "object",
                                            properties: {
                                                time: { type: "string" },
                                                topic: { type: "string" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            setResults(aiResponse.results || []);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
                    onClick={onClose}
                >
                    {/* Glass morphism overlay */}
                    <div className="absolute inset-0 bg-[#0C100E]/90 backdrop-blur-xl" />

                    {/* Search container */}
                    <motion.div
                        initial={{ y: -50, opacity: 0, scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: -50, opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative glass-heavy rounded-3xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-[#364442]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C2AD90] to-[#97754D] flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-[#0C100E]" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-[#F5F0EA]">Semantic Search</h2>
                                        <p className="text-xs text-[#F5F0EA]/40">Find exact moments in episodes</p>
                                    </div>
                                </div>
                                <Button
                                    onClick={onClose}
                                    variant="ghost"
                                    size="icon"
                                    className="text-[#F5F0EA]/40 hover:text-[#F5F0EA]"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="E.g., 'I need to understand venture capital terms'"
                                    className="bg-[#364442]/30 border-[#364442] text-[#F5F0EA] text-base"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSearch();
                                    }}
                                />
                                <Button
                                    onClick={handleSearch}
                                    disabled={loading || !query.trim()}
                                    className="bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]"
                                >
                                    {loading ? 'Searching...' : <Search className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-6 space-y-4">
                            {loading && (
                                <div className="text-center py-12 text-[#C2AD90] animate-pulse">
                                    Analyzing content across the vault...
                                </div>
                            )}

                            {results && results.length === 0 && (
                                <div className="text-center py-12 text-[#F5F0EA]/40">
                                    No results found. Try a different query.
                                </div>
                            )}

                            {results?.map((result, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="glass rounded-xl p-5 space-y-3"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-[#F5F0EA] mb-1">
                                                {result.episode_title}
                                            </h3>
                                            <p className="text-xs text-[#F5F0EA]/40">{result.podcast_title}</p>
                                        </div>
                                        <div className="text-xs text-[#C2AD90] font-medium">
                                            {Math.round(result.relevance_score * 100)}% match
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        {result.timestamps?.map((ts, idx) => (
                                            <Link
                                                key={idx}
                                                to={createPageUrl(`EpisodePlayer?id=${result.episode_id}`)}
                                                className="flex items-start gap-3 p-3 rounded-lg bg-[#364442]/20 hover:bg-[#364442]/40 transition-colors group"
                                            >
                                                <div className="flex items-center gap-2 min-w-[80px]">
                                                    <Clock className="w-3.5 h-3.5 text-[#C2AD90]" />
                                                    <span className="text-sm font-mono text-[#C2AD90]">{ts.time}</span>
                                                </div>
                                                <p className="text-sm text-[#F5F0EA]/70 flex-1">{ts.topic}</p>
                                                <Play className="w-4 h-4 text-[#C2AD90] opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </Link>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}