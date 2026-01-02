import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import Button from './ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type MessageTarget = 'all' | 'late' | 'validated';

interface BroadcastMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const BroadcastMessageModal: React.FC<BroadcastMessageModalProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [target, setTarget] = useState<MessageTarget>('all');
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSend = async () => {
        if (!message.trim()) {
            setError('Veuillez saisir un message');
            return;
        }

        if (!user) {
            setError('Vous devez être connecté');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            let recipientIds: string[] = [];

            // Récupérer les destinataires selon le ciblage
            if (target === 'all') {
                // Tous les candidats
                const { data, error: fetchError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'student')
                    .eq('is_registered', true);

                if (fetchError) throw fetchError;
                recipientIds = data?.map(p => p.id) || [];

            } else if (target === 'late') {
                // Candidats en retard pour le jour en cours
                // 1. Trouver le jour actif
                const { data: activeDay, error: dayError } = await supabase
                    .from('challenge_days')
                    .select('day_number')
                    .eq('is_active', true)
                    .single();

                if (dayError) throw dayError;

                // 2. Trouver les candidats qui n'ont pas soumis
                const { data: allStudents, error: studentsError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('role', 'student')
                    .eq('is_registered', true);

                if (studentsError) throw studentsError;

                const { data: submissions, error: submissionsError } = await supabase
                    .from('submissions')
                    .select('user_id')
                    .eq('day_number', activeDay.day_number);

                if (submissionsError) throw submissionsError;

                const submittedIds = new Set(submissions?.map(s => s.user_id) || []);
                recipientIds = allStudents?.filter(s => !submittedIds.has(s.id)).map(s => s.id) || [];

            } else if (target === 'validated') {
                // Candidats ayant validé le jour spécifié
                const { data, error: fetchError } = await supabase
                    .from('submissions')
                    .select('user_id')
                    .eq('day_number', selectedDay)
                    .eq('status', 'validated');

                if (fetchError) throw fetchError;
                recipientIds = data?.map(s => s.user_id) || [];
            }

            if (recipientIds.length === 0) {
                setError('Aucun destinataire trouvé pour ce ciblage');
                setLoading(false);
                return;
            }

            // Créer les messages pour chaque destinataire
            const messages = recipientIds.map(recipientId => ({
                sender_id: user.id,
                receiver_id: recipientId,
                content: message,
                is_read: false,
                created_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase
                .from('messages')
                .insert(messages);

            if (insertError) throw insertError;

            setSuccess(`✅ Message envoyé à ${recipientIds.length} candidat(s) !`);
            setMessage('');

            // Fermer le modal après 2 secondes
            setTimeout(() => {
                onClose();
                setSuccess('');
            }, 2000);

        } catch (err: any) {
            console.error('Erreur lors de l\'envoi du message:', err);
            setError(err.message || 'Une erreur est survenue');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="glass-strong rounded-3xl p-8 max-w-2xl w-full border border-white/10 shadow-2xl relative pointer-events-auto"
                        >
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Header */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg glow-blue">
                                    <Send className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white font-display">
                                        Message groupé
                                    </h2>
                                    <p className="text-sm text-gray-400">
                                        Envoyer un message à plusieurs candidats
                                    </p>
                                </div>
                            </div>

                            {/* Target Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-3">
                                    Destinataires
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Option 1 : Tous les candidats */}
                                    <button
                                        onClick={() => setTarget('all')}
                                        className={`p-4 rounded-xl border-2 transition-all ${target === 'all'
                                                ? 'border-blue-500 bg-blue-500/10 shadow-lg ring-2 ring-blue-500/30'
                                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                            }`}
                                    >
                                        <Users className={`w-6 h-6 mx-auto mb-2 ${target === 'all' ? 'text-blue-400' : 'text-gray-400'}`} />
                                        <p className={`text-sm font-medium ${target === 'all' ? 'text-white' : 'text-gray-300'}`}>
                                            Tous les candidats
                                        </p>
                                    </button>

                                    {/* Option 2 : En retard */}
                                    <button
                                        onClick={() => setTarget('late')}
                                        className={`p-4 rounded-xl border-2 transition-all ${target === 'late'
                                                ? 'border-orange-500 bg-orange-500/10 shadow-lg ring-2 ring-orange-500/30'
                                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                            }`}
                                    >
                                        <Clock className={`w-6 h-6 mx-auto mb-2 ${target === 'late' ? 'text-orange-400' : 'text-gray-400'}`} />
                                        <p className={`text-sm font-medium ${target === 'late' ? 'text-white' : 'text-gray-300'}`}>
                                            En retard (jour actif)
                                        </p>
                                    </button>

                                    {/* Option 3 : Ayant validé */}
                                    <button
                                        onClick={() => setTarget('validated')}
                                        className={`p-4 rounded-xl border-2 transition-all ${target === 'validated'
                                                ? 'border-green-500 bg-green-500/10 shadow-lg ring-2 ring-green-500/30'
                                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                            }`}
                                    >
                                        <CheckCircle className={`w-6 h-6 mx-auto mb-2 ${target === 'validated' ? 'text-green-400' : 'text-gray-400'}`} />
                                        <p className={`text-sm font-medium ${target === 'validated' ? 'text-white' : 'text-gray-300'}`}>
                                            Ayant validé un jour
                                        </p>
                                    </button>
                                </div>
                            </div>

                            {/* Day Selection (only for validated target) */}
                            {target === 'validated' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Jour à cibler
                                    </label>
                                    <select
                                        value={selectedDay}
                                        onChange={(e) => setSelectedDay(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        {Array.from({ length: 15 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day}>
                                                Jour {day}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Message Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Message
                                </label>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    rows={6}
                                    placeholder="Écrivez votre message ici..."
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    {message.length} caractères
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                    <p className="text-sm text-red-400">{error}</p>
                                </motion.div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
                                >
                                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                                    <p className="text-sm text-green-400">{success}</p>
                                </motion.div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <Button
                                    onClick={onClose}
                                    variant="secondary"
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleSend}
                                    isLoading={loading}
                                    className="flex-1 btn-primary-neo"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Envoyer le message
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BroadcastMessageModal;
