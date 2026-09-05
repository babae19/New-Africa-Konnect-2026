import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import SEO from '../components/SEO';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link. Please request a new password reset.');
        }
    }, [token]);

    useEffect(() => {
        // Check password strength
        if (password.length === 0) {
            setPasswordStrength('');
        } else if (password.length < 8) {
            setPasswordStrength('weak');
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
            setPasswordStrength('medium');
        } else {
            setPasswordStrength('strong');
        }
    }, [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(password)) {
            setError('Password must contain uppercase, lowercase, number, and special character');
            return;
        }

        setLoading(true);

        try {
            await api.auth.resetPassword(token, password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/signin');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <>
                <SEO
                    title="Password Reset Successful - Africa Konnect"
                    description="Your password has been reset"
                />
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4 py-12">
                    <div className="max-w-md w-full">
                        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                Password Reset Successful!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Your password has been reset successfully. Redirecting to sign in...
                            </p>
                            <Loader2 className="animate-spin mx-auto text-primary" size={24} />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SEO
                title="Reset Password - Africa Konnect"
                description="Create a new password for your Africa Konnect account"
            />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4 py-12">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                Reset Password
                            </h2>
                            <p className="text-gray-600">
                                Enter your new password below
                            </p>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start">
                                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="••••••••"
                                />
                                {passwordStrength && (
                                    <div className="mt-2">
                                        <div className="flex gap-1">
                                            <div className={`h-1 flex-1 rounded ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                                            <div className={`h-1 flex-1 rounded ${passwordStrength === 'medium' || passwordStrength === 'strong' ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                                            <div className={`h-1 flex-1 rounded ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                                        </div>
                                        <p className={`text-xs mt-1 ${passwordStrength === 'weak' ? 'text-red-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                                            {passwordStrength === 'weak' && 'Weak password'}
                                            {passwordStrength === 'medium' && 'Medium strength'}
                                            {passwordStrength === 'strong' && 'Strong password'}
                                        </p>
                                    </div>
                                )}
                                <p className="mt-2 text-xs text-gray-500">
                                    Must be 8+ characters with uppercase, lowercase, number, and special character
                                </p>
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="••••••••"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading || !token}>
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={20} />
                                        Resetting...
                                    </>
                                ) : (
                                    'Reset Password'
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
