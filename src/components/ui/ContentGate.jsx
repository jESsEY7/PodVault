/**
 * ContentGate — monetization access guard for podcast cards and episode rows.
 *
 * Usage:
 *   <ContentGate isPremium={podcast.tier === 'premium'}>
 *     <PodcastCard podcast={podcast} />
 *   </ContentGate>
 *
 * Behaviour:
 *   - Free content  + logged in   → no gate, renders children as-is
 *   - Free content  + logged out  → subtle lock overlay pointing to login
 *   - Premium content + any user  → prominent gold lock + upgrade CTA
 *   - Premium content + subscribed → no gate (passes user.subscription check)
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogIn, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { useAuth } from '../../lib/AuthContext';

/**
 * @param {Object}  props
 * @param {boolean} [props.isPremium=false]   - is this premium-only content?
 * @param {boolean} [props.compact=false]     - card (compact) vs row layout
 * @param {React.ReactNode} props.children
 */
export default function ContentGate({ isPremium = false, compact = false, children }) {
    const { isAuthenticated, user } = useAuth();
    const [hovered, setHovered] = useState(false);

    // Determine if the gate should be shown
    const isSubscribed = user?.subscription_tier && user.subscription_tier !== 'free';
    const showGate = !isAuthenticated || (isPremium && !isSubscribed);

    if (!showGate) return <>{children}</>;

    return (
        <div
            className="relative"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Render children (blurred/dimmed behind the gate) */}
            <div className={`transition-all duration-300 ${hovered ? 'opacity-40 blur-[1px]' : 'opacity-70'} pointer-events-none select-none`}>
                {children}
            </div>

            {/* Lock overlay */}
            <AnimatePresence>
                {(hovered || true) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center z-10 rounded-xl"
                    >
                        {compact ? (
                            /* ── Compact layout (card) ── */
                            <Link
                                to={isAuthenticated
                                    ? createPageUrl('Settings')   // → upgrade plan
                                    : createPageUrl('Login')
                                }
                                className="group flex flex-col items-center gap-2 px-4 py-3 text-center"
                            >
                                {/* Lock badge */}
                                <motion.div
                                    animate={hovered ? { scale: [1, 1.15, 1], rotate: [0, -5, 5, 0] } : {}}
                                    transition={{ duration: 0.5 }}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg
                                        ${isPremium
                                            ? 'bg-gradient-to-br from-[#C2AD90] to-[#97754D] shadow-[0_0_30px_rgba(194,173,144,0.4)]'
                                            : 'bg-[#0C100E]/80 border border-white/20'
                                        }`}
                                >
                                    <Lock className={`w-5 h-5 ${isPremium ? 'text-[#0C100E]' : 'text-[#C2AD90]'}`} />
                                </motion.div>

                                <AnimatePresence>
                                    {hovered && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 6 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 6 }}
                                            className="text-center"
                                        >
                                            {isPremium ? (
                                                <>
                                                    <p className="text-[10px] font-bold text-[#C2AD90] uppercase tracking-wider flex items-center gap-1 justify-center">
                                                        <Sparkles className="w-3 h-3" /> Premium
                                                    </p>
                                                    <p className="text-[9px] text-[#F5F0EA]/60 mt-0.5">
                                                        {isAuthenticated ? 'Upgrade to unlock' : 'Sign in to unlock'}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-[10px] font-medium text-[#F5F0EA]/80 flex items-center gap-1 justify-center">
                                                        <LogIn className="w-3 h-3" /> Sign in
                                                    </p>
                                                    <p className="text-[9px] text-[#F5F0EA]/40 mt-0.5">to listen</p>
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Link>
                        ) : (
                            /* ── Row layout (episode row) ── */
                            <Link
                                to={isAuthenticated ? createPageUrl('Settings') : createPageUrl('Login')}
                                className="flex items-center gap-3 px-4 py-2.5 rounded-xl glass border border-white/10 hover:border-[#C2AD90]/40 transition-all group"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                                    ${isPremium
                                        ? 'bg-gradient-to-br from-[#C2AD90] to-[#97754D]'
                                        : 'bg-white/10'
                                    }`}
                                >
                                    <Lock className={`w-4 h-4 ${isPremium ? 'text-[#0C100E]' : 'text-[#C2AD90]'}`} />
                                </div>
                                <div>
                                    {isPremium ? (
                                        <>
                                            <p className="text-xs font-semibold text-[#C2AD90]">Premium Episode</p>
                                            <p className="text-[10px] text-[#F5F0EA]/40">
                                                {isAuthenticated ? 'Upgrade your plan to listen' : 'Sign in & upgrade to listen'}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-xs font-medium text-[#F5F0EA]/70">Sign in to listen</p>
                                            <p className="text-[10px] text-[#F5F0EA]/40">Free account required</p>
                                        </>
                                    )}
                                </div>
                                <span className="ml-auto text-[10px] text-[#C2AD90] font-medium group-hover:underline">
                                    {isAuthenticated ? 'Upgrade →' : 'Sign in →'}
                                </span>
                            </Link>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Static lock badge (always visible, top-right of compact cards) */}
            {compact && (
                <div className="absolute top-2 left-2 z-20 pointer-events-none">
                    <div
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider
                            ${isPremium
                                ? 'bg-gradient-to-r from-[#C2AD90]/90 to-[#97754D]/90 text-[#0C100E]'
                                : 'bg-[#0C100E]/70 text-[#C2AD90] border border-white/10'
                            }`}
                    >
                        <Lock className="w-2.5 h-2.5" />
                        {isPremium ? 'Premium' : 'Login'}
                    </div>
                </div>
            )}
        </div>
    );
}
