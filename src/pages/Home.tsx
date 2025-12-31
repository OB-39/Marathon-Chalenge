import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Rocket, Target, Users, TrendingUp, Trophy, ArrowRight, Zap, LayoutDashboard, ChevronRight, Star } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import ProfileDropdown from '../components/ProfileDropdown';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    const features = [
        {
            icon: Target,
            title: "Méthode Structurée",
            description: "Fini le flou artistique. Suivez un plan d'action précis sur 15 jours pour maximiser votre impact.",
            color: "blue"
        },
        {
            icon: Zap,
            title: "Constance & Discipline",
            description: "Le secret de la réussite ? La régularité. Nous vous aidons à construire une habitude de création solide.",
            color: "yellow"
        },
        {
            icon: TrendingUp,
            title: "Suivi de Performance",
            description: "Analysez votre progression. Recevez des feedbacks et validez vos acquis jour après jour.",
            color: "green"
        },
        {
            icon: Users,
            title: "Encadrement & Communauté",
            description: "Ne restez plus seul face à votre écran. Rejoignez une élite de créateurs motivés.",
            color: "purple"
        }
    ];

    return (
        <div className="min-h-screen bg-[#0F172A] relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-600/20 to-transparent pointer-events-none" />
            <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

            {/* Nav */}
            <nav className="relative z-50 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg glow-blue border border-white/10">
                        <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
                    </div>
                    <span className="text-xl font-bold text-white font-display hidden sm:inline">Marathon Challenge</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/leaderboard')}
                        className="text-gray-300 hover:text-white transition-colors font-medium text-sm hidden sm:block"
                    >
                        Classement
                    </button>
                    {user ? (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="hidden sm:flex bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 px-4 py-2 rounded-xl font-bold transition-all border border-blue-500/20 items-center gap-2"
                            >
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </button>
                            <ProfileDropdown onEditProfile={() => setIsEditProfileOpen(true)} />
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/quick-login')}
                            className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-lg"
                        >
                            Se connecter
                        </button>
                    )}
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-24 md:pt-20 md:pb-32">
                {user ? (
                    /* PERSONALIZED LOGGED-IN HERO */
                    <div className="text-center md:text-left grid md:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-sm mb-6">
                                <Star className="w-4 h-4 fill-current" />
                                <span>Ravi de vous revoir !</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-display leading-tight">
                                Salut, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">{profile?.full_name?.split(' ')[0] || 'Aventurier'}</span> !
                            </h1>

                            <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-xl">
                                Votre challenge est en cours. Ne perdez pas le rythme et continuez à construire votre succès un jour après l'autre.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <button
                                    onClick={() => navigate('/dashboard')}
                                    className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-[0_0_30px_-5px_rgba(59,130,246,0.5)] flex items-center justify-center gap-3 group"
                                >
                                    Reprendre le Challenge
                                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => navigate('/leaderboard')}
                                    className="w-full sm:w-auto px-10 py-5 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-colors backdrop-blur-sm flex items-center justify-center gap-2"
                                >
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    Voir mon rang
                                </button>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="hidden md:block"
                        >
                            <div className="glass-strong rounded-[2.5rem] p-10 border border-white/10 relative group">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[2.6rem] blur opacity-20 group-hover:opacity-40 transition-opacity" />
                                <div className="relative space-y-8">
                                    <div className="flex items-center gap-6">
                                        {profile?.avatar_url ? (
                                            <img src={profile.avatar_url} className="w-24 h-24 rounded-full border-4 border-blue-500/30 object-cover shadow-2xl" alt="" />
                                        ) : (
                                            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center border-4 border-white/10 shadow-2xl">
                                                <LayoutDashboard className="w-10 h-10 text-gray-600" />
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-2xl font-black text-white">{profile?.full_name}</h3>
                                            <p className="text-gray-400 font-medium">Participant Élite</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                            <p className="text-3xl font-black text-blue-400 mb-1">{profile?.total_points || 0}</p>
                                            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Points</p>
                                        </div>
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                            <p className="text-3xl font-black text-purple-400 mb-1">#--</p>
                                            <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Rang</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => navigate('/dashboard')}
                                        className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-white font-bold transition-all border border-white/10 flex items-center justify-center gap-2"
                                    >
                                        Accéder aux tâches <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                ) : (
                    /* PUBLIC LANDING HERO (NO USER) */
                    <div className="text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 font-bold text-sm mb-8 backdrop-blur-sm animate-pulse-slow">
                                <Rocket className="w-4 h-4" />
                                <span>Janvier 2026</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 font-display tracking-tight leading-tight">
                                Passez de l'ombre à la <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                    Lumière en 15 Jours
                                </span>
                            </h1>

                            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                                Le premier incubateur intensif de création de contenu.
                                Une méthode éprouvée pour construire votre audience, structurer votre pensée et valider vos compétences digitales.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl hover:shadow-purple-500/25 flex items-center justify-center gap-2"
                                >
                                    Rejoindre le Challenge
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => navigate('/leaderboard')}
                                    className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold text-lg hover:bg-white/10 transition-colors backdrop-blur-sm flex items-center justify-center gap-2"
                                >
                                    <Trophy className="w-5 h-5 text-yellow-500" />
                                    Voir le Classement
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Features Grid - Always visible or show more stats if logged in */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-24 text-left">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.1 }}
                            className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors group"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${feature.color === 'blue' ? 'bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white' :
                                feature.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400 group-hover:bg-yellow-500 group-hover:text-white' :
                                    feature.color === 'green' ? 'bg-green-500/20 text-green-400 group-hover:bg-green-500 group-hover:text-white' :
                                        'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-white'
                                }`}>
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Social Proof / Stats */}
                {!user && (
                    <div className="mt-24 border-t border-white/10 pt-16 mb-24">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                            {[
                                { label: "Jours de Challenge", value: "15" },
                                { label: "Participants", value: "50+" },
                                { label: "Contenus Créés", value: "100+" },
                                { label: "Impact", value: "Infini" }
                            ].map((stat, idx) => (
                                <div key={idx}>
                                    <p className="text-3xl md:text-4xl font-bold text-white mb-2 font-display">{stat.value}</p>
                                    <p className="text-sm text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-white/10 bg-black/20 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-500 font-bold">Marathon Challenge</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                        &copy; 2026 Tous droits réservés. Propulsé par l'équipe Marathon Challenge.
                    </p>
                </div>
            </footer>

            <EditProfileModal
                isOpen={isEditProfileOpen}
                onClose={() => setIsEditProfileOpen(false)}
                onSuccess={() => { }}
            />
        </div>
    );
};

export default Home;
