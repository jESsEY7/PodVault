import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiClient } from '@/api/apiClient';
import { toast } from 'sonner';
import { DollarSign } from 'lucide-react';

const PRESET_AMOUNTS = [5, 10, 25, 50, 100];

export default function TipCreatorModal({ open, onClose, creatorId, creatorName }) {
    const [amount, setAmount] = useState(10);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTip = async () => {
        if (amount < 1) {
            toast.error('Minimum tip is $1');
            return;
        }

        setLoading(true);
        try {
            const user = await apiClient.auth.me();
            await apiClient.Tip.create({
                creator_id: creatorId,
                tipper_name: user.full_name || 'Anonymous',
                amount,
                message,
                is_public: true
            });
            toast.success(`Tipped $${amount} to ${creatorName}!`);
            setAmount(10);
            setMessage('');
            onClose();
        } catch (error) {
            toast.error('Failed to process tip');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-[#0C100E] border-[#364442] text-[#F5F0EA]">
                <DialogHeader>
                    <DialogTitle className="text-[#C2AD90] text-xl">Tip {creatorName}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <div>
                        <label className="text-sm text-[#F5F0EA]/70 mb-2 block">Select Amount</label>
                        <div className="flex gap-2 flex-wrap">
                            {PRESET_AMOUNTS.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => setAmount(preset)}
                                    className={`px-4 py-2 rounded-lg transition ${amount === preset
                                        ? 'bg-[#C2AD90] text-[#0C100E]'
                                        : 'bg-[#364442]/20 text-[#F5F0EA]/70 hover:bg-[#364442]/40'
                                        }`}
                                >
                                    ${preset}
                                </button>
                            ))}
                        </div>
                        <Input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            placeholder="Custom amount"
                            className="bg-[#364442]/20 border-[#364442] text-[#F5F0EA] mt-2"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-[#F5F0EA]/70 mb-2 block">Add a message (optional)</label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Love your content!"
                            className="bg-[#364442]/20 border-[#364442] text-[#F5F0EA]"
                        />
                    </div>
                    <Button
                        onClick={handleTip}
                        disabled={loading}
                        className="w-full bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E] flex items-center gap-2"
                    >
                        <DollarSign className="w-4 h-4" />
                        {loading ? 'Processing...' : `Tip $${amount}`}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}