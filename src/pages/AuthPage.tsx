import { useParams } from 'react-router-dom';
import { AuthView } from '@neondatabase/neon-js/auth/react/ui';

export default function Auth() {
    const { pathname } = useParams();

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Africa Konnect
                        </h1>
                        <p className="text-gray-600">
                            {pathname === 'signup' ? 'Create your account' : 'Welcome back'}
                        </p>
                    </div>

                    <AuthView view={pathname as any} />
                </div>
            </div>
        </div>
    );
}
