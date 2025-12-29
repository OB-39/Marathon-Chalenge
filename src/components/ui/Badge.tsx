import React from 'react';

interface BadgeProps {
    status: 'pending' | 'validated' | 'rejected';
    children?: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({ status, children }) => {
    const variants = {
        pending: 'badge-neo bg-warning-light text-warning-dark border-warning-dark/10',
        validated: 'badge-neo bg-success-light text-success-dark border-success-dark/10',
        rejected: 'badge-neo bg-danger-light text-danger-dark border-danger-dark/10',
    };

    const labels = {
        pending: 'En attente',
        validated: 'Validé',
        rejected: 'Refusé',
    };

    return (
        <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${variants[status]}`}
        >
            {children || labels[status]}
        </span>
    );
};

export default Badge;
