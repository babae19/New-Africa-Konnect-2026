import React from 'react';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { UserPlus, Database, Sparkles, Video, FileSignature, Users, DollarSign, CheckCircle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const steps = [
    {
        icon: UserPlus,
        title: "1. Register & Profile",
        description: "Create your account in seconds. Tell us about your company and what you're building."
    },
    {
        icon: Database,
        title: "2. Company Vault",
        description: "Securely upload your brand assets, technical requirements, and project documentation. Our AI analyzes this to understand your DNA."
    },
    {
        icon: Sparkles,
        title: "3. AI Match Engine",
        description: "Our proprietary algorithm scans thousands of vetted experts to find the perfect technical and cultural match for your team."
    },
    {
        icon: Video,
        title: "4. Integrated Interview",
        description: "Meet your top matches via our built-in video platform. Schedule with timezone smarts and collaborate on a whiteboard."
    },
    {
        icon: FileSignature,
        title: "5. Smart Contract",
        description: "Sign a standardized, fair contract instantly. Terms are clear, and IP protection is guaranteed."
    },
    {
        icon: DollarSign,
        title: "6. Escrow & Collaborate",
        description: "Fund the project securely. Money is held in escrow and only released when you approve the milestones."
    }
];

const HowItWorks = () => {
    return (
        <div className="py-20 bg-gray-50 min-h-screen">
            <SEO
                title="How It Works"
                description="Learn how Africa Konnect streamlines the hiring process for African tech talent. From matching to contracts and payments."
            />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-6">How Africa Konnect Works</h1>
                    <p className="text-xl text-gray-600">
                        A seamless, secure, and smart way to build your dream team.
                    </p>
                </div>

                <div className="space-y-8 relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 -translate-x-1/2 hidden md:block" />

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex flex-col md:flex-row gap-8 items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''
                                }`}
                        >
                            <div className="flex-1 w-full">
                                <Card className="p-8 h-full hover:border-primary/30 transition-colors">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <step.icon size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed">
                                        {step.description}
                                    </p>
                                </Card>
                            </div>

                            <div className="relative z-10 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-white border-4 border-primary shadow-lg">
                                <span className="font-bold text-primary text-sm">{index + 1}</span>
                            </div>

                            <div className="flex-1 w-full hidden md:block" />
                        </motion.div>
                    ))}
                </div>

                <div className="mt-20 text-center">
                    <Link to="/project-hub">
                        <Button size="lg" className="px-12">Start Your Journey</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HowItWorks;
