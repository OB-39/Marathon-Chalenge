import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ExternalLink, Calendar, User, Award, ChevronLeft, ChevronRight, Home, Trophy, ArrowLeft, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Submission } from '../types/database';
import ProfileDropdown from '../components/ProfileDropdown';
import { useAuth } from '../contexts/AuthContext';
import {
    getOptimizedImageUrl,
    generateBlurPlaceholder,
    getOptimalImageWidth
} from '../utils/imageOptimization';

// Helper function to get max score based on day number
const getMaxScoreForDay = (dayNumber: number): number => {
    return dayNumber >= 4 && dayNumber <= 15 ? 20 : 10;
};

const PostsGallery: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
    const postsPerPage = 9; // 3x3 grid

    useEffect(() => {
        fetchValidatedSubmissions();
    }, [selectedDay]);

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

            // Initialize image loading states
            const loadingStates: Record<string, boolean> = {};
            (data || []).forEach(sub => {
                loadingStates[sub.id] = true;
            });
            setImageLoadingStates(loadingStates);
        } catch (error) {
            console.error('Error fetching validated submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageLoad = (submissionId: string) => {
        setImageLoadingStates(prev => ({
            ...prev,
            [submissionId]: false
        }));
    };

    // Pagination
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    const currentPosts = submissions.slice(indexOfFirstPost, indexOfLastPost);
    const totalPages = Math.ceil(submissions.length / postsPerPage);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    return (
        <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />
            <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <header className="glass-strong border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo & Title */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/')}
                                className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                                title="Retour à l'accueil"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg glow-blue border border-white/10">
                                    <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white font-display">
                                        Galerie des Posts
                                    </h1>
                                    <p className="text-xs text-gray-400">Publications validées</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate('/')}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium text-sm border border-white/10 rounded-xl hover:bg-white/5"
                            >
                                <Home className="w-4 h-4" />
                                Accueil
                            </button>
                            <button
                                onClick={() => navigate('/leaderboard')}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors font-medium text-sm border border-white/10 rounded-xl hover:bg-white/5"
                            >
                                <Trophy className="w-4 h-4" />
                                Classement
                            </button>
                            {user && <ProfileDropdown onEditProfile={() => { }} />}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 font-display">
                        Découvrez les <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Posts Validés</span>
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        Explorez les publications de qualité créées par nos participants. Likez, commentez et soutenez-les sur leurs plateformes !
                    </p>
                </motion.div>

                {/* Day Filter */}
                <div className="glass-strong rounded-2xl p-6 border border-white/10 mb-8">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-4">
                        Filtrer par jour
                    </h3>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
                        <button
                            onClick={() => {
                                setSelectedDay(null);
                                setCurrentPage(1);
                            }}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${selectedDay === null
                                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            Tous les jours ({submissions.length})
                        </button>
                        {[...Array(15)].map((_, i) => {
                            const dayPosts = submissions.filter(s => s.day_number === i + 1).length;
                            return (
                                <button
                                    key={i + 1}
                                    onClick={() => {
                                        setSelectedDay(i + 1);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${selectedDay === i + 1
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    Jour {i + 1}
                                    {selectedDay === null && dayPosts > 0 && (
                                        <span className="ml-1 text-xs opacity-75">({dayPosts})</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Posts Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(9)].map((_, i) => (
                            <div
                                key={i}
                                className="glass-panel rounded-xl border border-white/10 overflow-hidden animate-pulse"
                            >
                                <div className="h-64 bg-white/5" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-white/5 rounded w-3/4" />
                                    <div className="h-4 bg-white/5 rounded w-1/2" />
                                    <div className="h-10 bg-white/5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : currentPosts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-strong rounded-2xl p-16 text-center border border-white/10"
                    >
                        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">
                            Aucun post validé
                        </h3>
                        <p className="text-gray-400">
                            {selectedDay !== null
                                ? `Aucune publication validée pour le jour ${selectedDay}`
                                : 'Aucune publication validée pour le moment'}
                        </p>
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {currentPosts.map((submission, index) => (
                                <motion.div
                                    key={submission.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass-panel rounded-xl overflow-hidden border border-white/10 hover:border-blue-500/30 transition-all group"
                                >
                                    {/* Post Image/Preview */}
                                    <div className="relative h-64 overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900">
                                        {imageLoadingStates[submission.id] && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Loader className="w-8 h-8 text-blue-400 animate-spin" />
                                            </div>
                                        )}
                                        {submission.proof_image_url ? (
                                            <img
                                                src={getOptimizedImageUrl(submission.proof_image_url, {
                                                    width: getOptimalImageWidth(),
                                                    quality: 80
                                                })}
                                                alt={`Post jour ${submission.day_number}`}
                                                loading="lazy"
                                                onLoad={() => handleImageLoad(submission.id)}
                                                onError={() => handleImageLoad(submission.id)}
                                                className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${imageLoadingStates[submission.id] ? 'opacity-0' : 'opacity-100'
                                                    }`}
                                                style={{
                                                    backgroundColor: '#1e293b'
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Calendar className="w-16 h-16 text-white/30" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                        {/* Platform Badge */}
                                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getPlatformColor(submission.platform)} shadow-lg`}>
                                            {submission.platform.toUpperCase()}
                                        </div>
                                    </div>

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
                                            <h3 className="text-sm font-bold text-white line-clamp-2">
                                                {(submission as any).challenge_day?.theme_title || `Challenge ${submission.day_number}`}
                                            </h3>
                                        </div>

                                        {/* Author Info */}
                                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                            {(submission as any).profile?.avatar_url ? (
                                                <img
                                                    src={(submission as any).profile.avatar_url}
                                                    alt=""
                                                    loading="lazy"
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
                                            className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-sm transition-all group-hover:shadow-lg group-hover:shadow-blue-500/25"
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
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-white" />
                                    </button>

                                    <div className="flex items-center gap-2">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button
                                                key={i + 1}
                                                onClick={() => handlePageChange(i + 1)}
                                                className={`w-10 h-10 rounded-lg font-semibold text-sm transition-all ${currentPage === i + 1
                                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                                    }`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
                                    >
                                        <ChevronRight className="w-5 h-5 text-white" />
                                    </button>
                                </div>

                                {/* Stats */}
                                <div className="glass-panel rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center justify-center gap-4 text-sm">
                                        <span className="text-gray-400">
                                            {submissions.length} publication{submissions.length > 1 ? 's' : ''} validée{submissions.length > 1 ? 's' : ''}
                                            {selectedDay !== null && ` pour le jour ${selectedDay}`}
                                        </span>
                                        <span className="text-gray-600">•</span>
                                        <span className="text-gray-500">
                                            Page {currentPage} sur {totalPages}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black/20 backdrop-blur-lg mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-gray-500" />
                            <span className="text-gray-500 font-bold">Marathon Challenge</span>
                        </div>
                        <p className="text-gray-600 text-sm text-center">
                            © 2026 Tous droits réservés. Propulsé par l'équipe Marathon Challenge.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default PostsGallery;
