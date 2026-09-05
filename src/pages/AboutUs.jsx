import React, { useEffect } from 'react';
import SEO from '../components/SEO';
import { motion, useSpring, useTransform } from 'framer-motion';
import { Users, Globe, Award, TrendingUp } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';

const AnimatedCounter = ({ value, label, icon: Icon, baseValue = 0 }) => {
    // Parse numeric part
    let numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0;

    // Handle 'k' multiplier
    if (value.toLowerCase().includes('k')) {
        numericValue *= 1000;
    }

    const finalValue = numericValue + baseValue;

    // Animation
    const spring = useSpring(0, { duration: 3000, bounce: 0 });
    const displayValue = useTransform(spring, (current) => {
        if (value.includes('%')) return Math.floor(current) + '%';
        if (value.toLowerCase().includes('k')) {
            // If > 1000, show as k
            return (current / 1000).toFixed(1) + 'k+';
        }
        return Math.floor(current).toLocaleString() + '+';
    });

    useEffect(() => {
        spring.set(finalValue);
    }, [finalValue, spring]);

    return (
        <div className="p-6 bg-gray-800/50 rounded-2xl backdrop-blur-sm border border-gray-700 hover:border-primary/50 transition-colors group">
            <div className="flex justify-center mb-4 text-primary group-hover:scale-110 transition-transform duration-300">
                <Icon size={32} />
            </div>
            <motion.div className="text-4xl font-bold mb-2 text-white font-display">
                {displayValue}
            </motion.div>
            <div className="text-gray-400 font-medium">{label}</div>
        </div>
    );
};

const AboutUs = () => {
    const { projects } = useProject();

    // Calculate real-time stats directly
    const realProjectsCount = projects ? projects.length : 0;
    const realUsersCount = 0;

    const stats = [
        { icon: Users, label: "Vetted Experts", value: "2,500+", baseAdd: realUsersCount },
        { icon: Globe, label: "Countries Served", value: "30+", baseAdd: 0 },
        { icon: Award, label: "Projects Completed", value: "10k+", baseAdd: realProjectsCount },
        { icon: TrendingUp, label: "Client Satisfaction", value: "98%", baseAdd: 0 }
    ];

    return (
        <div className="bg-white min-h-screen pt-20">
            <SEO title="About Us" description="Learn about Africa Konnect's mission to bridge the gap between African talent and global opportunities." />

            {/* Hero Section */}
            <section className="bg-primary/5 py-20 text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6"
                    >
                        Our Story
                    </motion.span>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display"
                    >
                        Bridging the Gap Between <br />
                        <span className="text-primary">African Talent</span> & Global Innovation
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto"
                    >
                        We are on a mission to showcase the incredible technical expertise of Africa's top developers to the world, creating a unified ecosystem of innovation.
                    </motion.p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                        >
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white transform rotate-2 hover:rotate-0 transition-transform duration-500">
                                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10" />
                                <img
                                    src="/about-us-hero.jpg"
                                    alt="Africa Konnect Team collaborating on a project"
                                    className="w-full h-[600px] object-cover"
                                />
                            </div>
                        </motion.div>

                        <motion.div
                            className="space-y-12"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        >
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-12 h-1 bg-primary rounded-full" />
                                    Our Mission
                                </h2>
                                <p className="text-gray-600 leading-relaxed text-lg border-l-4 border-gray-100 pl-6">
                                    To empower African technology professionals by connecting them with global enterprises, fostering economic growth, and driving innovation through cross-border collaboration. We believe talent is distributed equally, but opportunity is not. We're here to fix that.
                                </p>
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                    <span className="w-12 h-1 bg-highlight rounded-full" />
                                    Our Vision
                                </h2>
                                <p className="text-gray-600 leading-relaxed text-lg border-l-4 border-gray-100 pl-6">
                                    A world where talent knows no borders, and African developers are recognized as leading contributors to the global digital economy. We envision a future where "Made in Africa" is synonymous with "World Class Tech".
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Real-time Stats */}
            <section className="bg-gray-900 py-24 text-white relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4 font-display">Our Impact by the Numbers</h2>
                        <p className="text-gray-400">Real-time metrics tracking our growing ecosystem</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {stats.map((stat, idx) => (
                            <AnimatedCounter
                                key={idx}
                                icon={stat.icon}
                                label={stat.label}
                                value={stat.value}
                                baseValue={stat.baseAdd}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutUs;
