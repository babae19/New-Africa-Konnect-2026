import React from 'react';
import SEO from '../components/SEO';
import { Hero } from '../features/home/Hero';
import { TrustSection } from '../features/home/TrustSection';
import { HowItWorksPreview } from '../features/home/HowItWorksPreview';
import { FeaturedExperts } from '../features/home/FeaturedExperts';
import { FAQSection } from '../features/home/FAQSection';

const Home = () => {
    return (
        <div className="min-h-screen">
            <SEO
                title="Home"
                description="Africa Konnect connects top African tech talent with global companies. Build your dream team today."
            />
            <Hero />
            <HowItWorksPreview />
            <TrustSection />
            <FeaturedExperts />
            <FAQSection />
        </div>
    );
};

export default Home;
