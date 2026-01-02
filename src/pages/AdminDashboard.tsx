import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
    Eye, CheckCircle2, XCircle, LogOut, MessageSquare,
    Send, Bell, Flame, Video, Link as LinkIcon, Trash2,
    Users, User, Search, ExternalLink, Menu, X
} from 'lucide-react';
import type { Submission, Announcement, Profile } from '../types/database';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import MessageModal from '../components/MessageModal';
import BroadcastMessageModal from '../components/BroadcastMessageModal';
import { exportSubmissionsToPDF, exportDailyReportToPDF } from '../utils/pdfExport';
import { Download, FileText } from 'lucide-react';

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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [messageTarget, setMessageTarget] = useState<{ id: string; name: string } | null>(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);


    const handleLogout = async () => {
        await signOut();
        window.location.href = '/';
    };

    useEffect(() => {
        // Don't redirect if profile is still loading
        if (!profile) return;

        if (profile.role !== 'ambassador') {
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
            alert(`Erreur: ${error.message} `);
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
                .select(`*, profile: profiles!submissions_user_id_fkey(*)`)
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
                .select(`*, profile: profiles!submissions_user_id_fkey(*)`)
                .eq('status', 'pending')
                .order('created_at', { ascending: true });
            if (error) throw error;
            setSubmissions(data || []);
        } catch (error) {
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

            const targetUserId = selectedSubmission.user_id;

            // Only update points if there's a change
            if (pointAdjustment !== 0) {
                try {
                    await supabase.rpc('increment_points', {
                        user_id: targetUserId,
                        points: pointAdjustment,
                    });
                } catch (rpcError: any) {
                    console.warn('RPC increment_points failed, falling back to manual update', rpcError);
                    const { data: cp } = await supabase.from('profiles').select('total_points').eq('id', targetUserId).single();
                    if (cp) {
                        await supabase.from('profiles').update({
                            total_points: (cp.total_points || 0) + pointAdjustment
                        }).eq('id', targetUserId);
                    }
                }
            }

            // Note: Day unlocking is automatic based on validated submissions count
            // The Dashboard.tsx already handles this logic:
            // - Day 1 is always active
            // - Day N+1 becomes active when user has N validated submissions
            // No need to update challenge_days table (it's global, not per-user)

            setSelectedSubmission(null);
            fetchSubmissions();
            fetchReviewedSubmissions();
            fetchUsers(); // Refresh users list for points update
        } catch (error: any) {
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

            const targetUserId = selectedSubmission.user_id;

            if (pointAdjustment !== 0) {
                try {
                    await supabase.rpc('increment_points', {
                        user_id: targetUserId,
                        points: pointAdjustment,
                    });
                } catch (rpcError: any) {
                    console.warn('RPC increment_points failed, falling back to manual update', rpcError);
                    const { data: cp } = await supabase.from('profiles').select('total_points').eq('id', targetUserId).single();
                    if (cp) {
                        await supabase.from('profiles').update({
                            total_points: Math.max(0, (cp.total_points || 0) + pointAdjustment)
                        }).eq('id', targetUserId);
                    }
                }
            }

            setSelectedSubmission(null);
            setRejectionComment('');
            fetchSubmissions();
            fetchReviewedSubmissions();
            fetchUsers(); // Refresh users list
        } catch (error: any) {
            console.error('Error rejecting submission:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubmissionsForPDF = async () => {
        setIsExportingPDF(true);
        try {
            const { data, error } = await supabase
                .from('submissions')
                .select(`
    *,
    profile: profiles!submissions_user_id_fkey(*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) {
                exportSubmissionsToPDF(data as any);
            }
        } catch (error) {
            console.error('Error fetching submissions for PDF:', error);
            alert('Erreur lors de la génération du PDF');
        } finally {
            setIsExportingPDF(false);
        }
    };

    const generateDailyReport = async () => {
        setIsExportingPDF(true);
        try {
            // Fetch all submissions
            const { data: submissionsData, error: subError } = await supabase
                .from('submissions')
                .select(`
                    *,
                    profile: profiles!submissions_user_id_fkey(*)
                `)
                .order('created_at', { ascending: false });

            if (subError) throw subError;

            // Fetch all profiles
            const { data: profilesData, error: profError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'student')
                .order('total_points', { ascending: false });

            if (profError) throw profError;

            // Generate PDF
            exportDailyReportToPDF({
                submissions: submissionsData as any || [],
                profiles: profilesData || [],
                date: new Date()
            });
        } catch (error) {
            console.error('Error generating daily report:', error);
            alert('Erreur lors de la génération du rapport journalier');
        } finally {
            setIsExportingPDF(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                    <p className="text-gray-400 font-medium">Chargement du dashboard...</p>
                </div>
            </div>
        );
    }

    if (profile?.role !== 'ambassador') return null;

    const tabs = [
        { id: 'pending', label: 'À valider', shortLabel: 'Valider', count: submissions.length, icon: Eye, color: 'orange' },
        { id: 'reviewed', label: 'Analysées', shortLabel: 'Analysées', count: reviewedSubmissions.length, icon: CheckCircle2, color: 'green' },
        { id: 'communications', label: 'Communications', shortLabel: 'Comm', count: announcements.length, icon: Send, color: 'purple' },
        { id: 'users', label: 'Participants', shortLabel: 'Users', count: allUsers.length, icon: Users, color: 'blue' }
    ];

    return (
        <div className="min-h-screen bg-[#0F172A] relative overflow-hidden pb-12 md:pb-0">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />
            <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Mobile Header */}
            <header className="glass-strong border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
                    <div className="flex items-center justify-between">
                        {/* Logo & Title */}
                        <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl overflow-hidden shadow-lg glow-purple border border-white/10">
                                <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
                            </div>
                            <h1 className="text-base md:text-xl font-bold text-white font-display tracking-tight">
                                <span className="hidden sm:inline">Admin Dashboard</span>
                                <span className="sm:hidden">Admin</span>
                            </h1>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            <Button
                                variant="secondary"
                                onClick={generateDailyReport}
                                isLoading={isExportingPDF}
                                className="bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"
                            >
                                <FileText className="w-4 h-4 mr-2" /> Rapport Journalier
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={fetchSubmissionsForPDF}
                                isLoading={isExportingPDF}
                                className="bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20"
                            >
                                <Download className="w-4 h-4 mr-2" /> Export PDF
                            </Button>
                            <div className="h-6 w-[1px] bg-white/10"></div>
                            <Button variant="ghost" onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold">
                                <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                            </Button>
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    {mobileMenuOpen && (
                        <div className="md:hidden mt-4 pt-4 border-t border-white/10 space-y-2">
                            <Button
                                variant="secondary"
                                onClick={generateDailyReport}
                                isLoading={isExportingPDF}
                                className="w-full bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 justify-start"
                            >
                                <FileText className="w-4 h-4 mr-2" /> Rapport Journalier
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={fetchSubmissionsForPDF}
                                isLoading={isExportingPDF}
                                className="w-full bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20 justify-start"
                            >
                                <Download className="w-4 h-4 mr-2" /> Export PDF Soumissions
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={handleLogout}
                                className="w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 font-semibold justify-start"
                            >
                                <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-6 mb-6 md:mb-8">
                    <div className="glass-strong rounded-xl md:rounded-2xl p-3 md:p-6 border border-orange-500/30 hover-glow transition-all">
                        <p className="text-[10px] md:text-sm font-medium text-gray-400 uppercase tracking-wide">En attente</p>
                        <p className="text-xl md:text-3xl font-bold text-orange-400 mt-1 md:mt-2 font-display">{submissions.length}</p>
                    </div>
                    <div className="glass-strong rounded-xl md:rounded-2xl p-3 md:p-6 border border-green-500/30 hover-glow transition-all">
                        <p className="text-[10px] md:text-sm font-medium text-gray-400 uppercase tracking-wide">Analysées</p>
                        <p className="text-xl md:text-3xl font-bold text-green-400 mt-1 md:mt-2 font-display">{reviewedSubmissions.length}</p>
                    </div>
                    <div className="glass-strong rounded-xl md:rounded-2xl p-3 md:p-6 border border-blue-500/30 hover-glow transition-all">
                        <p className="text-[10px] md:text-sm font-medium text-gray-400 uppercase tracking-wide">Participants</p>
                        <p className="text-xl md:text-3xl font-bold text-blue-400 mt-1 md:mt-2 font-display">{allUsers.length}</p>
                    </div>
                </div>

                {/* Tabs Container */}
                <div className="glass-strong rounded-xl md:rounded-2xl overflow-hidden border border-white/10">
                    {/* Tabs - Horizontal Scroll on Mobile */}
                    <div className="border-b border-white/10 overflow-x-auto scrollbar-hide">
                        <div className="flex min-w-max md:min-w-0">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`flex-1 min-w-[100px] md:min-w-0 px-4 md:px-6 py-4 md:py-4 text-xs md:text-sm font-medium text-center transition-colors relative ${activeTab === tab.id
                                        ? `text-${tab.color}-400 bg-${tab.color}-500/10 border-b-2 border-${tab.color}-500`
                                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <tab.icon className="w-5 h-5 md:w-5 md:h-5" />
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="hidden md:inline text-sm font-semibold">{tab.label}</span>
                                            <span className="md:hidden text-xs font-semibold">{tab.shortLabel}</span>
                                            <span className="text-xs font-bold opacity-75">({tab.count})</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-0 md:p-0">
                        {activeTab === 'pending' && (
                            <div>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
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
                                                                    {s.profile?.avatar_url ? <img src={s.profile.avatar_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">{s.profile?.full_name?.charAt(0)}</div>}
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

                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-white/5">
                                    {loading ? (
                                        <div className="px-4 py-12 text-center text-gray-500">Chargement...</div>
                                    ) : submissions.length === 0 ? (
                                        <div className="px-4 py-12 text-center text-gray-500">Aucune soumission en attente. 🎉</div>
                                    ) : (
                                        submissions.map(s => (
                                            <div key={s.id} className="p-4 hover:bg-white/5 transition-colors">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden flex-shrink-0">
                                                        {s.profile?.avatar_url ? <img src={s.profile.avatar_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">{s.profile?.full_name?.charAt(0)}</div>}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-white truncate">{s.profile?.full_name}</div>
                                                        <div className="text-xs text-gray-500 truncate">{s.profile?.email}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-semibold text-orange-400">Jour {s.day_number}</span>
                                                            <span className="text-xs text-gray-500">•</span>
                                                            <span className="text-xs text-gray-500">{new Date(s.created_at!).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button size="sm" onClick={() => setSelectedSubmission(s)} className="w-full">Évaluer</Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviewed' && (
                            <div>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
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
                                                                {s.profile?.avatar_url ? <img src={s.profile.avatar_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-400">{s.profile?.full_name?.charAt(0)}</div>}
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

                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y divide-white/5">
                                    {reviewedSubmissions.map(s => (
                                        <div key={s.id} className="p-4 hover:bg-white/5 transition-colors">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-white/10 overflow-hidden flex-shrink-0">
                                                    {s.profile?.avatar_url ? <img src={s.profile.avatar_url} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">{s.profile?.full_name?.charAt(0)}</div>}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-white truncate">{s.profile?.full_name}</div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs font-semibold text-purple-400">Jour {s.day_number}</span>
                                                        <span className="text-xs text-gray-500">•</span>
                                                        <span className="text-xs text-gray-500">{new Date(s.updated_at!).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge status={s.status} />
                                                        <span className="text-sm font-bold text-purple-400">{s.score_awarded}/10</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={() => { setSelectedSubmission(s); setScore(s.score_awarded || 5); }} className="w-full text-gray-400 hover:text-white">
                                                <Eye className="w-4 h-4 mr-1" /> Revoir
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'communications' && (
                            <div className="p-4 md:p-6 space-y-6 md:space-y-8">
                                {/* Section Message Groupé */}
                                <div className="glass-panel rounded-xl md:rounded-2xl p-4 md:p-6 border border-blue-500/30 hover-glow transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-base md:text-lg font-semibold text-white flex items-center gap-2">
                                                <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                                                Message groupé aux candidats
                                            </h3>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Envoyer un message ciblé à plusieurs candidats à la fois
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => setShowBroadcastModal(true)}
                                            className="btn-primary-neo"
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            <span className="hidden md:inline">Nouveau message groupé</span>
                                            <span className="md:hidden">Message</span>
                                        </Button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Users className="w-4 h-4 text-blue-400" />
                                                <span className="text-xs font-semibold text-blue-300">Tous les candidats</span>
                                            </div>
                                            <p className="text-xs text-gray-400">Annonces générales</p>
                                        </div>
                                        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Bell className="w-4 h-4 text-orange-400" />
                                                <span className="text-xs font-semibold text-orange-300">En retard</span>
                                            </div>
                                            <p className="text-xs text-gray-400">Rappels de deadline</p>
                                        </div>
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                                            <div className="flex items-center gap-2 mb-1">
                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                <span className="text-xs font-semibold text-green-300">Ayant validé</span>
                                            </div>
                                            <p className="text-xs text-gray-400">Félicitations</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Section Publication Leaderboard */}
                                <div className="glass-panel rounded-xl md:rounded-2xl p-4 md:p-6 border border-white/10">
                                    <h3 className="text-base md:text-lg font-semibold text-white mb-4 md:mb-6 flex items-center gap-2">
                                        <Send className="w-4 h-4 md:w-5 md:h-5 text-purple-400" /> Publier sur le Leaderboard
                                    </h3>
                                    <form onSubmit={handleCreateAnnouncement} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs md:text-sm font-medium text-gray-400 mb-2">Type de contenu</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { id: 'announcement', label: 'Annonce', icon: Bell },
                                                            { id: 'motivation', label: 'Motivation', icon: Flame },
                                                            { id: 'video', label: 'Vidéo', icon: Video },
                                                            { id: 'link', label: 'Lien', icon: LinkIcon }
                                                        ].map(item => (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => setNewAnnouncement({ ...newAnnouncement, type: item.id as any })}
                                                                className={`flex items - center justify - center gap - 2 p - 2 md: p - 3 rounded - lg md: rounded - xl border transition - all text - xs md: text - sm ${newAnnouncement.type === item.id
                                                                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                                                                    : 'border-white/10 text-gray-400 hover:bg-white/5'
                                                                    } `}
                                                            >
                                                                <item.icon className="w-3 h-3 md:w-4 md:h-4" />
                                                                <span className="font-medium">{item.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    value={newAnnouncement.title}
                                                    onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                                    className="input-neo w-full text-sm md:text-base"
                                                    placeholder="Titre..."
                                                    required
                                                />
                                                {(newAnnouncement.type === 'video' || newAnnouncement.type === 'link') && (
                                                    <input
                                                        type="url"
                                                        value={newAnnouncement.url}
                                                        onChange={e => setNewAnnouncement({ ...newAnnouncement, url: e.target.value })}
                                                        className="input-neo w-full text-sm md:text-base"
                                                        placeholder="https://..."
                                                    />
                                                )}
                                            </div>
                                            <textarea
                                                value={newAnnouncement.content}
                                                onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                                className="input-neo w-full h-full min-h-[120px] md:min-h-[150px] resize-none text-sm md:text-base"
                                                placeholder="Message..."
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end pt-2">
                                            <Button type="submit" isLoading={isPublishing} className="w-full md:w-auto px-6 md:px-8 btn-primary-neo">
                                                Publier
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                                <div className="space-y-3 md:space-y-4">
                                    {announcements.map(ann => (
                                        <div key={ann.id} className="glass-panel rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/10 flex items-start gap-3 md:gap-4">
                                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-purple-500/10 text-purple-400 flex-shrink-0">
                                                <Bell className="w-4 h-4 md:w-5 md:h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-bold text-white text-sm md:text-base truncate">{ann.title}</h4>
                                                    <span className="text-[10px] md:text-xs text-gray-500 flex-shrink-0">{new Date(ann.created_at!).toLocaleDateString()}</span>
                                                </div>
                                                <p className="text-xs md:text-sm text-gray-400 mt-1 line-clamp-2">{ann.content}</p>
                                            </div>
                                            <button onClick={() => handleDeleteAnnouncement(ann.id)} className="text-gray-500 hover:text-red-400 flex-shrink-0">
                                                <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="p-4 md:p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                                    <div>
                                        <h3 className="text-base md:text-lg font-semibold text-white">Participants</h3>
                                        <p className="text-xs text-gray-500">Suivi et relance des candidats.</p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="gap-2 border-orange-500/20 text-orange-400 w-full sm:w-auto"
                                            onClick={() => {
                                                const today = new Date().toISOString().split('T')[0];
                                                const late = allUsers.filter(u => !reviewedSubmissions.some(s => s.user_id === u.id && s.created_at?.startsWith(today)) && !submissions.some(s => s.user_id === u.id && s.created_at?.startsWith(today)));
                                                if (late.length === 0) return alert("Tout le monde est à jour !");
                                                window.location.href = `mailto:? bcc = ${late.map(u => u.email).join(',')}& subject=Rappel Marathon Challenge & body=N'oubliez pas votre participation du jour !`;
                                            }}
                                        >
                                            <Bell className="w-4 h-4" /> Rappel
                                        </Button >
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={fetchSubmissionsForPDF}
                                            isLoading={isExportingPDF}
                                            className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                        >
                                            <Download className="w-4 h-4" /> PDF
                                        </Button>
                                        <div className="relative w-full sm:w-auto">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="text"
                                                placeholder="Rechercher..."
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                className="input-neo pl-10 h-10 text-sm w-full"
                                            />
                                        </div>
                                    </div >
                                </div >

                                {/* Desktop Table */}
                                < div className="hidden md:block overflow-x-auto" >
                                    <table className="w-full">
                                        <thead>
                                            <tr className="text-left border-b border-white/5">
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Candidat</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase">Université</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-center">Jours</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-center">Score</th>
                                                <th className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {allUsers.filter(u =>
                                                (u.full_name || u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                                            ).map(u => (
                                                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden">
                                                                {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : <User className="w-full h-full p-1" />}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-white">{u.full_name}</div>
                                                                <div className="text-xs text-gray-500">{u.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-sm text-gray-300">{u.university || 'N/A'}</td>
                                                    <td className="px-4 py-4 text-center text-sm text-white font-bold">{u.validated_count}/15</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">{u.total_points} pts</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <button
                                                            onClick={() => {
                                                                setMessageTarget({ id: u.id, name: u.full_name || u.email });
                                                                setIsMessageModalOpen(true);
                                                            }}
                                                            className="text-blue-400 hover:text-blue-300 p-2 rounded-lg hover:bg-blue-500/10 transition-colors"
                                                            title="Envoyer un message"
                                                        >
                                                            <MessageSquare className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div >

                                {/* Mobile Cards */}
                                < div className="md:hidden space-y-3" >
                                    {
                                        allUsers.filter(u =>
                                            (u.full_name || u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
                                        ).map(u => (
                                            <div key={u.id} className="glass-panel rounded-xl p-4 border border-white/10">
                                                <div className="flex items-start gap-3 mb-3">
                                                    <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden flex-shrink-0">
                                                        {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : <User className="w-full h-full p-2 text-gray-400" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-bold text-white truncate">{u.full_name}</div>
                                                        <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                                        <div className="text-xs text-gray-400 mt-1">{u.university || 'N/A'}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-3 border-t border-white/10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-center">
                                                            <div className="text-xs text-gray-500">Jours</div>
                                                            <div className="text-sm font-bold text-white">{u.validated_count}/15</div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-xs text-gray-500">Score</div>
                                                            <div className="text-sm font-bold text-blue-400">{u.total_points} pts</div>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setMessageTarget({ id: u.id, name: u.full_name || u.email });
                                                            setIsMessageModalOpen(true);
                                                        }}
                                                        className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors"
                                                    >
                                                        <MessageSquare className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div >
                            </div >
                        )}
                    </div >
                </div >
            </main >

            {/* Evaluation Modal */}
            {
                selectedSubmission && (
                    <Modal isOpen={!!selectedSubmission} onClose={() => setSelectedSubmission(null)} title={`Évaluer Jour ${selectedSubmission.day_number}`} size="xl">
                        <div className="space-y-4 md:space-y-6">
                            <div className="glass-panel rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl -z-10" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 relative">
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Candidat</p>
                                        <p className="font-bold text-white text-base md:text-lg">{selectedSubmission.profile?.full_name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Plateforme</p>
                                        <Badge status="pending">{selectedSubmission.platform}</Badge>
                                    </div>
                                    <div className="col-span-full">
                                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Lien publication</p>
                                        <a
                                            href={selectedSubmission.post_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-400 hover:text-purple-300 flex items-center gap-2 text-xs md:text-sm font-medium break-all"
                                        >
                                            <span className="truncate">{selectedSubmission.post_link}</span>
                                            <ExternalLink className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                            {selectedSubmission.proof_image_url && (
                                <img src={selectedSubmission.proof_image_url} alt="Proof" className="w-full rounded-xl border border-white/10 shadow-lg" />
                            )}
                            <div className="glass-panel rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/10">
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-3">Notation (0-10)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="10"
                                        value={score}
                                        onChange={e => setScore(Number(e.target.value))}
                                        className="flex-1 accent-purple-500"
                                    />
                                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500 flex items-center justify-center font-bold text-purple-400 text-xl">
                                        {score}
                                    </div>
                                </div>
                            </div>
                            <div className="glass-panel rounded-xl md:rounded-2xl p-4 md:p-5 border border-white/10">
                                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-3 flex items-center gap-2">
                                    <MessageSquare className="w-3.5 h-3.5" /> Commentaire / Motif
                                </label>
                                <textarea
                                    value={rejectionComment}
                                    onChange={e => setRejectionComment(e.target.value)}
                                    rows={3}
                                    className="input-neo w-full resize-none bg-black/20 border-white/5 text-sm md:text-base"
                                    placeholder="Message..."
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
                                <Button variant="danger" onClick={handleReject} isLoading={isLoading} className="flex-1">
                                    <XCircle className="w-4 h-4 mr-2" /> Refuser
                                </Button>
                                <Button variant="success" onClick={handleValidate} isLoading={isLoading} className="flex-1">
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Valider
                                </Button>
                            </div>
                        </div>
                    </Modal>
                )
            }
            {/* Message Modal */}
            {
                messageTarget && (
                    <MessageModal
                        isOpen={isMessageModalOpen}
                        onClose={() => {
                            setIsMessageModalOpen(false);
                            setMessageTarget(null);
                        }}
                        recipientId={messageTarget.id}
                        recipientName={messageTarget.name}
                    />
                )
            }

            {/* Broadcast Message Modal */}
            <BroadcastMessageModal
                isOpen={showBroadcastModal}
                onClose={() => setShowBroadcastModal(false)}
            />
        </div >
    );
};

export default AdminDashboard;
