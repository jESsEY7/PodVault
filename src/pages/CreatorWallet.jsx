import React, { useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    Phone,
    ShieldCheck,
    AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { apiClient } from '@/api/apiClient';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function CreatorWallet() {
    const [amount, setAmount] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const queryClient = useQueryClient();

    // Fetch Wallet Balance
    const { data: wallet, isLoading: walletLoading } = useQuery({
        queryKey: ['wallet'],
        queryFn: apiClient.Wallet.get
    });

    // Fetch Transactions
    const { data: transactions, isLoading: txLoading } = useQuery({
        queryKey: ['transactions'],
        queryFn: apiClient.Wallet.getTransactions
    });

    const withdrawMutation = useMutation({
        mutationFn: ({ amount, phone }) => apiClient.Wallet.withdraw(amount, phone),
        onSuccess: () => {
            toast.success(`Withdrawal initiated to ${phoneNumber}`);
            setAmount('');
            setPhoneNumber('');
            queryClient.invalidateQueries(['wallet']);
            queryClient.invalidateQueries(['transactions']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.error || 'Withdrawal failed');
        }
    });

    const handleWithdraw = (e) => {
        e.preventDefault();
        if (!amount || !phoneNumber) {
            toast.error('Please fill in all fields');
            return;
        }
        withdrawMutation.mutate({ amount: parseFloat(amount), phone: phoneNumber });
    };

    // Derived state for UI safety
    const availableBalance = wallet?.balance ? parseFloat(wallet.balance) : 0;
    const pendingBalance = wallet?.pending_balance ? parseFloat(wallet.pending_balance) : 0;
    const currency = wallet?.currency || 'KES';
    const txList = transactions || [];


    return (
        <DashboardLayout activePage="wallet">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[#F5F0EA] mb-2">Wallet & Payouts</h1>
                <p className="text-[#F5F0EA]/60">Manage your earnings and withdraw directly to M-Pesa.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Balance Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="rounded-3xl border border-[#364442] bg-gradient-to-br from-[#1C1F1E] to-[#C2AD90]/20 p-8">
                            <div className="flex items-center gap-3 mb-4 text-[#C2AD90]">
                                <Wallet className="h-6 w-6" />
                                <span className="text-sm font-bold uppercase tracking-wider">Available Balance</span>
                            </div>
                            <h2 className="text-4xl font-bold text-[#F5F0EA] mb-2">
                                <span className="text-2xl text-[#F5F0EA]/60 mr-1">{balance.currency}</span>
                                {balance.available.toLocaleString()}
                            </h2>
                            <p className="text-xs text-[#F5F0EA]/40">Last updated: Just now</p>
                        </div>

                        <div className="rounded-3xl border border-[#364442] bg-[#1C1F1E]/50 p-8 border-dashed">
                            <div className="flex items-center gap-3 mb-4 text-[#F5F0EA]/60">
                                <Clock className="h-6 w-6" />
                                <span className="text-sm font-bold uppercase tracking-wider">Pending Payouts</span>
                            </div>
                            <h2 className="text-4xl font-bold text-[#F5F0EA]/60 mb-2">
                                <span className="text-2xl text-[#F5F0EA]/40 mr-1">{balance.currency}</span>
                                {balance.pending.toLocaleString()}
                            </h2>
                            <p className="text-xs text-[#F5F0EA]/30">Clears in 3-5 business days</p>
                        </div>
                    </div>

                    {/* Transaction History */}
                    <div className="rounded-3xl border border-[#364442] bg-[#1C1F1E]/30 p-6">
                        <h3 className="text-lg font-bold text-[#F5F0EA] mb-6">Recent Transactions</h3>
                        <div className="space-y-4">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl bg-[#0C100E]/40 border border-[#364442]/30">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tx.type === 'Credit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                            }`}>
                                            {tx.type === 'Credit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-[#F5F0EA]">{tx.description}</p>
                                            <p className="text-xs text-[#F5F0EA]/40">{tx.date} • {tx.id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${tx.amount > 0 ? 'text-[#F5F0EA]' : 'text-[#F5F0EA]/60'}`}>
                                            {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}
                                        </p>
                                        <span className="text-[10px] bg-[#364442]/50 px-2 py-0.5 rounded text-[#F5F0EA]/60">
                                            {tx.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button variant="link" className="w-full mt-4 text-[#C2AD90]">View All Transactions</Button>
                    </div>
                </div>

                {/* Withdrawal Form */}
                <div className="space-y-6">
                    <div className="rounded-3xl border border-[#364442] bg-[#1C1F1E] p-6 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-[#F5F0EA]">Withdraw Funds</h3>
                            <div className="h-8 w-12 bg-green-600 rounded flex items-center justify-center">
                                <span className="text-[10px] font-bold text-white">M-PESA</span>
                            </div>
                        </div>

                        <form onSubmit={handleWithdraw} className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-[#F5F0EA]/60 mb-1.5 block">Amount (KES)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#F5F0EA]/40 font-bold">KES</span>
                                    <Input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="pl-12 bg-[#0C100E] border-[#364442] text-[#F5F0EA] h-12"
                                    />
                                </div>
                                <p className="text-[10px] text-[#F5F0EA]/40 mt-1">Transaction fee: 5% (Platform) + Carrier rates</p>
                            </div>

                            <div>
                                <label className="text-xs font-medium text-[#F5F0EA]/60 mb-1.5 block">M-Pesa Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F5F0EA]/40" />
                                    <Input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="254 7..."
                                        className="pl-10 bg-[#0C100E] border-[#364442] text-[#F5F0EA] h-12"
                                    />
                                </div>
                            </div>

                            <div className="bg-[#364442]/20 rounded-xl p-3 flex gap-3 items-start">
                                <ShieldCheck className="h-5 w-5 text-[#C2AD90] shrink-0" />
                                <p className="text-xs text-[#F5F0EA]/60 leading-relaxed">
                                    Withdrawals are processed instantly. Ensure your Safaricom line is active and registered.
                                </p>
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 bg-[#C2AD90] text-[#0C100E] hover:bg-[#A9937D] font-bold text-base"
                            >
                                {loading ? 'Processing...' : 'Withdraw to M-Pesa'}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
