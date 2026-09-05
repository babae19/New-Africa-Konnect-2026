import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import { Mail, Lock, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';

export default function SignIn() {
    const navigate = useNavigate();
    const location = useLocation();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { user, error: signInError } = await signIn(email, password, rememberMe);

            if (signInError) {
                throw signInError;
            }

            if (user) {
                // Check for returnUrl in query params (for OAuth flow)
                const params = new URLSearchParams(location.search);
                const returnUrl = params.get('returnUrl');

                if (returnUrl) {
                    // Decode and navigate to the return URL
                    navigate(decodeURIComponent(returnUrl));
                } else {
                    // Redirect based on onboarding status
                    if (!user.onboarding_completed && !user.user_metadata?.onboarding_completed) {
                        navigate('/onboarding');
                    } else {
                        const role = user.role || user.user_metadata?.role;
                        if (role === 'expert') {
                            navigate('/expert-dashboard');
                        } else {
                            navigate('/project-hub');
                        }
                    }
                }
            }
        } catch (error) {
            alert(typeof error === 'string' ? error : error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to your account to continue"
        >
            <SEO title="Sign In" description="Sign in to your Africa Konnect account." />

            {location.state?.message && (
                <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${location.state.type === 'error' ? 'bg-red-50 text-red-900 border border-red-200' : 'bg-green-50 text-green-900 border border-green-200'
                    }`}>
                    {location.state.type === 'error' ? (
                        <div className="shrink-0 text-red-500">⚠️</div>
                    ) : (
                        <div className="shrink-0 text-green-500">✓</div>
                    )}
                    <p className="text-sm font-medium">{location.state.message}</p>
                </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            className="absolute right-3 top-3 text-gray-400 hover:text-primary transition-colors"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                            Remember me
                        </label>
                    </div>

                    <div className="text-sm">
                        <Link to="/forgot-password" className="font-medium text-primary hover:text-primary/80">
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                    {loading ? (
                        <Loader2 className="animate-spin mr-2" size={20} />
                    ) : (
                        <>
                            Sign in
                            <ArrowRight className="ml-2" size={20} />
                        </>
                    )}
                </Button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-primary hover:text-primary/80">
                    Sign up
                </Link>
            </div>
        </AuthLayout>
    );
}
