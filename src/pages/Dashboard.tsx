import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { ChallengeDay, Submission } from '../types/database';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import SubmissionModal from '../components/SubmissionModal';
import ProfileDropdown from '../components/ProfileDropdown';
import EditProfileModal from '../components/EditProfileModal';
import ProgressChart from '../components/ProgressChart';
import PerformanceChart from '../components/PerformanceChart';
import RankingCard from '../components/RankingCard';
import { Trophy, Lock, CheckCircle2, Clock, XCircle } from 'lucide-react';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [challengeDays, setChallengeDays] = useState<ChallengeDay[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [userRank, setUserRank] = useState<number>(0);
    const [totalParticipants, setTotalParticipants] = useState<number>(0);

    useEffect(() => {
        fetchData();
        fetchRanking();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch challenge days
            const { data: daysData, error: daysError } = await supabase
                .from('challenge_days')
                .select('*')
                .order('day_number');

            if (daysError) throw daysError;
            setChallengeDays(daysData || []);

            // Fetch user submissions
            if (user) {
                const { data: submissionsData, error: submissionsError } = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('user_id', user.id);

                if (submissionsError) throw submissionsError;
                setSubmissions(submissionsData || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRanking = async () => {
        try {
            const { data: allProfiles, error } = await supabase
                .from('profiles')
                .select('id, total_points')
                .eq('is_registered', true)
                .eq('role', 'student')
                .order('total_points', { ascending: false });

            if (error) throw error;

            const rank = allProfiles?.findIndex(p => p.id === user?.id) ?? -1;
            setUserRank(rank + 1);
            setTotalParticipants(allProfiles?.length || 0);
        } catch (error) {
            console.error('Error fetching ranking:', error);
        }
    };

    const getSubmissionForDay = (dayNumber: number) => {
        return submissions.find((s) => s.day_number === dayNumber);
    };

    const getDayStatus = (day: ChallengeDay) => {
        const submission = getSubmissionForDay(day.day_number);
        if (submission) {
            return submission.status;
        }

        // Day 1 is always active
        if (day.day_number === 1) {
            return 'active';
        }

        // Other days unlock when the previous day is validated
        const previousDaySubmission = getSubmissionForDay(day.day_number - 1);
        if (previousDaySubmission && previousDaySubmission.status === 'validated') {
            return 'active';
        }

        return 'locked';
    };

    const validatedCount = submissions.filter((s) => s.status === 'validated').length;
    const pendingCount = submissions.filter((s) => s.status === 'pending').length;
    const rejectedCount = submissions.filter((s) => s.status === 'rejected').length;
    const progressPercentage = (validatedCount / 15) * 100;

    // Données pour le graphique d'évolution
    const progressData = submissions
        .filter(s => s.status === 'validated')
        .sort((a, b) => a.day_number - b.day_number)
        .reduce((acc: Array<{ day: number; points: number }>, sub, index) => {
            const totalPoints = submissions
                .filter(s => s.status === 'validated')
                .slice(0, index + 1)
                .reduce((sum, s) => sum + (s.score_awarded || 0), 0);

            acc.push({ day: sub.day_number, points: totalPoints });
            return acc;
        }, []);

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass-strong border-b border-white/10 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-2xl shadow-lg glow-blue">
                                <Trophy className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-white font-display tracking-tight">
                                    Marathon Challenge
                                </h1>
                                <p className="text-sm text-gray-300/80 font-medium">
                                    Tableau de bord
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/leaderboard')}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium border border-white/10 rounded-xl hover:bg-white/5 text-sm md:text-base"
                            >
                                <Trophy className="w-4 h-4 text-blue-400" />
                                <span className="hidden xs:inline">Classement</span>
                            </button>
                            <ProfileDropdown onEditProfile={() => setIsEditProfileOpen(true)} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards Row */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
                >
                    <div className="glass-strong rounded-2xl p-6 border border-blue-500/30 hover-glow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1 font-semibold uppercase tracking-wide">
                                    Points Totaux
                                </p>
                                <p className="text-5xl font-bold text-white font-display text-primary-glow">
                                    {profile?.total_points || 0}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-lg glow-blue">
                                <Trophy className="w-10 h-10 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-strong rounded-2xl p-6 border border-green-500/30 hover:glow-green transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-400 mb-1 font-semibold uppercase tracking-wide">
                                    Jours Validés
                                </p>
                                <p className="text-5xl font-bold text-white font-display text-success-glow">
                                    {validatedCount}/15
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-2xl shadow-lg glow-green">
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className="glass-strong rounded-2xl p-6 border border-purple-500/30 hover:glow-purple transition-all">
                        <div>
                            <p className="text-sm text-gray-400 mb-3 font-semibold uppercase tracking-wide">
                                Progression
                            </p>
                            <div className="w-full bg-slate-900/60 rounded-full h-4 mb-3 overflow-hidden shadow-inner border border-white/10">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-4 rounded-full shadow-lg relative"
                                    style={{
                                        boxShadow: '0 0 20px rgba(139, 92, 246, 0.6)'
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                                </motion.div>
                            </div>
                            <p className="text-sm text-white font-bold">
                                {progressPercentage.toFixed(0)}% complété
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Charts and Ranking Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                        <ProgressChart data={progressData} />
                    </div>
                    <div>
                        <RankingCard
                            rank={userRank}
                            totalParticipants={totalParticipants}
                        />
                    </div>
                </div>

                {/* Performance Chart */}
                <div className="mb-8">
                    <PerformanceChart
                        validated={validatedCount}
                        pending={pendingCount}
                        rejected={rejectedCount}
                    />
                </div>

                {/* Challenge Days Grid */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
                        Les 15 Jours du Challenge
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(15)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"
                                />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren: 0.05,
                                    },
                                },
                            }}
                        >
                            {challengeDays.map((day) => {
                                const status = getDayStatus(day);
                                const submission = getSubmissionForDay(day.day_number);

                                return (
                                    <motion.div
                                        key={day.day_number}
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: { opacity: 1, y: 0 },
                                        }}
                                    >
                                        <Card
                                            variant="default"
                                            hover={status === 'active'}
                                            onClick={() => status === 'active' && setSelectedDay(day.day_number)}
                                            className={`relative overflow-hidden transition-all duration-300 ${status === 'locked'
                                                ? 'opacity-40 grayscale cursor-not-allowed border-white/5'
                                                : status === 'active'
                                                    ? 'cursor-pointer border-blue-500/50 glow-blue ring-1 ring-blue-500/20'
                                                    : 'border-white/10'
                                                }`}
                                        >
                                            {/* Status Badge */}
                                            <div className="absolute top-4 right-4">
                                                {status === 'locked' && (
                                                    <div className="bg-slate-800/80 p-2 rounded-xl backdrop-blur-md border border-white/10">
                                                        <Lock className="w-4 h-4 text-gray-500" />
                                                    </div>
                                                )}
                                                {status === 'validated' && (
                                                    <div className="bg-green-500/20 p-2 rounded-xl backdrop-blur-md border border-green-500/30">
                                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                    </div>
                                                )}
                                                {status === 'pending' && (
                                                    <div className="bg-orange-500/20 p-2 rounded-xl backdrop-blur-md border border-orange-500/30">
                                                        <Clock className="w-4 h-4 text-orange-400" />
                                                    </div>
                                                )}
                                                {status === 'rejected' && (
                                                    <div className="bg-red-500/20 p-2 rounded-xl backdrop-blur-md border border-red-500/30">
                                                        <XCircle className="w-4 h-4 text-red-400" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm font-bold text-blue-400 mb-1 uppercase tracking-wider">
                                                        Jour {day.day_number}
                                                    </p>
                                                    <h3 className="text-xl font-bold text-white font-display">
                                                        {day.theme_title}
                                                    </h3>
                                                </div>

                                                <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
                                                    {day.description}
                                                </p>

                                                {submission && (
                                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                                        <Badge status={submission.status} />
                                                        {submission.score_awarded !== null && (
                                                            <span className="ml-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                                Score: {submission.score_awarded}/10
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {status === 'active' && !submission && (
                                                    <div className="pt-2">
                                                        <p className="text-sm font-medium text-primary">
                                                            Cliquez pour soumettre →
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {selectedDay !== null && (
                <SubmissionModal
                    isOpen={selectedDay !== null}
                    onClose={() => setSelectedDay(null)}
                    dayNumber={selectedDay}
                    onSuccess={() => {
                        setSelectedDay(null);
                        fetchData();
                        fetchRanking();
                    }}
                />
            )}

            <EditProfileModal
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                onSuccess={() => {
                    fetchData();
                }}
            />
        </div>
    );
};

export default Dashboard;
