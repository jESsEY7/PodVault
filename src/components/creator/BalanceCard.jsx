import React from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { CreatorService } from '@/services/api';
import { Skeleton } from "@/components/ui/skeleton";

export default function BalanceCard() {
    const { data: wallet, isLoading } = useQuery({
        queryKey: ['creator-wallet'],
        queryFn: () => CreatorService.getDashboardStats().then(res => res.data), // Assuming the endpoint returns wallet data or similar
        // Adjust based on actual API response structure from CreatorService
    });

    // Fallback if API is not fully ready or to show structure
    const balance = wallet?.balance || 0;
    const pending = wallet?.pending_revenue || 0;

    if (isLoading) {
        return <Skeleton className="h-48 w-full rounded-2xl bg-[#1C1F1E]" />;
    }

    return (
        <div className="glass p-6 rounded-2xl border border-[#364442] bg-gradient-to-br from-[#1C1F1E] to-[#0C100E]">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-[#C2AD90]/10 rounded-xl text-[#C2AD90]">
                    <Wallet className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-[#F5F0EA]/40 bg-[#364442]/30 px-2 py-1 rounded">KES Wallet</span>
            </div>

            <div className="space-y-1">
                <p className="text-[#F5F0EA]/60 text-sm">Total Balance</p>
                <h3 className="text-3xl font-bold text-[#F5F0EA]">
                    KES {balance.toLocaleString()}
                </h3>
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>+12.5% this month</span>
                </div>
                <div className="flex items-center gap-1 text-[#C2AD90] bg-[#C2AD90]/10 px-2 py-1 rounded-lg">
                    <ArrowDownRight className="w-3 h-3" />
                    <span>KES {pending.toLocaleString()} pending</span>
                </div>
            </div>
        </div>
    );
}
