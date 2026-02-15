import React from 'react';
import PodcastCard from '../cards/PodcastCard';
import { Grid3X3 } from 'lucide-react';

export default function PodcastGrid({ podcasts, title = "Discover", subtitle }) {
    if (!podcasts || podcasts.length === 0) {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-[#364442]/40 flex items-center justify-center">
                        <Grid3X3 className="w-4 h-4 text-[#C2AD90]" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-[#F5F0EA]">{title}</h2>
                        {subtitle && <p className="text-sm text-[#F5F0EA]/40 mt-1">{subtitle}</p>}
                    </div>
                </div>
                <div className="glass rounded-2xl p-12 text-center">
                    <p className="text-[#F5F0EA]/40 text-sm">No podcasts yet. Check back soon.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#364442]/40 flex items-center justify-center">
                    <Grid3X3 className="w-4 h-4 text-[#C2AD90]" />
                </div>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#F5F0EA]">{title}</h2>
                    {subtitle && <p className="text-sm text-[#F5F0EA]/40 mt-1">{subtitle}</p>}
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {podcasts.map((podcast, i) => (
                    <PodcastCard key={podcast.id} podcast={podcast} index={i} />
                ))}
            </div>
        </div>
    );
}