import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, User, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../common/NotificationCenter';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, profile, signOut, isExpert, isClient } = useAuth();
    const avatarUrl = profile?.profile_image_url || profile?.avatar_url || user?.profile_image_url || user?.avatar_url;
    const displayName = profile?.name || user?.name || user?.email?.split('@')[0] || 'User';

    const handleLogout = async () => {
        await signOut();
        setShowUserMenu(false);
        navigate('/');
    };

    // Define navigation links based on user role
    const getNavLinks = () => {
        const baseLinks = [
            { name: 'Home', path: '/' },
            { name: 'Experts', path: '/experts' },
        ];

        if (user) {
            if (isExpert) {
                return [
                    ...baseLinks,
                    { name: 'Dashboard', path: '/expert-dashboard' },
                    { name: 'Marketplace', path: '/marketplace' },
                    { name: 'My Bids', path: '/my-bids' },
                    { name: 'Pricing', path: '/pricing' },
                ];
            } else {
                // Client
                return [
                    ...baseLinks,
                    { name: 'Project Hub', path: '/project-hub' },
                    { name: 'Marketplace', path: '/marketplace' },
                    { name: 'Collaboration', path: '/collaboration' },
                    { name: 'Pricing', path: '/pricing' },
                ];
            }
        }

        // Not logged in
        return [
            ...baseLinks,
            { name: 'Project Hub', path: '/project-hub' },
            { name: 'Collaboration', path: '/collaboration' },
            { name: 'Pricing', path: '/pricing' },
        ];
    };

    const navLinks = getNavLinks();
    const isActive = (path) => location.pathname === path;

    return (
        <header className="fixed top-0 left-0 right-0 z-50">
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 h-full">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo.png" alt="Africa Konnect Logo" className="h-16 w-auto" />
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-primary",
                                        isActive(link.path) ? "text-primary font-semibold" : "text-gray-600"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* CTA & Mobile Menu Toggle */}
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-3">
                                {user ? (
                                    <>
                                        {/* Notifications */}
                                        <div className="mr-2">
                                            <NotificationCenter />
                                        </div>

                                        <div className="relative group">
                                            <button
                                                onClick={() => setShowUserMenu(!showUserMenu)}
                                                className="flex items-center gap-3 pl-1 pr-4 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-full transition-all duration-200 shadow-sm hover:shadow-md group relative"
                                            >
                                                {/* Enhanced Profile Image */}
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-full blur-sm opacity-60 group-hover:opacity-100 transition-opacity"></div>
                                                    <div className="relative w-11 h-11 rounded-full bg-white p-[2px]">
                                                        <div className="w-full h-full rounded-full overflow-hidden">
                                                            {avatarUrl ? (
                                                                <img
                                                                    src={avatarUrl}
                                                                    alt={`${displayName}'s profile`}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div
                                                                className="w-full h-full bg-gradient-to-br from-primary/20 to-blue-600/20 flex items-center justify-center"
                                                                style={{ display: avatarUrl ? 'none' : 'flex' }}
                                                            >
                                                                <span className="text-primary font-bold text-lg">
                                                                    {displayName.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Online Indicator */}
                                                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                                </div>

                                                {/* User Info */}
                                                <div className="text-left hidden lg:block">
                                                    <p className="text-sm font-bold text-gray-900 leading-tight">
                                                        {displayName}
                                                    </p>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-primary/80 flex items-center gap-1.5">
                                                        {isExpert ? (
                                                            <>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(102,126,234,0.6)]"></div>
                                                                Expert
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                                                                Client
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                                <ChevronRight size={16} className={`text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''}`} />
                                            </button>

                                            {/* Enhanced User Dropdown Menu */}
                                            <AnimatePresence>
                                                {showUserMenu && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -20, filter: "blur(10px)" }}
                                                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                                                        exit={{ opacity: 0, scale: 0.95, y: -20, filter: "blur(10px)" }}
                                                        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                                        className="absolute right-0 top-full mt-3 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 origin-top-right"
                                                    >
                                                        {isExpert ? (
                                                            <ExpertDropdown
                                                                profile={profile}
                                                                user={user}
                                                                signOut={handleLogout}
                                                                closeMenu={() => setShowUserMenu(false)}
                                                            />
                                                        ) : (
                                                            <ClientDropdown
                                                                profile={profile}
                                                                user={user}
                                                                signOut={handleLogout}
                                                                closeMenu={() => setShowUserMenu(false)}
                                                            />
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </>
                                ) : (
                                    <Link to="/signup">
                                        <Button size="sm">Get Started</Button>
                                    </Link>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(!isOpen)}
                                className="md:hidden p-2 text-gray-600 hover:text-primary transition-colors"
                            >
                                {isOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                        >
                            <div className="px-4 py-6 space-y-4">
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setIsOpen(false)}
                                        className={cn(
                                            "block text-base font-medium py-2 border-b border-gray-50 last:border-0",
                                            isActive(link.path) ? "text-primary" : "text-gray-600"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            {link.name}
                                            <ChevronRight size={16} className="text-gray-400" />
                                        </div>
                                    </Link>
                                ))}
                                <div className="pt-4 space-y-2">
                                    {user ? (
                                        <>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
                                                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 flex-shrink-0">
                                                    {(profile?.profile_image_url || user?.profile_image_url) ? (
                                                        <img
                                                            src={profile?.profile_image_url || user?.profile_image_url}
                                                            alt="avatar"
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || user?.name || 'U')}&background=667eea&color=fff&size=40`; }}
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-primary font-bold">
                                                            {(profile?.name || user?.name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {profile?.name || user?.email?.split('@')[0]}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {isExpert ? 'Expert Account' : 'Client Account'}
                                                    </p>
                                                </div>
                                            </div>
                                            <Link to="/profile" onClick={() => setIsOpen(false)}>
                                                <Button variant="secondary" className="w-full" size="lg">
                                                    <Settings size={16} className="mr-2" />
                                                    Edit Profile
                                                </Button>
                                            </Link>
                                            <Link to="/change-password" onClick={() => setIsOpen(false)} className="block text-sm font-medium text-primary">Change password</Link>
                                            <Button
                                                onClick={() => {
                                                    handleLogout();
                                                    setIsOpen(false);
                                                }}
                                                variant="secondary"
                                                className="w-full"
                                                size="lg"
                                            >
                                                <LogOut size={16} className="mr-2" />
                                                Logout
                                            </Button>
                                        </>
                                    ) : (
                                        <Link to="/signup" onClick={() => setIsOpen(false)}>
                                            <Button className="w-full" size="lg">Get Started</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </header>
    );
};

// --- Sub-components (Internal to this file or could be moved) ---

const DropdownHeader = ({ profile, user, isExpert }) => (
    <div className="px-5 py-5 border-b border-gray-100 bg-gray-50/70">
        <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
                <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-14 h-14 rounded-full bg-primary/15 p-0.5"
                >
                    <div className="w-full h-full rounded-full overflow-hidden bg-white border-2 border-white">
                        {(profile?.profile_image_url || user?.profile_image_url) ? (
                            <img
                                src={profile?.profile_image_url || user?.profile_image_url}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-blue-600/10 flex items-center justify-center">
                                <span className="text-primary font-bold text-xl">
                                    {(profile?.name || user?.name || user?.email)?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-gray-900 truncate leading-tight">
                    {profile?.name || user?.name || 'User'}
                </p>
                <p className="text-xs font-medium text-gray-500 truncate mb-2">{user?.email}</p>
                <div className={`inline-flex items-center px-2 py-0.5 rounded-full ${isExpert ? 'bg-primary/10 text-primary' : 'bg-blue-50 text-blue-700'} font-semibold text-xs`}>
                    {isExpert ? 'Expert account' : 'Client account'}
                </div>
            </div>
        </div>
    </div>
);

const DropdownLink = ({ to, icon: Icon, label, onClick, variant = "default" }) => (
    <Link
        to={to}
        onClick={onClick}
        className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-colors group mb-1",
            variant === "danger"
                ? "text-red-600 hover:bg-red-50"
                : "text-gray-700 hover:bg-gray-100 hover:text-primary"
        )}
    >
        <div className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
            variant === "danger"
                ? "bg-red-50 group-hover:bg-red-100"
                : "bg-gray-100 group-hover:bg-primary/10"
        )}>
            <Icon size={18} className={variant === "danger" ? "text-red-500" : "text-gray-600 group-hover:text-primary"} />
        </div>
        <span className="flex-1 tracking-tight">{label}</span>
        <ChevronRight size={14} className="text-gray-400" />
    </Link>
);

const ExpertDropdown = ({ profile, user, signOut, closeMenu }) => (
    <>
        <DropdownHeader profile={profile} user={user} isExpert={true} />

        <div className="px-5 py-4 border-b border-gray-100 bg-white">
            <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-semibold text-gray-500">Profile completion</span>
                <span className="text-[10px] font-black text-primary bg-white px-3 py-1 rounded-full shadow-sm border border-primary/10">
                    {profile?.profile_completeness || 0}%
                </span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-1">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${profile?.profile_completeness || 0}%` }}
                    transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
                    className="h-full bg-gradient-to-r from-primary via-blue-500 to-indigo-600 rounded-full relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]"></div>
                </motion.div>
            </div>
        </div>

        <div className="p-3">
            <DropdownLink to="/expert-dashboard" icon={Settings} label="Dashboard" onClick={closeMenu} />
            <DropdownLink to="/marketplace" icon={User} label="Browse Projects" onClick={closeMenu} />
            <DropdownLink to="/my-bids" icon={ChevronRight} label="My Proposals" onClick={closeMenu} />
            <div className="my-2 border-t border-gray-100 mx-2"></div>
            <DropdownLink to="/profile" icon={User} label="My Profile" onClick={closeMenu} />
            <DropdownLink to="/change-password" icon={Settings} label="Change Password" onClick={closeMenu} />
            <DropdownLink to={`/profile/view/${user?.id}`} icon={ChevronRight} label="View Public Profile" onClick={closeMenu} />
            <div className="my-2 border-t border-gray-100 mx-2"></div>
            <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-50"><LogOut size={18} /></span>
                <span className="flex-1 text-left">Log Out</span>
            </button>
        </div>
    </>
);

const ClientDropdown = ({ profile, user, signOut, closeMenu }) => (
    <>
        <DropdownHeader profile={profile} user={user} isExpert={false} />

        <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Workspace</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Verified Client</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Active Projects</p>
                    <p className="text-sm font-bold text-gray-900">{profile?.active_projects || 0}</p>
                </div>
                <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50 text-center">
                    <p className="text-xs text-gray-500 mb-0.5">Total Spend</p>
                    <p className="text-sm font-bold text-gray-900">${profile?.total_spend || '0'}</p>
                </div>
            </div>
        </div>

        <div className="p-3">
            <DropdownLink to="/project-hub" icon={Settings} label="Project Hub" onClick={closeMenu} />
            <DropdownLink to="/marketplace" icon={User} label="Browse Projects" onClick={closeMenu} />
            <DropdownLink to="/collaboration" icon={User} label="Collaborations" onClick={closeMenu} />
            <div className="my-2 border-t border-gray-100 mx-2"></div>
            <DropdownLink to="/profile" icon={User} label="Edit Profile" onClick={closeMenu} />
            <DropdownLink to="/change-password" icon={Settings} label="Change Password" onClick={closeMenu} />
            <div className="my-2 border-t border-gray-100 mx-2"></div>
            <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl text-red-600 hover:bg-red-50 transition-colors">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center bg-red-50"><LogOut size={18} /></span>
                <span className="flex-1 text-left">Log Out</span>
            </button>
        </div>
    </>
);

export { Navbar };
