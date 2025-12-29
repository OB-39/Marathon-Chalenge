import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Submission } from '../types/database';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ExportButton from '../components/ExportButton';
import { Shield, Eye, CheckCircle2, XCircle, LogOut, MessageSquare } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const { profile, signOut } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [reviewedSubmissions, setReviewedSubmissions] = useState<Submission[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'reviewed'>('pending');
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [score, setScore] = useState<number>(5);
    const [rejectionComment, setRejectionComment] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.role !== 'ambassador') {
            window.location.href = '/dashboard';
            return;
        }
        fetchSubmissions();
        fetchReviewedSubmissions();
    }, [profile]);

    const fetchReviewedSubmissions = async () => {
        try {
            const { data, error } = await supabase
                .from('submissions')
                .select(`
          *,
          profile:profiles!submissions_user_id_fkey(*)
        `)
                .in('status', ['validated', 'rejected'])
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Error fetching reviewed submissions:', error);
                throw error;
            }

            setReviewedSubmissions(data || []);
        } catch (error) {
            console.error('Error fetching reviewed submissions:', error);
        }
    };

    const fetchSubmissions = async () => {
        try {
            console.log('🔍 Starting to fetch submissions...');

            const { data, error } = await supabase
                .from('submissions')
                .select(`
          *,
          profile:profiles!submissions_user_id_fkey(*)
        `)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            console.log('📊 Raw data:', data);
            console.log('❌ Error object:', error);

            if (error) {
                console.error('❌ Supabase error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                });
                throw error;
            }

            console.log('✅ Successfully fetched submissions:', data?.length || 0);
            setSubmissions(data || []);
        } catch (error: any) {
            console.error('❌ Error fetching submissions:', error);
            console.error('Error message:', error?.message);
            console.error('Error details:', error?.details);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async () => {
        if (!selectedSubmission) return;

        setIsLoading(true);
        try {
            // Update submission
            const { error: submissionError } = await supabase
                .from('submissions')
                .update({
                    status: 'validated',
                    score_awarded: score,
                })
                .eq('id', selectedSubmission.id);

            if (submissionError) throw submissionError;

            // Update user's total points
            const { error: profileError } = await supabase.rpc('increment_points', {
                user_id: selectedSubmission.user_id,
                points: score,
            });

            // If RPC doesn't exist, do it manually
            if (profileError) {
                const { data: currentProfile } = await supabase
                    .from('profiles')
                    .select('total_points')
                    .eq('id', selectedSubmission.user_id)
                    .single();

                if (currentProfile) {
                    await supabase
                        .from('profiles')
                        .update({ total_points: (currentProfile.total_points || 0) + score })
                        .eq('id', selectedSubmission.user_id);
                }
            }

            // 🔓 AUTO-UNLOCK NEXT DAY
            const nextDayNumber = selectedSubmission.day_number + 1;
            if (nextDayNumber <= 15) {
                console.log(`🔓 Unlocking day ${nextDayNumber} for user...`);

                // Activate the next day in challenge_days
                await supabase
                    .from('challenge_days')
                    .update({ is_active: true })
                    .eq('day_number', nextDayNumber);

                console.log(`✅ Day ${nextDayNumber} unlocked!`);
            }

            setSelectedSubmission(null);
            fetchSubmissions();
            fetchReviewedSubmissions();
        } catch (error) {
            console.error('Error validating submission:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedSubmission) return;

        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('submissions')
                .update({
                    status: 'rejected',
                    score_awarded: 0,
                    rejection_comment: rejectionComment || null,
                })
                .eq('id', selectedSubmission.id);

            if (error) throw error;

            setSelectedSubmission(null);
            setRejectionComment('');
            fetchSubmissions();
            fetchReviewedSubmissions();
        } catch (error) {
            console.error('Error rejecting submission:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (profile?.role !== 'ambassador') {
        return null;
    }

    return (
        <div className="min-h-screen pb-12">
            {/* Header */}
            <header className="glass-strong border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-2xl shadow-lg glow-purple">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white font-display tracking-tight">
                                Admin Dashboard
                            </h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <ExportButton type="submissions" />
                            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
                            <Button
                                variant="ghost"
                                onClick={signOut}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold"
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Déconnexion
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-strong rounded-2xl p-6 border border-orange-500/30 hover-glow transition-all">
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">En attente</p>
                        <p className="text-3xl font-bold text-orange-400 mt-2 font-display">
                            {submissions.length}
                        </p>
                    </div>
                    <div className="glass-strong rounded-2xl p-6 border border-green-500/30 hover-glow transition-all">
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">Analysées</p>
                        <p className="text-3xl font-bold text-green-400 mt-2 font-display">
                            {reviewedSubmissions.length}
                        </p>
                    </div>
                    <div className="glass-strong rounded-2xl p-6 border border-blue-500/30 hover-glow transition-all">
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">Total Soumissions</p>
                        <p className="text-3xl font-bold text-blue-400 mt-2 font-display">
                            {submissions.length + reviewedSubmissions.length}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="glass-strong rounded-2xl overflow-hidden border border-white/10">
                    {/* Tabs */}
                    <div className="border-b border-white/10">
                        <div className="flex items-center">
                            <button
                                onClick={() => setActiveTab('pending')}
                                className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors relative ${activeTab === 'pending'
                                    ? 'text-orange-400 bg-orange-500/10 border-b-2 border-orange-500'
                                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <Eye className="w-4 h-4" />
                                    À valider ({submissions.length})
                                </div>
                                {activeTab === 'pending' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('reviewed')}
                                className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors relative ${activeTab === 'reviewed'
                                    ? 'text-green-400 bg-green-500/10 border-b-2 border-green-500'
                                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Analysées ({reviewedSubmissions.length})
                                </div>
                                {activeTab === 'reviewed' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Pending Content */}
                    {activeTab === 'pending' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900/60 border-b border-white/10">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Étudiant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Jour
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-surface-500">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
                                                Chargement...
                                            </td>
                                        </tr>
                                    ) : submissions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-surface-500">
                                                Aucune soumission en attente. Bon travail ! 🎉
                                            </td>
                                        </tr>
                                    ) : (
                                        submissions.map((submission) => (
                                            <tr key={submission.id} className="hover:bg-surface-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            {submission.profile?.avatar_url ? (
                                                                <img
                                                                    className="h-10 w-10 rounded-full object-cover border-2 border-primary-100"
                                                                    src={submission.profile.avatar_url}
                                                                    alt=""
                                                                />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                                                                    <span className="text-primary-600 font-medium text-sm">
                                                                        {submission.profile?.full_name?.charAt(0) || 'U'}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-surface-900">
                                                                {submission.profile?.full_name || 'Utilisateur inconnu'}
                                                            </div>
                                                            <div className="text-sm text-surface-500">
                                                                {submission.profile?.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-surface-900">
                                                        Jour {submission.day_number || '?'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-surface-500">
                                                        {submission.created_at ? new Date(submission.created_at).toLocaleDateString('fr-FR', {
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                        }) : '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedSubmission(submission);
                                                            setScore(5);
                                                            setRejectionComment('');
                                                        }}
                                                    >
                                                        Évaluer
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Reviewed Content */}
                    {activeTab === 'reviewed' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-surface-50 border-b border-surface-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                            Étudiant
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                            Info
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-200 bg-white">
                                    {reviewedSubmissions.map((submission) => (
                                        <tr key={submission.id} className="hover:bg-surface-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        {submission.profile?.avatar_url ? (
                                                            <img
                                                                className="h-10 w-10 rounded-full object-cover border-2 border-surface-200"
                                                                src={submission.profile.avatar_url}
                                                                alt=""
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-surface-100 flex items-center justify-center">
                                                                <span className="text-surface-600 font-medium text-sm">
                                                                    {submission.profile?.full_name?.charAt(0) || 'U'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-surface-900">
                                                            {submission.profile?.full_name || 'Utilisateur inconnu'}
                                                        </div>
                                                        <div className="text-sm text-surface-500">
                                                            Jour {submission.day_number || '?'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-surface-500">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-xs">
                                                            {submission.created_at ? new Date(submission.created_at).toLocaleDateString('fr-FR') : '-'}
                                                        </span>
                                                        {submission.score_awarded !== null && (
                                                            <span className="font-medium text-primary-600">
                                                                Score: {submission.score_awarded}/10
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge status={submission.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => {
                                                        setSelectedSubmission(submission);
                                                        setScore(submission.score_awarded || 5);
                                                        setRejectionComment(submission.rejection_comment || '');
                                                    }}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    Revoir
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {reviewedSubmissions.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-surface-500">
                                                Aucune soumission analysée pour le moment.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Evaluation Modal */}
            {selectedSubmission && (
                <Modal
                    isOpen={!!selectedSubmission}
                    onClose={() => setSelectedSubmission(null)}
                    title={`Évaluer - Jour ${selectedSubmission.day_number}`}
                    size="xl"
                >
                    <div className="space-y-6">
                        {/* User Info */}
                        <div className="bg-surface-50 rounded-xl p-4 border border-surface-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-surface-500 uppercase tracking-wide font-semibold mb-1">Candidat</p>
                                    <p className="font-medium text-surface-900">{selectedSubmission.profile?.full_name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-surface-500 uppercase tracking-wide font-semibold mb-1">Plateforme</p>
                                    <p className="font-medium text-surface-900">{selectedSubmission.platform}</p>
                                </div>
                                <div className="col-span-full">
                                    <p className="text-xs text-surface-500 uppercase tracking-wide font-semibold mb-1">Lien du post</p>
                                    <a
                                        href={selectedSubmission.post_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:text-primary-700 hover:underline break-all"
                                    >
                                        {selectedSubmission.post_link}
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Proof Image */}
                        {selectedSubmission.proof_image_url && (
                            <div>
                                <p className="text-sm font-medium text-surface-700 mb-2">
                                    Preuve (capture d'écran)
                                </p>
                                <img
                                    src={selectedSubmission.proof_image_url}
                                    alt="Proof"
                                    className="w-full rounded-xl border border-surface-200 shadow-sm"
                                />
                            </div>
                        )}

                        {/* Score Input */}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2">
                                Note attribuée (sur 10)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={score}
                                onChange={(e) => setScore(Number(e.target.value))}
                                className="input-neo w-full text-lg font-semibold"
                            />
                        </div>

                        {/* Rejection Comment */}
                        <div>
                            <label className="block text-sm font-medium text-surface-700 mb-2 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Commentaire (obligatoire si refus)
                            </label>
                            <textarea
                                value={rejectionComment}
                                onChange={(e) => setRejectionComment(e.target.value)}
                                rows={3}
                                className="input-neo w-full resize-none"
                                placeholder="Expliquez pourquoi la soumission est refusée ou laissez un encouragement..."
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-4 border-t border-surface-100">
                            <Button
                                variant="danger"
                                onClick={handleReject}
                                isLoading={isLoading}
                                className="flex-1"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Refuser
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleValidate}
                                isLoading={isLoading}
                                className="flex-1"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Valider
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminDashboard;
