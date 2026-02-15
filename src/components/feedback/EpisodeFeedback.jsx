import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, EyeOff } from 'lucide-react';
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';

export default function EpisodeFeedback({ episodeId, podcastId, compact = false }) {
    const [feedback, setFeedback] = useState(null);

    const handleFeedback = async (type) => {
        try {
            await apiClient.UserPreference.create({
                episode_id: episodeId,
                podcast_id: podcastId,
                feedback_type: type
            });
            setFeedback(type);

            const messages = {
                like: 'We\'ll show you more like this',
                dislike: 'Thanks for the feedback',
                not_interested: 'We\'ll show less of this topic'
            };
            toast.success(messages[type]);
        } catch (error) {
            console.error('Feedback error:', error);
        }
    };

    if (compact) {
        return (
            <div className="flex gap-1">
                <button
                    onClick={() => handleFeedback('like')}
                    className={`p-1.5 rounded-lg transition-colors ${feedback === 'like'
                        ? 'bg-[#C2AD90] text-[#0C100E]'
                        : 'text-[#F5F0EA]/30 hover:text-[#C2AD90]'
                        }`}
                >
                    <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={() => handleFeedback('dislike')}
                    className={`p-1.5 rounded-lg transition-colors ${feedback === 'dislike'
                        ? 'bg-[#C2AD90] text-[#0C100E]'
                        : 'text-[#F5F0EA]/30 hover:text-[#C2AD90]'
                        }`}
                >
                    <ThumbsDown className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <button
                onClick={() => handleFeedback('like')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${feedback === 'like'
                    ? 'bg-[#C2AD90] text-[#0C100E]'
                    : 'bg-[#364442]/30 text-[#F5F0EA]/60 hover:bg-[#364442]/50'
                    }`}
            >
                <ThumbsUp className="w-4 h-4" />
                <span className="text-sm">Like</span>
            </button>
            <button
                onClick={() => handleFeedback('dislike')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${feedback === 'dislike'
                    ? 'bg-[#C2AD90] text-[#0C100E]'
                    : 'bg-[#364442]/30 text-[#F5F0EA]/60 hover:bg-[#364442]/50'
                    }`}
            >
                <ThumbsDown className="w-4 h-4" />
                <span className="text-sm">Dislike</span>
            </button>
            <button
                onClick={() => handleFeedback('not_interested')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${feedback === 'not_interested'
                    ? 'bg-[#C2AD90] text-[#0C100E]'
                    : 'bg-[#364442]/30 text-[#F5F0EA]/60 hover:bg-[#364442]/50'
                    }`}
            >
                <EyeOff className="w-4 h-4" />
                <span className="text-sm">Not Interested</span>
            </button>
        </div>
    );
}