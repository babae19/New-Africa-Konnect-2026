import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';

const PrivateRoute = ({ children, roles = [], requireEmailVerification = false, requireProfileComplete = false }) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [emailVerified, setEmailVerified] = useState(true);
    const [profileComplete, setProfileComplete] = useState(true);

    useEffect(() => {
        const checkRequirements = async () => {
            if (!user) {
                setChecking(false);
                return;
            }

            try {
                // Check email verification if required
                if (requireEmailVerification) {
                    const profileData = await api.auth.getProfile();
                    setEmailVerified(profileData.emailVerified);
                }

                // Check profile completeness if required (for experts)
                if (requireProfileComplete && user.role === 'expert') {
                    const completenessData = await api.experts.getCompleteness(user.id);
                    setProfileComplete(completenessData.completeness >= 90);
                }
            } catch (error) {
                console.error('Error checking requirements:', error);
            } finally {
                setChecking(false);
            }
        };

        checkRequirements();
    }, [user, requireEmailVerification, requireProfileComplete]);

    if (loading || checking) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect to signin, save current location
        return <Navigate to="/signin" state={{ from: location }} replace />;
    }

    // Check role authorization
    if (roles.length > 0 && !roles.includes(user.role)) {
        const redirectPath = user.role === 'expert' ? '/expert-dashboard' : '/project-hub';
        return <Navigate to={redirectPath} replace />;
    }

    // Check email verification
    if (requireEmailVerification && !emailVerified) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification Required</h2>
                    <p className="text-gray-600 mb-6">
                        Please verify your email address to access this feature. Check your inbox for the verification link.
                    </p>
                    <button
                        onClick={async () => {
                            try {
                                await api.auth.resendVerification();
                                alert('Verification email sent! Please check your inbox.');
                            } catch (error) {
                                alert('Failed to resend verification email');
                            }
                        }}
                        className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Resend Verification Email
                    </button>
                </div>
            </div>
        );
    }

    // Check profile completeness
    if (requireProfileComplete && !profileComplete) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Profile</h2>
                    <p className="text-gray-600 mb-6">
                        Your profile must be at least 90% complete to access this feature. Please complete your profile to continue.
                    </p>
                    <button
                        onClick={() => window.location.href = '/expert-dashboard'}
                        className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                        Complete Profile
                    </button>
                </div>
            </div>
        );
    }

    return children;
};

export default PrivateRoute;
