import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/ui/Button';
import { Trophy, Target, Users, Sparkles, Zap, Award } from 'lucide-react';

const Login: React.FC = () => {
    const { signInWithGoogle } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            await signInWithGoogle();
        } catch (error) {
            console.error('Login error:', error);
            setIsLoading(false);
        }
    };

    const features = [
        {
            icon: Target,
            title: 'Défi quotidien',
            description: 'Un challenge par jour pendant 15 jours',
            color: 'green',
            gradient: 'from-green-500 to-emerald-600'
        },
        {
            icon: Users,
            title: 'Visibilité garantie',
            description: 'Construisez votre portfolio public',
            color: 'blue',
            gradient: 'from-blue-500 to-cyan-600'
        },
        {
            icon: Award,
            title: 'Classement en temps réel',
            description: 'Comparez vos performances',
            color: 'purple',
            gradient: 'from-purple-500 to-pink-600'
        }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-32 h-32 md:w-64 md:h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-10 w-40 h-40 md:w-80 md:h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 md:w-96 md:h-96 bg-green-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            <div className="w-full max-w-6xl grid md:grid-cols-2 gap-6 md:gap-8 items-center relative z-10">
                {/* Left side - Branding (Hidden on mobile, shown on desktop) */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="hidden md:block space-y-6"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg glow-blue border border-white/10">
                            <img src="/logo.png" className="w-full h-full object-cover" alt="Logo" />
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-white font-display">
                            Marathon Challenge
                        </h1>
                    </div>

                    <p className="text-xl text-gray-300">
                        15 jours pour révéler votre talent de créateur de contenu
                    </p>

                    <div className="space-y-4 pt-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                                className="flex items-start gap-4"
                            >
                                <div className={`bg-${feature.color}-500/20 p-2 rounded-lg border border-${feature.color}-500/30`}>
                                    <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-400 text-sm">
                                        {feature.description}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Right side - Login card (Full width on mobile) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="w-full"
                >
                    {/* Mobile Header */}
                    <div className="md:hidden text-center mb-6 space-y-3">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, type: "spring" }}
                            className="inline-flex items-center justify-center"
                        >
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-3xl shadow-2xl glow-blue relative">
                                <Trophy className="w-12 h-12 text-white" />
                                <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                                    <Sparkles className="w-4 h-4 text-yellow-900" />
                                </div>
                            </div>
                        </motion.div>
                        <h1 className="text-3xl font-bold text-white font-display">
                            Marathon Challenge
                        </h1>
                        <p className="text-sm text-gray-400 px-4">
                            15 jours pour révéler votre talent de créateur
                        </p>
                    </div>

                    {/* Login Card */}
                    <div className="glass-strong rounded-2xl md:rounded-3xl p-6 md:p-12 border border-white/10 shadow-2xl">
                        <div className="text-center space-y-6">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 font-display">
                                    Bienvenue ! 👋
                                </h2>
                                <p className="text-sm md:text-base text-gray-400">
                                    Connectez-vous pour commencer le challenge
                                </p>
                            </div>

                            {/* Features Grid - Mobile Only */}
                            <div className="md:hidden grid grid-cols-3 gap-3 py-4">
                                {features.map((feature, index) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
                                        className="glass-panel rounded-xl p-3 border border-white/10 text-center"
                                    >
                                        <div className={`bg-gradient-to-br ${feature.gradient} p-2 rounded-lg mx-auto w-fit mb-2`}>
                                            <feature.icon className="w-5 h-5 text-white" />
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-medium leading-tight">
                                            {feature.title}
                                        </p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Google Sign In Button */}
                            <div className="pt-2">
                                <Button
                                    onClick={handleGoogleSignIn}
                                    isLoading={isLoading}
                                    size="lg"
                                    className="w-full btn-primary-neo group relative overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    <div className="relative flex items-center justify-center">
                                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                            <path
                                                fill="currentColor"
                                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            />
                                            <path
                                                fill="currentColor"
                                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            />
                                        </svg>
                                        <span className="font-semibold">Continuer avec Google</span>
                                    </div>
                                </Button>
                            </div>

                            {/* Stats Preview - Mobile */}
                            <div className="md:hidden pt-4 border-t border-white/10">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className="text-2xl font-bold text-blue-400">15</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Jours</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-purple-400">100+</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Participants</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-400">10</div>
                                        <div className="text-[10px] text-gray-500 uppercase tracking-wide">Points/jour</div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">
                                En vous connectant, vous acceptez de participer au Marathon Challenge
                            </p>
                        </div>
                    </div>

                    {/* Mobile CTA */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="md:hidden mt-6 text-center"
                    >
                        <div className="inline-flex items-center gap-2 glass-panel px-4 py-2 rounded-full border border-white/10">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span className="text-xs text-gray-300 font-medium">Rejoignez le challenge maintenant !</span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
