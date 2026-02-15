import React from 'react';
import CreatorCard from '../cards/CreatorCard';
import { Mic2 } from 'lucide-react';

export default function CreatorsRow({ creators }) {
    const displayCreators = creators?.slice(0, 8) || [];

    if (displayCreators.length === 0) {
        return (
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-[#97754D]/10 flex items-center justify-center">
                        <Mic2 className="w-4 h-4 text-[#97754D]" />
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#F5F0EA]">Top Creators</h2>
                </div>
                <div className="glass rounded-2xl p-8 text-center">
                    <p className="text-[#F5F0EA]/40 text-sm">Creators will appear here.</p>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-[#97754D]/10 flex items-center justify-center">
                    <Mic2 className="w-4 h-4 text-[#97754D]" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-[#F5F0EA]">Top Creators</h2>
            </div>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-2">
                {displayCreators.map((creator, i) => (
                    <div key={creator.id} className="flex-shrink-0">
                        <CreatorCard creator={creator} index={i} />
                    </div>
                ))}
            </div>
        </div>
    );
}