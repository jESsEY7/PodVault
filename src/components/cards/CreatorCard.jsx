import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { BadgeCheck, Users } from 'lucide-react';

export default function CreatorCard({ creator, index = 0 }) {
    const placeholderAvatars = [
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80',
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&q=80',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80',
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.08, duration: 0.4 }}
        >
            <Link
                to={createPageUrl(`CreatorProfile?id=${creator.id}`)}
                className="group block text-center"
            >
                <div className="relative w-24 h-24 md:w-28 md:h-28 mx-auto mb-3">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#C2AD90] to-[#5D4429] p-[2px]">
                        <div className="w-full h-full rounded-full overflow-hidden">
                            <img
                                src={creator.avatar_url || placeholderAvatars[index % placeholderAvatars.length]}
                                alt={creator.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        </div>
                    </div>
                    {creator.is_verified && (
                        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 bg-[#0C100E] rounded-full p-0.5">
                            <BadgeCheck className="w-5 h-5 text-[#C2AD90]" />
                        </div>
                    )}
                </div>
                <h4 className="text-sm font-semibold text-[#F5F0EA] group-hover:text-[#C2AD90] transition-colors">
                    {creator.name}
                </h4>
                {creator.follower_count > 0 && (
                    <p className="text-[10px] text-[#F5F0EA]/30 mt-0.5 flex items-center justify-center gap-1">
                        <Users className="w-3 h-3" />
                        {creator.follower_count?.toLocaleString()} followers
                    </p>
                )}
            </Link>
        </motion.div>
    );
}