import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';

const featuredData = [
    {
        id: 'featured-1',
        title: 'The Art of Deep Listening',
        creator: 'Sarah Koenig',
        image: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1200&q=80',
        category: 'Culture',
    },
    {
        id: 'featured-2',
        title: 'Future Forward: AI & Humanity',
        creator: 'Lex Fridman',
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80',
        category: 'Technology',
    },
    {
        id: 'featured-3',
        title: 'Mindful Business',
        creator: 'Tim Ferriss',
        image: 'https://images.unsplash.com/photo-1519682577862-22b62b24e493?w=1200&q=80',
        category: 'Business',
    },
];

export default function FeaturedCarousel({ podcasts }) {
    const scrollRef = useRef(null);
    const items = podcasts?.length > 0
        ? podcasts.filter(p => p.is_featured).slice(0, 5)
        : [];

    const displayItems = items.length > 0
        ? items.map(p => ({
            id: p.id,
            title: p.title,
            creator: p.creator_name,
            image: p.cover_image || featuredData[0].image,
            category: p.category,
        }))
        : featuredData;

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.offsetWidth * 0.8;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#F5F0EA]">Featured</h2>
                    <p className="text-sm text-[#F5F0EA]/40 mt-1">Hand-picked by our editors</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[#C2AD90] hover:bg-white/10 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="w-10 h-10 rounded-xl glass flex items-center justify-center text-[#C2AD90] hover:bg-white/10 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory"
            >
                {displayItems.map((item, i) => (
                    <motion.div
                        key={item.id || i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className="flex-shrink-0 w-[85vw] md:w-[60vw] lg:w-[45vw] snap-center"
                    >
                        <div className="relative aspect-[16/9] rounded-3xl overflow-hidden group cursor-pointer">
                            <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0C100E] via-[#0C100E]/30 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                                <span className="inline-block glass rounded-lg px-3 py-1 text-[10px] uppercase tracking-widest text-[#C2AD90] mb-3">
                                    {item.category}
                                </span>
                                <h3 className="text-xl md:text-2xl font-bold text-[#F5F0EA] mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-sm text-[#F5F0EA]/50">{item.creator}</p>
                            </div>
                            <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-[#C2AD90] flex items-center justify-center shadow-[0_0_30px_rgba(194,173,144,0.4)] opacity-0 group-hover:opacity-100 transition-all duration-300">
                                <Play className="w-5 h-5 text-[#0C100E] fill-current ml-0.5" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}