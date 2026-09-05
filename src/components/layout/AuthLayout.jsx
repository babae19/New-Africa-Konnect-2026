import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Import slider images
import slide1 from '../../assets/auth-slider/slide1.jpg';
import slide2 from '../../assets/auth-slider/slide2.jpg';
import slide3 from '../../assets/auth-slider/slide3.jpg';
import slide4 from '../../assets/auth-slider/slide4.jpg';

const sliderImages = [
    { src: slide1, caption: "Collaborate with top African talent" },
    { src: slide2, caption: "Focused expertise, global reach" },
    { src: slide3, caption: "Build the future together" },
    { src: slide4, caption: "Innovation meets opportunity" }
];

export const AuthLayout = ({ children, title, subtitle }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-rotate slides every 5 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen flex w-full bg-white">
            {/* Left Side - Image Slider (Hidden on mobile) */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
            >
                {/* Animated Background Slider */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="absolute inset-0 z-0"
                        style={{
                            backgroundImage: `url(${sliderImages[currentSlide].src})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    />
                </AnimatePresence>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                <div className="relative z-20 flex flex-col justify-between p-12 w-full h-full text-white">
                    <div>
                        <Link to="/" className="text-2xl font-bold tracking-tighter text-white drop-shadow-lg">
                            AFRICA KONNECT
                        </Link>
                    </div>

                    {/* Caption and Slide Indicators */}
                    <div className="space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.p
                                key={currentSlide}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5 }}
                                className="text-2xl font-semibold drop-shadow-lg max-w-md"
                            >
                                {sliderImages[currentSlide].caption}
                            </motion.p>
                        </AnimatePresence>

                        {/* Slide Indicators */}
                        <div className="flex gap-2">
                            {sliderImages.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                                            ? 'w-8 bg-white'
                                            : 'w-2 bg-white/50 hover:bg-white/70'
                                        }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                />
                            ))}
                        </div>

                        <div className="flex gap-6 text-sm text-white/80 font-medium drop-shadow-md pt-4">
                            <span>© 2026 Africa Konnect</span>
                            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
                            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Right Side - Form */}
            <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h2>
                            {subtitle && (
                                <p className="mt-2 text-sm text-gray-600">
                                    {subtitle}
                                </p>
                            )}
                        </div>

                        {children}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};
