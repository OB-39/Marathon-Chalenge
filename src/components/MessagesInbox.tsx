import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Mail, MailOpen, Trash2, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';

interface BroadcastMessage {
    id: string; // ID du broadcast_recipient
    broadcast_id: string; // ID du broadcast
    title: string;
    message: string;
    sent_at: string;
    is_read: boolean;
    read_at: string | null;
    sender_name: string;
    target_day: number | null;
}

interface MessagesInboxProps {
    isOpen: boolean;
    onClose: () => void;
}

const MessagesInbox: React.FC<MessagesInboxProps> = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<BroadcastMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<BroadcastMessage | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (isOpen && user) {
            fetchMessages();
        }
    }, [isOpen, user]);

    const fetchMessages = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('broadcast_recipients')
                .select(`
                    id,
                    broadcast_id,
                    is_read,
                    read_at,
                    broadcast:admin_broadcasts(
                        id,
                        title,
                        message,
                        sent_at,
                        target_day,
                        sender:profiles!admin_broadcasts_sender_id_fkey(
                            full_name
                        )
                    )
                `)
                .eq('recipient_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            console.log('Fetched messages:', data); // Debug

            const formattedMessages: BroadcastMessage[] = (data || []).map((item: any) => ({
                id: item.id,
                broadcast_id: item.broadcast_id,
                title: item.broadcast?.title || 'Sans titre',
                message: item.broadcast?.message || '',
                sent_at: item.broadcast?.sent_at || new Date().toISOString(),
                is_read: item.is_read,
                read_at: item.read_at,
                sender_name: item.broadcast?.sender?.full_name || 'Admin',
                target_day: item.broadcast?.target_day
            }));

            console.log('Formatted messages:', formattedMessages); // Debug

            setMessages(formattedMessages);
            setUnreadCount(formattedMessages.filter(m => !m.is_read).length);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (recipientId: string, broadcastId: string) => {
        if (!user) return;

        try {
            // Mettre à jour directement dans broadcast_recipients
            const { error } = await supabase
                .from('broadcast_recipients')
                .update({
                    is_read: true,
                    read_at: new Date().toISOString()
                })
                .eq('id', recipientId)
                .eq('recipient_id', user.id);

            if (error) throw error;

            // Mettre à jour localement
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === recipientId
                        ? { ...msg, is_read: true, read_at: new Date().toISOString() }
                        : msg
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    };

    const handleMessageClick = (message: BroadcastMessage) => {
        setSelectedMessage(message);
        if (!message.is_read) {
            markAsRead(message.id, message.broadcast_id);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;

        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-strong rounded-2xl w-full max-w-4xl h-[80vh] border border-white/10 shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white font-display">
                                Mes Messages
                            </h2>
                            <p className="text-sm text-gray-400">
                                {unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}` : 'Tous les messages lus'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Messages List */}
                    <div className="w-full md:w-1/2 border-r border-white/10 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center">
                                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                                <p className="text-gray-400 mt-4">Chargement...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="p-8 text-center">
                                <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <p className="text-gray-400">Aucun message</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {messages.map((msg) => (
                                    <button
                                        key={msg.id}
                                        onClick={() => handleMessageClick(msg)}
                                        className={`w-full p-4 text-left hover:bg-white/5 transition-colors ${selectedMessage?.id === msg.id ? 'bg-white/10' : ''
                                            } ${!msg.is_read ? 'bg-blue-500/5' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 ${!msg.is_read ? 'text-blue-400' : 'text-gray-500'}`}>
                                                {!msg.is_read ? (
                                                    <Mail className="w-5 h-5" />
                                                ) : (
                                                    <MailOpen className="w-5 h-5" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <p className={`font-semibold truncate ${!msg.is_read ? 'text-white' : 'text-gray-300'}`}>
                                                        {msg.title}
                                                    </p>
                                                    {!msg.is_read && (
                                                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mb-1">
                                                    De: {msg.sender_name}
                                                </p>
                                                <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                                                    {msg.message}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{formatDate(msg.sent_at)}</span>
                                                    {msg.target_day && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                Jour {msg.target_day}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Message Detail */}
                    <div className="hidden md:block w-1/2 overflow-y-auto">
                        {selectedMessage ? (
                            <div className="p-6">
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        {selectedMessage.title}
                                    </h3>
                                    <div className="flex items-center gap-4 text-sm text-gray-400">
                                        <span>De: {selectedMessage.sender_name}</span>
                                        <span>•</span>
                                        <span>{formatDate(selectedMessage.sent_at)}</span>
                                        {selectedMessage.target_day && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    Jour {selectedMessage.target_day}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-gray-300 whitespace-pre-wrap">
                                        {selectedMessage.message}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center p-8 text-center">
                                <div>
                                    <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                    <p className="text-gray-400">
                                        Sélectionnez un message pour le lire
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default MessagesInbox;
