import React from 'react';
import { Menu, Bell, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileHeaderProps {
    onMenuClick: () => void;
    title: string;
    subtitle?: string;
    unreadCount?: number;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick, title, subtitle, unreadCount = 0 }) => {
    return (
        <header className="md:hidden glass-strong border-b border-white/10 sticky top-0 z-40">
            <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                    {/* Menu Button */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onMenuClick}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <Menu className="w-6 h-6 text-white" />
                    </motion.button>

                    {/* Title */}
                    <div className="flex-1 text-center">
                        <div className="flex items-center justify-center gap-2">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-lg">
                                <Trophy className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h1 className="text-base font-bold text-white font-display">
                                    {title}
                                </h1>
                                {subtitle && (
                                    <p className="text-xs text-gray-400">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors relative"
                    >
                        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-blue-400' : 'text-gray-400'}`} />
                        {/* Notification Badge */}
                        <AnimatePresence>
                            {unreadCount > 0 && (
                                <motion.span
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-[#0F172A]"
                                >
                                    {unreadCount}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>
        </header>
    );
};

export default MobileHeader;
