import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';
import { createPageUrl } from '../../utils';

export default function CreateSessionModal({ open, onClose, episodeId, episodeTitle }) {
    const [sessionName, setSessionName] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!sessionName.trim()) {
            toast.error('Please enter a session name');
            return;
        }

        setLoading(true);
        try {
            const user = await apiClient.auth.me();
            const session = await apiClient.ListeningSession.create({
                episode_id: episodeId,
                host_user_id: user.id,
                host_name: user.full_name || 'Anonymous',
                session_name: sessionName,
                current_timestamp: 0,
                is_active: true,
                participant_count: 1,
                start_time: new Date().toISOString()
            });

            toast.success('Session created!');
            window.location.href = createPageUrl(`GroupSession?id=${session.id}`);
        } catch (error) {
            toast.error('Failed to create session');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#0C100E] border-[#364442] text-[#F5F0EA]">
                <DialogHeader>
                    <DialogTitle className="text-[#C2AD90] text-xl">Create Listening Session</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <div>
                        <p className="text-sm text-[#F5F0EA]/40 mb-3">Episode: {episodeTitle}</p>
                        <Input
                            value={sessionName}
                            onChange={(e) => setSessionName(e.target.value)}
                            placeholder="Session name (e.g., 'Friday Night Listen')"
                            className="bg-[#364442]/20 border-[#364442] text-[#F5F0EA]"
                        />
                    </div>
                    <Button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]"
                    >
                        {loading ? 'Creating...' : 'Create Session'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}