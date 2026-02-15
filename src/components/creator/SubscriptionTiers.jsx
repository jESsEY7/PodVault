import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Crown, Star, Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function SubscriptionTiers({ creatorId, creatorName }) {
    const [paymentType, setPaymentType] = useState('monthly');
    const [customAmount, setCustomAmount] = useState('');
    const [showPWYC, setShowPWYC] = useState(false);

    const tiers = [
        {
            id: 'supporter',
            name: 'Supporter',
            icon: Heart,
            monthlyPrice: 5,
            annualPrice: 50,
            color: 'from-[#97754D] to-[#5D4429]',
            benefits: [
                '2 bonus episodes per month',
                'Ad-free listening',
                'Supporter badge in group sessions',
                'Early episode notifications'
            ]
        },
        {
            id: 'inner-circle',
            name: 'Inner Circle',
            icon: Crown,
            monthlyPrice: 15,
            annualPrice: 150,
            color: 'from-[#C2AD90] to-[#97754D]',
            popular: true,
            benefits: [
                'Everything in Supporter',
                'Monthly live Q&A access',
                'Private Discord community',
                'Early access (48hrs before public)',
                'Exclusive merch discounts',
                'Name in episode credits'
            ]
        }
    ];

    const handleSubscribe = (tier) => {
        const price = paymentType === 'monthly' ? tier.monthlyPrice : tier.annualPrice;
        toast.success(`Subscribing to ${tier.name} - $${price}/${paymentType === 'monthly' ? 'mo' : 'yr'}`);
    };

    const handlePWYC = () => {
        const amount = parseFloat(customAmount);
        if (amount < 1) {
            toast.error('Minimum donation is $1');
            return;
        }
        toast.success(`Thank you for your $${amount} donation!`);
        setCustomAmount('');
    };

    return (
        <div className="space-y-6">
            {/* Payment toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
                <button
                    onClick={() => setPaymentType('monthly')}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${paymentType === 'monthly'
                            ? 'bg-[#C2AD90] text-[#0C100E]'
                            : 'text-[#F5F0EA]/60 hover:text-[#F5F0EA]'
                        }`}
                >
                    Monthly
                </button>
                <button
                    onClick={() => setPaymentType('annual')}
                    className={`px-6 py-2 rounded-lg font-medium transition-all ${paymentType === 'annual'
                            ? 'bg-[#C2AD90] text-[#0C100E]'
                            : 'text-[#F5F0EA]/60 hover:text-[#F5F0EA]'
                        }`}
                >
                    Annual
                    <span className="ml-2 text-xs bg-[#C2AD90]/20 px-2 py-0.5 rounded">Save 17%</span>
                </button>
            </div>

            {/* Tiers */}
            <div className="grid md:grid-cols-2 gap-6">
                {tiers.map((tier, i) => {
                    const Icon = tier.icon;
                    const price = paymentType === 'monthly' ? tier.monthlyPrice : tier.annualPrice;

                    return (
                        <motion.div
                            key={tier.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`glass rounded-2xl p-6 relative ${tier.popular ? 'ring-2 ring-[#C2AD90]' : ''}`}
                        >
                            {tier.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C2AD90] text-[#0C100E] text-xs font-bold px-4 py-1 rounded-full">
                                    MOST POPULAR
                                </div>
                            )}

                            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center mb-4`}>
                                <Icon className="w-6 h-6 text-[#F5F0EA]" />
                            </div>

                            <h3 className="text-2xl font-bold text-[#F5F0EA] mb-2">{tier.name}</h3>
                            <div className="flex items-baseline gap-2 mb-6">
                                <span className="text-4xl font-bold text-[#C2AD90]">${price}</span>
                                <span className="text-[#F5F0EA]/40 text-sm">/{paymentType === 'monthly' ? 'mo' : 'yr'}</span>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {tier.benefits.map((benefit, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-sm text-[#F5F0EA]/70">
                                        <Check className="w-4 h-4 text-[#C2AD90] flex-shrink-0 mt-0.5" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                onClick={() => handleSubscribe(tier)}
                                className={`w-full ${tier.popular
                                        ? 'bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]'
                                        : 'bg-[#364442] hover:bg-[#364442]/70 text-[#F5F0EA]'
                                    }`}
                            >
                                Subscribe Now
                            </Button>
                        </motion.div>
                    );
                })}
            </div>

            {/* Pay What You Want */}
            <div className="glass rounded-2xl p-6">
                <button
                    onClick={() => setShowPWYC(!showPWYC)}
                    className="flex items-center justify-between w-full"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C2AD90] to-[#97754D] flex items-center justify-center">
                            <Star className="w-5 h-5 text-[#0C100E]" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold text-[#F5F0EA]">Pay What You Want</h3>
                            <p className="text-xs text-[#F5F0EA]/40">One-time contribution</p>
                        </div>
                    </div>
                    <span className="text-[#C2AD90]">{showPWYC ? '−' : '+'}</span>
                </button>

                {showPWYC && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        className="mt-4 pt-4 border-t border-[#364442]"
                    >
                        <div className="flex gap-2 mb-3">
                            <Input
                                type="number"
                                value={customAmount}
                                onChange={(e) => setCustomAmount(e.target.value)}
                                placeholder="Enter amount ($)"
                                className="bg-[#364442]/30 border-[#364442] text-[#F5F0EA]"
                                min="1"
                            />
                            <Button
                                onClick={handlePWYC}
                                disabled={!customAmount || parseFloat(customAmount) < 1}
                                className="bg-[#C2AD90] hover:bg-[#97754D] text-[#0C100E]"
                            >
                                Donate
                            </Button>
                        </div>
                        <div className="flex gap-2">
                            {[5, 10, 25, 50].map(amount => (
                                <button
                                    key={amount}
                                    onClick={() => setCustomAmount(amount.toString())}
                                    className="flex-1 py-2 rounded-lg bg-[#364442]/30 text-[#F5F0EA]/70 hover:bg-[#364442]/50 text-sm"
                                >
                                    ${amount}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Gift Subscription */}
            <div className="text-center">
                <Button
                    variant="ghost"
                    className="text-[#C2AD90] hover:bg-[#364442]/20"
                >
                    🎁 Gift a Subscription
                </Button>
            </div>
        </div>
    );
}