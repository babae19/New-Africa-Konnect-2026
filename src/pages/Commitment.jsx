import React from 'react';
import { motion } from 'framer-motion';

export default function Commitment() {
    return (
        <div className="min-h-screen bg-gray-50 pt-20 pb-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12"
                >
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">Our Commitment</h1>
                        <div className="w-20 h-1 bg-highlight mx-auto rounded-full"></div>
                    </div>

                    <div className="prose prose-lg text-gray-700 mx-auto">
                        <p className="mb-6 leading-relaxed">
                            We are driven by a singular passion: to discover, develop, and create opportunities for talented African IT technicians and technologists. We believe in challenging the status quo by identifying and nurturing exceptional talent across Africa, where a vast and underutilized pool of technical expertise exists.
                        </p>

                        <p className="leading-relaxed">
                            To advance this mission, we pledge a portion of our income to support primary, secondary, and tertiary students through scholarships and work-study opportunities. In addition, we provide essential learning resources including textbooks, computers, and scientific supplies to schools across the continent.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
