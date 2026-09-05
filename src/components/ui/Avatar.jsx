import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Avatar = ({ src, name, className, size = 'md' }) => {
    const getInitials = (name) => {
        if (!name) return '??';
        return name
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    const sizeClasses = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-10 h-10 text-sm',
        lg: 'w-12 h-12 text-base',
        xl: 'w-16 h-16 text-xl',
    };

    return (
        <div
            className={twMerge(
                'rounded-full flex items-center justify-center font-bold overflow-hidden bg-gray-200 text-gray-600',
                sizeClasses[size],
                className
            )}
        >
            {src ? (
                <img
                    src={src}
                    alt={name || 'Avatar'}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span>{getInitials(name)}</span>
            )}
        </div>
    );
};
