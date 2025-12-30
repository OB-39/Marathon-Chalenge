import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';

interface MessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientName: string;
    recipientId: string;
}

const MessageModal: React.FC<MessageModalProps> = ({ isOpen, onClose, recipientName, recipientId }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user) return;

        setIsSending(true);
        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: recipientId,
                    content: content.trim(),
                });

            console.log('🚀 Tentative d\'envoi :', {
                from: user.id,
                to: recipientId,
                content: content.trim()
            });

            if (error) throw error;
            console.log('✅ Message inserted successfully to:', recipientId);

            setSent(true);
            setTimeout(() => {
                onClose();
                setSent(false);
                setContent('');
            }, 2000);
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Erreur lors de l\'envoi du message.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg glass-strong rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-xl">
                                    <MessageSquare className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white font-display">Envoyer un message</h3>
                                    <p className="text-sm text-gray-400">À: {recipientName}</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {sent ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Send className="w-8 h-8 text-green-400" />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">Message envoyé !</h4>
                                    <p className="text-gray-400">Le candidat recevra votre message directement dans son dashboard.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleSendMessage} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Votre message</label>
                                        <textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            required
                                            className="input-neo w-full h-40 resize-none text-sm md:text-base p-4"
                                            placeholder="Écrivez votre message ici..."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={onClose}
                                            className="text-gray-400 hover:text-white"
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            type="submit"
                                            isLoading={isSending}
                                            className="btn-primary-neo px-8"
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Envoyer
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MessageModal;
