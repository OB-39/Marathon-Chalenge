import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Copy, Check, Key, AlertCircle } from 'lucide-react';
import Button from './ui/Button';

interface UniqueIdModalProps {
    isOpen: boolean;
    onClose: () => void;
    uniqueId: string;
    userName: string;
}

const UniqueIdModal: React.FC<UniqueIdModalProps> = ({ isOpen, onClose, uniqueId, userName }) => {
    const [copied, setCopied] = React.useState(false);

    // Debug logs
    React.useEffect(() => {
        console.log('🎭 [MODAL] UniqueIdModal rendered');
        console.log('🎭 [MODAL] isOpen:', isOpen);
        console.log('🎭 [MODAL] uniqueId:', uniqueId);
        console.log('🎭 [MODAL] userName:', userName);
    }, [isOpen, uniqueId, userName]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(uniqueId);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
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
                        <div className="pointer-events-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="glass-strong rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl relative"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                {/* Icon */}
                                <div className="flex justify-center mb-6">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -180 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: "spring", duration: 0.6 }}
                                        className="bg-gradient-to-br from-green-500 to-emerald-600 p-4 rounded-3xl shadow-lg glow-green"
                                    >
                                        <Key className="w-12 h-12 text-white" />
                                    </motion.div>
                                </div>

                                {/* Title */}
                                <h2 className="text-2xl font-bold text-white text-center mb-2 font-display">
                                    🎉 Inscription Réussie !
                                </h2>
                                <p className="text-gray-400 text-center mb-6">
                                    Bienvenue {userName} !
                                </p>

                                {/* Important Notice */}
                                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="text-sm font-bold text-yellow-400 mb-1">
                                                Important - Conservez cet identifiant !
                                            </h3>
                                            <p className="text-xs text-yellow-200/80">
                                                Cet identifiant unique vous permettra de vous reconnecter facilement à votre compte.
                                                Notez-le précieusement ou prenez une capture d'écran.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Unique ID Display */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-300 mb-3 text-center">
                                        Votre Identifiant de Connexion
                                    </label>
                                    <div className="relative">
                                        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/30 rounded-2xl p-6 text-center">
                                            <motion.div
                                                initial={{ scale: 0.8 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.3, type: "spring" }}
                                                className="text-3xl font-bold text-white font-mono tracking-wider mb-2"
                                            >
                                                {uniqueId}
                                            </motion.div>
                                            <p className="text-xs text-gray-400">
                                                Utilisez cet identifiant pour vous connecter
                                            </p>
                                        </div>

                                        {/* Copy Button */}
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={handleCopy}
                                            className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-colors"
                                        >
                                            {copied ? (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Copié !</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Copier</span>
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </div>

                                {/* Instructions */}
                                <div className="space-y-3 mb-6 mt-8">
                                    <h3 className="text-sm font-bold text-white">Comment utiliser votre identifiant :</h3>
                                    <ol className="space-y-2 text-sm text-gray-400">
                                        <li className="flex items-start gap-2">
                                            <span className="flex-shrink-0 w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                                            <span>Notez ou copiez votre identifiant</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex-shrink-0 w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                                            <span>Lors de votre prochaine visite, cliquez sur "Se Connecter"</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex-shrink-0 w-5 h-5 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                                            <span>Entrez votre identifiant pour accéder à votre compte</span>
                                        </li>
                                    </ol>
                                </div>

                                {/* Action Button */}
                                <Button
                                    onClick={onClose}
                                    size="lg"
                                    className="w-full btn-primary-neo"
                                >
                                    J'ai noté mon identifiant, continuer
                                </Button>

                                {/* Footer Note */}
                                <p className="text-xs text-gray-500 text-center mt-4">
                                    En cas de perte, contactez un ambassadeur pour récupérer votre identifiant
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UniqueIdModal;
