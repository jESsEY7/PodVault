import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Home, Compass, Settings, Music, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const navItems = [
    { icon: Home, label: 'Home', page: 'Home' },
    { icon: Compass, label: 'Explore', page: 'Explore' },
    { icon: Search, label: 'Search', page: 'Search' },
    { icon: Music, label: 'Playlists', page: 'Playlists' },
    { icon: Settings, label: 'Settings', page: 'Settings' },
];

export default function FloatingNav({ currentPage, onSearchClick }) {
    const [visible, setVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentY = window.scrollY;
            setVisible(currentY < lastScrollY || currentY < 100);
            setLastScrollY(currentY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <AnimatePresence>
            {visible && (
                <motion.nav
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
                >
                    <div className="glass-heavy rounded-2xl px-2 py-2 flex items-center gap-1 shadow-2xl">
                        {navItems.map(({ icon: Icon, label, page }) => {
                            const isActive = currentPage === page;

                            if (page === 'Search') {
                                return (
                                    <button
                                        key={page}
                                        onClick={onSearchClick}
                                        className="relative flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-300 group hover:bg-white/5"
                                    >
                                        <Icon className="w-5 h-5 transition-colors duration-300 text-[#F5F0EA]/50 group-hover:text-[#F5F0EA]/80" />
                                        <span className="text-[10px] mt-1 transition-colors duration-300 text-[#F5F0EA]/40 group-hover:text-[#F5F0EA]/70">
                                            {label}
                                        </span>
                                    </button>
                                );
                            }

                            return (
                                <Link
                                    key={page}
                                    to={createPageUrl(page)}
                                    className={`relative flex flex-col items-center px-4 py-2 rounded-xl transition-all duration-300 group ${isActive
                                            ? 'bg-[var(--sandstone)]/15'
                                            : 'hover:bg-white/5'
                                        }`}
                                >
                                    <Icon
                                        className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-[#C2AD90]' : 'text-[#F5F0EA]/50 group-hover:text-[#F5F0EA]/80'
                                            }`}
                                    />
                                    <span
                                        className={`text-[10px] mt-1 transition-colors duration-300 ${isActive ? 'text-[#C2AD90]' : 'text-[#F5F0EA]/40 group-hover:text-[#F5F0EA]/70'
                                            }`}
                                    >
                                        {label}
                                    </span>
                                    {isActive && (
                                        <motion.div
                                            layoutId="nav-indicator"
                                            className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#C2AD90]"
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
}