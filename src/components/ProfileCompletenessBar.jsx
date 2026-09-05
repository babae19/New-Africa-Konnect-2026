import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

const ProfileCompletenessBar = ({ userId, onUpdate }) => {
    const [completeness, setCompleteness] = useState(0);
    const [loading, setLoading] = useState(true);
    const [missingFields, setMissingFields] = useState([]);

    useEffect(() => {
        loadCompleteness();
    }, [userId]);

    const loadCompleteness = async () => {
        try {
            const data = await api.experts.getCompleteness(userId);
            setCompleteness(data.completeness || 0);
            calculateMissingFields(data.completeness);
        } catch (error) {
            console.error('Failed to load completeness:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateMissingFields = (percent) => {
        const missing = [];
        if (percent < 100) {
            if (percent < 10) missing.push('Title');
            if (percent < 25) missing.push('Bio');
            if (percent < 35) missing.push('Location');
            if (percent < 50) missing.push('Skills');
            if (percent < 60) missing.push('Skill Categories');
            if (percent < 70) missing.push('Hourly Rate');
            if (percent < 80) missing.push('Profile Image');
            if (percent < 90) missing.push('Portfolio Items');
            if (percent < 100) missing.push('Availability Calendar');
        }
        setMissingFields(missing);
    };

    const getColor = () => {
        if (completeness >= 90) return 'bg-green-500';
        if (completeness >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getMessage = () => {
        if (completeness >= 90) return 'Your profile is ready for matching!';
        if (completeness >= 70) return 'Almost there! Complete your profile to get matched.';
        return 'Complete your profile to start receiving project invitations.';
    };

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Progress Bar */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                        Profile Completeness
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                        {completeness}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full ${getColor()} transition-all duration-500 ease-out`}
                        style={{ width: `${completeness}%` }}
                    />
                </div>
            </div>

            {/* Message */}
            <div className={`flex items-start space-x-2 p-3 rounded-lg ${completeness >= 90 ? 'bg-green-50 text-green-800' :
                    completeness >= 70 ? 'bg-yellow-50 text-yellow-800' :
                        'bg-red-50 text-red-800'
                }`}>
                {completeness >= 90 ? (
                    <CheckCircle size={20} className="mt-0.5 flex-shrink-0" />
                ) : (
                    <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1">
                    <p className="text-sm font-medium">{getMessage()}</p>
                    {missingFields.length > 0 && (
                        <p className="text-xs mt-1">
                            Missing: {missingFields.join(', ')}
                        </p>
                    )}
                </div>
            </div>

            {/* Profile Completion Requirement */}
            {completeness < 90 && (
                <div className="flex items-start space-x-2 p-3 bg-blue-50 text-blue-800 rounded-lg">
                    <TrendingUp size={20} className="mt-0.5 flex-shrink-0" />
                    <p className="text-xs">
                        <strong>Note:</strong> You need at least 90% profile completion to be matched with clients and receive project invitations.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProfileCompletenessBar;
