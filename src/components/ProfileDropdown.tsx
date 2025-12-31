import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Settings, Eye, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ProfileDropdownProps {
    onEditProfile: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ onEditProfile }) => {
    const { user, profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
            >
                {/* Avatar */}
                {profile?.avatar_url ? (
                    <img
                        key={profile.avatar_url}
                        src={profile.avatar_url}
                        alt={profile.full_name || 'User'}
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/30 shadow-sm"
                    />
                ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/30">
                        <User className="w-5 h-5 text-blue-400" />
                    </div>
                )}

                {/* Name and Arrow */}
                <div className="hidden md:flex items-center gap-2">
                    <div className="text-left">
                        <p className="text-sm font-semibold text-white">
                            {profile?.full_name || profile?.email}
                        </p>
                        <p className="text-xs text-gray-400">
                            {profile?.total_points || 0} points
                        </p>
                    </div>
                    <ChevronDown
                        className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''
                            }`}
                    />
                </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-64 glass-strong rounded-2xl border border-white/10 overflow-hidden z-50 shadow-2xl"
                    >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
                            <p className="text-sm font-semibold text-white">
                                {profile?.full_name}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>

                        {/* Menu Items */}
                        <div className="p-2 space-y-1">
                            <button
                                onClick={() => {
                                    onEditProfile();
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg flex items-center gap-3 transition-colors font-medium group"
                            >
                                <Settings className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
                                Modifier mon profil
                            </button>

                            <button
                                onClick={() => {
                                    navigate(`/u/${user?.id}`);
                                    setIsOpen(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg flex items-center gap-3 transition-colors font-medium group"
                            >
                                <Eye className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
                                Voir mon profil public
                            </button>

                            <div className="border-t border-white/10 my-1"></div>

                            <button
                                onClick={handleSignOut}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 rounded-lg flex items-center gap-3 transition-colors font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                Déconnexion
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileDropdown;
