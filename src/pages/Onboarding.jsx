import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Check, ChevronRight, User, Briefcase, Award, Loader2, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';
import { api } from '../lib/api';
import { toast } from 'sonner';

const steps = [
    { id: 1, title: 'Profile Photo', icon: Camera, description: 'Add a professional photo to build trust.' },
    { id: 2, title: 'Basic Details', icon: User, description: 'Tell us who you are.' },
    { id: 3, title: 'Expertise', icon: Award, description: 'Showcase your skills.' }
];

const Onboarding = () => {
    const navigate = useNavigate();
    const { user, updateProfile, uploadProfileImage } = useAuth();
    const { uploadFile, uploading } = useFileUpload();
    const [currentStep, setCurrentStep] = useState(1);
    const [saving, setSaving] = useState(false);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        title: '',
        bio: '',
        skills: [],
        location: '',
        completion_status: 1
    });
    const [imagePreview, setImagePreview] = useState(user?.profile_image_url || null);
    const [newSkill, setNewSkill] = useState('');

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // Optimistic preview
            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);

            await uploadProfileImage(file);
            toast.success('Photo uploaded! Looking good.');
        } catch (error) {
            toast.error('Failed to upload image. Please try again.');
            console.error(error);
        }
    };

    const handleNext = async () => {
        if (currentStep < 3) {
            setCurrentStep(prev => prev + 1);
        } else {
            finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        setSaving(true);
        try {
            await updateProfile({
                ...formData,
                onboarding_completed: true
            });
            toast.success("Welcome aboard! Your profile is ready.");
            navigate('/dashboard'); // or expert-dashboard based on role
        } catch (error) {
            toast.error("Failed to save profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl">
                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex justify-between mb-2">
                        {steps.map((step) => (
                            <div key={step.id} className={`flex flex-col items-center flex-1 ${step.id === currentStep ? 'text-primary' : 'text-gray-400'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${step.id === currentStep ? 'bg-primary text-white shadow-lg shadow-primary/30' :
                                        step.id < currentStep ? 'bg-green-500 text-white' : 'bg-gray-200'
                                    }`}>
                                    {step.id < currentStep ? <Check size={20} /> : <step.icon size={20} />}
                                </div>
                                <span className="text-sm font-medium hidden md:block">{step.title}</span>
                            </div>
                        ))}
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-primary"
                            initial={{ width: '0%' }}
                            animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </div>

                <Card className="p-8 shadow-xl border-t-4 border-t-primary">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-center"
                            >
                                <h2 className="text-2xl font-bold mb-2">Let's verify your identity</h2>
                                <p className="text-gray-500 mb-8">Upload a professional photo. Validated experts get 3x more jobs.</p>

                                <div className="relative w-40 h-40 mx-auto mb-6 group">
                                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                <User size={64} />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute bottom-0 right-0 bg-primary text-white p-3 rounded-full shadow-lg hover:bg-primary/90 transition-transform hover:scale-105"
                                    >
                                        {uploading ? <Loader2 className="animate-spin" size={20} /> : <Camera size={20} />}
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                    />
                                </div>

                                <Button onClick={handleNext} className="w-full max-w-xs mx-auto">
                                    Looks Good <ChevronRight className="ml-2" size={16} />
                                </Button>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h2 className="text-2xl font-bold mb-6 text-center">Tell us about yourself</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Senior Full Stack Developer"
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                        <textarea
                                            placeholder="Briefly describe your experience..."
                                            className="w-full p-3 border rounded-lg h-32 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={formData.bio}
                                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Lagos, Nigeria"
                                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            value={formData.location}
                                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-between mt-8">
                                    <Button variant="ghost" onClick={() => setCurrentStep(1)}>Back</Button>
                                    <Button onClick={handleNext}>Next Step <ChevronRight className="ml-2" size={16} /></Button>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <h2 className="text-2xl font-bold mb-6 text-center">What are your top skills?</h2>

                                <div className="mb-6">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Add a skill (e.g. React, Python)"
                                            className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                            value={newSkill}
                                            onChange={(e) => setNewSkill(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (newSkill.trim()) {
                                                        setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
                                                        setNewSkill('');
                                                    }
                                                }
                                            }}
                                        />
                                        <Button onClick={() => {
                                            if (newSkill.trim()) {
                                                setFormData(prev => ({ ...prev, skills: [...prev.skills, newSkill.trim()] }));
                                                setNewSkill('');
                                            }
                                        }}><Upload size={20} /></Button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Press Enter to add</p>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-8 min-h-[100px] p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    {formData.skills.map((skill, index) => (
                                        <span key={index} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm font-medium flex items-center gap-2 shadow-sm animate-fade-in">
                                            {skill}
                                            <button
                                                onClick={() => setFormData(prev => ({ ...prev, skills: prev.skills.filter((_, i) => i !== index) }))}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                    {formData.skills.length === 0 && (
                                        <div className="w-full text-center text-gray-400 py-4">No skills added yet</div>
                                    )}
                                </div>

                                <div className="flex justify-between">
                                    <Button variant="ghost" onClick={() => setCurrentStep(2)}>Back</Button>
                                    <Button
                                        onClick={finishOnboarding}
                                        disabled={saving}
                                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                                    >
                                        {saving ? <Loader2 className="animate-spin" /> : 'Complete Profile'}
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Card>
            </div>
        </div>
    );
};

export default Onboarding;
