
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const faqs = [
    {
        question: "How does Africa Konnect vet its experts?",
        answer: "Every expert on our platform goes through a rigorous multi-stage vetting process. This includes technical assessments, soft skills verification, and detailed background checks. Only the top 3% of applicants make it into our network."
    },
    {
        question: "What is the typical time to hire?",
        answer: "Most clients are able to match with an expert within 24-48 hours. Once matched, you can start your project immediately using our streamlined collaboration tools."
    },
    {
        question: "Are there long-term contracts?",
        answer: "No, we offer flexible engagement models. You can hire experts for short-term tasks or build long-term teams. There are no lock-in contracts; you pay as you go."
    },
    {
        question: "How are payments handled?",
        answer: "We use a secure escrow system. You fund the project milestones upfront, but funds are only released to the expert when you are satisfied with the deliverables."
    },
    {
        question: "What happens if I'm not satisfied with an expert?",
        answer: "We offer a satisfaction guarantee. If an engagement isn't working out in the first two weeks, we'll replace the expert at no additional cost or maximize a refund for the unused time."
    }
];

const FAQItem = ({ faq, index }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="border-b border-gray-200"
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center py-6 text-left focus:outline-none"
            >
                <span className="text-lg font-medium text-gray-900">{faq.question}</span>
                <span className={`p-2 rounded-full ${isOpen ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </span>
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <p className="text-gray-600 pb-6 leading-relaxed">
                            {faq.answer}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export const FAQSection = () => {
    return (
        <section className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-12 lg:gap-24">
                    <div className="md:w-1/3">
                        <span className="text-primary font-bold tracking-wider uppercase text-sm">Common Questions</span>
                        <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                        <p className="text-gray-600 text-lg">
                            Everything you need to know about working with Africa Konnect. Can't find the answer you're looking for?
                            <a href="/contact" className="text-primary font-medium hover:underline ml-1">Contact our support team.</a>
                        </p>
                    </div>
                    <div className="md:w-2/3">
                        <div className="w-full">
                            {faqs.map((faq, index) => (
                                <FAQItem key={index} faq={faq} index={index} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
