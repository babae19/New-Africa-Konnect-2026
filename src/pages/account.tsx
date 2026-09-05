import { useParams } from 'react-router-dom';
import { AccountView } from '@neondatabase/neon-js/auth/react/ui';

export function Account() {
    const { pathname } = useParams();

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Account Management
                        </h1>
                        <p className="text-gray-600">
                            Manage your profile, password, and sessions
                        </p>
                    </div>

                    <AccountView view={pathname as any} />
                </div>
            </div>
        </div>
    );
}
