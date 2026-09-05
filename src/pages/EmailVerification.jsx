import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

const EmailVerification = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // verifying, success, error
    const [message, setMessage] = useState('');
    const [resending, setResending] = useState(false);

    useEffect(() => {
        const verifyEmail = async (token) => {
            try {
                const data = await api.auth.verifyEmail(token);
                setStatus('success');
                setMessage(data.message || 'Email verified successfully!');

                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    const user = JSON.parse(localStorage.getItem('userInfo') || '{}');
                    if (user.role === 'expert') {
                        navigate('/expert-dashboard');
                    } else {
                        navigate('/project-hub');
                    }
                }, 3000);
            } catch (error) {
                setStatus('error');
                setMessage(error.message || 'Verification failed. The link may have expired.');
            }
        };

        const token = searchParams.get('token');
        if (token) {
            verifyEmail(token);
        } else {
            setStatus('error');
            setMessage('No verification token provided');
        }
    }, [searchParams, navigate]);

    const handleResend = async () => {
        setResending(true);
        try {
            await api.auth.resendVerification();
            setMessage('Verification email sent! Please check your inbox.');
            setStatus('success');
        } catch (error) {
            setMessage(error.message || 'Failed to resend verification email');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <Card className="max-w-md w-full p-8 text-center">
                {status === 'verifying' && (
                    <>
                        <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Verifying your email...
                        </h2>
                        <p className="text-gray-600">
                            Please wait while we verify your email address.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Email Verified!
                        </h2>
                        <p className="text-gray-600 mb-4">
                            {message}
                        </p>
                        <p className="text-sm text-gray-500">
                            Redirecting to your dashboard...
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Verification Failed
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {message}
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={handleResend}
                                disabled={resending}
                                className="w-full"
                            >
                                {resending ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2" size={20} />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2" size={20} />
                                        Resend Verification Email
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/signin')}
                                className="w-full"
                            >
                                Back to Sign In
                            </Button>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default EmailVerification;
