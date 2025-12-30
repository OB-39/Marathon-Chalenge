import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Target, Zap, Award, Calendar, CheckCircle } from 'lucide-react';
import type { Submission } from '../types/database';
import ProgressChart from './ProgressChart';
import PerformanceChart from './PerformanceChart';

interface StatisticsSectionProps {
    submissions: Submission[];
    totalPoints: number;
    userRank: number;
    totalParticipants: number;
}

const StatisticsSection: React.FC<StatisticsSectionProps> = ({
    submissions,
    userRank,
    totalParticipants
}) => {
    const validatedCount = submissions.filter(s => s.status === 'validated').length;
    const pendingCount = submissions.filter(s => s.status === 'pending').length;
    const rejectedCount = submissions.filter(s => s.status === 'rejected').length;
    const totalSubmissions = submissions.length;

    const averageScore = submissions
        .filter(s => s.score_awarded !== null)
        .reduce((acc, s) => acc + (s.score_awarded || 0), 0) / (validatedCount || 1);

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

    const stats = [
        {
            label: 'Taux de réussite',
            value: totalSubmissions > 0 ? `${Math.round((validatedCount / totalSubmissions) * 100)}%` : '0%',
            icon: Target,
            color: 'blue',
            bgColor: 'from-blue-500/20 to-cyan-500/20',
            borderColor: 'border-blue-500/30'
        },
        {
            label: 'Score moyen',
            value: `${averageScore.toFixed(1)}/10`,
            icon: Award,
            color: 'yellow',
            bgColor: 'from-yellow-500/20 to-orange-500/20',
            borderColor: 'border-yellow-500/30'
        },
        {
            label: 'Jours consécutifs',
            value: validatedCount.toString(),
            icon: Calendar,
            color: 'green',
            bgColor: 'from-green-500/20 to-emerald-500/20',
            borderColor: 'border-green-500/30'
        },
        {
            label: 'Classement',
            value: `#${userRank}/${totalParticipants}`,
            icon: TrendingUp,
            color: 'purple',
            bgColor: 'from-purple-500/20 to-pink-500/20',
            borderColor: 'border-purple-500/30'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-white font-display mb-1">
                    Statistiques
                </h2>
                <p className="text-sm text-gray-400">
                    Analyse de vos performances
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.1 }}
                            className={`glass-strong rounded-xl p-4 border bg-gradient-to-br ${stat.bgColor} ${stat.borderColor}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className={`p-2 rounded-lg ${stat.color === 'blue' ? 'bg-blue-500/20' :
                                    stat.color === 'yellow' ? 'bg-yellow-500/20' :
                                        stat.color === 'green' ? 'bg-green-500/20' :
                                            'bg-purple-500/20'
                                    }`}>
                                    <Icon className={`w-4 h-4 ${stat.color === 'blue' ? 'text-blue-400' :
                                        stat.color === 'yellow' ? 'text-yellow-400' :
                                            stat.color === 'green' ? 'text-green-400' :
                                                'text-purple-400'
                                        }`} />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white mb-1">
                                {stat.value}
                            </p>
                            <p className="text-xs text-gray-400">
                                {stat.label}
                            </p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Performance Overview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-strong rounded-xl p-4 border border-white/10"
            >
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    Vue d'ensemble
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <p className="text-xl font-bold text-white">{validatedCount}</p>
                        <p className="text-xs text-gray-400">Validés</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Calendar className="w-6 h-6 text-orange-400" />
                        </div>
                        <p className="text-xl font-bold text-white">{pendingCount}</p>
                        <p className="text-xs text-gray-400">En attente</p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <Target className="w-6 h-6 text-red-400" />
                        </div>
                        <p className="text-xl font-bold text-white">{rejectedCount}</p>
                        <p className="text-xs text-gray-400">Rejetés</p>
                    </div>
                </div>
            </motion.div>

            {/* Charts */}
            <div className="space-y-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    <ProgressChart data={progressData} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <PerformanceChart
                        validated={validatedCount}
                        pending={pendingCount}
                        rejected={rejectedCount}
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default StatisticsSection;
