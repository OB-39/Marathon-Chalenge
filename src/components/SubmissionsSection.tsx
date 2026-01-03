import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, Calendar, Award, Trash2 } from 'lucide-react';
import type { Submission } from '../types/database';
import Badge from './ui/Badge';
import { supabase } from '../lib/supabase';
import Button from './ui/Button';

interface SubmissionsSectionProps {
    submissions: Submission[];
    onDelete?: () => void; // Callback pour rafraîchir après suppression
}

// Helper function to get max score based on day number
const getMaxScoreForDay = (dayNumber: number): number => {
    return dayNumber >= 4 && dayNumber <= 15 ? 20 : 10;
};

const SubmissionsSection: React.FC<SubmissionsSectionProps> = ({ submissions, onDelete }) => {
    const sortedSubmissions = [...submissions].sort((a, b) => b.day_number - a.day_number);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (submission: Submission) => {
        // Vérifier que le statut est bien "pending"
        if (submission.status !== 'pending') {
            alert('Vous ne pouvez supprimer que les soumissions en attente de validation.');
            return;
        }

        // Demander confirmation
        const confirmed = window.confirm(
            `Êtes-vous sûr de vouloir supprimer votre soumission du Jour ${submission.day_number} ?\n\nCette action est irréversible.`
        );

        if (!confirmed) return;

        setDeletingId(submission.id);

        try {
            const { error } = await supabase
                .from('submissions')
                .delete()
                .eq('id', submission.id)
                .eq('status', 'pending'); // Double vérification côté serveur

            if (error) {
                console.error('Error deleting submission:', error);
                throw error;
            }

            // Notifier le parent pour rafraîchir la liste
            if (onDelete) {
                onDelete();
            }
        } catch (error) {
            console.error('Failed to delete submission:', error);
            alert('Erreur lors de la suppression. Veuillez réessayer.');
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'validated':
                return <CheckCircle2 className="w-5 h-5 text-green-400" />;
            case 'pending':
                return <Clock className="w-5 h-5 text-orange-400" />;
            case 'rejected':
                return <XCircle className="w-5 h-5 text-red-400" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'validated':
                return 'from-green-500/20 to-emerald-500/20 border-green-500/30';
            case 'pending':
                return 'from-orange-500/20 to-yellow-500/20 border-orange-500/30';
            case 'rejected':
                return 'from-red-500/20 to-pink-500/20 border-red-500/30';
            default:
                return 'from-gray-500/20 to-slate-500/20 border-gray-500/30';
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white font-display">
                    Mes Soumissions
                </h2>
                <span className="text-sm text-gray-400">
                    {submissions.length} soumission{submissions.length > 1 ? 's' : ''}
                </span>
            </div>

            {/* Submissions List */}
            {submissions.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-strong rounded-2xl p-8 text-center border border-white/10"
                >
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Aucune soumission</h3>
                    <p className="text-sm text-gray-400">
                        Commencez à soumettre vos défis quotidiens !
                    </p>
                </motion.div>
            ) : (
                <div className="space-y-3">
                    {sortedSubmissions.map((submission, index) => (
                        <motion.div
                            key={submission.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`glass-strong rounded-xl p-4 border bg-gradient-to-br ${getStatusColor(submission.status)}`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Status Icon */}
                                <div className="flex-shrink-0 mt-1">
                                    {getStatusIcon(submission.status)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <h3 className="font-bold text-white">
                                                Jour {submission.day_number}
                                            </h3>
                                            <p className="text-xs text-gray-400">
                                                {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric'
                                                }) : 'Date inconnue'}
                                            </p>
                                        </div>
                                        <Badge status={submission.status} />
                                    </div>

                                    {/* Submission URL */}
                                    {submission.submission_url && (
                                        <a
                                            href={submission.submission_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-400 hover:text-blue-300 truncate block mb-2"
                                        >
                                            {submission.submission_url}
                                        </a>
                                    )}

                                    {/* Score */}
                                    {submission.score_awarded !== null && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <Award className="w-4 h-4 text-yellow-400" />
                                            <span className="text-sm font-bold text-white">
                                                Score: {submission.score_awarded}/{getMaxScoreForDay(submission.day_number)}
                                            </span>
                                        </div>
                                    )}

                                    {/* Feedback */}
                                    {submission.feedback && (
                                        <div className="mt-3 p-3 bg-black/20 rounded-lg">
                                            <p className="text-xs text-gray-300 italic">
                                                "{submission.feedback}"
                                            </p>
                                        </div>
                                    )}

                                    {/* Delete Button - Only for pending submissions */}
                                    {submission.status === 'pending' && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <Button
                                                variant="danger"
                                                size="sm"
                                                onClick={() => handleDelete(submission)}
                                                isLoading={deletingId === submission.id}
                                                disabled={deletingId === submission.id}
                                                className="w-full sm:w-auto"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Supprimer cette soumission
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SubmissionsSection;
