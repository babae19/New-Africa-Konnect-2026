import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { toast } from 'sonner';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadProfile = useCallback(async (userData) => {
        try {
            // Refetch full consolidated profile from backend
            const dbProfile = await api.auth.getProfile();
            setProfile(dbProfile);
            
            // Sync with user state too
            setUser(prev => ({ ...prev, ...dbProfile }));
            
            // Persist to localStorage
            const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
            localStorage.setItem('userInfo', JSON.stringify({ ...stored, ...dbProfile }));
        } catch (error) {
            console.error('Error loading consolidated profile:', error);
            // Fallback to userData if fetch fails
            setProfile(userData);
        }
    }, []);

    const checkSession = useCallback(async () => {
        try {
            const storedUserJson = localStorage.getItem('userInfo');

            if (storedUserJson) {
                // Verify the token and get consolidated profile from our backend
                const dbProfile = await api.auth.getProfile();

                // Merge with stored data to preserve the token/identity but use DB as source of truth for fields
                const stored = JSON.parse(storedUserJson);
                const newUser = { 
                    ...stored, 
                    ...dbProfile
                };

                setUser(newUser);
                setProfile(dbProfile);
                
                // Update localStorage to ensure persistence
                localStorage.setItem('userInfo', JSON.stringify(newUser));
            }
        } catch (error) {
            console.log("Authentication check failed:", error.message);
            if (error.message && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Auth'))) {
                localStorage.removeItem('userInfo');
                setUser(null);
            }
        } finally {
            setLoading(false);
        }
    }, [loadProfile]);

    useEffect(() => {
        const handleRefresh = (e) => {
            console.log("🔄 AuthContext: Token refreshed in background");
            setUser(e.detail);
        };

        const handleLogout = () => {
            console.log("🚪 AuthContext: Session expired, logging out");
            setUser(null);
            setProfile(null);
        };

        window.addEventListener('auth-token-refreshed', handleRefresh);
        window.addEventListener('auth-logout', handleLogout);

        checkSession();

        return () => {
            window.removeEventListener('auth-token-refreshed', handleRefresh);
            window.removeEventListener('auth-logout', handleLogout);
        };
    }, [checkSession]);

    const signUp = async (email, password, name, role) => {
        try {
            const dbUser = await api.auth.register({
                email,
                password,
                name,
                role
            });

            if (dbUser && dbUser.id) {
                setUser(dbUser);
                localStorage.setItem('userInfo', JSON.stringify(dbUser));
                await loadProfile(dbUser);
                return { user: dbUser, error: null };
            } else {
                throw new Error('Registration failed - no user returned');
            }
        } catch (error) {
            console.error("❌ SignUp Error Details:", error);
            return { user: null, error: error?.message || error || "Unknown signup error" };
        }
    };

    const signIn = async (email, password, rememberMe = false) => {
        try {
            const dbUser = await api.auth.login({ email, password, rememberMe });

            if (dbUser && dbUser.id) {
                setUser(dbUser);
                localStorage.setItem('userInfo', JSON.stringify(dbUser));
                await loadProfile(dbUser);
                return { user: dbUser, error: null };
            } else {
                throw new Error('Login failed - no user returned');
            }
        } catch (error) {
            console.error("❌ SignIn Error Details:", error);
            return { user: null, error: error?.message || error || "Unknown login error" };
        }
    };

    const signOut = async () => {
        try {
            // Backend signout to revoke session in DB
            await api.auth.logout();
        } catch (error) {
            console.error('Sign out error:', error);
        } finally {
            setUser(null);
            setProfile(null);
            localStorage.removeItem('userInfo');
            return { error: null };
        }
    };

    const updateProfile = async (updates) => {
        try {
            let updatedData;
            
            // If expert, update professional profile
            if (user?.role === 'expert') {
                const expertUpdates = {
                    ...updates,
                    profileImageUrl: updates.profile_image_url || updates.profileImageUrl
                };
                updatedData = await api.experts.updateProfile(user.id, expertUpdates);
            } else {
                // For all users, update the main identity profile
                updatedData = await api.auth.updateProfile({
                    name: updates.name || user.name,
                    email: updates.email || user.email,
                    profile_image_url: updates.profile_image_url || updates.profileImageUrl || user.profile_image_url,
                    profileImageUrl: updates.profile_image_url || updates.profileImageUrl || user.profile_image_url,
                    bio: updates.bio || user.bio
                });
            }

            // Refetch fully consolidated profile from backend for absolute consistency
            const finalProfile = await api.auth.getProfile();
            
            const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
            const newUser = { ...stored, ...finalProfile };

            setUser(newUser);
            setProfile(finalProfile);
            localStorage.setItem('userInfo', JSON.stringify(newUser));
            
            return { profile: finalProfile, error: null };
        } catch (error) {
            console.error('Consolidated update failed:', error);
            return { profile: null, error };
        }
    };

    const uploadProfileImage = async (file) => {
        // 1. Immediate Optimistic Update
        const optimisticUrl = URL.createObjectURL(file);

        // Update both user and profile state immediately
        setUser(prev => ({ ...prev, profile_image_url: optimisticUrl }));
        setProfile(prev => prev ? ({ ...prev, profile_image_url: optimisticUrl }) : { profile_image_url: optimisticUrl });

        try {
            const { url } = await api.files.uploadImage({
                data: await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.readAsDataURL(file);
                }),
                name: file.name
            });

            // 2. Confirm with real URL
            setUser(prev => ({ ...prev, profile_image_url: url }));
            setProfile(prev => prev ? ({ ...prev, profile_image_url: url }) : { profile_image_url: url });

            // Persist to localStorage
            const stored = JSON.parse(localStorage.getItem('userInfo') || '{}');
            localStorage.setItem('userInfo', JSON.stringify({ ...stored, profile_image_url: url }));

            // Update Backend Profiles
            await updateProfile({ profile_image_url: url });

            return { url };
        } catch (error) {
            console.error('Image upload failed:', error);
            // Revert on failure (optional, or let next load fix it)
            toast.error("Failed to save profile picture permanently.");
            throw error;
        }
    };

    const value = {
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        updateProfile,
        uploadProfileImage,
        isAuthenticated: !!user,
        isExpert: user?.role === 'expert' || user?.user_metadata?.role === 'expert',
        isClient: user?.role === 'client' || user?.user_metadata?.role === 'client',
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
