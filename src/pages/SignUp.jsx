import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { Mail, Lock, User, Briefcase, ArrowRight, Loader2, Check, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { AuthLayout } from '../components/layout/AuthLayout';
import { motion, AnimatePresence } from 'framer-motion';

const RoleSelection = ({ role, onUpdate, onNext }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
            <button
                type="button"
                onClick={() => { onUpdate('role', 'client'); onNext(); }}
                className={`relative group p-6 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-left ${role === 'client' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">I want to hire talent</h3>
                        <p className="text-sm text-gray-500">Find top African experts for your project</p>
                    </div>
                </div>
            </button>

            <button
                type="button"
                onClick={() => { onUpdate('role', 'expert'); onNext(); }}
                className={`relative group p-6 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/5 transition-all text-left ${role === 'expert' ? 'border-primary bg-primary/5' : 'border-gray-100'}`}
            >
                <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900">I want to work</h3>
                        <p className="text-sm text-gray-500">Find global opportunities and grow</p>
                    </div>
                </div>
            </button>
        </div>

        <div className="text-center text-sm text-gray-500 mt-6">
            Already have an account? {' '}
            <Link to="/signin" className="font-semibold text-primary hover:text-primary/80">
                Sign in
            </Link>
        </div>
    </div>
);

const AccountDetails = ({ formData, onUpdate, onSubmit, onBack, loading }) => {
    const [showPassword, setShowPassword] = useState(false);
    return (
    <form onSubmit={onSubmit} className="space-y-5">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
                <User className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                    required
                    type="text"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => onUpdate('name', e.target.value)}
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                    required
                    type="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="you@company.com"
                    value={formData.email}
                    onChange={(e) => onUpdate('email', e.target.value)}
                />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => onUpdate('password', e.target.value)}
                />
                <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-400 hover:text-primary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be at least 8 characters.</p>
        </div>

        <div className="pt-2">
            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
            </Button>
        </div>

        <div className="text-center pt-2">
            <button
                type="button"
                onClick={onBack}
                className="text-sm text-gray-500 hover:text-gray-900 flex items-center justify-center mx-auto"
            >
                <ArrowLeft size={14} className="mr-1" /> Back to role selection
            </button>
        </div>
    </form>
);
};

const SignUp = () => {
    const navigate = useNavigate();
    const { signUp, signOut } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: '' // 'client' or 'expert'
    });

    const updateData = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const { user, error } = await signUp(
                formData.email,
                formData.password,
                formData.name,
                formData.role
            );

            if (error) throw error;

            if (user) {
                // Auto-login logic (if your API returns token on signup, otherwise keep as is)
                // Assuming verify-email or signin is next step, but ideally:
                navigate('/onboarding', { state: { fromSignup: true } });
            }
        } catch (error) {
            alert(typeof error === 'string' ? error : error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title={step === 1 ? "Join Africa Konnect" : "Create Account"}
            subtitle={step === 1 ? "Choose how you want to use the platform" : `Signing up as a ${formData.role === 'client' ? 'Client' : 'Expert'}`}
        >
            <SEO title="Sign Up" description="Create your Africa Konnect account." />

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {step === 1 ? (
                        <RoleSelection
                            role={formData.role}
                            onUpdate={updateData}
                            onNext={handleNext}
                        />
                    ) : (
                        <AccountDetails
                            formData={formData}
                            onUpdate={updateData}
                            onSubmit={handleSubmit}
                            onBack={handleBack}
                            loading={loading}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </AuthLayout>
    );
};

export default SignUp;
