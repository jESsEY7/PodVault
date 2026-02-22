import React, { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Play } from 'lucide-react';
import { PodcastLogo } from './PodcastLogo';

export default function HeroSection() {
    const ref = useRef(null);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start start', 'end start'],
    });

    const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
    const y = useTransform(scrollYProgress, [0, 0.5], [0, -80]);

    useEffect(() => {
        const handleOrientationChange = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
        };

        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('resize', handleOrientationChange);
        };
    }, []);

    return (
        <div ref={ref} className="relative w-full min-h-screen flex flex-col justify-center items-center overflow-hidden bg-[#0C100E]">
            {/* Background image with parallax */}
            <motion.div
                style={{ scale, y }}
                className="absolute inset-0 z-0"
            >
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=1920&q=80')`,
                    }}
                    role="img"
                    aria-label="Podcast background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-[#0C100E]/40 via-[#0C100E]/60 to-[#0C100E]" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0C100E]/80 via-transparent to-[#0C100E]/80" />
            </motion.div>

            {/* Content overlay with responsive layout */}
            <motion.div
                style={{ opacity }}
                className="relative z-10 w-full h-full flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-8 sm:py-12 md:py-16 text-center safe-area-inset"
            >
                {/* Main content grid - responsive layout */}
                <div className="w-full max-w-6xl flex flex-col items-center gap-6 sm:gap-8 md:gap-10 lg:gap-12">
                    {/* Logo - Using reusable PodcastLogo component */}
                    <PodcastLogo size="md" showText={true} />

                    {/* Floating badge - Responsive */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass rounded-full px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 flex items-center gap-2 whitespace-nowrap"
                    >
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#C2AD90] animate-pulse flex-shrink-0" />
                        <span className="text-xs sm:text-xs md:text-sm tracking-widest uppercase text-[#C2AD90] font-medium">
                            Now Streaming
                        </span>
                    </motion.div>

                    {/* Main heading - Responsive typography */}
                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="font-bold tracking-tight leading-none text-[#F5F0EA] w-full"
                        style={{
                            fontSize: 'clamp(1.875rem, 12vw, 4.5rem)',
                            lineHeight: '1.1'
                        }}
                    >
                        <span className="text-[#F5F0EA]">The Podcast</span>
                        <br />
                        <span className="text-gradient">Vault</span>
                    </motion.h1>

                    {/* Subheading - Responsive typography */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="text-[#F5F0EA]/70 max-w-2xl leading-relaxed w-full px-4 sm:px-0"
                        style={{
                            fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
                            letterSpacing: '0.01em'
                        }}
                    >
                        Where sound becomes intelligence. Discover, curate, and experience
                        podcasts like never before.
                    </motion.p>

                    {/* CTA Buttons - Responsive layout */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 md:gap-5 w-full px-4 sm:px-0"
                    >
                        <button 
                            className="group flex items-center justify-center gap-2 sm:gap-3 bg-[#C2AD90] text-[#0C100E] px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 rounded-2xl font-semibold transition-all duration-300 hover:bg-[#97754D] hover:shadow-[0_0_40px_rgba(194,173,144,0.3)] focus:outline-none focus:ring-2 focus:ring-[#C2AD90] focus:ring-offset-2 focus:ring-offset-[#0C100E] active:scale-95 w-full sm:w-auto"
                            aria-label="Start listening to podcasts"
                        >
                            <Play className="w-4 sm:w-5 h-4 sm:h-5 fill-current flex-shrink-0" />
                            <span className="text-sm sm:text-base">Start Listening</span>
                        </button>
                        <button 
                            className="glass px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 rounded-2xl font-medium text-[#C2AD90] transition-all duration-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#C2AD90] focus:ring-offset-2 focus:ring-offset-[#0C100E] active:scale-95 w-full sm:w-auto"
                            aria-label="Explore the vault of podcasts"
                        >
                            <span className="text-sm sm:text-base">Explore Vault</span>
                        </button>
                    </motion.div>

                    {/* Sound bars animation */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className="flex items-end justify-center gap-1 mt-6 sm:mt-8 md:mt-10"
                        aria-hidden="true"
                    >
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={`w-0.5 sm:w-1 bg-[#C2AD90]/60 rounded-full soundbar soundbar-delay-${i}`}
                                style={{ 
                                    height: 'clamp(0.5rem, 3vh, 1.5rem)',
                                    animationDelay: `${i * 0.15}s` 
                                }}
                            />
                        ))}
                    </motion.div>
                </div>
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
                style={{ opacity }}
                className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10"
                aria-hidden="true"
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