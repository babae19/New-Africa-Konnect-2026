import React from 'react';
import SEO from '../components/SEO';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

const Careers = () => {
    return (
        <div className="bg-white min-h-screen pt-20">
            <SEO title="Careers" description="Join the Africa Konnect team and help us shape the future of remote work in Africa." />

            <div className="max-w-4xl mx-auto px-4 py-20 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Join Our Mission</h1>
                <p className="text-xl text-gray-600 mb-12">
                    We are always looking for passionate individuals to help us build the bridge between African talent and the world.
                </p>

                <div className="bg-gray-50 rounded-2xl p-12 border border-gray-100">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">No Open Positions Currently</h2>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                        While we don't have any active job listings right now, we're growing fast. Check back soon or follow us on social media for updates.
                    </p>
                    <Link to="/contact">
                        <Button variant="outline">Contact Us</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Careers;
