import React from 'react';
import SEO from '../components/SEO';
import { Check, Shield } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const tiers = [
    {
        name: "Starter",
        price: "Free",
        description: "Perfect for small projects and browsing talent.",
        features: [
            "Access to Expert Directory",
            "Post 1 Project",
            "Basic AI Matching",
            "Standard Support",
            "5% Platform Fee"
        ],
        cta: "Get Started",
        popular: false
    },
    {
        name: "Growth",
        price: "$49",
        period: "/month",
        description: "For scaling teams needing dedicated support.",
        features: [
            "Unlimited Project Posts",
            "Priority AI Matching",
            "Verified Badge Experts",
            "Dedicated Account Manager",
            "3% Platform Fee"
        ],
        cta: "Start Free Trial",
        popular: true
    },
    {
        name: "Enterprise",
        price: "Custom",
        description: "Full-service solution for large organizations.",
        features: [
            "White-glove Matching",
            "Custom Contracts",
            "SLA Guarantees",
            "Team Onboarding",
            "1% Platform Fee"
        ],
        cta: "Contact Sales",
        popular: false
    }
];

const Pricing = () => {
    return (
        <div className="py-20 bg-gray-50 min-h-screen">
            <SEO
                title="Pricing"
                description="Flexible pricing plans for businesses of all sizes. No hidden fees, secure escrow included."
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Transparent Pricing</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        No hidden fees. Pay for what you use. Secure escrow included in all plans.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                    {tiers.map((tier, index) => (
                        <Card
                            key={index}
                            className={`p-8 relative ${tier.popular ? 'border-primary ring-2 ring-primary ring-opacity-50' : ''}`}
                            hoverEffect
                        >
                            {tier.popular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white px-4 py-1 rounded-full text-sm font-medium">
                                    Most Popular
                                </div>
                            )}
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{tier.name}</h3>
                                <div className="flex items-baseline justify-center gap-1">
                                    <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                                    {tier.period && <span className="text-gray-500">{tier.period}</span>}
                                </div>
                                <p className="text-gray-500 mt-4 text-sm">{tier.description}</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {tier.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                                        <Check size={16} className="text-success mt-0.5 shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className="w-full"
                                variant={tier.popular ? 'primary' : 'secondary'}
                            >
                                {tier.cta}
                            </Button>
                        </Card>
                    ))}
                </div>

                {/* Escrow Explanation */}
                <div className="bg-white rounded-2xl p-8 md:p-12 border border-gray-100 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center gap-8">
                        <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center text-success shrink-0">
                            <Shield size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Secure Escrow Protection</h3>
                            <p className="text-gray-600 leading-relaxed">
                                All payments on Africa Konnect are held in a secure escrow account.
                                Funds are only released to the expert when you are 100% satisfied with the work delivered.
                                This ensures safety and trust for both parties.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
