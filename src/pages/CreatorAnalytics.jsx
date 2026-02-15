import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, PlayCircle, MapPin, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

import DashboardLayout from '../components/dashboard/DashboardLayout';

export default function CreatorAnalytics() {
    const [timeRange, setTimeRange] = useState('30d');

    const { data: episodes = [] } = useQuery({
        queryKey: ['creator-episodes'],
        queryFn: () => apiClient.Episode.list('-created_date', 50),
    });

    const { data: activities = [] } = useQuery({
        queryKey: ['all-activities'],
        queryFn: () => apiClient.UserActivity.list('-created_date', 200),
    });

    const { data: subscriptions = [] } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: () => apiClient.CreatorSubscription.list('-created_date', 100),
    });

    // Calculate metrics
    const totalPlays = episodes.reduce((sum, ep) => sum + (ep.plays || 0), 0);
    const totalLikes = episodes.reduce((sum, ep) => sum + (ep.likes || 0), 0);
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.price_monthly || 0) * (sub.subscriber_count || 0), 0);
    const avgCompletionRate = activities.filter(a => a.action === 'complete').length / Math.max(activities.length, 1) * 100;

    // Episode performance data
    const episodeData = episodes.slice(0, 10).map(ep => ({
        name: ep.title.slice(0, 20) + '...',
        plays: ep.plays || 0,
        likes: ep.likes || 0,
        completion: Math.random() * 100 // Mock data
    }));

    // Growth trend
    const growthData = [
        { month: 'Jan', listeners: 1200, revenue: 850 },
        { month: 'Feb', listeners: 1800, revenue: 1250 },
        { month: 'Mar', listeners: 2400, revenue: 1680 },
        { month: 'Apr', listeners: 3100, revenue: 2170 },
        { month: 'May', listeners: 3800, revenue: 2660 },
        { month: 'Jun', listeners: 4500, revenue: 3150 }
    ];

    // Geographic breakdown
    const geoData = [
        { country: 'United States', value: 45 },
        { country: 'United Kingdom', value: 18 },
        { country: 'Canada', value: 12 },
        { country: 'Australia', value: 10 },
        { country: 'Others', value: 15 }
    ];

    const COLORS = ['#C2AD90', '#97754D', '#5D4429', '#364442', '#F5F0EA'];

    const StatCard = ({ icon: Icon, label, value, change, color }) => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-xl p-5"
        >
            <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-[#F5F0EA]" />
                </div>
                {change && (
                    <span className={`text-xs font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change > 0 ? '+' : ''}{change}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-bold text-[#F5F0EA] mb-1">{value.toLocaleString()}</p>
            <p className="text-xs text-[#F5F0EA]/40">{label}</p>
        </motion.div>
    );

    return (
        <DashboardLayout activePage="analytics">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[#F5F0EA] mb-2">Analytics</h1>
                    <p className="text-[#F5F0EA]/60">Track your audience growth and revenue performance.</p>
                </div>
                <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="bg-[#0C100E] border border-[#364442] text-[#F5F0EA] rounded-lg px-4 py-2 text-sm"
                >
                    <option value="7d">Last 7 days</option>
                    <option value="30d">Last 30 days</option>
                    <option value="90d">Last 90 days</option>
                    <option value="1y">Last year</option>
                </select>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon={PlayCircle}
                    label="Total Plays"
                    value={totalPlays}
                    change={12.5}
                    color="from-[#C2AD90] to-[#97754D]"
                />
                <StatCard
                    icon={Users}
                    label="Subscribers"
                    value={subscriptions.reduce((sum, s) => sum + (s.subscriber_count || 0), 0)}
                    change={8.3}
                    color="from-[#97754D] to-[#5D4429]"
                />
                <StatCard
                    icon={DollarSign}
                    label="Revenue (Monthly)"
                    value={totalRevenue}
                    change={15.2}
                    color="from-[#C2AD90] to-[#97754D]"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Completion Rate"
                    value={Math.round(avgCompletionRate)}
                    change={5.7}
                    color="from-[#5D4429] to-[#364442]"
                />
            </div>

            {/* Growth Trends */}
            <div className="glass rounded-2xl p-6 mb-8">
                <h2 className="text-xl font-bold text-[#F5F0EA] mb-6">Growth Trends</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={growthData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#364442" />
                        <XAxis dataKey="month" stroke="#F5F0EA" />
                        <YAxis stroke="#F5F0EA" />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0C100E', border: '1px solid #364442' }}
                            labelStyle={{ color: '#F5F0EA' }}
                        />
                        <Line type="monotone" dataKey="listeners" stroke="#C2AD90" strokeWidth={2} />
                        <Line type="monotone" dataKey="revenue" stroke="#97754D" strokeWidth={2} />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Episode Performance */}
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-[#F5F0EA] mb-6">Episode Performance</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={episodeData.slice(0, 5)}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#364442" />
                            <XAxis dataKey="name" stroke="#F5F0EA" fontSize={10} />
                            <YAxis stroke="#F5F0EA" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#0C100E', border: '1px solid #364442' }}
                                labelStyle={{ color: '#F5F0EA' }}
                            />
                            <Bar dataKey="plays" fill="#C2AD90" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Geographic Breakdown */}
                <div className="glass rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-[#F5F0EA] mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#C2AD90]" />
                        Geographic Breakdown
                    </h2>
                    <div className="space-y-3">
                        {geoData.map((geo, i) => (
                            <div key={geo.country}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-[#F5F0EA]/70">{geo.country}</span>
                                    <span className="text-[#C2AD90] font-medium">{geo.value}%</span>
                                </div>
                                <div className="w-full h-2 bg-[#364442]/30 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${geo.value}%` }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        className="h-full bg-gradient-to-r from-[#C2AD90] to-[#97754D]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Drop-off Analysis */}
            <div className="glass rounded-2xl p-6">
                <h2 className="text-xl font-bold text-[#F5F0EA] mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#C2AD90]" />
                    Listen-Through Analysis
                </h2>
                <p className="text-sm text-[#F5F0EA]/60 mb-4">
                    Average listener drop-off points across your episodes
                </p>
                <div className="space-y-2">
                    {['0-25%', '25-50%', '50-75%', '75-100%'].map((range, i) => {
                        const value = [92, 78, 65, 45][i];
                        return (
                            <div key={range} className="flex items-center gap-4">
                                <span className="text-sm text-[#F5F0EA]/70 w-20">{range}</span>
                                <div className="flex-1 h-8 bg-[#364442]/30 rounded-lg overflow-hidden relative">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${value}%` }}
                                        transition={{ delay: i * 0.1, duration: 0.5 }}
                                        className="h-full bg-gradient-to-r from-[#C2AD90] to-[#97754D]"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#F5F0EA]">
                                        {value}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}