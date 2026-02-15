import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, Users, Send, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function GroupSession() {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('id');
    const [user, setUser] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [message, setMessage] = useState('');
    const [copied, setCopied] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        apiClient.auth.me().then(setUser).catch(() => { });
    }, []);

    const { data: session } = useQuery({
        queryKey: ['session', sessionId],
        queryFn: () => apiClient.ListeningSession.get(sessionId),
        enabled: !!sessionId,
        refetchInterval: 2000, // Poll for sync
    });

    const { data: episode } = useQuery({
        queryKey: ['episode', session?.episode_id],
        queryFn: () => apiClient.Episode.get(session.episode_id),
        enabled: !!session?.episode_id,
    });

    const { data: messages = [] } = useQuery({
        queryKey: ['chat-messages', sessionId],
        queryFn: () => apiClient.ChatMessage.filter({ session_id: sessionId }, '-created_date', 50),
        enabled: !!sessionId,
        refetchInterval: 1000,
    });

    const sendMessageMutation = useMutation({
        mutationFn: (msg) => apiClient.ChatMessage.create({
            session_id: sessionId,
            message: msg,
            user_name: user?.full_name || 'Guest',
            user_avatar: user?.avatar_url,
            timestamp: new Date().toISOString()
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['chat-messages', sessionId]);
            setMessage('');
        }
    });

    const updateTimeMutation = useMutation({
        mutationFn: (time) => apiClient.ListeningSession.update(sessionId, {
            ...session,
            current_timestamp: time
        }),
    });

    // Sync playback with session
    useEffect(() => {
        if (session?.current_timestamp !== undefined) {
            setCurrentTime(session.current_timestamp);
        }
    }, [session?.current_timestamp]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (time) => {
        setCurrentTime(time);
        updateTimeMutation.mutate(time);
    };

    const copySessionLink = () => {
        const link = window.location.href;
        navigator.clipboard.writeText(link);
        setCopied(true);
        toast.success('Session link copied!');
        setTimeout(() => setCopied(false), 2000);
    };

    if (!session || !episode) {
        return (
            <div className="min-h-screen pt-20 flex items-center justify-center">
                <div className="text-[#C2AD90] animate-pulse">Loading session...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-20 pb-32 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Player Section */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Users className="w-5 h-5 text-[#C2AD90]" />
                                    <div>
                                        <h2 className="font-bold text-[#F5F0EA]">{session.session_name}</h2>
                                        <p className="text-xs text-[#F5F0EA]/40">
                                            Hosted by {session.host_name || 'Anonymous'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={copySessionLink}
                                    size="sm"
                                    variant="outline"
                                    className="border-[#C2AD90] text-[#C2AD90]"
                                >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied' : 'Invite'}
                                </Button>
                            </div>

                            <div className="aspect-video bg-gradient-to-br from-[#364442] to-[#5D4429] rounded-xl mb-4 flex items-center justify-center overflow-hidden">
                                <img
                                    src={episode.cover_image || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80'}
                                    alt={episode.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <h3 className="font-bold text-[#F5F0EA] mb-1">{episode.title}</h3>
                            <p className="text-sm text-[#F5F0EA]/40 mb-4">{episode.podcast_title}</p>

                            <div className="flex items-center justify-center gap-6">
                                <Button
                                    onClick={togglePlay}
                                    className="w-14 h-14 rounded-full bg-[#C2AD90] hover:bg-[#97754D]"
                                >
                                    {isPlaying ? <Pause className="w-6 h-6 text-[#0C100E]" /> : <Play className="w-6 h-6 text-[#0C100E] ml-1" />}
                                </Button>
                            </div>

                            <p className="text-xs text-[#F5F0EA]/30 text-center mt-4">
                                Synced playback • {session.participant_count || 0} listening
                            </p>
                        </div>
                    </div>

                    {/* Chat Section */}
                    <div className="glass rounded-2xl p-6 flex flex-col h-[600px]">
                        <h3 className="font-bold text-[#F5F0EA] mb-4">Live Chat</h3>

                        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.02 }}
                                    className="flex gap-2"
                                >
                                    <div className="w-8 h-8 rounded-full bg-[#364442] flex items-center justify-center text-[#C2AD90] text-xs font-semibold flex-shrink-0">
                                        {msg.user_name?.[0] || '?'}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-xs font-medium text-[#F5F0EA]">{msg.user_name || 'Guest'}</span>
                                            <span className="text-[10px] text-[#F5F0EA]/30">
                                                {new Date(msg.created_date).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-[#F5F0EA]/70">{msg.message}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <Input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="bg-[#364442]/20 border-[#364442] text-[#F5F0EA]"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && message.trim()) {
                                        sendMessageMutation.mutate(message);
                                    }
                                }}
                            />
                            <Button
                                onClick={() => message.trim() && sendMessageMutation.mutate(message)}
                                disabled={!message.trim()}
                                className="bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]"
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}