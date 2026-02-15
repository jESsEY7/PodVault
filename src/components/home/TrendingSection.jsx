import React from 'react';
import EpisodeRow from '../cards/EpisodeRow';
import { TrendingUp } from 'lucide-react';

export default function TrendingSection({ episodes }) {
    const trending = episodes?.slice(0, 8) || [];

    if (trending.length === 0) {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-[#C2AD90]/10 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-[#C2AD90]" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#F5F0EA]">Trending Now</h2>
                </div>
                <div className="glass rounded-2xl p-8 text-center">
                    <p className="text-[#F5F0EA]/40 text-sm">Episodes will appear here once published.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#C2AD90]/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-[#C2AD90]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#F5F0EA]">Trending Now</h2>
            </div>
            <div className="glass rounded-2xl p-2 divide-y divide-white/5">
                {trending.map((episode, i) => (
                    <EpisodeRow key={episode.id} episode={episode} index={i} />
                ))}
            </div>
        </div>
    );
}