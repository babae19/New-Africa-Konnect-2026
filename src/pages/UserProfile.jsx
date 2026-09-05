import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFileUpload } from '../hooks/useFileUpload';
import { api } from '../lib/api';
import { toast } from 'sonner';
import {
    User, Mail, Phone, MapPin, Building, Globe, Camera,
    Briefcase, Award, Save, X, Loader2, Check, Shield,
    Upload, FileText, Trash2, Plus, Bell, Edit3,
    DollarSign, Star, Lock, ChevronRight, Zap
} from 'lucide-react';
import NotificationPreferences from '../components/bidding/NotificationPreferences';

// ─── Reusable Input Field ─────────────────────────────────────────────────────
const Field = ({ icon: Icon, label, value, onChange, disabled, type = 'text', placeholder, required }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            {label} {required && <span className="text-red-400">*</span>}
        </label>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200
            ${disabled
                ? 'bg-gray-50 border-gray-100 cursor-default'
                : 'bg-white border-gray-200 hover:border-primary/40 focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/8 shadow-sm'
            }`}>
            {Icon && <Icon size={16} className={disabled ? 'text-gray-300' : 'text-primary/70'} />}
            <input
                type={type}
                value={value || ''}
                onChange={onChange ? (e) => onChange(e.target.value) : undefined}
                disabled={disabled}
                placeholder={disabled ? '—' : placeholder}
                className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-gray-800 placeholder:text-gray-300 disabled:text-gray-500"
            />
        </div>
    </div>
);

// ─── Reusable Textarea Field ──────────────────────────────────────────────────
const TextareaField = ({ label, value, onChange, disabled, placeholder, rows = 4 }) => (
    <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
        <textarea
            value={value || ''}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            disabled={disabled}
            placeholder={disabled ? '—' : placeholder}
            rows={rows}
            className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 resize-none
                ${disabled
                    ? 'bg-gray-50 border-gray-100 text-gray-500 cursor-default'
                    : 'bg-white border-gray-200 text-gray-800 hover:border-primary/40 focus:border-primary focus:ring-4 focus:ring-primary/8 shadow-sm'
                }`}
        />
    </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ icon: Icon, iconBg, title, subtitle, children, action }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
                    <Icon size={16} />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    {subtitle && <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {action}
        </div>
        <div className="p-6">{children}</div>
    </div>
);


