import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { Profile, Submission, ChallengeDay } from '../types/database';
import {
    Trophy,
    User,
    ArrowLeft,
    Linkedin,
    Facebook,
    Instagram,
    ExternalLink,
    CheckCircle2,
} from 'lucide-react';
import Button from '../components/ui/Button';

const PublicProfile: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [challengeDays, setChallengeDays] = useState<ChallengeDay[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            fetchProfileData();
        }
    }, [userId]);

    const fetchProfileData = async () => {
        try {
            // Fetch profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // Fetch validated submissions
            const { data: submissionsData, error: submissionsError } = await supabase
                .from('submissions')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'validated')
                .order('day_number');

            if (submissionsError) throw submissionsError;
            setSubmissions(submissionsData || []);

            // Fetch challenge days for themes
            const { data: daysData, error: daysError } = await supabase
                .from('challenge_days')
                .select('*')
                .order('day_number');

            if (daysError) throw daysError;
            setChallengeDays(daysData || []);
        } catch (error) {
            console.error('Error fetching profile data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDayTheme = (dayNumber: number) => {
        return challengeDays.find((d) => d.day_number === dayNumber);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="glass-strong rounded-2xl text-center p-12 border border-white/10">
                    <p className="text-lg text-gray-300">Profil non trouvé</p>
                    <Button onClick={() => navigate('/')} className="mt-4 btn-primary-neo">
                        Retour au classement
                    </Button>
                </div>
            </div>
        );
    }

    const validatedCount = submissions.length;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="glass-strong border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors group"
                        >
                            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                            <span className="font-semibold tracking-wide">Retour au classement</span>
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-2xl shadow-lg glow-blue">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-white">Marathon Challenge</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Profile Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="glass-strong rounded-2xl p-8 mb-8 border border-white/10"
                >
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt={profile.full_name || 'User'}
                                className="w-32 h-32 rounded-full border-4 border-blue-500/30 shadow-lg object-cover"
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-blue-500/20 flex items-center justify-center border-4 border-blue-500/30 shadow-lg">
                                <User className="w-16 h-16 text-blue-400" />
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-white mb-2 font-display">
                                {profile.full_name || profile.email}
                            </h1>
                            {profile.bio && (
                                <p className="text-gray-300 mb-4">{profile.bio}</p>
                            )}

                            {/* Social Links */}
                            <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-6">
                                {profile.linkedin_url && (
                                    <a
                                        href={profile.linkedin_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-blue-300"
                                    >
                                        <Linkedin className="w-4 h-4" />
                                        <span className="text-sm font-medium">LinkedIn</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                {profile.facebook_url && (
                                    <a
                                        href={profile.facebook_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors text-blue-300"
                                    >
                                        <Facebook className="w-4 h-4" />
                                        <span className="text-sm font-medium">Facebook</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                                {profile.instagram_url && (
                                    <a
                                        href={profile.instagram_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-pink-600/20 border border-pink-500/30 rounded-lg hover:bg-pink-600/30 transition-colors text-pink-300"
                                    >
                                        <Instagram className="w-4 h-4" />
                                        <span className="text-sm font-medium">Instagram</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="flex gap-8 justify-center md:justify-start">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-primary-glow font-display">
                                        {profile.total_points || 0}
                                    </p>
                                    <p className="text-sm text-gray-400 uppercase tracking-wide">Points</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-success-glow font-display">
                                        {validatedCount}
                                    </p>
                                    <p className="text-sm text-gray-400 uppercase tracking-wide">Jours Validés</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Timeline/Gallery */}
                <div>
                    <h2 className="text-2xl font-bold text-white mb-6 font-display">
                        Portfolio du Challenge
                    </h2>

                    {submissions.length === 0 ? (
                        <div className="glass-panel rounded-2xl text-center py-16 border border-white/10">
                            <Trophy className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                            <p className="text-lg text-gray-300">
                                Aucune soumission validée pour le moment
                            </p>
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            variants={{
                                visible: {
                                    transition: {
                                        staggerChildren: 0.05,
                                    },
                                },
                            }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {submissions.map((submission) => {
                                const theme = getDayTheme(submission.day_number);
                                return (
                                    <motion.div
                                        key={submission.id}
                                        variants={{
                                            hidden: { opacity: 0, scale: 0.9 },
                                            visible: { opacity: 1, scale: 1 },
                                        }}
                                    >
                                        <div className="glass-strong rounded-2xl overflow-hidden group border border-white/10 hover-glow transition-all">
                                            {/* Image */}
                                            {submission.proof_image_url && (
                                                <div className="relative h-56 bg-slate-900/60 overflow-hidden">
                                                    <img
                                                        src={submission.proof_image_url}
                                                        alt={`Jour ${submission.day_number}`}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                    />
                                                    <div className="absolute top-3 right-3">
                                                        <div className="glass-panel p-2 rounded-lg border border-green-500/30">
                                                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Content */}
                                            <div className="p-6 space-y-3">
                                                <div>
                                                    <p className="text-xs font-bold text-blue-400 uppercase tracking-wide mb-1">
                                                        Jour {submission.day_number}
                                                    </p>
                                                    <h3 className="text-lg font-bold text-white font-display leading-tight">
                                                        {theme?.theme_title || `Challenge ${submission.day_number}`}
                                                    </h3>
                                                </div>

                                                {submission.content_text && (
                                                    <p className="text-sm text-gray-300 line-clamp-2">
                                                        {submission.content_text}
                                                    </p>
                                                )}

                                                <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
                                                    {/* View Post Button */}
                                                    <a
                                                        href={submission.post_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                                    >
                                                        Voir le post
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default PublicProfile;

