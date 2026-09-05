import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import SEO from '../components/SEO';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await api.auth.forgotPassword(email);
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Failed to send reset email');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <>
                <SEO
                    title="Check Your Email - Africa Konnect"
                    description="Password reset link sent"
                />
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4 py-12">
                    <div className="max-w-md w-full">
                        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Check Your Email
                            </h2>
                            <p className="text-gray-600 mb-6">
                                If an account exists with <strong>{email}</strong>, we've sent a password reset link.
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                The link will expire in 1 hour. If you don't see the email, check your spam folder.
                            </p>
                            <Link to="/signin">
                                <Button className="w-full">
                                    <ArrowLeft size={20} className="mr-2" />
                                    Back to Sign In
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO
                title="Forgot Password - Africa Konnect"
                description="Reset your Africa Konnect password"
            />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4 py-12">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Forgot Password?
                            </h2>
                            <p className="text-gray-600">
                                No worries! Enter your email and we'll send you reset instructions.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="you@example.com"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={20} />
                                        Sending...
                                    </>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </Button>

                            <div className="text-center">
                                <Link
                                    to="/signin"
                                    className="text-sm font-medium text-primary hover:text-primary/80 inline-flex items-center"
                                >
                                    <ArrowLeft size={16} className="mr-1" />
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
