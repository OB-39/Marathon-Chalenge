import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, Calendar, User, Award, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Submission } from '../types/database';

interface ValidatedPostsFeedProps {
    isOpen: boolean;
    onClose: () => void;
}

// Helper function to get max score based on day number
const getMaxScoreForDay = (dayNumber: number): number => {
    return dayNumber >= 4 && dayNumber <= 15 ? 20 : 10;
};

const ValidatedPostsFeed: React.FC<ValidatedPostsFeedProps> = ({ isOpen, onClose }) => {
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const postsPerPage = 6;

    useEffect(() => {
        if (isOpen) {
            fetchValidatedSubmissions();
        }
    }, [isOpen, selectedDay]);

    const fetchValidatedSubmissions = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('submissions')
                .select(`
                    *,
                    profile: profiles!submissions_user_id_fkey(
                        full_name,
                        avatar_url,
                        university
                    ),
                    challenge_day: challenge_days!submissions_day_number_fkey(
                        theme_title
                    )
                `)
                .eq('status', 'validated')
                .order('created_at', { ascending: false });

            if (selectedDay !== null) {
                query = query.eq('day_number', selectedDay);
            }

            const { data, error } = await query;

            if (error) throw error;
            setSubmissions(data || []);
        } catch (error) {
            console.error('Error fetching validated submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Pagination
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = submissions.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(submissions.length / postsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        // Scroll to top of modal
        document.getElementById('posts-feed-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPlatformColor = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'linkedin':
                return 'from-blue-600 to-blue-700';
            case 'twitter':
            case 'x':
                return 'from-slate-700 to-slate-900';
            case 'facebook':
                return 'from-blue-500 to-blue-600';
            case 'instagram':
                return 'from-pink-500 via-purple-500 to-orange-500';
            default:
                return 'from-gray-600 to-gray-700';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="glass-strong rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-white/10 shadow-2xl"
                >
                    {/* Header */}
                    <div className="sticky top-0 z-10 glass-strong border-b border-white/10 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white font-display">
                                    Posts Validés 🎉
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">
                                    Découvrez les publications validées par nos ambassadeurs
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Day Filter */}
                        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                            <button
                                onClick={() => {
                                    setSelectedDay(null);
                                    setCurrentPage(1);
                                }}
                                className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${selectedDay === null
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                Tous les jours
                            </button>
                            {[...Array(15)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => {
                                        setSelectedDay(i + 1);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${selectedDay === i + 1
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    Jour {i + 1}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div
                        id="posts-feed-content"
                        className="overflow-y-auto p-6 max-h-[calc(90vh-200px)]"
                    >
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="glass-panel rounded-xl p-4 border border-white/10 animate-pulse"
                                    >
                                        <div className="h-48 bg-white/5 rounded-lg mb-4" />
                                        <div className="h-4 bg-white/5 rounded w-3/4 mb-2" />
                                        <div className="h-4 bg-white/5 rounded w-1/2" />
                                    </div>
                                ))}
                            </div>
                        ) : currentPosts.length === 0 ? (
                            <div className="text-center py-16">
                                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Aucun post validé
                                </h3>
                                <p className="text-gray-400">
                                    {selectedDay !== null
                                        ? `Aucune publication validée pour le jour ${selectedDay}`
                                        : 'Aucune publication validée pour le moment'}
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {currentPosts.map((submission, index) => (
                                        <motion.div
                                            key={submission.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="glass-panel rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all group"
                                        >
                                            {/* Post Image/Preview */}
                                            {submission.proof_image_url ? (
                                                <div className="relative h-48 overflow-hidden">
                                                    <img
                                                        src={submission.proof_image_url}
                                                        alt={`Post jour ${submission.day_number}`}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                                    {/* Platform Badge */}
                                                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getPlatformColor(submission.platform)}`}>
                                                        {submission.platform.toUpperCase()}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-48 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                                                    <Calendar className="w-16 h-16 text-white/30" />
                                                </div>
                                            )}

                                            {/* Post Info */}
                                            <div className="p-4 space-y-3">
                                                {/* Day & Theme */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                                                            Jour {submission.day_number}
                                                        </span>
                                                        <div className="flex items-center gap-1 text-xs text-yellow-400">
                                                            <Award className="w-3 h-3" />
                                                            <span className="font-bold">
                                                                {submission.score_awarded}/{getMaxScoreForDay(submission.day_number)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <h3 className="text-sm font-bold text-white line-clamp-1">
                                                        {(submission as any).challenge_day?.theme_title || `Challenge ${submission.day_number}`}
                                                    </h3>
                                                </div>

                                                {/* Author Info */}
                                                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                                    {(submission as any).profile?.avatar_url ? (
                                                        <img
                                                            src={(submission as any).profile.avatar_url}
                                                            alt=""
                                                            className="w-8 h-8 rounded-full border-2 border-white/10"
                                                        />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border-2 border-white/10">
                                                            <User className="w-4 h-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">
                                                            {(submission as any).profile?.full_name || 'Anonyme'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {(submission as any).profile?.university || 'Université'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* View Post Button */}
                                                <a
                                                    href={submission.post_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-colors group-hover:shadow-lg group-hover:shadow-blue-500/25"
                                                >
                                                    Voir le post
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Pagination */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 mt-8">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="w-5 h-5 text-white" />
                                        </button>

                                        <div className="flex items-center gap-2">
                                            {[...Array(totalPages)].map((_, i) => (
                                                <button
                                                    key={i + 1}
                                                    onClick={() => handlePageChange(i + 1)}
                                                    className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${currentPage === i + 1
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    {i + 1}
                                                </button>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="w-5 h-5 text-white" />
                                        </button>
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="mt-6 p-4 glass-panel rounded-xl border border-white/10">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400">
                                            {submissions.length} publication{submissions.length > 1 ? 's' : ''} validée{submissions.length > 1 ? 's' : ''}
                                            {selectedDay !== null && ` pour le jour ${selectedDay}`}
                                        </span>
                                        <span className="text-gray-500">
                                            Page {currentPage} sur {totalPages}
                                        </span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ValidatedPostsFeed;
