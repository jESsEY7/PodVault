import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Settings as SettingsIcon, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Settings() {
    const [user, setUser] = useState(null);
    const [preferredCategories, setPreferredCategories] = useState([]);
    const [preferredDuration, setPreferredDuration] = useState('any');
    const [topicsToAvoid, setTopicsToAvoid] = useState([]);
    const [newTopic, setNewTopic] = useState('');
    const queryClient = useQueryClient();

    const categories = ['culture', 'technology', 'business', 'wellness', 'entertainment', 'education', 'storytelling', 'sports'];
    const durations = [
        { value: 'any', label: 'Any Length' },
        { value: 'short', label: 'Short (<20 min)' },
        { value: 'medium', label: 'Medium (20-45 min)' },
        { value: 'long', label: 'Long (45+ min)' }
    ];

    useEffect(() => {
        apiClient.auth.me().then(u => {
            setUser(u);
            setPreferredCategories(u.preferred_categories || []);
            setPreferredDuration(u.preferred_duration || 'any');
            setTopicsToAvoid(u.topics_to_avoid || []);
        }).catch(() => { });
    }, []);

    const saveMutation = useMutation({
        mutationFn: async () => {
            await apiClient.auth.updateMe({
                preferred_categories: preferredCategories,
                preferred_duration: preferredDuration,
                topics_to_avoid: topicsToAvoid
            });
        },
        onSuccess: () => {
            toast.success('Preferences saved');
            queryClient.invalidateQueries(['user']);
        }
    });

    const toggleCategory = (cat) => {
        setPreferredCategories(prev =>
            prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
        );
    };

    const addTopicToAvoid = () => {
        if (newTopic.trim() && !topicsToAvoid.includes(newTopic.trim().toLowerCase())) {
            setTopicsToAvoid([...topicsToAvoid, newTopic.trim().toLowerCase()]);
            setNewTopic('');
        }
    };

    const removeTopic = (topic) => {
        setTopicsToAvoid(topicsToAvoid.filter(t => t !== topic));
    };

    return (
        <div className="min-h-screen bg-[#0C100E] pt-12 pb-32">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-10"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <SettingsIcon className="w-6 h-6 text-[#C2AD90]" />
                        <h1 className="text-3xl font-bold text-[#F5F0EA]">Preferences</h1>
                    </div>
                    <p className="text-[#F5F0EA]/40 text-sm">Customize your discovery experience</p>
                </motion.div>

                <div className="space-y-6">
                    {/* AI Personalization */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-[#C2AD90]" />
                            <h2 className="text-xl font-bold text-[#F5F0EA]">AI Personalization</h2>
                        </div>

                        {/* Categories */}
                        <div className="mb-6">
                            <Label className="text-[#F5F0EA] mb-3 block">Favorite Categories</Label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => toggleCategory(cat)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${preferredCategories.includes(cat)
                                            ? 'bg-[#C2AD90] text-[#0C100E]'
                                            : 'bg-[#364442]/30 text-[#F5F0EA]/60 hover:bg-[#364442]/50'
                                            }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="mb-6">
                            <Label className="text-[#F5F0EA] mb-3 block">Preferred Episode Length</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {durations.map(dur => (
                                    <button
                                        key={dur.value}
                                        onClick={() => setPreferredDuration(dur.value)}
                                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${preferredDuration === dur.value
                                            ? 'bg-[#C2AD90] text-[#0C100E]'
                                            : 'bg-[#364442]/30 text-[#F5F0EA]/60 hover:bg-[#364442]/50'
                                            }`}
                                    >
                                        {dur.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Topics to Avoid */}
                        <div>
                            <Label className="text-[#F5F0EA] mb-3 block">Topics to Avoid</Label>
                            <div className="flex gap-2 mb-3">
                                <input
                                    value={newTopic}
                                    onChange={(e) => setNewTopic(e.target.value)}
                                    placeholder="E.g., politics, sports..."
                                    className="flex-1 bg-[#364442]/30 border border-[#364442] rounded-lg px-4 py-2 text-[#F5F0EA] text-sm"
                                    onKeyDown={(e) => e.key === 'Enter' && addTopicToAvoid()}
                                />
                                <Button
                                    onClick={addTopicToAvoid}
                                    className="bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]"
                                >
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {topicsToAvoid.map(topic => (
                                    <span
                                        key={topic}
                                        className="inline-flex items-center gap-2 bg-[#364442]/50 text-[#F5F0EA] px-3 py-1.5 rounded-lg text-sm"
                                    >
                                        {topic}
                                        <button onClick={() => removeTopic(topic)}>
                                            <X className="w-3.5 h-3.5 text-[#F5F0EA]/50 hover:text-[#F5F0EA]" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Connected Accounts */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-[#C2AD90]" />
                            <h2 className="text-xl font-bold text-[#F5F0EA]">Connected Accounts</h2>
                        </div>

                        <div className="flex items-center justify-between bg-[#364442]/30 p-4 rounded-xl border border-[#364442]">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center text-black font-bold">
                                    <span className="sr-only">Spotify</span>
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141 4.2-1.32 9.6-.66 13.38 1.68.42.24.539.84.36 1.14zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#F5F0EA]">Spotify</h3>
                                    <p className="text-xs text-[#F5F0EA]/50">Connect to sync your library (Fixes 403 Errors)</p>
                                </div>
                            </div>
                            <Button
                                onClick={async () => {
                                    try {
                                        const { url } = await apiClient.auth.connectSpotify();
                                        if (url) window.location.href = url;
                                    } catch (e) {
                                        toast.error("Failed to initiate Spotify connection");
                                    }
                                }}
                                variant="outline"
                                className="border-[#C2AD90] text-[#C2AD90] hover:bg-[#C2AD90] hover:text-[#0C100E]"
                            >
                                Connect
                            </Button>
                        </div>
                    </div>

                    {/* Save Button */}
                    <Button
                        onClick={() => saveMutation.mutate()}
                        disabled={saveMutation.isPending}
                        className="w-full bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E] text-base py-6"
                    >
                        {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
                    </Button>
                </div>
            </div>
        </div>
    );
}