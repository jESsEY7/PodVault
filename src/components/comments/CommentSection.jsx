import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function CommentSection({ episodeId }) {
    const [newComment, setNewComment] = useState('');
    const [user, setUser] = useState(null);
    const queryClient = useQueryClient();

    React.useEffect(() => {
        apiClient.auth.me().then(setUser).catch(() => { });
    }, []);

    const { data: commentsData, isLoading } = useQuery({
        queryKey: ['comments', episodeId],
        queryFn: () => apiClient.Comment.filter({ episode_id: episodeId }, '-created_at'),
    });
    const comments = commentsData?.results || [];

    const createMutation = useMutation({
        mutationFn: (text) => apiClient.Comment.create({
            episode: episodeId,
            text: text,
            activity_type: 'comment'
        }),
        onSuccess: () => {
            queryClient.invalidateQueries(['comments', episodeId]);
            setNewComment('');
            toast.success('Comment posted!');
        }
    });

    const handleSubmit = () => {
        if (!newComment.trim()) return;
        createMutation.mutate(newComment);
    };

    return (
        <div className="glass rounded-2xl p-6 mt-8">
            <h3 className="text-xl font-bold text-[#F5F0EA] mb-4">Comments</h3>

            <div className="flex gap-3 mb-6">
                <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="bg-[#364442]/20 border-[#364442] text-[#F5F0EA] resize-none"
                    rows={3}
                />
                <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || !newComment.trim()}
                    className="bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E] self-end"
                >
                    <Send className="w-4 h-4" />
                </Button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <p className="text-[#F5F0EA]/40 text-sm">Loading comments...</p>
                ) : comments.length === 0 ? (
                    <p className="text-[#F5F0EA]/40 text-sm">Be the first to comment!</p>
                ) : (
                    comments.map((comment, i) => (
                        <motion.div
                            key={comment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="flex gap-3 p-4 rounded-xl bg-[#364442]/10"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#364442] flex items-center justify-center text-[#C2AD90] font-semibold flex-shrink-0">
                                {comment.username?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-[#F5F0EA]">{comment.username || 'Anonymous'}</span>
                                    <span className="text-xs text-[#F5F0EA]/40">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-[#F5F0EA]/80 text-sm">{comment.text || comment.metadata?.text}</p>
                                <button className="flex items-center gap-1 mt-2 text-xs text-[#F5F0EA]/40 hover:text-[#C2AD90] transition">
                                    <Heart className="w-3 h-3" />
                                    {comment.metadata?.likes || 0}
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}