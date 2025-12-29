import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface CardProps extends HTMLMotionProps<'div'> {
    variant?: 'default' | 'glass' | 'bordered';
    hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ children, variant = 'default', hover = false, className = '', ...props }, ref) => {
        const baseStyles = 'rounded-xl p-6 transition-smooth';

        const variants = {
            default: 'neo-card',
            glass: 'glass-panel rounded-2xl p-6',
            bordered:
                'bg-surface-50 border-2 border-surface-200 rounded-2xl shadow-none',
        };

        const hoverStyles = hover ? 'card-hover cursor-pointer' : '';

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`${baseStyles} ${variants[variant]} ${hoverStyles} ${className}`}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);

Card.displayName = 'Card';

export default Card;
