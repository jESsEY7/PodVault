import React, { useState } from 'react';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import {
    Upload,
    FileAudio,
    MoreVertical,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { createPageUrl } from '../utils/index';
import { Link } from 'react-router-dom';

export default function CreatorContent() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const { data: episodes = [] } = useQuery({
        queryKey: ['creator-content'],
        queryFn: () => apiClient.Episode.list('-published_at', 20),
    });

    // Mock RSS ingestion status
    const rssFeed = {
        url: 'https://anchor.fm/s/12345/podcast/rss',
        lastSync: '2 hours ago',
        status: 'Active'
    };

    const StatusBadge = ({ status }) => {
        const styles = {
            published: 'bg-emerald-500/10 text-emerald-500',
            draft: 'bg-[#F5F0EA]/10 text-[#F5F0EA]/60',
            processing: 'bg-amber-500/10 text-amber-500',
            failed: 'bg-red-500/10 text-red-500'
        };

        // Mock status logic since API doesn't have it yet
        const currentStatus = status || 'published';

        return (
            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${styles[currentStatus] || styles.draft}`}>
                {currentStatus}
            </span>
        );
    };

    return (
        <DashboardLayout activePage="content">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#F5F0EA] mb-2">Content Management</h1>
                    <p className="text-[#F5F0EA]/60">Upload episodes, manage RSS feeds, and track processing status.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="border-[#364442] text-[#F5F0EA] hover:bg-[#364442]/50">
                        Sync RSS
                    </Button>
                    <Button className="bg-[#C2AD90] text-[#0C100E] hover:bg-[#A9937D] gap-2">
                        <Upload className="h-4 w-4" />
                        New Episode
                    </Button>
                </div>
            </div>

            {/* RSS Feed Status */}
            <div className="mb-8 rounded-xl border border-[#364442] bg-[#1C1F1E]/30 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#364442]/50 flex items-center justify-center">
                        <FileAudio className="h-5 w-5 text-[#C2AD90]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-[#F5F0EA]">Imported via RSS</h3>
                        <p className="text-xs text-[#F5F0EA]/40">{rssFeed.url}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <span className="text-[#F5F0EA]/40">Last synced: {rssFeed.lastSync}</span>
                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                        <CheckCircle2 className="h-3 w-3" />
                        <span className="font-medium">Active</span>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#F5F0EA]/40" />
                    <Input
                        placeholder="Search episodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#0C100E] border-[#364442] text-[#F5F0EA]"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        className="bg-[#0C100E] border border-[#364442] text-[#F5F0EA] rounded-md px-3 text-sm focus:outline-none focus:border-[#C2AD90]"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="draft">Drafts</option>
                        <option value="processing">Processing</option>
                    </select>
                </div>
            </div>

            {/* Content Table */}
            <div className="rounded-2xl border border-[#364442] bg-[#1C1F1E]/20 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#1C1F1E] text-[#F5F0EA]/40 uppercase text-[10px] font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Episode</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Plays</th>
                            <th className="px-6 py-4">Published</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#364442]">
                        {episodes.map((episode) => (
                            <tr key={episode.id} className="hover:bg-[#364442]/10 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={episode.cover_image || 'https://images.unsplash.com/photo-1478737270239-2f02b77ac6d5?w=100&q=80'}
                                            alt=""
                                            className="h-10 w-10 rounded object-cover bg-[#364442]"
                                        />
                                        <div>
                                            <p className="font-medium text-[#F5F0EA] line-clamp-1">{episode.title}</p>
                                            <p className="text-xs text-[#F5F0EA]/40 line-clamp-1">{episode.podcast_title}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={episode.status} />
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-[#F5F0EA]/60">
                                    {episode.plays?.toLocaleString() || '-'}
                                </td>
                                <td className="px-6 py-4 text-[#F5F0EA]/40 text-xs">
                                    {new Date(episode.created_date || Date.now()).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#F5F0EA]/40 hover:text-[#C2AD90]">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {episodes.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-[#F5F0EA]/40">
                                    No episodes found. Start by uploading one!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </DashboardLayout>
    );
}
