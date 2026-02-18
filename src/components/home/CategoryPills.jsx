import React from 'react';
import { Sparkles, Headphones, Briefcase, Heart, Film, GraduationCap, BookOpen, Trophy, Newspaper } from 'lucide-react';

const categories = [
    { label: 'All', icon: Sparkles },
    { label: 'News', icon: Newspaper },
    { label: 'Culture', icon: Headphones },
    { label: 'Technology', icon: Sparkles },
    { label: 'Business', icon: Briefcase },
    { label: 'Wellness', icon: Heart },
    { label: 'Entertainment', icon: Film },
    { label: 'Education', icon: GraduationCap },
    { label: 'Storytelling', icon: BookOpen },
    { label: 'Sports', icon: Trophy },
];


export default function CategoryPills({ active, onSelect }) {
    return (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {categories.map(({ label, icon: Icon }) => {
                const isActive = active === label;
                return (
                    <button
                        key={label}
                        onClick={() => onSelect(label)}
                        className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${isActive
                            ? 'bg-[#C2AD90] text-[#0C100E]'
                            : 'glass text-[#F5F0EA]/70 hover:text-[#F5F0EA] hover:bg-white/10'
                            }`}
                    >
                        <Icon className="w-4 h-4" />
                        {label}
                    </button>
                );
            })}
        </div>
    );
}