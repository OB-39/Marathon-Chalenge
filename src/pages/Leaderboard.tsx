import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, User, Medal, Award, Flame, Video, Bell, Link as LinkIcon, ExternalLink, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { LeaderboardEntry, Announcement } from '../types/database';

const Leaderboard: React.FC = () => {
    const navigate = useNavigate();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLeaderboard();
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(6);

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    };

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, total_points, avatar_url, bio, university')
                .eq('is_registered', true)
                .eq('role', 'student')
                .order('total_points', { ascending: false });

            if (error) throw error;

            const leaderboardData: LeaderboardEntry[] = (data || []).map((profile, index) => ({
                ...profile,
                rank: index + 1,
            }));

            setLeaderboard(leaderboardData);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getPodiumIcon = (rank: number) => {
        switch (rank) {
            case 1: return <Trophy className="w-10 h-10 text-yellow-400" />;
            case 2: return <Medal className="w-10 h-10 text-slate-300" />;
            case 3: return <Award className="w-10 h-10 text-orange-600" />;
            default: return null;
        }
    };

    const topThree = leaderboard.slice(0, 3);
    const others = leaderboard.slice(3);

    return (
        <div className="min-h-screen bg-[#0F172A] relative overflow-hidden pb-20">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header / Nav */}
            <div className="relative z-50 max-w-7xl mx-auto px-6 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span>Retour</span>
                </button>

                <div className="text-center mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-2xl overflow-hidden shadow-lg glow-blue border border-white/10 mb-4"
                    >
                        <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
                    </motion.div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 font-display">Classement Général</h1>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Suivez en temps réel la progression des participants et l'évolution du challenge.
                    </p>
                </div>

                {/* Announcements Grid */}
                {announcements.length > 0 && (
                    <div className="mb-20">
                        <div className="flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-purple-400" />
                            <h2 className="text-xl font-bold text-white font-display">Dernières Nouvelles</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {announcements.map((ann, idx) => (
                                <motion.div
                                    key={ann.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="glass-strong rounded-2xl p-6 border border-white/10 hover:border-purple-500/30 transition-all group"
                                >
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2 rounded-lg ${ann.type === 'announcement' ? 'bg-blue-500/20 text-blue-400' :
                                            ann.type === 'motivation' ? 'bg-orange-500/20 text-orange-400' :
                                                ann.type === 'video' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                                            }`}>
                                            {ann.type === 'announcement' && <Bell className="w-4 h-4" />}
                                            {ann.type === 'motivation' && <Flame className="w-4 h-4" />}
                                            {ann.type === 'video' && <Video className="w-4 h-4" />}
                                            {ann.type === 'link' && <LinkIcon className="w-4 h-4" />}
                                        </div>
                                        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-black">{ann.type}</span>
                                    </div>
                                    <h4 className="font-bold text-white mb-2">{ann.title}</h4>
                                    <p className="text-sm text-gray-400 line-clamp-3 mb-4">{ann.content}</p>
                                    {ann.url && (
                                        <a href={ann.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300">
                                            Voir plus <ExternalLink className="w-3 h-3" />
                                        </a>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Leaderboard content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
                        <p className="text-gray-400">Chargement du classement...</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {/* Podium */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {topThree.map((entry) => (
                                <motion.div
                                    key={entry.id}
                                    whileHover={{ y: -10 }}
                                    onClick={() => navigate(`/u/${entry.id}`)}
                                    className="cursor-pointer relative"
                                >
                                    <div className={`glass-strong rounded-3xl p-8 border border-white/10 text-center h-full hover-glow transition-all ${entry.rank === 1 ? 'ring-2 ring-yellow-500/50 scale-105 z-10' : ''
                                        }`}>
                                        <div className="mb-6 flex justify-center">{getPodiumIcon(entry.rank)}</div>
                                        <div className="relative inline-block mb-4">
                                            {entry.avatar_url ? (
                                                <img src={entry.avatar_url} className="w-24 h-24 rounded-full border-4 border-white/10 object-cover" alt="" />
                                            ) : (
                                                <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-white/10">
                                                    <User className="w-12 h-12 text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">{entry.full_name || entry.email}</h3>
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold text-gray-400 uppercase tracking-widest">Rang #{entry.rank}</span>
                                        <div className="mt-6 pt-6 border-t border-white/5">
                                            <p className="text-3xl font-black text-blue-400">{entry.total_points} pts</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* List */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 mb-6 px-2">
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                                <h2 className="text-xl font-bold text-white font-display">Reste des participants</h2>
                            </div>
                            {others.map((entry) => (
                                <motion.div
                                    key={entry.id}
                                    whileHover={{ x: 10 }}
                                    onClick={() => navigate(`/u/${entry.id}`)}
                                    className="glass-panel p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:glass-strong transition-all border border-white/5 hover:border-blue-500/20"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-gray-400">
                                        #{entry.rank}
                                    </div>
                                    {entry.avatar_url ? (
                                        <img src={entry.avatar_url} className="w-12 h-12 rounded-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                            <User className="w-6 h-6 text-gray-600" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="font-bold text-white">{entry.full_name || entry.email}</p>
                                        <p className="text-xs text-gray-500 uppercase">{entry.university || 'Candidat'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-blue-400">{entry.total_points}</p>
                                        <p className="text-[10px] text-gray-600 font-bold uppercase">Points</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
