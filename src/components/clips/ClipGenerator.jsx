import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiClient } from '@/api/apiClient';
import { Scissors, Loader2, Share2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function ClipGenerator({ episode, open, onClose }) {
    const [generating, setGenerating] = useState(false);
    const [clip, setClip] = useState(null);
    const [copied, setCopied] = useState(false);

    const generateClip = async () => {
        setGenerating(true);
        try {
            const clipData = await apiClient.integrations.Core.InvokeLLM({
                prompt: `Analyze this podcast episode and identify the BEST 60-second moment to share:

Episode: "${episode.title}"
Description: ${episode.description || 'No description'}
Tags: ${episode.tags?.join(', ') || 'None'}

Identify:
1. The most compelling 60-second segment (timestamp range)
2. A hook title for social sharing (max 60 chars)
3. A 2-sentence summary of what makes this moment shareable
4. 3 relevant hashtags

Return JSON format:
{
  "start_time": "MM:SS",
  "end_time": "MM:SS",
  "hook_title": "...",
  "summary": "...",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "why_shareable": "..."
}`,
                response_json_schema: {
                    type: "object",
                    properties: {
                        start_time: { type: "string" },
                        end_time: { type: "string" },
                        hook_title: { type: "string" },
                        summary: { type: "string" },
                        hashtags: { type: "array", items: { type: "string" } },
                        why_shareable: { type: "string" }
                    }
                }
            });

            // InvokeLLM may return a string instead of parsed JSON
            const parsed = typeof clipData === 'string'
                ? (() => { try { return JSON.parse(clipData); } catch { return null; } })()
                : clipData;

            if (!parsed || typeof parsed !== 'object') {
                toast.error('Could not parse clip data');
                return;
            }

            setClip(parsed);
            toast.success('Clip generated!');
        } catch (error) {
            toast.error('Failed to generate clip');
        } finally {
            setGenerating(false);
        }
    };

    const shareToSocial = (platform) => {
        if (!clip) return;
        const text = `${clip.hook_title || ''}\n\n${clip.summary || ''}\n\n${(clip.hashtags || []).join(' ')}`;
        const url = window.location.href;

        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        };

        window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    };

    const copyToClipboard = () => {
        if (!clip) return;
        const text = `${clip.hook_title || ''}\n\n${clip.summary || ''}\n\nListen: ${window.location.href}\n\n${(clip.hashtags || []).join(' ')}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success('Copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#0C100E] border-[#364442] text-[#F5F0EA] max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-[#C2AD90] text-xl flex items-center gap-2">
                        <Scissors className="w-5 h-5" />
                        AI Clip Generator
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {!clip ? (
                        <div className="text-center py-8">
                            <p className="text-[#F5F0EA]/60 mb-6">
                                Generate a shareable 60-second clip highlighting the best moment from this episode
                            </p>
                            <Button
                                onClick={generateClip}
                                disabled={generating}
                                className="bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Analyzing Episode...
                                    </>
                                ) : (
                                    <>
                                        <Scissors className="w-4 h-4 mr-2" />
                                        Generate Clip
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                        >
                            {/* Clip Preview */}
                            <div className="glass rounded-xl p-5">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs text-[#C2AD90] font-medium">
                                        {clip.start_time} - {clip.end_time} (60 sec)
                                    </span>
                                    <span className="text-xs text-[#F5F0EA]/40">Best Moment</span>
                                </div>

                                <h3 className="text-lg font-bold text-[#F5F0EA] mb-2">{clip.hook_title}</h3>
                                <p className="text-sm text-[#F5F0EA]/70 mb-3">{clip.summary}</p>

                                <div className="flex flex-wrap gap-2 mb-3">
                                    {(clip.hashtags || []).map((tag, i) => (
                                        <span key={i} className="text-xs bg-[#364442]/50 text-[#C2AD90] px-2 py-1 rounded">
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                <p className="text-xs text-[#F5F0EA]/40 italic">
                                    Why shareable: {clip.why_shareable}
                                </p>
                            </div>

                            {/* Share Actions */}
                            <div className="space-y-3">
                                <p className="text-sm text-[#F5F0EA]/60 font-medium">Share This Clip</p>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        onClick={() => shareToSocial('twitter')}
                                        variant="outline"
                                        className="border-[#364442] text-[#F5F0EA] hover:bg-[#364442]/30"
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Twitter
                                    </Button>
                                    <Button
                                        onClick={() => shareToSocial('facebook')}
                                        variant="outline"
                                        className="border-[#364442] text-[#F5F0EA] hover:bg-[#364442]/30"
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        Facebook
                                    </Button>
                                    <Button
                                        onClick={() => shareToSocial('linkedin')}
                                        variant="outline"
                                        className="border-[#364442] text-[#F5F0EA] hover:bg-[#364442]/30"
                                    >
                                        <Share2 className="w-4 h-4 mr-2" />
                                        LinkedIn
                                    </Button>
                                    <Button
                                        onClick={copyToClipboard}
                                        variant="outline"
                                        className="border-[#364442] text-[#F5F0EA] hover:bg-[#364442]/30"
                                    >
                                        {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                        Copy Text
                                    </Button>
                                </div>

                                <Button
                                    onClick={generateClip}
                                    variant="ghost"
                                    className="w-full text-[#C2AD90] hover:bg-[#364442]/20"
                                >
                                    Generate Different Clip
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}