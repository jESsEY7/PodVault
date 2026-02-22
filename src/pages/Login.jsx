import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Mic, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { createPageUrl } from '../utils/index';

export default function Login() {
    const { login, isAuthenticated, isLoadingAuth, authError, setAuthError } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // If already logged in, redirect to home
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/Home', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    // Sync auth context errors
    useEffect(() => {
        if (authError?.type === 'login_failed') {
            setError(authError.message);
        }
    }, [authError]);

    const handleChange = (e) => {
        setError('');
        setAuthError?.(null);
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.username.trim() || !form.password) {
            setError('Please enter your username and password');
            return;
        }
        setIsSubmitting(true);
        setError('');
        const result = await login({ username: form.username.trim(), password: form.password });
        if (result.success) {
            // Navigate to intended page or home
            const params = new URLSearchParams(window.location.search);
            const next = params.get('next') || '/Home';
            navigate(next, { replace: true });
        } else {
            setError(result.error || 'Login failed');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-[#0C100E] flex flex-col items-center justify-center px-5 relative overflow-hidden">
            {/* Animated background glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#C2AD90]/5 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#97754D]/5 blur-[100px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#C2AD90] to-[#97754D] flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(194,173,144,0.3)]">
                        <Mic className="w-8 h-8 text-[#0C100E]" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#F5F0EA]">Welcome back</h1>
                    <p className="text-sm text-[#F5F0EA]/40 mt-1">Sign in to continue listening</p>
                </div>

                {/* Card */}
                <div className="glass rounded-2xl border border-white/8 p-8 shadow-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Error message */}
                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -8, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                                    exit={{ opacity: 0, y: -8, height: 0 }}
                                    className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                                >
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-[#F5F0EA]/50 font-medium uppercase tracking-wider">
                                Username or Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F0EA]/30" />
                                <input
                                    id="login-username"
                                    name="username"
                                    type="text"
                                    autoComplete="username"
                                    autoFocus
                                    value={form.username}
                                    onChange={handleChange}
                                    placeholder="your_username"
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[#F5F0EA] placeholder-[#F5F0EA]/25 text-sm focus:outline-none focus:border-[#C2AD90]/50 focus:bg-white/8 transition-all"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label className="text-xs text-[#F5F0EA]/50 font-medium uppercase tracking-wider">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F0EA]/30" />
                                <input
                                    id="login-password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-11 py-3 bg-white/5 border border-white/10 rounded-xl text-[#F5F0EA] placeholder-[#F5F0EA]/25 text-sm focus:outline-none focus:border-[#C2AD90]/50 focus:bg-white/8 transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#F5F0EA]/30 hover:text-[#C2AD90] transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            id="login-submit"
                            disabled={isSubmitting || isLoadingAuth}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#C2AD90] to-[#97754D] text-[#0C100E] font-semibold py-3.5 rounded-xl hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 shadow-[0_4px_24px_rgba(194,173,144,0.2)]"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Sign In <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 my-6">
                        <div className="flex-1 h-px bg-white/8" />
                        <span className="text-[10px] text-[#F5F0EA]/25 uppercase tracking-wider">or</span>
                        <div className="flex-1 h-px bg-white/8" />
                    </div>

                    {/* Switch to sign up */}
                    <p className="text-center text-sm text-[#F5F0EA]/40">
                        Don't have an account?{' '}
                        <Link
                            to="/SignUp"
                            className="text-[#C2AD90] font-medium hover:text-[#F5F0EA] transition-colors"
                        >
                            Create one free →
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <p className="text-center text-[10px] text-[#F5F0EA]/20 mt-8">
                    PodVault · Your audio universe
                </p>
            </motion.div>
        </div>
    );
}
