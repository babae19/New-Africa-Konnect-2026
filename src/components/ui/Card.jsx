import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, children, hoverEffect = false, ...props }, ref) => {
    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={hoverEffect ? { y: -5, transition: { duration: 0.2 } } : {}}
            className={cn(
                'rounded-2xl bg-white/60 backdrop-blur-md border border-white/20 shadow-xl shadow-gray-200/50 overflow-hidden',
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
});

Card.displayName = 'Card';

export { Card };
