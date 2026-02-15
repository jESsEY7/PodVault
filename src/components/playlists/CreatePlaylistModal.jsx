import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';

export default function CreatePlaylistModal({ open, onClose, onSuccess }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isPublic, setIsPublic] = useState(true);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) {
            toast.error('Please enter a playlist name');
            return;
        }

        setLoading(true);
        try {
            await apiClient.Playlist.create({
                name,
                description,
                is_public: isPublic,
                episode_ids: []
            });
            toast.success('Playlist created!');
            setName('');
            setDescription('');
            setIsPublic(true);
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error('Failed to create playlist');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#0C100E] border-[#364442] text-[#F5F0EA]">
                <DialogHeader>
                    <DialogTitle className="text-[#C2AD90] text-xl">Create New Playlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <div>
                        <Label className="text-[#F5F0EA]/70">Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="My Awesome Playlist"
                            className="bg-[#364442]/20 border-[#364442] text-[#F5F0EA] mt-1"
                        />
                    </div>
                    <div>
                        <Label className="text-[#F5F0EA]/70">Description</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this playlist about?"
                            className="bg-[#364442]/20 border-[#364442] text-[#F5F0EA] mt-1"
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label className="text-[#F5F0EA]/70">Public Playlist</Label>
                        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                    </div>
                    <Button
                        onClick={handleCreate}
                        disabled={loading}
                        className="w-full bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]"
                    >
                        {loading ? 'Creating...' : 'Create Playlist'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}