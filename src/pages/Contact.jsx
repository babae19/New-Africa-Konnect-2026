import React, { useState } from 'react';
import SEO from '../components/SEO';
import { Button } from '../components/ui/Button';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Card } from '../components/ui/Card';

const Contact = () => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
        // Simulate form submission
    };

    return (
        <div className="bg-white min-h-screen pt-20">
            <SEO title="Contact Us" description="Get in touch with the Africa Konnect team for support, partnerships, or general inquiries." />

            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="grid lg:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display">
                            Let's Start a <br />
                            <span className="text-primary">Conversation</span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-12">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">Email Us</h3>
                                    <p className="text-gray-600">hello@africakonnect.com</p>
                                    <p className="text-gray-600">support@africakonnect.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                    <Phone size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">Call Us</h3>
                                    <p className="text-gray-600">+1 (404) 713-2428 (USA)</p>
                                    <p className="text-gray-600">+232 88 580 063 (Sierra Leone)</p>
                                    <p className="text-gray-500 text-sm">Mon-Fri from 8am to 5pm</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                                    <MapPin size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">Visit Us</h3>
                                    <p className="text-gray-600">
                                        3310 Waterford Way<br />
                                        Conyers, GA 30012<br />
                                        USA
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <Card className="p-8 border-gray-100 shadow-xl">
                        {submitted ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                                    <Send size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                                <p className="text-gray-600">Thank you for contacting us. We'll get back to you within 24 hours.</p>
                                <Button className="mt-6" variant="outline" onClick={() => setSubmitted(false)}>Send Another</Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">First Name</label>
                                        <input required type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="John" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">Last Name</label>
                                        <input required type="text" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="Doe" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Email Address</label>
                                    <input required type="email" className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="john@company.com" />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Subject</label>
                                    <select className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
                                        <option>General Inquiry</option>
                                        <option>Hiring Support</option>
                                        <option>Partnership</option>
                                        <option>Press</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Message</label>
                                    <textarea required rows={4} className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" placeholder="How can we help you?" />
                                </div>

                                <Button type="submit" size="lg" className="w-full">
                                    Send Message
                                </Button>
                            </form>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Contact;
