import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from '@/api/apiClient';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import EpisodeRow from '../cards/EpisodeRow';
import PodcastCard from '../cards/PodcastCard';

export default function AIDiscoveryChat() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [recommendations, setRecommendations] = useState([]);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setLoading(true);
        setResponse(null);
        setRecommendations([]);

        try {
            // Fetch all content
            const [episodes, podcasts] = await Promise.all([
                apiClient.Episode.list('-published_at', 50),
                apiClient.Podcast.list('-created_date', 50)
            ]);

            // Use AI to find relevant content
            const aiResponse = await apiClient.integrations.Core.InvokeLLM({
                prompt: `User query: "${query}"

Available Episodes:
${episodes.map(e => `- "${e.title}" (${e.podcast_title}) - ${e.description || 'No description'} [Tags: ${e.tags?.join(', ') || 'none'}]`).join('\n')}

Available Podcasts:
${podcasts.map(p => `- "${p.title}" by ${p.creator_name} - ${p.description} [Category: ${p.category}]`).join('\n')}

Task: Based on the user's query, provide:
1. A friendly response explaining what you found
2. List the most relevant episode titles (up to 5)
3. List the most relevant podcast titles (up to 3)

Return your response in this exact JSON format:
{
  "message": "Your friendly explanation here",
  "episode_titles": ["Episode Title 1", "Episode Title 2"],
  "podcast_titles": ["Podcast Title 1"]
}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        message: { type: "string" },
                        episode_titles: { type: "array", items: { type: "string" } },
                        podcast_titles: { type: "array", items: { type: "string" } }
                    }
                }
            });

            // Find matching content
            const matchedEpisodes = episodes.filter(e =>
                aiResponse.episode_titles?.some(title => e.title.includes(title) || title.includes(e.title))
            );

            const matchedPodcasts = podcasts.filter(p =>
                aiResponse.podcast_titles?.some(title => p.title.includes(title) || title.includes(p.title))
            );

            setResponse(aiResponse.message);
            setRecommendations({ episodes: matchedEpisodes, podcasts: matchedPodcasts });
        } catch (error) {
            setResponse("I'm having trouble finding content right now. Please try again!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C2AD90] to-[#97754D] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#0C100E]" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-[#F5F0EA]">AI Discovery Assistant</h2>
                    <p className="text-xs text-[#F5F0EA]/40">Ask me anything about our content</p>
                </div>
            </div>

            <div className="flex gap-2 mb-6">
                <Textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="E.g., 'Find podcasts about stoicism for entrepreneurs' or 'Recent AI advancements episodes'"
                    className="bg-[#364442]/20 border-[#364442] text-[#F5F0EA] resize-none"
                    rows={2}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSearch();
                        }
                    }}
                />
                <Button
                    onClick={handleSearch}
                    disabled={loading || !query.trim()}
                    className="bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E] self-end"
                >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
            </div>

            {response && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <div className="bg-[#364442]/20 rounded-xl p-4 border border-[#364442]">
                        <p className="text-sm text-[#F5F0EA]/80 leading-relaxed">{response}</p>
                    </div>

                    {recommendations.podcasts?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-[#C2AD90] mb-3">Recommended Shows</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {recommendations.podcasts.map((podcast, i) => (
                                    <PodcastCard key={podcast.id} podcast={podcast} index={i} />
                                ))}
                            </div>
                        </div>
                    )}

                    {recommendations.episodes?.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-[#C2AD90] mb-3">Recommended Episodes</h3>
                            <div className="space-y-2">
                                {recommendations.episodes.map((episode, i) => (
                                    <EpisodeRow key={episode.id} episode={episode} index={i} />
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}