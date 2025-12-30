import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Trophy, LogIn, ArrowLeft, Key, User as UserIcon, AlertCircle } from 'lucide-react';

const QuickLogin: React.FC = () => {
    const navigate = useNavigate();
    const [loginId, setLoginId] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Nettoyer l'identifiant (enlever les espaces)
            const cleanedId = loginId.trim().toUpperCase();

            if (!cleanedId) {
                setError('Veuillez entrer votre identifiant de connexion');
                setIsLoading(false);
                return;
            }

            // Rechercher le profil avec cet identifiant
            console.log('🔍 [QUICK LOGIN] Recherche du profil avec ID:', cleanedId);

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('unique_login_id', cleanedId)
                .eq('is_registered', true)
                .single();

            console.log('🔍 [QUICK LOGIN] Profil trouvé:', profile);
            console.log('🔍 [QUICK LOGIN] Erreur:', profileError);

            if (profileError || !profile) {
                console.error('❌ [QUICK LOGIN] Profil non trouvé ou erreur');
                setError('Identifiant invalide. Veuillez vérifier votre identifiant de connexion.');
                setIsLoading(false);
                return;
            }

            console.log('✅ [QUICK LOGIN] Profil valide trouvé:', profile.id);
            console.log('✅ [QUICK LOGIN] Email:', profile.email);
            console.log('✅ [QUICK LOGIN] Nom:', profile.full_name);

            // Connexion réussie - Créer une session Supabase
            // Note: Pour l'instant, on utilise une approche simplifiée
            // Dans un système de production, vous devriez implémenter un système de tokens

            // Stocker temporairement l'ID du profil pour que le Dashboard puisse le récupérer
            sessionStorage.setItem('quick_login_user_id', profile.id);
            sessionStorage.setItem('quick_login_timestamp', Date.now().toString());

            console.log('💾 [QUICK LOGIN] Session stockée dans sessionStorage');
            console.log('💾 [QUICK LOGIN] user_id:', profile.id);
            console.log('💾 [QUICK LOGIN] timestamp:', Date.now());

            // Rediriger vers le dashboard avec rechargement de la page
            // Cela permet à AuthContext de relire sessionStorage
            console.log('🚀 [QUICK LOGIN] Redirection vers /dashboard avec rechargement...');

            // Utiliser window.location au lieu de navigate() pour forcer un rechargement
            window.location.href = '/dashboard';
        } catch (err) {
            console.error('❌ [QUICK LOGIN] Erreur:', err);
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-32 h-32 md:w-64 md:h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-40 h-40 md:w-80 md:h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Back Button */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">Retour au classement</span>
                </motion.button>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="glass-strong rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl"
                >
                    {/* Header */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, type: "spring" }}
                            className="inline-flex items-center justify-center mb-4"
                        >
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-3xl shadow-2xl glow-blue relative">
                                <Key className="w-10 h-10 text-white" />
                            </div>
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white mb-2 font-display">
                            Connexion Rapide
                        </h1>
                        <p className="text-gray-400">
                            Entrez votre identifiant unique pour accéder à votre compte
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="loginId" className="block text-sm font-medium text-gray-300 mb-2">
                                Identifiant de Connexion
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    id="loginId"
                                    value={loginId}
                                    onChange={(e) => setLoginId(e.target.value)}
                                    placeholder="MC-XXXX-XXXX"
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all uppercase"
                                    disabled={isLoading}
                                />
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                                Format: MC-XXXX-XXXX (ex: MC-1234-5678)
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                            >
                                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                                <p className="text-sm text-red-400">{error}</p>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            isLoading={isLoading}
                            size="lg"
                            className="w-full btn-primary-neo group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative flex items-center justify-center gap-2">
                                <LogIn className="w-5 h-5" />
                                <span className="font-semibold">Se Connecter</span>
                            </div>
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-900/50 text-gray-400">ou</span>
                        </div>
                    </div>

                    {/* First Time Registration */}
                    <div className="text-center space-y-4">
                        <p className="text-sm text-gray-400">
                            Première fois sur le Marathon Challenge ?
                        </p>
                        <Button
                            onClick={() => navigate('/login')}
                            variant="secondary"
                            size="lg"
                            className="w-full border-white/10 hover:border-blue-500/30 hover:bg-blue-500/5"
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Trophy className="w-5 h-5 text-blue-400" />
                                <span className="font-semibold">Participer au Challenge</span>
                            </div>
                        </Button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                        <p className="text-xs text-gray-400 text-center">
                            💡 Votre identifiant unique vous a été communiqué lors de votre première inscription.
                            Si vous l'avez perdu, contactez un ambassadeur.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default QuickLogin;
