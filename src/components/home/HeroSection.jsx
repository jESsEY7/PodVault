import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play } from 'lucide-react';

export default function HeroSection() {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
    const y = useTransform(scrollYProgress, [0, 0.5], [0, -80]);

    return (
        <div ref={ref} className="relative h-screen w-full overflow-hidden">
            {/* Background image with parallax */}
            <motion.div
                style={{ scale, y }}
                className="absolute inset-0"
            >
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1920&q=80')`,
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0C100E]/40 via-[#0C100E]/60 to-[#0C100E]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0C100E]/80 via-transparent to-[#0C100E]/80" />
            </motion.div>

            {/* Content overlay */}
            <motion.div
                style={{ opacity }}
                className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center"
            >
                {/* Floating badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass rounded-full px-5 py-2 mb-8 flex items-center gap-2"
                >
                    <div className="w-2 h-2 rounded-full bg-[#C2AD90] animate-pulse" />
                    <span className="text-xs tracking-[0.2em] uppercase text-[#C2AD90]">
                        Now Streaming
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[0.9] mb-6"
                >
                    <span className="text-[#F5F0EA]">The Podcast</span>
                    <br />
                    <span className="text-gradient">Vault</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="text-[#F5F0EA]/60 text-base md:text-lg max-w-md mb-10 leading-relaxed"
                >
                    Where sound becomes intelligence. Discover, curate, and experience
                    podcasts like never before.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex items-center gap-4"
                >
                    <button className="group flex items-center gap-3 bg-[#C2AD90] text-[#0C100E] px-8 py-4 rounded-2xl font-semibold transition-all duration-300 hover:bg-[#97754D] hover:shadow-[0_0_40px_rgba(194,173,144,0.3)]">
                        <Play className="w-5 h-5 fill-current" />
                        Start Listening
                    </button>
                    <button className="glass px-8 py-4 rounded-2xl font-medium text-[#C2AD90] transition-all duration-300 hover:bg-white/10">
                        Explore Vault
                    </button>
                </motion.div>

                {/* Sound bars animation */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="flex items-end gap-1 mt-16"
                >
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className={`w-1 bg-[#C2AD90]/60 rounded-full soundbar soundbar-delay-${i}`}
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </motion.div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                style={{ opacity }}
                className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10"
            >
                <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-5 h-8 rounded-full border border-[#C2AD90]/30 flex justify-center pt-2"
                >
                    <div className="w-1 h-2 rounded-full bg-[#C2AD90]/60" />
                </motion.div>
            </motion.div>
        </div>
    );
}