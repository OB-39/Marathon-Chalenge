import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { LeaderboardEntry } from '../types/database';
import { useAuth } from '../contexts/AuthContext';
import ProfileDropdown from '../components/ProfileDropdown';
import EditProfileModal from '../components/EditProfileModal';
import { Trophy, Medal, Award, User, TrendingUp, LayoutDashboard } from 'lucide-react';

const Leaderboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            // Fetch profiles with validated submissions count
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, total_points, avatar_url, bio, university')
                .eq('is_registered', true)
                .eq('role', 'student')
                .order('total_points', { ascending: false });

            if (error) throw error;

            // Get validated days count for each user
            const leaderboardData: LeaderboardEntry[] = await Promise.all(
                (data || []).map(async (profile: any, index: number) => {
                    const { count } = await supabase
                        .from('submissions')
                        .select('*', { count: 'exact', head: true })
                        .eq('user_id', profile.id)
                        .eq('status', 'validated');

                    return {
                        ...profile,
                        rank: index + 1,
                        validated_days: count || 0,
                    };
                })
            );

            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPodiumIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Trophy className="w-8 h-8 text-warning-DEFAULT" />;
            case 2:
                return <Medal className="w-8 h-8 text-surface-400" />;
            case 3:
                return <Award className="w-8 h-8 text-warning-dark" />;
            default:
                return null;
        }
    };

    const getPodiumColor = (rank: number) => {
        switch (rank) {
            case 1:
                return 'from-warning-400 to-warning-600';
            case 2:
                return 'from-surface-300 to-surface-500';
            case 3:
                return 'from-warning-600 to-warning-800';
            default:
                return 'from-primary to-success';
        }
    };

    const topThree = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass-strong border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-2xl shadow-lg glow-blue">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white font-display">
                                Marathon Challenge
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            {user ? (
                                <>
                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium border border-white/10 rounded-xl hover:bg-white/5"
                                    >
                                        <LayoutDashboard className="w-4 h-4 text-blue-400" />
                                        Tableau de bord
                                    </button>
                                    <ProfileDropdown onEditProfile={() => setIsEditProfileOpen(true)} />
                                </>
                            ) : (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/login')}
                                    className="px-4 py-2 btn-primary-neo"
                                >
                                    Se connecter
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-12 text-center">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-display">
                        Classement des Créateurs
                    </h1>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                        Découvrez les talents du Marathon Challenge - 15 jours de création de contenu pour briller.
                    </p>

                    {/* CTA Button */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(user ? '/dashboard' : '/login')}
                        className="inline-flex items-center gap-2 px-8 py-4 btn-primary-neo"
                    >
                        {user ? (
                            <>
                                <LayoutDashboard className="w-5 h-5" />
                                Accéder à mon Dashboard
                            </>
                        ) : (
                            <>
                                <Trophy className="w-5 h-5" />
                                Participer au Challenge
                            </>
                        )}
                    </motion.button>
                </motion.div>
            </section>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {loading ? (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-64 glass-panel rounded-2xl animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Podium - Top 3 */}
                        {topThree.length > 0 && (
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                variants={{
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.1,
                                        },
                                    },
                                }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12"
                            >
                                {topThree.map((entry) => (
                                    <motion.div
                                        key={entry.id}
                                        variants={{
                                            hidden: { opacity: 0, scale: 0.8 },
                                            visible: { opacity: 1, scale: 1 },
                                        }}
                                        onClick={() => navigate(`/u/${entry.id}`)}
                                        className="transform hover:z-10"
                                    >
                                        <div className="glass-strong rounded-2xl relative overflow-hidden cursor-pointer h-full border border-white/10 hover-glow transition-all">
                                            {/* Gradient Background */}
                                            <div
                                                className={`absolute inset-0 bg-gradient-to-br ${getPodiumColor(
                                                    entry.rank
                                                )} opacity-10`}
                                            />

                                            <div className="relative text-center space-y-4 p-6">
                                                {/* Rank Icon */}
                                                <div className="flex justify-center">
                                                    {getPodiumIcon(entry.rank)}
                                                </div>

                                                {/* Avatar */}
                                                <div className="flex justify-center">
                                                    {entry.avatar_url ? (
                                                        <img
                                                            src={entry.avatar_url}
                                                            alt={entry.full_name || 'User'}
                                                            className="w-16 h-16 md:w-24 md:h-24 rounded-full border-2 md:border-4 border-white shadow-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-blue-500/20 flex items-center justify-center border-2 md:border-4 border-blue-500/30 shadow-lg">
                                                            <User className="w-8 h-8 md:w-12 md:h-12 text-blue-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Info */}
                                                <div>
                                                    <h3 className="text-xl font-bold text-white font-display">
                                                        {entry.full_name || entry.email}
                                                    </h3>
                                                    <p className="text-sm text-gray-400 font-medium">
                                                        Rang #{entry.rank}
                                                    </p>
                                                </div>

                                                {/* Stats */}
                                                <div className="flex justify-around pt-4 border-t border-white/10">
                                                    <div>
                                                        <p className="text-xl md:text-2xl font-bold text-primary-glow font-display">
                                                            {entry.total_points}
                                                        </p>
                                                        <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide">Points</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xl md:text-2xl font-bold text-success-glow font-display">
                                                            {entry.validated_days}
                                                        </p>
                                                        <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wide">Jours</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}

                        {/* Rest of Leaderboard */}
                        {others.length > 0 && (
                            <div className="space-y-4">
                                <h2 className="text-2xl font-bold text-white mb-4 font-display flex items-center gap-3">
                                    <TrendingUp className="w-6 h-6 text-blue-400" />
                                    Classement Complet
                                </h2>

                                <motion.div
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        visible: {
                                            transition: {
                                                staggerChildren: 0.03,
                                            },
                                        },
                                    }}
                                    className="space-y-3"
                                >
                                    {others.map((entry) => (
                                        <motion.div
                                            key={entry.id}
                                            variants={{
                                                hidden: { opacity: 0, x: -20 },
                                                visible: { opacity: 1, x: 0 },
                                            }}
                                            onClick={() => navigate(`/u/${entry.id}`)}
                                            className="glass-panel rounded-xl p-4 cursor-pointer hover:glass-strong transition-all border border-white/10 hover:border-blue-500/30"
                                        >
                                            <div className="flex items-center gap-4">
                                                {/* Rank */}
                                                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/60 flex items-center justify-center border border-white/10">
                                                    <span className="text-base md:text-lg font-bold text-gray-300">
                                                        #{entry.rank}
                                                    </span>
                                                </div>

                                                {/* Avatar */}
                                                {entry.avatar_url ? (
                                                    <img
                                                        src={entry.avatar_url}
                                                        alt={entry.full_name || 'User'}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border-2 border-blue-500/30">
                                                        <User className="w-6 h-6 text-blue-400" />
                                                    </div>
                                                )}

                                                {/* Name */}
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-white">
                                                        {entry.full_name || entry.email}
                                                    </h3>
                                                    <p className="text-sm text-gray-400 truncate max-w-[200px]">
                                                        Étudiant
                                                    </p>
                                                </div>

                                                {/* Stats */}
                                                <div className="hidden sm:flex items-center gap-8 text-sm mr-4">
                                                    <div className="text-center">
                                                        <p className="font-bold text-primary-glow text-lg">{entry.total_points}</p>
                                                        <p className="text-xs text-gray-400">Points</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-bold text-success-glow text-lg">{entry.validated_days}</p>
                                                        <p className="text-xs text-gray-400">Jours</p>
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <div className="text-gray-500">
                                                    <TrendingUp className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modals */}
            <EditProfileModal
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                onSuccess={() => {
                    fetchLeaderboard();
                }}
            />
        </div>
    );
};

export default Leaderboard;
