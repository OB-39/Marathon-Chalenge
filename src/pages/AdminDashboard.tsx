import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    Shield, Eye, CheckCircle2, XCircle, LogOut, MessageSquare,
    Send, Bell, Flame, Video, Link as LinkIcon, Trash2,
    Users, User, Search, Award, ExternalLink
} from 'lucide-react';
import type { Submission, Announcement, Profile } from '../types/database';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ExportButton from '../components/ExportButton';

const AdminDashboard: React.FC = () => {
    const { profile, signOut } = useAuth();
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [reviewedSubmissions, setReviewedSubmissions] = useState<Submission[]>([]);
    const [activeTab, setActiveTab] = useState<'pending' | 'reviewed' | 'communications' | 'users'>('pending');
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [allUsers, setAllUsers] = useState<(Profile & { validated_count: number })[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [newAnnouncement, setNewAnnouncement] = useState<{
        title: string;
        content: string;
        type: 'announcement' | 'motivation' | 'video' | 'link';
        url: string;
    }>({
        title: '',
        content: '',
        type: 'announcement',
        url: '',
    });
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [score, setScore] = useState<number>(5);
    const [rejectionComment, setRejectionComment] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isPublishing, setIsPublishing] = useState(false);

    useEffect(() => {
        if (profile?.role !== 'ambassador') {
            window.location.href = '/dashboard';
            return;
        }
        fetchSubmissions();
        fetchReviewedSubmissions();
        fetchAnnouncements();
        fetchUsers();
    }, [profile]);

    const fetchUsers = async () => {
        try {
            const { data: profiles, error: pError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'student')
                .order('total_points', { ascending: false });

            if (pError) throw pError;

            const { data: counts, error: cError } = await supabase
                .from('submissions')
                .select('user_id')
                .eq('status', 'validated');

            if (cError) throw cError;

            const userStats = profiles.map(u => ({
                ...u,
                validated_count: counts?.filter(c => c.user_id === u.id).length || 0
            }));

            setAllUsers(userStats);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        }
    };

    const handleCreateAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAnnouncement.title || !newAnnouncement.content) return;

        setIsPublishing(true);
        try {
            const { error } = await supabase.from('announcements').insert({
                ambassador_id: profile?.id,
                title: newAnnouncement.title,
                content: newAnnouncement.content,
                type: newAnnouncement.type,
                url: newAnnouncement.url || null,
            });

            if (error) throw error;

            setNewAnnouncement({ title: '', content: '', type: 'announcement', url: '' });
            fetchAnnouncements();
            alert('Publication réussie !');
        } catch (error: any) {
            console.error('Error publishing:', error);
            alert(`Erreur : ${error.message}`);
        } finally {
            setIsPublishing(false);
        }
    };

    const handleDeleteAnnouncement = async (id: string) => {
        if (!confirm('Voulez-vous vraiment supprimer cette publication ?')) return;
        try {
            const { error } = await supabase.from('announcements').delete().eq('id', id);
            if (error) throw error;
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    const fetchReviewedSubmissions = async () => {
        try {
            const { data, error } = await supabase
                .from('submissions')
                .select(`*, profile:profiles!submissions_user_id_fkey(*)`)
                .in('status', ['validated', 'rejected'])
                .order('updated_at', { ascending: false });
            if (error) throw error;
            setReviewedSubmissions(data || []);
        } catch (error) {
            console.error('Error fetching reviewed submissions:', error);
        }
    };

    const fetchSubmissions = async () => {
        try {
            const { data, error } = await supabase
                .from('submissions')
                .select(`*, profile:profiles!submissions_user_id_fkey(*)`)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });
            if (error) throw error;
            setSubmissions(data || []);
        } catch (error: any) {
            console.error('❌ Error fetching submissions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async () => {
        if (!selectedSubmission) return;
        setIsLoading(true);
        try {
            // Calculate point adjustment (difference if already validated)
            const previousScore = selectedSubmission.status === 'validated' ? (selectedSubmission.score_awarded || 0) : 0;
            const pointAdjustment = score - previousScore;

            const { error: submissionError } = await supabase
                .from('submissions')
                .update({ status: 'validated', score_awarded: score })
                .eq('id', selectedSubmission.id);
            if (submissionError) throw submissionError;

            // Only update points if there's a change
            if (pointAdjustment !== 0) {
                await supabase.rpc('increment_points', {
                    user_id: selectedSubmission.user_id,
                    points: pointAdjustment,
                }).catch(async () => {
                    const { data: cp } = await supabase.from('profiles').select('total_points').eq('id', selectedSubmission.user_id).single();
                    if (cp) {
                        await supabase.from('profiles').update({
                            total_points: (cp.total_points || 0) + pointAdjustment
                        }).eq('id', selectedSubmission.user_id);
                    }
                });
            }

            // Unlock next day only if newly validated (not just score updated)
            if (selectedSubmission.status !== 'validated') {
                const nextDayNumber = selectedSubmission.day_number + 1;
                if (nextDayNumber <= 15) {
                    await supabase.from('challenge_days').update({ is_active: true }).eq('day_number', nextDayNumber);
                }
            }

            setSelectedSubmission(null);
            fetchSubmissions();
            fetchReviewedSubmissions();
            fetchUsers(); // Refresh users list for points update
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
            // Calculate point adjustment (remove points if previously validated)
            const previousScore = selectedSubmission.status === 'validated' ? (selectedSubmission.score_awarded || 0) : 0;
            const pointAdjustment = -previousScore;

            const { error } = await supabase
                .from('submissions')
                .update({
                    status: 'rejected',
                    score_awarded: 0,
                    rejection_comment: rejectionComment || null,
                })
                .eq('id', selectedSubmission.id);
            if (error) throw error;

            if (pointAdjustment !== 0) {
                await supabase.rpc('increment_points', {
                    user_id: selectedSubmission.user_id,
                    points: pointAdjustment,
                }).catch(async () => {
                    const { data: cp } = await supabase.from('profiles').select('total_points').eq('id', selectedSubmission.user_id).single();
                    if (cp) {
                        await supabase.from('profiles').update({
                            total_points: Math.max(0, (cp.total_points || 0) + pointAdjustment)
                        }).eq('id', selectedSubmission.user_id);
                    }
                });
            }

            setSelectedSubmission(null);
            setRejectionComment('');
            fetchSubmissions();
            fetchReviewedSubmissions();
            fetchUsers(); // Refresh users list
        } catch (error) {
            console.error('Error rejecting submission:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (profile?.role !== 'ambassador') return null;

    return (
        <div className="min-h-screen pb-12">
            <header className="glass-strong border-b border-white/10 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-2 rounded-2xl shadow-lg glow-purple">
                                <Shield className="w-6 h-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-white font-display tracking-tight">Admin Dashboard</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <ExportButton type="submissions" />
                            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
                            <Button variant="ghost" onClick={signOut} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold">
                                <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="glass-strong rounded-2xl p-6 border border-orange-500/30 hover-glow transition-all">
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">En attente</p>
                        <p className="text-3xl font-bold text-orange-400 mt-2 font-display">{submissions.length}</p>
                    </div>
                    <div className="glass-strong rounded-2xl p-6 border border-green-500/30 hover-glow transition-all">
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">Analysées</p>
                        <p className="text-3xl font-bold text-green-400 mt-2 font-display">{reviewedSubmissions.length}</p>
                    </div>
                    <div className="glass-strong rounded-2xl p-6 border border-blue-500/30 hover-glow transition-all">
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">Participants</p>
                        <p className="text-3xl font-bold text-blue-400 mt-2 font-display">{allUsers.length}</p>
                    </div>
                </div>

                <div className="glass-strong rounded-2xl overflow-hidden border border-white/10">
                    <div className="border-b border-white/10">
                        <div className="flex items-center">
                            {[
                                { id: 'pending', label: 'À valider', count: submissions.length, icon: Eye, color: 'orange' },
                                { id: 'reviewed', label: 'Analysées', count: reviewedSubmissions.length, icon: CheckCircle2, color: 'green' },
                                { id: 'communications', label: 'Communications', count: announcements.length, icon: Send, color: 'purple' },
                                { id: 'users', label: 'Participants', count: allUsers.length, icon: Users, color: 'blue' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 px-6 py-4 text-sm font-medium text-center transition-colors relative ${activeTab === tab.id ? `text-${tab.color}-400 bg-${tab.color}-500/10 border-b-2 border-${tab.color}-500` : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'}`}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label} ({tab.count})
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {activeTab === 'pending' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900/60 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Étudiant</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jour</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 bg-transparent">
                                    {loading ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Chargement...</td></tr>
                                    ) : submissions.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500">Aucune soumission en attente. 🎉</td></tr>
                                    ) : (
                                        submissions.map(s => (
                                            <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden">
                                                            {s.profile?.avatar_url ? <img src={s.profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">{s.profile?.full_name?.charAt(0)}</div>}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-medium text-white">{s.profile?.full_name}</div>
                                                            <div className="text-xs text-gray-500">{s.profile?.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-white">Jour {s.day_number}</td>
                                                <td className="px-6 py-4 text-xs text-gray-400">{new Date(s.created_at!).toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right"><Button size="sm" onClick={() => setSelectedSubmission(s)}>Évaluer</Button></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'reviewed' && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900/60 border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Étudiant</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Info</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Statut</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {reviewedSubmissions.map(s => (
                                        <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden">
                                                        {s.profile?.avatar_url ? <img src={s.profile.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">{s.profile?.full_name?.charAt(0)}</div>}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-white">{s.profile?.full_name}</div>
                                                        <div className="text-xs text-gray-500">Jour {s.day_number}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-400">{new Date(s.updated_at!).toLocaleDateString()}</div>
                                                <div className="text-sm font-bold text-purple-400">{s.score_awarded}/10</div>
                                            </td>
                                            <td className="px-6 py-4"><Badge status={s.status} /></td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" variant="ghost" onClick={() => { setSelectedSubmission(s); setScore(s.score_awarded || 5); }} className="text-gray-400 hover:text-white">
                                                    <Eye className="w-4 h-4 mr-1" /> Revoir
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'communications' && (
                        <div className="p-6 space-y-8">
                            <div className="glass-panel rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Send className="w-5 h-5 text-purple-400" /> Publier sur le Leaderboard</h3>
                                <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-400 mb-1">Type de contenu</label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {[{ id: 'announcement', label: 'Annonce', icon: Bell }, { id: 'motivation', label: 'Motivation', icon: Flame }, { id: 'video', label: 'Vidéo', icon: Video }, { id: 'link', label: 'Lien Web', icon: LinkIcon }].map(item => (
                                                        <button key={item.id} type="button" onClick={() => setNewAnnouncement({ ...newAnnouncement, type: item.id as any })} className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-all ${newAnnouncement.type === item.id ? 'bg-purple-500/20 border-purple-500 text-purple-400' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}>
                                                            <item.icon className="w-4 h-4" /> <span className="text-sm font-medium">{item.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <input type="text" value={newAnnouncement.title} onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} className="input-neo w-full" placeholder="Titre..." required />
                                            {(newAnnouncement.type === 'video' || newAnnouncement.type === 'link') && <input type="url" value={newAnnouncement.url} onChange={e => setNewAnnouncement({ ...newAnnouncement, url: e.target.value })} className="input-neo w-full" placeholder="https://..." />}
                                        </div>
                                        <textarea value={newAnnouncement.content} onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} className="input-neo w-full h-full min-h-[150px] resize-none" placeholder="Message..." required />
                                    </div>
                                    <div className="flex justify-end pt-2"><Button type="submit" isLoading={isPublishing} className="px-8 btn-primary-neo">Publier</Button></div>
                                </form>
                            </div>
                            <div className="space-y-4">
                                {announcements.map(ann => (
                                    <div key={ann.id} className="glass-panel rounded-2xl p-4 border border-white/10 flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400"><Bell className="w-5 h-5" /></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between"><h4 className="font-bold text-white">{ann.title}</h4><span className="text-xs text-gray-500">{new Date(ann.created_at!).toLocaleDateString()}</span></div>
                                            <p className="text-sm text-gray-400">{ann.content}</p>
                                        </div>
                                        <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-gray-500 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                                <div><h3 className="text-lg font-semibold text-white">Participants</h3><p className="text-xs text-gray-500">Suivi et relance des candidats.</p></div>
                                <div className="flex gap-3">
                                    <Button variant="secondary" size="sm" className="gap-2 border-orange-500/20 text-orange-400" onClick={() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        const late = allUsers.filter(u => !reviewedSubmissions.some(s => s.user_id === u.id && s.created_at?.startsWith(today)) && !submissions.some(s => s.user_id === u.id && s.created_at?.startsWith(today)));
                                        if (late.length === 0) return alert("Tout le monde est à jour !");
                                        window.location.href = `mailto:?bcc=${late.map(u => u.email).join(',')}&subject=Rappel Marathon Challenge&body=N'oubliez pas votre participation du jour !`;
                                    }}><Bell className="w-4 h-4" /> Rappel</Button>
                                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" /><input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-neo pl-10 h-10 text-sm" /></div>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="text-left border-b border-white/5"><th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Candidat</th><th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Université</th><th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-center">Jours</th><th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-center">Score</th><th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-right">Actions</th></tr></thead>
                                    <tbody className="divide-y divide-white/5">{allUsers.filter(u => u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())).map(u => (
                                        <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden">{u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-1" />}</div><div><div className="text-sm font-bold text-white">{u.full_name}</div><div className="text-xs text-gray-500">{u.email}</div></div></div></td>
                                            <td className="px-4 py-4 text-sm text-gray-300">{u.university || 'N/A'}</td>
                                            <td className="px-4 py-4 text-center text-sm text-white font-bold">{u.validated_count}/15</td>
                                            <td className="px-4 py-4 text-center"><span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">{u.total_points} pts</span></td>
                                            <td className="px-4 py-4 text-right"><button onClick={() => alert('Bientôt disponible')} className="text-gray-500 hover:text-white"><MessageSquare className="w-5 h-5" /></button></td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {selectedSubmission && (
                <Modal isOpen={!!selectedSubmission} onClose={() => setSelectedSubmission(null)} title={`Évaluer Jour ${selectedSubmission.day_number}`} size="xl">
                    <div className="space-y-6">
                        <div className="glass-panel rounded-2xl p-5 border border-white/10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -z-10" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                <div><p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Candidat</p><p className="font-bold text-white text-lg">{selectedSubmission.profile?.full_name}</p></div>
                                <div><p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Plateforme</p><Badge status="pending">{selectedSubmission.platform}</Badge></div>
                                <div className="col-span-full"><p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Lien publication</p><a href={selectedSubmission.post_link} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 flex items-center gap-2 text-sm font-medium"><span className="truncate">{selectedSubmission.post_link}</span> <ExternalLink className="w-4 h-4" /></a></div>
                            </div>
                        </div>
                        {selectedSubmission.proof_image_url && <img src={selectedSubmission.proof_image_url} alt="Proof" className="w-full rounded-xl border border-white/10 shadow-lg" />}
                        <div className="glass-panel rounded-2xl p-5 border border-white/10">
                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-3">Notation (0-10)</label>
                            <div className="flex items-center gap-4"><input type="range" min="0" max="10" value={score} onChange={e => setScore(Number(e.target.value))} className="flex-1 accent-purple-500" /><div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500 flex items-center justify-center font-bold text-purple-400 text-xl">{score}</div></div>
                        </div>
                        <div className="glass-panel rounded-2xl p-5 border border-white/10">
                            <label className="block text-[10px] uppercase font-bold text-gray-500 mb-3 flex items-center gap-2"><MessageSquare className="w-3.5 h-3.5" /> Commentaire / Motif</label>
                            <textarea value={rejectionComment} onChange={e => setRejectionComment(e.target.value)} rows={3} className="input-neo w-full resize-none bg-black/20 border-white/5" placeholder="Message..." />
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <Button variant="danger" onClick={handleReject} isLoading={isLoading} className="flex-1"><XCircle className="w-4 h-4 mr-2" /> Refuser</Button>
                            <Button variant="success" onClick={handleValidate} isLoading={isLoading} className="flex-1"><CheckCircle2 className="w-4 h-4 mr-2" /> Valider</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AdminDashboard;
