import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreatorService } from '@/services/api';
import { Loader2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function WithdrawBtn() {
    const [isOpen, setIsOpen] = useState(false);
    const [amount, setAmount] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleWithdraw = async () => {
        if (!amount || isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setIsLoading(true);
        try {
            await CreatorService.requestPayout(Number(amount));
            toast.success("Withdrawal initiated successfully!");
            setIsOpen(false);
            setAmount('');
        } catch (error) {
            toast.error("Withdrawal failed. Please try again.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="w-full bg-[#C2AD90] text-[#0C100E] hover:bg-[#A9937D] font-semibold">
                    Withdraw Funds
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1C1F1E] border-[#364442] text-[#F5F0EA]">
                <DialogHeader>
                    <DialogTitle>Withdraw to M-Pesa</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount" className="text-[#F5F0EA]/70">Amount (KES)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#F5F0EA]/40" />
                            <Input
                                id="amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-9 bg-[#0C100E] border-[#364442] text-[#F5F0EA]"
                                placeholder="0.00"
                                type="number"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="border-[#364442] text-[#F5F0EA] hover:bg-[#364442]/50">
                        Cancel
                    </Button>
                    <Button onClick={handleWithdraw} disabled={isLoading} className="bg-[#C2AD90] text-[#0C100E] hover:bg-[#A9937D]">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing
                            </>
                        ) : (
                            'Confirm Withdrawal'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
