import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Mic,
    BarChart3,
    Wallet,
    Settings,
    LogOut,
    PlusCircle,
    Bell
} from 'lucide-react';
import { createPageUrl } from '../../utils';
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children, activePage }) {
    const minSidebarWidth = '80px';
    const maxSidebarWidth = '280px';

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, path: 'CreatorDashboard' },
        { id: 'content', label: 'Content', icon: Mic, path: 'CreatorContent' },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, path: 'CreatorAnalytics' },
        { id: 'wallet', label: 'Wallet', icon: Wallet, path: 'CreatorWallet' },
        { id: 'settings', label: 'Settings', icon: Settings, path: 'CreatorSettings' },
    ];

    return (
        <div className="flex min-h-screen bg-[#0C100E] text-[#F5F0EA]">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-72 border-r border-[#364442] bg-[#0C100E] lg:block">
                <div className="flex h-full flex-col">
                    {/* Brand */}
                    <div className="flex h-20 items-center border-b border-[#364442] px-6">
                        <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-[#C2AD90]" />
                            <span className="text-lg font-bold tracking-tight">PodVault <span className="text-[#C2AD90]">Creator</span></span>
                        </Link>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 space-y-1 px-4 py-6">
                        {menuItems.map((item) => {
                            const isActive = activePage === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    to={createPageUrl(item.path)}
                                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${isActive
                                            ? 'bg-[#C2AD90] text-[#0C100E]'
                                            : 'text-[#F5F0EA]/60 hover:bg-[#364442]/50 hover:text-[#F5F0EA]'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="border-t border-[#364442] p-4">
                        <div className="rounded-xl bg-gradient-to-br from-[#1C1F1E] to-[#364442]/30 p-4">
                            <p className="text-xs font-semibold text-[#F5F0EA] mb-2">Pro Plan</p>
                            <div className="mb-3 h-1.5 w-full rounded-full bg-[#0C100E]">
                                <div className="h-1.5 w-[75%] rounded-full bg-[#C2AD90]" />
                            </div>
                            <p className="text-[10px] text-[#F5F0EA]/50">75GB of 100GB used</p>
                        </div>
                        <button className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[#F5F0EA]/60 hover:bg-red-500/10 hover:text-red-400 transition-colors">
                            <LogOut className="h-5 w-5" />
                            Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-72">
                {/* Mobile Header (Placeholder for mobile) */}
                <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#364442] bg-[#0C100E]/80 px-6 backdrop-blur-md lg:px-8">
                    <div className="lg:hidden">
                        {/* Mobile Menu Trigger */}
                        <div className="h-8 w-8 rounded-lg bg-[#C2AD90]" />
                    </div>

                    <div className="flex flex-1 justify-end items-center gap-4">
                        <Button variant="ghost" size="icon" className="text-[#F5F0EA]/60 hover:text-[#C2AD90]">
                            <Bell className="h-5 w-5" />
                        </Button>
                        <Button className="bg-[#C2AD90] text-[#0C100E] hover:bg-[#A9937D] gap-2">
                            <PlusCircle className="h-4 w-4" />
                            <span>Upload</span>
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-[#364442] border border-[#C2AD90]/50" />
                    </div>
                </div>

                <div className="p-6 lg:p-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}
