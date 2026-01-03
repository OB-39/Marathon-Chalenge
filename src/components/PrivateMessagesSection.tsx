import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Calendar, User, ChevronRight, Inbox, Clock, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UnifiedMessage {
    id: string;
    type: 'private' | 'broadcast';
    title?: string;
    content: string;
    sender_name: string;
    sender_avatar?: string;
    created_at: string;
    is_read: boolean;
    target_day?: number | null;
}

const PrivateMessagesSection: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<UnifiedMessage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            console.log('🔍 Fetching messages for user:', user.id);

            // 1. Récupérer les messages privés (anciens)
            const { data: privateMessages, error: privateError } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:profiles!sender_id(full_name, avatar_url)
                `)
                .eq('receiver_id', user.id)
                .order('created_at', { ascending: false });

            if (privateError) {
                console.error('❌ Error fetching private messages:', privateError);
                throw privateError;
            }
            console.log('📧 Private messages:', privateMessages);

            // 2. Récupérer les broadcasts (nouveaux)
            const { data: broadcasts, error: broadcastError } = await supabase
                .from('broadcast_recipients')
                .select(`
                    id,
                    is_read,
                    created_at,
                    broadcast:admin_broadcasts(
                        id,
                        title,
                        message,
                        sent_at,
                        target_day,
                        sender:profiles!admin_broadcasts_sender_id_fkey(
                            full_name,
                            avatar_url
                        )
                    )
                `)
                .eq('recipient_id', user.id)
                .order('created_at', { ascending: false });

            if (broadcastError) {
                console.error('❌ Error fetching broadcasts:', broadcastError);
                throw broadcastError;
            }
            console.log('📢 Broadcasts:', broadcasts);

            // 3. Formater les messages privés
            const formattedPrivateMessages: UnifiedMessage[] = (privateMessages || []).map(msg => ({
                id: msg.id,
                type: 'private',
                content: msg.content,
                sender_name: msg.sender?.full_name || 'Ambassadeur',
                sender_avatar: msg.sender?.avatar_url,
                created_at: msg.created_at,
                is_read: msg.is_read
            }));

            // 4. Formater les broadcasts
            const formattedBroadcasts: UnifiedMessage[] = (broadcasts || []).map((item: any) => ({
                id: item.id,
                type: 'broadcast',
                title: item.broadcast?.title || 'Message groupé',
                content: item.broadcast?.message || '',
                sender_name: item.broadcast?.sender?.full_name || 'Équipe Marathon',
                sender_avatar: item.broadcast?.sender?.avatar_url,
                created_at: item.created_at,
                is_read: item.is_read,
                target_day: item.broadcast?.target_day
            }));

            console.log('✉️ Formatted private messages:', formattedPrivateMessages);
            console.log('📣 Formatted broadcasts:', formattedBroadcasts);

            // 5. Fusionner et trier par date
            const allMessages = [...formattedPrivateMessages, ...formattedBroadcasts]
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            console.log('📬 All messages (merged):', allMessages);
            setMessages(allMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchMessages();

            // Realtime subscription pour les deux tables
            const messagesChannel = supabase
                .channel('messages-realtime')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                }, () => {
                    fetchMessages();
                })
                .subscribe();

            const broadcastsChannel = supabase
                .channel('broadcasts-realtime')
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'broadcast_recipients',
                    filter: `recipient_id=eq.${user.id}`
                }, () => {
                    fetchMessages();
                })
                .subscribe();

            return () => {
                supabase.removeChannel(messagesChannel);
                supabase.removeChannel(broadcastsChannel);
            };
        }
    }, [user, fetchMessages]);

    const markAsRead = async (messageId: string, messageType: 'private' | 'broadcast') => {
        try {
            if (messageType === 'private') {
                const { error } = await supabase
                    .from('messages')
                    .update({ is_read: true })
                    .eq('id', messageId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('broadcast_recipients')
                    .update({
                        is_read: true,
                        read_at: new Date().toISOString()
                    })
                    .eq('id', messageId)
                    .eq('recipient_id', user?.id);

                if (error) throw error;
            }

            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_read: true } : m));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
            <p className="text-gray-400 font-medium">Récupération de vos messages...</p>
        </div>
    );

    return (
        <section className="space-y-6">
            <div className="flex items-center gap-2 px-1">
                <MessageSquare className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-bold text-white font-display">Messagerie Privée</h2>
                {messages.filter(m => !m.is_read).length > 0 && (
                    <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                        {messages.filter(m => !m.is_read).length}
                    </span>
                )}
            </div>

            {messages.length === 0 ? (
                <div className="glass-strong rounded-3xl p-12 text-center border border-white/10">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Inbox className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-white font-bold mb-1">Aucun message</h3>
                    <p className="text-sm text-gray-500">Vous n'avez pas encore reçu de messages des ambassadeurs.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    <AnimatePresence mode="popLayout">
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`glass-strong rounded-2xl p-6 border transition-all relative overflow-hidden ${msg.is_read
                                    ? 'border-white/5 opacity-80'
                                    : 'border-blue-500/30 shadow-lg glow-blue bg-blue-500/5'
                                    }`}
                            >
                                {!msg.is_read && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-3xl pointer-events-none" />
                                )}

                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.type === 'broadcast'
                                        ? 'bg-gradient-to-br from-purple-500 to-blue-600'
                                        : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                        }`}>
                                        {msg.type === 'broadcast' ? (
                                            <Users className="w-6 h-6 text-white" />
                                        ) : (
                                            <User className="w-6 h-6 text-white" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                {msg.title && (
                                                    <h3 className="text-base font-bold text-white mb-1">
                                                        {msg.title}
                                                    </h3>
                                                )}
                                                <h4 className="text-sm font-bold text-gray-300">
                                                    {msg.type === 'broadcast' ? '📢 ' : ''}
                                                    {msg.sender_name}
                                                </h4>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(msg.created_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 flex items-center gap-1 font-medium">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    {msg.target_day && (
                                                        <span className="text-[10px] text-blue-400 font-bold">
                                                            Jour {msg.target_day}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {!msg.is_read && (
                                                <span className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-black uppercase tracking-tighter rounded-md animate-pulse">
                                                    Nouveau
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-300 leading-relaxed font-medium whitespace-pre-wrap mb-4">
                                            {msg.content}
                                        </p>
                                        {!msg.is_read && (
                                            <button
                                                onClick={() => markAsRead(msg.id, msg.type)}
                                                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-all flex items-center gap-1.5 group"
                                            >
                                                <span>Marquer comme lu</span>
                                                <ChevronRight className="w-3 h-3 transform group-hover:translate-x-1 transition-transform" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </section>
    );
};

export default PrivateMessagesSection;
