import { useNavigate } from 'react-router-dom';
import { useAuthData } from '@neondatabase/neon-js/auth/react/ui';
import { useEffect } from 'react';

export function Home() {
    const navigate = useNavigate();
    const { data: session, isPending } = useAuthData();

    useEffect(() => {
        if (!isPending && !session) {
            navigate('/auth/signin');
        }
    }, [session, isPending, navigate]);

    if (isPending) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Welcome to Africa Konnect!
                    </h1>
                    <p className="text-lg text-gray-600 mb-6">
                        You are successfully authenticated with Neon Auth.
                    </p>

                    {(session as any)?.user && (
                        <div className="bg-blue-50 rounded-lg p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-2">
                                User Information
                            </h2>
                            <p className="text-gray-700">
                                <strong>Email:</strong> {(session as any).user.email}
                            </p>
                            <p className="text-gray-700">
                                <strong>User ID:</strong> {(session as any).user.id}
                            </p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/account/profile')}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                        >
                            Manage Account
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
