import React from 'react';
import SEO from '../../components/SEO';
import { Shield, Lock, Eye, Server } from 'lucide-react';
import { Card } from '../../components/ui/Card';

const Security = () => {
    return (
        <div className="bg-white min-h-screen pt-20 pb-20">
            <SEO title="Security" description="Learn about how Africa Konnect keeps your data and payments secure." />

            <div className="bg-primary/5 py-16 mb-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 font-display">Enterprise-Grade Security</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Your trust is our foundation. We employ state-of-the-art security measures to protect your data, intellectual property, and transactions.
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4">
                <div className="grid md:grid-cols-3 gap-8 mb-20">
                    <Card className="p-8">
                        <Lock className="text-primary mb-4" size={32} />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Data Encryption</h3>
                        <p className="text-gray-600">
                            All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption standards.
                        </p>
                    </Card>
                    <Card className="p-8">
                        <Eye className="text-primary mb-4" size={32} />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Access Control</h3>
                        <p className="text-gray-600">
                            Strict role-based access controls and multi-factor authentication (MFA) ensure only authorized access.
                        </p>
                    </Card>
                    <Card className="p-8">
                        <Server className="text-primary mb-4" size={32} />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Infrastructure</h3>
                        <p className="text-gray-600">
                            Hosted on world-class cloud providers with 24/7 monitoring, DDoS protection, and regular backups.
                        </p>
                    </Card>
                </div>

                <div className="max-w-3xl mx-auto space-y-12 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Security</h2>
                        <p>
                            We partner with industry-leading payment processors like Stripe and PayPal to handle all financial transactions. Africa Konnect does not store your full credit card information on our servers. All payment data is tokenized and processed securely in compliance with PCI-DSS Level 1 standards.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Vulnerability Disclosure</h2>
                        <p>
                            We value the contributions of the security research community. If you believe you have found a security vulnerability in Africa Konnect, please report it to us immediately at security@africakonnect.com. We investigate all reports and prioritize fixing confirmed issues.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Compliance</h2>
                        <p>
                            We are committed to complying with global data protection regulations, including GDPR and CCPA. We regularly audit our systems and processes to ensure we meet or exceed industry standards for data privacy and security.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Security;
