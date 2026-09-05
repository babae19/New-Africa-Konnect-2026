import React from 'react';
import { motion } from 'framer-motion';
import { Database, Sparkles, Video, FileSignature, LayoutDashboard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

const steps = [
    {
        id: '01',
        title: "Project Vault",
        description: "Upload your project requirements and files securely. Define your tech stack.",
        icon: Database,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100"
    },
    {
        id: '02',
        title: "AI & Expert Match",
        description: "Our AI instantly matches you with vetted African experts perfect for your stack.",
        icon: Sparkles,
        color: "text-purple-600",
        bg: "bg-purple-50",
        border: "border-purple-100"
    },
    {
        id: '03',
        title: "Interview & Vetting",
        description: "Meet your top candidates via integrated video calls to ensure the right fit.",
        icon: Video,
        color: "text-pink-600",
        bg: "bg-pink-50",
        border: "border-pink-100"
    },
    {
        id: '04',
        title: "Smart Contracts",
        description: "Generate and sign secure contracts digitally for complete peace of mind.",
        icon: FileSignature,
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-100"
    },
    {
        id: '05',
        title: "Collaboration Hub",
        description: "Manage tasks, files, chat, and payments in one centralized workspace.",
        icon: LayoutDashboard,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-100"
    }
];

const HowItWorksPreview = () => {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] opacity-60" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-50 rounded-full blur-[100px] opacity-60" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-20">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4"
                    >
                        Seamless Process
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display"
                    >
                        From Idea to <span className="text-primary">Execution</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
                    >
                        Experience a simplified project journey designed for speed, security, and transparency.
                    </motion.p>
                </div>

                <div className="relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden lg:block absolute top-[28%] left-[10%] right-[10%] h-0.5 bg-gray-200 -z-10" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.15 }}
                                className="relative group"
                            >
                                <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 h-full">
                                    <div className={`w-16 h-16 rounded-2xl ${step.bg} ${step.color} flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                                        <step.icon size={30} />
                                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-xs font-bold text-gray-400 shadow-sm group-hover:border-primary group-hover:text-primary transition-colors">
                                            {step.id}
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors">
                                        {step.title}
                                    </h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 }}
                    className="mt-16 text-center"
                >
                    <Link to="/project-hub">
                        <Button size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow">
                            Start Your Journey
                            <ArrowRight size={20} className="ml-2" />
                        </Button>
                    </Link>
                    <p className="mt-4 text-sm text-gray-500 flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} className="text-green-500" />
                        No credit card required to start
                    </p>
                </motion.div>
            </div>
        </section>
    );
};

export { HowItWorksPreview };
