import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RankingCardProps {
    rank: number;
    totalParticipants: number;
    previousRank?: number;
}

const RankingCard: React.FC<RankingCardProps> = ({ rank, totalParticipants, previousRank }) => {
    const getRankChange = () => {
        if (!previousRank) return 'stable';
        if (rank < previousRank) return 'up';
        if (rank > previousRank) return 'down';
        return 'stable';
    };

    const rankChange = getRankChange();

    const getRankBadge = () => {
        if (rank === 1) return { label: '🥇 Champion', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' };
        if (rank === 2) return { label: '🥈 Vice-champion', color: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' };
        if (rank === 3) return { label: '🥉 Podium', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' };
        if (rank <= 10) return { label: '⭐ Top 10', color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400' };
        if (rank <= 20) return { label: '🌟 Top 20', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' };
        return { label: '👤 Participant', color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' };
    };

    const badge = getRankBadge();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-primary-50 to-success-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl border-2 border-primary dark:border-primary-700 p-6"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Classement
                    </h3>
                </div>

                {/* Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                    {badge.label}
                </span>
            </div>

            {/* Rank Display */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-primary">#{rank}</span>
                        <span className="text-lg text-slate-500 dark:text-slate-400">
                            / {totalParticipants}
                        </span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        participants
                    </p>
                </div>

                {/* Trend Indicator */}
                <div className="flex flex-col items-center">
                    {rankChange === 'up' && (
                        <div className="flex flex-col items-center">
                            <TrendingUp className="w-8 h-8 text-success" />
                            <span className="text-xs text-success font-semibold mt-1">
                                +{previousRank! - rank}
                            </span>
                        </div>
                    )}
                    {rankChange === 'down' && (
                        <div className="flex flex-col items-center">
                            <TrendingDown className="w-8 h-8 text-error" />
                            <span className="text-xs text-error font-semibold mt-1">
                                -{rank - previousRank!}
                            </span>
                        </div>
                    )}
                    {rankChange === 'stable' && (
                        <div className="flex flex-col items-center">
                            <Minus className="w-8 h-8 text-slate-400" />
                            <span className="text-xs text-slate-400 font-semibold mt-1">
                                Stable
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default RankingCard;
