import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Home, Compass, Settings, Music, Search, Menu, X } from 'lucide-react';
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
            {(visible || isMobileMenuOpen) && (
                <motion.nav
                    initial={{ y: 100, opacity: 0, x: "-50%" }}
                    animate={{ y: 0, opacity: 1, x: "-50%" }}
                    exit={{ y: 100, opacity: 0, x: "-50%" }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="fixed bottom-6 left-1/2 z-50 w-full max-w-[90%] md:max-w-fit"
                >
                    <div className={`${isMobile && !isMobileMenuOpen ? '' : 'bg-black/40 backdrop-blur-xl border border-white/10'} rounded-2xl p-2 shadow-2xl relative transition-all duration-300`}>
                        {/* Mobile Hamburger Toggle */}
                        {isMobile && (
                            <div className="flex justify-end md:hidden">
                                <button
                                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                    className="p-3 bg-[#364442] rounded-full shadow-lg text-[#F5F0EA] hover:bg-[#364442]/80 transition-colors"
                                >
                                    {isMobileMenuOpen ? (
                                        <X className="w-6 h-6" />
                                    ) : (
                                        <Menu className="w-6 h-6" />
                                    )}
                                </button>
                            </div>
                        )}

                        {/* Navigation Items */}
                        <AnimatePresence>
                            {(!isMobile || isMobileMenuOpen) && (
                                <motion.div
                                    initial={isMobile ? { opacity: 0, height: 0 } : false}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={isMobile ? { opacity: 0, height: 0 } : false}
                                    className={`flex ${isMobile ? 'flex-col gap-2 pt-4 min-w-[200px]' : 'flex-row items-center gap-1'}`}
                                >
                                    {navItems.map(({ icon: Icon, label, page }) => {
                                        const isActive = currentPage === page;

                                        if (page === 'Search') {
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => {
                                                        onSearchClick();
                                                        setIsMobileMenuOpen(false);
                                                    }}
                                                    className={`relative flex ${isMobile ? 'flex-row gap-3 w-full px-4 py-3' : 'flex-col px-4 py-2'} items-center rounded-xl transition-all duration-300 group hover:bg-white/5`}
                                                >
                                                    <Icon className="w-5 h-5 transition-colors duration-300 text-[#F5F0EA]/50 group-hover:text-[#F5F0EA]/80" />
                                                    <span className={`text-[10px] ${isMobile ? 'text-sm font-medium text-[#F5F0EA]/80' : 'mt-1 text-[#F5F0EA]/40'} transition-colors duration-300 group-hover:text-[#F5F0EA]/70`}>
                                                        {label}
                                                    </span>
                                                </button>
                                            );
                                        }

                                        return (
                                            <Link
                                                key={page}
                                                to={createPageUrl(page)}
                                                onClick={() => setIsMobileMenuOpen(false)}
                                                className={`relative flex ${isMobile ? 'flex-row gap-3 w-full px-4 py-3' : 'flex-col px-4 py-2'} items-center rounded-xl transition-all duration-300 group ${isActive
                                                    ? 'bg-[var(--sandstone)]/15'
                                                    : 'hover:bg-white/5'
                                                    }`}
                                            >
                                                <Icon
                                                    className={`w-5 h-5 transition-colors duration-300 ${isActive ? 'text-[#C2AD90]' : 'text-[#F5F0EA]/50 group-hover:text-[#F5F0EA]/80'
                                                        }`}
                                                />
                                                <span
                                                    className={`text-[10px] ${isMobile ? 'text-sm font-medium' : 'mt-1'} transition-colors duration-300 ${isActive ? 'text-[#C2AD90]' : 'text-[#F5F0EA]/40 group-hover:text-[#F5F0EA]/70'
                                                        }`}
                                                >
                                                    {label}
                                                </span>
                                                {isActive && !isMobile && (
                                                    <motion.div
                                                        layoutId="nav-indicator"
                                                        className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[#C2AD90]"
                                                    />
                                                )}
                                            </Link>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.nav>
            )}
        </AnimatePresence>
    );
}