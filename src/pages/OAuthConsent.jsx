import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import SEO from '../components/SEO';
import { Shield, Check, AlertCircle } from 'lucide-react';

export default function OAuthConsent() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Extract OAuth parameters
    const clientId = searchParams.get('client_id');
    const redirectUri = searchParams.get('redirect_uri');
    const scopeParam = searchParams.get('scope');
    const state = searchParams.get('state');

    const [clientName, setClientName] = useState("External Application");
    const [scopes, setScopes] = useState([]);

    // Enforce authentication
    useEffect(() => {
        if (!authLoading && !user) {
            // Redirect to login preserving the current URL as return destination
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            navigate(`/signin?returnUrl=${returnUrl}`);
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        // Basic validation
        if (!redirectUri) {
            setError("Missing 'redirect_uri' parameter. Cannot proceed.");
            return;
        }
        if (!clientId) {
            setError("Missing 'client_id' parameter.");
            return;
        }

        // Simulate client lookup (In real app, fetch client details from backend)
        // For demo, we just prettify the client ID or use a default
        if (clientId === 'demo_client') {
            setClientName("Demo Client App");
        } else {
            setClientName(clientId || "External Application");
        }

        // Parse scopes
        if (scopeParam) {
            const scopeList = scopeParam.split(' ').map(s => {
                // Map known scopes to human readable descriptions
                switch (s) {
                    case 'profile': return 'Read your basic profile information';
                    case 'email': return 'View your email address';
                    case 'projects.read': return 'View your project history';
                    case 'projects.write': return 'Create and edit projects on your behalf';
                    case 'offline_access': return 'Access your account when you are not logged in';
                    default: return `Access scope: ${s}`;
                }
            });
            setScopes(scopeList);
        } else {
            setScopes(["Read your public profile"]);
        }

    }, [clientId, redirectUri, scopeParam]);

    const handleDecision = async (approved) => {
        setLoading(true);
        try {
            const response = await api.auth.oauthDecision({
                client_id: clientId,
                redirect_uri: redirectUri,
                scope: scopeParam,
                state: state,
                approved: approved
            });

            // Redirect based on backend response
            if (response.redirect_to) {
                window.location.href = response.redirect_to;
            } else {
                setError("Invalid server response provided no redirect URL.");
            }
        } catch (err) {
            setError(err.message || "Failed to process authorization.");
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="p-10 text-center">Loading session...</div>;

    // Determine title based on error state
    const pageTitle = error ? "Authorization Error" : "Authorization Request";
    const pageSubtitle = error ? "There was a problem with the authorization request." : `${clientName} is requesting access to your account.`;

    if (error) {
        return (
            <AuthLayout title={pageTitle} subtitle={pageSubtitle}>
                <SEO title="Authorization Error" />
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-red-700">{error}</p>
                </div>
                <div className="mt-6">
                    <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                        Return Home
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title={pageTitle}
            subtitle={pageSubtitle}
        >
            <SEO title="OAuth Consent" description="Authorize application access." />

            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                    <Shield className="text-blue-600 shrink-0 mt-0.5" size={20} />
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900">Secure Access</h3>
                        <p className="text-xs text-blue-700 mt-1">
                            This application will only have access to the information listed below.
                        </p>
                    </div>
                </div>

                <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Permissions requested:</h4>
                    <ul className="space-y-3">
                        {scopes.map((scope, index) => (
                            <li key={index} className="flex items-start gap-3 text-sm text-gray-600">
                                <Check className="text-green-500 shrink-0 mt-0.5" size={16} />
                                <span>{scope}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="pt-4 space-y-3">
                    <Button
                        onClick={() => handleDecision(true)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={loading}
                    >
                        {loading ? 'Authorizing...' : 'Allow Access'}
                    </Button>
                    <button
                        onClick={() => handleDecision(false)}
                        className="w-full py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                        disabled={loading}
                    >
                        Deny Access
                    </button>
                </div>

                <p className="text-xs text-center text-gray-500 mt-4">
                    By clicking "Allow Access", you agree to share the above information with {clientName}.
                </p>
            </div>
        </AuthLayout>
    );
}
