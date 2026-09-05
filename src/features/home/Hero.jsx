import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Globe, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

// Import hero slider images
import heroSlide1 from '../../assets/hero-slide1.jpg';
import heroSlide2 from '../../assets/hero-slide2.jpg';

const heroSlides = [
    {
        image: heroSlide1,
        alt: "Young African tech professional working on innovative projects"
    },
    {
        image: heroSlide2,
        alt: "African team collaborating in a modern workspace"
    }
];

const Hero = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-rotate slides every 6 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);

    return (
        <section className="relative pt-20 pb-32 overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-highlight/5 rounded-full blur-3xl" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-medium mb-8">
                            <Globe size={16} />
                            <span>Africa's Talent. Globally Connected.</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight mb-6 leading-tight">
                            Connecting Global Opportunity with <br />
                            <span className="text-primary">African Excellence</span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                            Connect with vetted African tech & cybersecurity experts. Build faster. Hire smarter. Pay securely.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center lg:justify-start justify-center gap-4">
                            <Link to="/project-hub">
                                <Button
                                    size="lg"
                                    className="group shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-300 px-8 py-4 text-lg rounded-full border-0"
                                >
                                    Start your project
                                    <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                                </Button>
                            </Link>
                            <Link to="/experts">
                                <Button variant="secondary" size="lg">
                                    Explore Experts
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Hero Image Slider */}
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/3]">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentSlide}
                                    src={heroSlides[currentSlide].image}
                                    alt={heroSlides[currentSlide].alt}
                                    className="w-full h-full object-cover absolute inset-0"
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.7, ease: "easeInOut" }}
                                />
                            </AnimatePresence>

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

                            {/* Navigation Arrows */}
                            <button
                                onClick={prevSlide}
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white transition-all shadow-lg hover:scale-110"
                                aria-label="Previous slide"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white transition-all shadow-lg hover:scale-110"
                                aria-label="Next slide"
                            >
                                <ChevronRight size={24} />
                            </button>

                            {/* Slide Indicators */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {heroSlides.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentSlide(index)}
                                        className={`h-2 rounded-full transition-all duration-300 ${index === currentSlide
                                            ? 'w-8 bg-white'
                                            : 'w-2 bg-white/50 hover:bg-white/70'
                                            }`}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Decorative blob behind image */}
                        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-primary/10 blur-3xl rounded-full" />
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export { Hero };
