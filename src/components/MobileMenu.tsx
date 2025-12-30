import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, ClipboardList, BarChart3, User, LogOut, Home, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface MobileMenuProps {
    isOpen: boolean;
    onClose: () => void;
    currentSection: string;
    onSectionChange: (section: string) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose, currentSection, onSectionChange }) => {
    const navigate = useNavigate();
    const { signOut, profile } = useAuth();

    const menuItems = [
        { id: 'dashboard', label: 'Tableau de bord', icon: Home, color: 'blue' },
        { id: 'submissions', label: 'Mes Soumissions', icon: ClipboardList, color: 'purple' },
        { id: 'messages', label: 'Messages', icon: MessageSquare, color: 'blue' },
        { id: 'statistics', label: 'Statistiques', icon: BarChart3, color: 'green' },
        { id: 'leaderboard', label: 'Classement', icon: Trophy, color: 'yellow' },
    ];

    const handleItemClick = (itemId: string) => {
        if (itemId === 'leaderboard') {
            navigate('/leaderboard');
            onClose();
        } else {
            onSectionChange(itemId);
            onClose();
        }
    };

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Menu Panel */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] glass-strong border-r border-white/10 z-[101] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-white font-display">Menu</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* User Info */}
                            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">
                                        {profile?.full_name || 'Utilisateur'}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {profile?.email}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="p-4 space-y-2">
                            {menuItems.map((item, index) => {
                                const Icon = item.icon;
                                const isActive = currentSection === item.id;

                                return (
                                    <motion.button
                                        key={item.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => handleItemClick(item.id)}
                                        className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${isActive
                                            ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30'
                                            : 'hover:bg-white/5 border border-transparent'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-lg ${item.color === 'blue' ? 'bg-blue-500/20' :
                                            item.color === 'purple' ? 'bg-purple-500/20' :
                                                item.color === 'green' ? 'bg-green-500/20' :
                                                    'bg-yellow-500/20'
                                            }`}>
                                            <Icon className={`w-5 h-5 ${item.color === 'blue' ? 'text-blue-400' :
                                                item.color === 'purple' ? 'text-purple-400' :
                                                    item.color === 'green' ? 'text-green-400' :
                                                        'text-yellow-400'
                                                }`} />
                                        </div>
                                        <span className={`font-medium ${isActive ? 'text-white' : 'text-gray-300'
                                            }`}>
                                            {item.label}
                                        </span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeIndicator"
                                                className="ml-auto w-2 h-2 bg-blue-500 rounded-full"
                                            />
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-gradient-to-t from-black/50">
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-red-500/10 border border-red-500/20 transition-all"
                            >
                                <div className="p-2 rounded-lg bg-red-500/20">
                                    <LogOut className="w-5 h-5 text-red-400" />
                                </div>
                                <span className="font-medium text-red-400">Déconnexion</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default MobileMenu;
