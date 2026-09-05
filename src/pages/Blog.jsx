import React from 'react';
import SEO from '../components/SEO';
import { Card } from '../components/ui/Card';

const Blog = () => {
    return (
        <div className="bg-white min-h-screen pt-20">
            <SEO title="Blog" description="Insights, news, and stories from the African tech ecosystem." />

            <section className="bg-primary/5 py-20 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display">
                    Africa Konnect <span className="text-primary">Insights</span>
                </h1>
                <p className="text-xl text-gray-600">Stories from the frontier of African innovation.</p>
            </section>

            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((item) => (
                        <Card key={item} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <div className="h-48 bg-gray-200 animate-pulse" />
                            <div className="p-6">
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
                                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse" />
                                <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse" />
                                <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                            </div>
                        </Card>
                    ))}
                </div>
                <div className="text-center mt-12">
                    <p className="text-gray-500 italic">Fresh content coming soon!</p>
                </div>
            </div>
        </div>
    );
};

export default Blog;