// ─── Main Component ───────────────────────────────────────────────────────────
const UserProfile = () => {
    const navigate = useNavigate();
    const { user, profile, updateProfile, uploadProfileImage, isExpert, loading: authLoading } = useAuth();
    const { uploadFile, uploading } = useFileUpload();

    const [editing, setEditing]     = useState(false);
    const [saving, setSaving]       = useState(false);
    const [activeTab, setActiveTab] = useState('profile');
    const [isDirty, setIsDirty]     = useState(false);
    const fileInputRef              = useRef(null);
    const docInputRef               = useRef(null);

    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', country: '', city: '',
        bio: '', company: '', website: '',
        skills: [], services: [], documents: [],
        title: '', hourly_rate: ''
    });

    const [savedData,    setSavedData]    = useState(null);
    const [newSkill,     setNewSkill]     = useState('');
    const [newService,   setNewService]   = useState('');
    const [imagePreview, setImagePreview] = useState(null);

    // ── Auth guard
    useEffect(() => {
        if (!authLoading && !user) navigate('/signin');
    }, [user, authLoading, navigate]);

    // ── Populate form when profile loads
    useEffect(() => {
        if (profile || user) {
            const data = {
                name:        profile?.name        || user?.name        || '',
                email:       profile?.email       || user?.email       || '',
                phone:       profile?.phone       || '',
                country:     profile?.country     || '',
                city:        profile?.city        || '',
                bio:         profile?.bio         || '',
                company:     profile?.company     || '',
                website:     profile?.website     || '',
                skills:      profile?.skills      || [],
                services:    profile?.services    || [],
                documents:   profile?.documents   || [],
                title:       profile?.title       || '',
                hourly_rate: profile?.hourly_rate || ''
            };
            setFormData(data);
            setSavedData(data);
            const img = profile?.profile_image_url || user?.profile_image_url;
            if (img) setImagePreview(img);
        }
    }, [profile, user]);

    // ── Track unsaved changes
    useEffect(() => {
        if (savedData) setIsDirty(JSON.stringify(formData) !== JSON.stringify(savedData));
    }, [formData, savedData]);

    const patch = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

    // ── Image upload
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image must be under 5MB');
            return;
        }

        try {
            // Optimistic UI update with local blob
            const optimisticUrl = URL.createObjectURL(file);
            setImagePreview(optimisticUrl);
            
            // Upload to cloud and get permanent URL
            const { url } = await uploadProfileImage(file);
            
            // Replace blob with permanent URL
            setImagePreview(url);
            URL.revokeObjectURL(optimisticUrl);
            toast.success('Avatar updated!');
        } catch (err) {
            // Revert to previous image on failure
            const fallback = profile?.profile_image_url || user?.profile_image_url || null;
            setImagePreview(fallback);
            toast.error('Image upload failed: ' + err.message);
        }
    };

    // ── Document upload
    const handleDocumentUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const result = await uploadFile(file);
            const doc = { name: file.name, url: result.url, type: file.type, uploadedAt: new Date().toISOString() };
            patch('documents', [...formData.documents, doc]);
            toast.success(`${file.name} uploaded!`);
        } catch (err) {
            toast.error('Upload failed: ' + err.message);
        }
    };

    // ── Skills
    const addSkill = () => {
        const s = newSkill.trim();
        if (s && !formData.skills.includes(s)) { patch('skills', [...formData.skills, s]); setNewSkill(''); }
    };
    const removeSkill = (s) => patch('skills', formData.skills.filter(x => x !== s));

    // ── Services
    const addService = () => {
        const s = newService.trim();
        if (s && !formData.services.includes(s)) { patch('services', [...formData.services, s]); setNewService(''); }
    };
    const removeService = (i) => patch('services', formData.services.filter((_, idx) => idx !== i));

    // ── Cancel – revert to saved state
    const handleCancel = () => {
        if (savedData) setFormData(savedData);
        setEditing(false);
        setIsDirty(false);
    };

    // ── Save
    const handleSave = async () => {
        if (!formData.name.trim()) { toast.error('Full name is required.'); return; }
        setSaving(true);

        // Guard: never persist a blob: URL to the database
        const safeImageUrl = (imagePreview && !imagePreview.startsWith('blob:'))
            ? imagePreview
            : (profile?.profile_image_url || user?.profile_image_url || null);

        try {
            // Build the unified payload
            const payload = {
                name:    formData.name,
                phone:   formData.phone,
                country: formData.country,
                city:    formData.city,
                bio:     formData.bio,
                company: formData.company,
                website: formData.website,
                profile_image_url: safeImageUrl
            };

            if (isExpert) {
                await updateProfile({
                    ...payload,
                    title:       formData.title,
                    skills:      formData.skills,
                    services:    formData.services,
                    documents:   formData.documents,
                    hourlyRate:  parseFloat(formData.hourly_rate) || 0,
                });
            } else {
                // Client: update base user profile
                await updateProfile(payload);
            }

            // Refetch to ensure state is fully in sync
            const freshProfile = await api.auth.getProfile();
            if (freshProfile) {
                setImagePreview(freshProfile.profile_image_url || safeImageUrl);
            }

            setSavedData(formData);
            setIsDirty(false);
            setEditing(false);
            toast.success('Profile saved successfully!');
        } catch (err) {
            console.error(err);
            toast.error('Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const completeness = profile?.profile_completeness || 0;
    const initials     = (formData.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    const navItems = [
        { id: 'profile',       label: 'My Profile',    icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell }
    ];

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/70">
            <SEO title="Profile Settings | Africa Konnect" description="Manage your Africa Konnect profile and settings." />

            {/* ── Sticky Profile Hero ─────────────────────────────────────── */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">

                        {/* Avatar + identity */}
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                            <div className="relative flex-shrink-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden ring-2 ring-primary/20 bg-primary/10 flex items-center justify-center">
                                    {imagePreview
                                        ? <img src={imagePreview} alt="avatar" className="w-full h-full object-cover" />
                                        : <span className="text-primary font-black text-sm">{initials}</span>
                                    }
                                </div>
                                {editing && (
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                                        title="Change photo"
                                    >
                                        <Camera size={10} />
                                    </button>
                                )}
                                <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>

                            <div className="min-w-0">
                                <h2 className="text-sm sm:text-base font-bold text-gray-900 truncate leading-tight">
                                    {formData.name || 'Your Name'}
                                </h2>
                                <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                                    <Mail size={10} />
                                    {user?.email}
                                </p>
                                {isExpert && formData.title && (
                                    <p className="text-[11px] text-primary font-semibold truncate">{formData.title}</p>
                                )}
                            </div>

                            {/* Verification badge */}
                            {profile?.vetting_status === 'verified' && (
                                <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold">
                                    <Check size={10} /> Verified
                                </span>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {isDirty && !editing && (
                                <span className="hidden sm:flex items-center gap-1 text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                                    <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
                                    Unsaved
                                </span>
                            )}

                            <AnimatePresence mode="wait">
                                {editing ? (
                                    <motion.div
                                        key="edit-actions"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex items-center gap-2"
                                    >
                                        <button
                                            onClick={handleCancel}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            <X size={14} /> Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-md shadow-primary/25 transition-all disabled:opacity-70"
                                        >
                                            {saving
                                                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                                                : <><Save size={14} /> Save Changes</>
                                            }
                                        </button>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        key="edit-btn"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        onClick={() => { setEditing(true); setActiveTab('profile'); }}
                                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                    >
                                        <Edit3 size={14} /> Edit Profile
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Page Body ───────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ── Left Sidebar ───────────────────────────────────── */}
                    <aside className="lg:col-span-3 space-y-4">

                        {/* Large profile card */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Cover */}
                            <div className="h-20 bg-gradient-to-br from-primary via-indigo-600 to-blue-700 relative">
                                <div
                                    className="absolute inset-0 opacity-20"
                                    style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}
                                />
                            </div>

                            <div className="px-5 pb-5 -mt-10">
                                {/* Avatar large */}
                                <div className="relative inline-block mb-3 group">
                                    <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg overflow-hidden bg-primary/10 flex items-center justify-center">
                                        {imagePreview
                                            ? <img src={imagePreview} alt="avatar" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />
                                            : null}
                                        <span className="text-primary font-black text-xl" style={{ display: imagePreview ? 'none' : 'flex' }}>{initials}</span>
                                    </div>
                                    {editing && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-0 w-20 h-20 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity"
                                        >
                                            <Camera size={16} className="text-white mb-0.5" />
                                            <span className="text-[9px] text-white font-bold uppercase">Change</span>
                                        </button>
                                    )}
                                </div>

                                <h3 className="font-bold text-gray-900 text-base leading-tight mb-0.5">
                                    {formData.name || 'Your Name'}
                                </h3>
                                {isExpert && formData.title && (
                                    <p className="text-[11px] text-primary font-semibold mb-1">{formData.title}</p>
                                )}
                                <p className="text-[11px] text-gray-400 flex items-center gap-1 mb-3">
                                    <Mail size={10} /> {user?.email}
                                </p>

                                {formData.city || formData.country ? (
                                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mb-3">
                                        <MapPin size={10} />
                                        {[formData.city, formData.country].filter(Boolean).join(', ')}
                                    </p>
                                ) : null}

                                {isExpert && formData.hourly_rate && (
                                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700 mb-3">
                                        <DollarSign size={10} className="text-green-500" />
                                        ${formData.hourly_rate}/hr
                                    </div>
                                )}

                                {/* Skills preview */}
                                {formData.skills.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-3">
                                        {formData.skills.slice(0, 4).map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-primary/8 text-primary text-[10px] font-bold rounded-md">
                                                {s}
                                            </span>
                                        ))}
                                        {formData.skills.length > 4 && (
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded-md">
                                                +{formData.skills.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile completeness (expert only) */}
                        {isExpert && (
                            <div className="bg-gray-900 text-white rounded-2xl p-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 opacity-5 p-4"><Award size={80} /></div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Zap size={14} className="text-yellow-400" />
                                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Profile Power</span>
                                </div>
                                <div className="flex items-end justify-between mb-2">
                                    <span className="text-3xl font-black">{completeness}%</span>
                                    <span className="text-[10px] text-gray-500 font-bold">TARGET 100%</span>
                                </div>
                                <div className="h-1.5 bg-white/10 rounded-full mb-3">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${completeness}%` }}
                                        transition={{ duration: 1, ease: 'easeOut' }}
                                        className="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full"
                                    />
                                </div>
                                <p className="text-[10px] text-gray-500 leading-relaxed">
                                    Complete profiles rank 2.5× higher in search results.
                                </p>
                            </div>
                        )}

                        {/* Nav */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-0.5">
                            {navItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id); if (editing) setEditing(false); }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                                        ${activeTab === item.id
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="flex items-center gap-2.5">
                                        <item.icon size={15} />
                                        {item.label}
                                    </span>
                                    <ChevronRight size={13} className="opacity-60" />
                                </button>
                            ))}
                        </div>
                    </aside>

                    {/* ── Right Content ──────────────────────────────────── */}
                    <main className="lg:col-span-9">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' ? (
                                <motion.div
                                    key="profile-tab"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-5"
                                >
                                    {/* Editing banner */}
                                    <AnimatePresence>
                                        {editing && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="flex items-center justify-between px-4 py-3 bg-primary/8 border border-primary/20 rounded-xl"
                                            >
                                                <div className="flex items-center gap-2 text-sm text-primary font-semibold">
                                                    <Edit3 size={14} />
                                                    Edit mode active — make your changes and click <strong>Save Changes</strong>.
                                                </div>
                                                <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                    <X size={15} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* ── Personal Details ─────────────────────────────── */}
                                    <SectionCard
                                        icon={User}
                                        iconBg="bg-orange-50 text-orange-500"
                                        title="Personal Details"
                                        subtitle="Your basic contact and location information"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Field
                                                icon={User} label="Full Name" required
                                                value={formData.name}
                                                onChange={val => patch('name', val)}
                                                disabled={!editing}
                                                placeholder="Your full name"
                                            />
                                            <Field
                                                icon={Mail} label="Email Address"
                                                value={formData.email}
                                                disabled={true}
                                                placeholder="Email"
                                            />
                                            <Field
                                                icon={Phone} label="Phone Number"
                                                value={formData.phone}
                                                onChange={val => patch('phone', val)}
                                                disabled={!editing}
                                                placeholder="+1 234 567 8900"
                                            />
                                            <Field
                                                icon={Globe} label="Country"
                                                value={formData.country}
                                                onChange={val => patch('country', val)}
                                                disabled={!editing}
                                                placeholder="e.g. Nigeria"
                                            />
                                            <Field
                                                icon={MapPin} label="City"
                                                value={formData.city}
                                                onChange={val => patch('city', val)}
                                                disabled={!editing}
                                                placeholder="e.g. Lagos"
                                            />
                                        </div>
                                        <div className="mt-4">
                                            <TextareaField
                                                label="Professional Bio"
                                                value={formData.bio}
                                                onChange={val => patch('bio', val)}
                                                disabled={!editing}
                                                placeholder="Describe your background, expertise, and what makes you unique…"
                                                rows={4}
                                            />
                                        </div>
                                    </SectionCard>

                                    {/* ── Professional Details ─────────────────────────── */}
                                    <SectionCard
                                        icon={Briefcase}
                                        iconBg="bg-primary/10 text-primary"
                                        title={isExpert ? 'Professional Profile' : 'Business Details'}
                                        subtitle="Work information and professional presence"
                                    >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Field
                                                icon={Building} label="Company / Organization"
                                                value={formData.company}
                                                onChange={val => patch('company', val)}
                                                disabled={!editing}
                                                placeholder="Your company"
                                            />
                                            <Field
                                                icon={Globe} label="Website"
                                                value={formData.website}
                                                onChange={val => patch('website', val)}
                                                disabled={!editing}
                                                placeholder="https://yoursite.com"
                                            />
                                            {isExpert && (
                                                <>
                                                    <Field
                                                        icon={Star} label="Professional Title"
                                                        value={formData.title}
                                                        onChange={val => patch('title', val)}
                                                        disabled={!editing}
                                                        placeholder="e.g. Full-Stack Engineer"
                                                    />
                                                    <Field
                                                        icon={DollarSign} label="Hourly Rate (USD)"
                                                        value={formData.hourly_rate}
                                                        onChange={val => patch('hourly_rate', val)}
                                                        disabled={!editing}
                                                        type="number"
                                                        placeholder="0"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    </SectionCard>

                                    {/* ── Skills & Services (Expert only) ─────────────── */}
                                    {isExpert && (
                                        <SectionCard
                                            icon={Zap}
                                            iconBg="bg-yellow-50 text-yellow-600"
                                            title="Skills & Services"
                                            subtitle="What you offer and your areas of expertise"
                                        >
                                            {/* Skills */}
                                            <div className="mb-5">
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                                                    Expertise Tags
                                                </label>
                                                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 min-h-[52px]">
                                                    {formData.skills.map((s, i) => (
                                                        <span
                                                            key={i}
                                                            className="flex items-center gap-1.5 px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg shadow-sm"
                                                        >
                                                            {s}
                                                            {editing && (
                                                                <button onClick={() => removeSkill(s)} className="text-gray-300 hover:text-red-500 transition-colors">
                                                                    <X size={11} />
                                                                </button>
                                                            )}
                                                        </span>
                                                    ))}
                                                    {editing && (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={newSkill}
                                                                onChange={e => setNewSkill(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && addSkill()}
                                                                placeholder="Type + Enter"
                                                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 w-28"
                                                            />
                                                            <button onClick={addSkill} className="p-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">
                                                                <Plus size={13} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {formData.skills.length === 0 && !editing && (
                                                        <span className="text-xs text-gray-400 italic">No skills added yet.</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Services */}
                                            <div>
                                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                                                    Services Offered
                                                </label>
                                                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 min-h-[52px]">
                                                    {formData.services.map((svc, i) => (
                                                        <span
                                                            key={i}
                                                            className="flex items-center gap-1.5 px-3 py-1 bg-primary/8 border border-primary/20 text-primary text-xs font-bold rounded-lg"
                                                        >
                                                            {svc}
                                                            {editing && (
                                                                <button onClick={() => removeService(i)} className="opacity-60 hover:opacity-100 hover:text-red-500 transition-colors">
                                                                    <X size={11} />
                                                                </button>
                                                            )}
                                                        </span>
                                                    ))}
                                                    {editing && (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={newService}
                                                                onChange={e => setNewService(e.target.value)}
                                                                onKeyDown={e => e.key === 'Enter' && addService()}
                                                                placeholder="Type + Enter"
                                                                className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-primary/20 w-28"
                                                            />
                                                            <button onClick={addService} className="p-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors">
                                                                <Plus size={13} />
                                                            </button>
                                                        </div>
                                                    )}
                                                    {formData.services.length === 0 && !editing && (
                                                        <span className="text-xs text-gray-400 italic">No services added yet.</span>
                                                    )}
                                                </div>
                                            </div>
                                        </SectionCard>
                                    )}

                                    {/* ── Documents & Verification ─────────────────────── */}
                                    <SectionCard
                                        icon={Shield}
                                        iconBg="bg-green-50 text-green-600"
                                        title="Trust & Verification"
                                        subtitle="Identity and portfolio documents for vetting"
                                        action={
                                            editing ? (
                                                <button
                                                    onClick={() => docInputRef.current?.click()}
                                                    disabled={uploading}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-primary border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary/5 rounded-lg transition-all disabled:opacity-50"
                                                >
                                                    {uploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                                    Upload Document
                                                </button>
                                            ) : null
                                        }
                                    >
                                        <input ref={docInputRef} type="file" className="hidden" onChange={handleDocumentUpload} />

                                        {formData.documents.length === 0 ? (
                                            <div className="text-center py-10 rounded-xl border-2 border-dashed border-gray-100 bg-gray-50/50">
                                                <FileText size={24} className="text-gray-200 mx-auto mb-2" />
                                                <p className="text-sm text-gray-400 font-medium">No documents uploaded yet.</p>
                                                {editing && (
                                                    <button
                                                        onClick={() => docInputRef.current?.click()}
                                                        className="mt-3 text-xs text-primary font-bold hover:underline"
                                                    >
                                                        Upload your first document →
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                                {formData.documents.map((doc, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm group hover:border-gray-200 transition-colors"
                                                    >
                                                        <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center text-primary flex-shrink-0">
                                                            <FileText size={15} />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-gray-900 truncate">{doc.name}</p>
                                                            <p className="text-[10px] text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                        </div>
                                                        {editing && (
                                                            <button
                                                                onClick={() => patch('documents', formData.documents.filter((_, idx) => idx !== i))}
                                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                            >
                                                                <Trash2 size={13} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Security note */}
                                        <div className="flex items-start gap-2.5 p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                                            <Lock size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                            <p className="text-[11px] text-blue-700 leading-relaxed">
                                                Documents are encrypted with AES-256 and only accessible by the Africa Konnect Vetting Team. Your privacy is protected.
                                            </p>
                                        </div>
                                    </SectionCard>

                                    {/* ── Floating Save Bar ─────────────────────────────── */}
                                    <AnimatePresence>
                                        {editing && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 30 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 30 }}
                                                className="sticky bottom-6 z-30 flex justify-end"
                                            >
                                                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/60 px-5 py-3">
                                                    <span className="text-xs text-gray-500">
                                                        {isDirty ? '● Unsaved changes' : '✓ No changes yet'}
                                                    </span>
                                                    <button
                                                        onClick={handleCancel}
                                                        disabled={saving}
                                                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                                                    >
                                                        Discard
                                                    </button>
                                                    <button
                                                        onClick={handleSave}
                                                        disabled={saving || !isDirty}
                                                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md shadow-primary/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        {saving
                                                            ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                                                            : <><Check size={15} /> Save Changes</>
                                                        }
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="notifications-tab"
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -12 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <NotificationPreferences />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>
            {/* Hidden inputs for uploads */}
            <input 
                ref={fileInputRef} 
                type="file" 
                className="hidden" 
                onChange={handleImageUpload} 
                accept="image/*" 
                style={{ display: 'none' }} 
            />
            <input 
                ref={docInputRef} 
                type="file" 
                className="hidden" 
                onChange={handleDocumentUpload} 
                style={{ display: 'none' }} 
            />
        </div>
    );
};

export default UserProfile;
