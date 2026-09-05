import React from 'react';
import {
    ChevronLeft, MapPin, Star, DollarSign, CheckCircle,
    Briefcase, Award, Globe, Shield, Clock
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

const ExpertDetail = ({ expert, onBack, isOwnProfile, onEditProfile, onHire }) => {
    if (!expert) return null;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            <Button
                variant="ghost"
                onClick={onBack}
                className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
                <ChevronLeft size={20} />
                Back to Experts
            </Button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Core Info */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 text-center">
                        <div className="relative inline-block mx-auto mb-4">
                            <img
                                src={expert.profile_image_url || `https://ui-avatars.com/api/?name=${expert.name}`}
                                alt={expert.name}
                                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-gray-100"
                            />
                            {(expert.vetting_status === 'verified' || expert.verified) && (
                                <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm">
                                    <CheckCircle size={24} className="text-blue-500 fill-blue-500 text-white" />
                                </div>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold text-gray-900 mb-1">{expert.name}</h1>
                        <p className="text-primary font-medium mb-4">{expert.title || 'Expert'}</p>

                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-6">
                            <MapPin size={16} />
                            <span>{expert.location || 'Remote'}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-4 mb-6">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Rate</p>
                                <p className="font-bold text-gray-900 text-lg">${expert.hourly_rate || 0}/hr</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Rating</p>
                                <div className="flex items-center justify-center gap-1 font-bold text-gray-900 text-lg">
                                    <Star size={16} className="text-yellow-400 fill-yellow-400" />
                                    {expert.rating || '5.0'}
                                </div>
                            </div>
                        </div>


                        <div className="space-y-3">
                            <Button className="w-full" onClick={() => onHire && onHire(expert)}>Hire {expert.name.split(' ')[0]}</Button>
                            <Button variant="secondary" className="w-full">Send Message</Button>
                            {isOwnProfile && (
                                <Button variant="outline" className="w-full mt-2" onClick={() => onEditProfile && onEditProfile()}>
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Globe size={18} />
                            Languages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {/* Placeholder for languages if not in schema yet */}
                            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">English</span>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Detailed Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* About */}
                    <Card className="p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                            {expert.bio || "No biography provided yet."}
                        </p>
                    </Card>

                    {/* Skills */}
                    <Card className="p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Award size={20} className="text-primary" />
                            Skills & Expertise
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {(expert.skills || []).map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-100 hover:border-primary/30 transition-colors"
                                >
                                    {skill}
                                </span>
                            ))}
                            {(!expert.skills || expert.skills.length === 0) && (
                                <span className="text-gray-400 italic">No skills listed</span>
                            )}
                        </div>
                    </Card>

                    {/* Portfolio */}
                    <Card className="p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Briefcase size={20} className="text-primary" />
                            Portfolio
                        </h2>
                        {expert.portfolio_items && expert.portfolio_items.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {expert.portfolio_items.map((item) => (
                                    <div key={item.id} className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                                        <div className="h-48 bg-gray-100 relative overflow-hidden">
                                            {item.imageUrl ? (
                                                <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <Briefcase size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-bold text-gray-900 mb-1">{item.title}</h3>
                                            <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500">No portfolio items available.</p>
                            </div>
                        )}
                    </Card>

                    {/* Vetting Status Detailed */}
                    <Card className="p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield size={20} className="text-primary" />
                            Verification
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className={expert.vetting_status === 'verified' ? "text-success" : "text-gray-300"} />
                                    <span className="font-medium text-gray-900">Identity Verified</span>
                                </div>
                                {expert.vetting_status === 'verified' && <span className="text-xs text-success bg-success/10 px-2 py-1 rounded">Verified</span>}
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CheckCircle size={20} className={expert.vetting_status === 'verified' ? "text-success" : "text-gray-300"} />
                                    <span className="font-medium text-gray-900">Skills Assessment</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
};

export default ExpertDetail;
