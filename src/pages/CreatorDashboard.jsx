import React from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { DollarSign, Wallet, ArrowUpRight, Zap, CheckCircle, Brain, Sparkles, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';

const CreatorDashboard = () => {
    // Fetch Wallet Data
    const { data: wallet, isLoading: walletLoading } = useQuery({
        queryKey: ['wallet'],
        queryFn: apiClient.Wallet.get
    });

    // Fetch Transactions for History and Lifetime Calc
    const { data: transactions, isLoading: txLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: apiClient.Wallet.getTransactions
    });

    // Calculate Lifetime Earnings (Sum of all DEPOSIT transactions)
    const lifetimeEarnings = transactions
        ? transactions
            .filter(tx => tx.transaction_type === 'DEPOSIT')
            .reduce((sum, tx) => sum + parseFloat(tx.amount), 0)
        : 0;

    // Derived State
    const balance = wallet?.balance ? parseFloat(wallet.balance).toLocaleString() : "0.00";
    const pendingBalance = wallet?.pending_balance ? parseFloat(wallet.pending_balance).toLocaleString() : "0.00";
    const lifetimeLabel = lifetimeEarnings.toLocaleString();

    // Mock data for the earnings trend line (Placeholder until Analytics API)
    const earningsData = [
        { day: 'Mon', kes: 4500 }, { day: 'Tue', kes: 5200 },
        { day: 'Wed', kes: 6100 }, { day: 'Thu', kes: 5800 },
        { day: 'Fri', kes: 8900 }, { day: 'Sat', kes: 12000 },
        { day: 'Sun', kes: 9500 }
    ];

    // Mock data for AI Insights
    const aiInsights = [
        { topic: "Crypto & Web3", growth: "+156%", sentiment: "Positive", relevance: "High" },
        { topic: "Nairobi Tech Scene", growth: "+89%", sentiment: "Neutral", relevance: "High" },
        { topic: "Mobile Money", growth: "+42%", sentiment: "Positive", relevance: "Medium" },
    ];

    return (
        <DashboardLayout activePage="overview">
            <div className="font-sans text-[#F5F0EA]">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent inline-block">
                        Creator Hub
                    </h1>
                    <p className="text-zinc-400 mt-2">Welcome back, Jesse. Here's your semantic audio performance.</p>
                </header>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Available Balance"
                        value={`KES ${balance}`}
                        icon={<Wallet className="text-green-400" />}
                        desc="Cleared for M-Pesa Withdrawal"
                        action={<button className="mt-4 w-full py-2 bg-green-600 hover:bg-green-700 rounded-lg font-bold transition-all shadow-lg shadow-green-900/20">Withdraw Now</button>}
                    />
                    <StatCard
                        title="Pending Verification"
                        value={`KES ${pendingBalance}`}
                        icon={<Zap className="text-yellow-400 animate-pulse" />}
                        desc="Processed offline events (24h lock)"
                    />
                    <StatCard
                        title="Lifetime Revenue"
                        value={`KES ${lifetimeLabel}`}
                        icon={<CheckCircle className="text-purple-400" />}
                        desc="Total earnings across all episodes"
                    />
                </div>

                {/* Analytics & Insights Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* Earnings Chart */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-md">
                        <h3 className="text-xl font-bold mb-6 flex items-center">
                            <ArrowUpRight className="mr-2 text-purple-400" /> Weekly Earnings Trend
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={earningsData}>
                                    <defs>
                                        <linearGradient id="colorKes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="day" stroke="#71717a" axisLine={false} tickLine={false} />
                                    <YAxis stroke="#71717a" axisLine={false} tickLine={false} tickFormatter={(value) => `K${value / 1000}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                                        itemStyle={{ color: '#a855f7' }}
                                        formatter={(value) => [`KES ${value}`, "Earnings"]}
                                    />
                                    <Area type="monotone" dataKey="kes" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorKes)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* AI Insights Panel */}
                    <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-md relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Brain size={100} className="text-purple-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-6 flex items-center relative z-10">
                            <Sparkles className="mr-2 text-pink-400" /> AI Semantic Insights
                        </h3>
                        <p className="text-zinc-400 text-sm mb-4 relative z-10">
                            Topics driving the highest engagement based on audio transcription analysis.
                        </p>
                        <div className="space-y-4 relative z-10">
                            {aiInsights.map((insight, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-zinc-800/40 rounded-xl border border-zinc-700/50 hover:border-purple-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">{insight.topic}</div>
                                            <div className="text-xs text-zinc-500">{insight.sentiment} Sentiment</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-green-400 font-bold">{insight.growth}</div>
                                        <div className="text-[10px] text-zinc-500 uppercase">Growth</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl backdrop-blur-md">
                    <h3 className="text-xl font-bold mb-6">Recent Transactions</h3>
                    <div className="space-y-2">
                        {transactions?.slice(0, 5).map(tx => (
                            <TransactionRow
                                key={tx.id}
                                title={tx.description || tx.transaction_type}
                                amount={`${tx.transaction_type === 'WITHDRAWAL' ? '-' : '+'} KES ${parseFloat(tx.amount).toFixed(2)}`}
                                time={new Date(tx.created_at).toLocaleDateString()}
                                status={tx.status}
                                isWithdrawal={tx.transaction_type === 'WITHDRAWAL'}
                            />
                        ))}
                        {(!transactions || transactions.length === 0) && (
                            <p className="text-zinc-500 text-sm">No recent transactions.</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

// Reusable Components
const StatCard = ({ title, value, icon, desc, action }) => (
    <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl hover:border-purple-500/50 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
            {icon}
            <span className="text-xs font-mono text-zinc-500 tracking-widest uppercase">{title}</span>
        </div>
        <div className="text-3xl font-bold mb-2 text-white">{value}</div>
        <p className="text-xs text-zinc-500 leading-relaxed mb-2">{desc}</p>
        {action}
    </div>
);

const TransactionRow = ({ title, amount, time, status, isWithdrawal }) => (
    <div className="flex justify-between items-center p-4 hover:bg-zinc-800/50 rounded-xl transition-all border-b border-zinc-800/50 last:border-0 last:pb-0">
        <div>
            <div className="font-medium text-white">{title}</div>
            <div className="text-xs text-zinc-500">{time}</div>
        </div>
        <div className="text-right">
            <div className={`font-bold ${isWithdrawal ? 'text-zinc-300' : 'text-purple-400'}`}>{amount}</div>
            <div className={`text-[10px] uppercase tracking-tighter ${status === 'Cleared' || status === 'Success' ? 'text-green-500' : 'text-yellow-500'}`}>{status}</div>
        </div>
    </div>
);

export default CreatorDashboard;
