import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Clock, BrainCircuit, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';

const features = [
    {
        icon: Users,
        title: "Vetted African Experts",
        description: "Access the top 1% of tech talent, thoroughly vetted for technical excellence and soft skills.",
        image: "/images/why-choose-1.jpg",
        delay: 0
    },
    {
        icon: BrainCircuit,
        title: "AI-Powered Matching",
        description: "Our intelligent algorithm instantly connects you with experts who match your exact stack.",
        image: "/images/why-choose-2.jpg",
        delay: 0.1
    },
    {
        icon: Clock,
        title: "Timezone Aligned",
        description: "Seamless collaboration with overlapping working hours for real-time synchronization.",
        image: "/images/why-choose-3.jpg",
        delay: 0.2
    },
    {
        icon: ShieldCheck,
        title: "Secure & Transparent",
        description: "Milestone-based escrow payments ensure you only pay for completed, quality work.",
        image: "/images/why-choose-4.jpg",
        delay: 0.3
    }
];

const TrustSection = () => {
    return (
        <section className="py-24 bg-gray-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
                    <div className="max-w-2xl">
                        <motion.span
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="text-primary font-semibold tracking-wide uppercase text-sm"
                        >
                            Why Choose Us
                        </motion.span>
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-3xl md:text-4xl font-bold text-gray-900 mt-2"
                        >
                            The Africa Konnect Advantage
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-600 mt-4 text-lg leading-relaxed"
                        >
                            We bridge the gap between global demand and African excellence with a platform built for trust and speed.
                        </motion.p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: feature.delay }}
                            className="group h-full"
                        >
                            <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 h-full flex flex-col border border-gray-100 group-hover:border-primary/20">
                                {/* Image Container */}
                                <div className="relative h-48 overflow-hidden">
                                    <div className="absolute inset-0 bg-gray-900/10 group-hover:bg-gray-900/0 transition-colors z-10" />
                                    <img
                                        src={feature.image}
                                        alt={feature.title}
                                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur p-2 rounded-xl shadow-lg">
                                        <feature.icon size={20} className="text-primary" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                                        {feature.description}
                                    </p>

                                    <div className="flex items-center text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                        <span className="mr-2">Learn more</span>
                                        <Check size={16} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export { TrustSection };
