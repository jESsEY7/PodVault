import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreatorService } from '@/services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsChart() {
    const { data: analytics, isLoading } = useQuery({
        queryKey: ['creator-analytics'],
        queryFn: () => CreatorService.getDashboardStats().then(res => res.data),
    });

    // Mock data if no data returned yet
    const data = analytics?.data || [
        { name: 'Mon', listeners: 400 },
        { name: 'Tue', listeners: 300 },
        { name: 'Wed', listeners: 550 },
        { name: 'Thu', listeners: 450 },
        { name: 'Fri', listeners: 700 },
        { name: 'Sat', listeners: 900 },
        { name: 'Sun', listeners: 800 },
    ];

    if (isLoading) {
        return <Skeleton className="h-64 w-full rounded-2xl bg-[#1C1F1E]" />;
    }

    return (
        <div className="glass p-6 rounded-2xl border border-[#364442]">
            <h3 className="text-[#F5F0EA] font-semibold mb-6">Listener Growth</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            stroke="#525252"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#525252"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1C1F1E',
                                border: '1px solid #364442',
                                borderRadius: '8px',
                                color: '#F5F0EA'
                            }}
                            cursor={{ fill: '#ffffff10' }}
                        />
                        <Bar
                            dataKey="listeners"
                            fill="#C2AD90"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
