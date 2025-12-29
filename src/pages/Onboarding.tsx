import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Button from '../components/ui/Button';
import { Upload, User, Phone, Building2, Globe, Info, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

const Onboarding: React.FC = () => {
    const { user, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>('');

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: user?.email || '',
        phoneNumber: '',
        university: '',
        preferredPlatform: '',
        bio: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Vérifier la taille (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                setErrors({ ...errors, photo: 'La photo ne doit pas dépasser 2MB' });
                return;
            }

            // Vérifier le format
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                setErrors({ ...errors, photo: 'Format accepté: JPG, PNG, WebP' });
                return;
            }

            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setErrors({ ...errors, photo: '' });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstName.trim()) newErrors.firstName = 'Le prénom est requis';
        if (!formData.lastName.trim()) newErrors.lastName = 'Le nom est requis';
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Le numéro de téléphone est requis';
        if (!formData.university.trim()) newErrors.university = "L'université est requise";
        if (!formData.preferredPlatform) newErrors.preferredPlatform = 'Veuillez choisir un réseau social';
        if (!photoFile) newErrors.photo = 'La photo de profil est requise';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            let avatarUrl = '';

            // Upload de la photo de profil
            if (photoFile && user) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${user.id}/avatar.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, photoFile, { upsert: true });

                if (uploadError) throw uploadError;

                // Obtenir l'URL publique
                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                avatarUrl = data.publicUrl;
            }

            // Mettre à jour le profil
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    full_name: `${formData.firstName} ${formData.lastName}`,
                    phone_number: formData.phoneNumber,
                    university: formData.university,
                    preferred_platform: formData.preferredPlatform,
                    bio: formData.bio || null,
                    avatar_url: avatarUrl,
                    is_registered: true,
                })
                .eq('id', user?.id);

            if (updateError) throw updateError;

            // Animation confetti
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
            });

            // Rafraîchir le profil
            await refreshProfile();

            // Redirection vers le dashboard
            setTimeout(() => {
                navigate('/dashboard');
            }, 1000);
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-3xl"
            >
                <div className="glass-strong rounded-3xl p-8 md:p-12 border border-white/10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl mb-4 shadow-lg glow-blue">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2 font-display">
                            Bienvenue au Marathon Challenge ! 🎉
                        </h1>
                        <p className="text-gray-300">
                            Complétez votre profil pour commencer l'aventure
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Photo de profil */}
                        <div className="glass-panel rounded-2xl p-6 border border-white/10">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-400" />
                                Photo de profil
                            </h2>

                            <div className="flex flex-col items-center gap-4">
                                <div className="relative">
                                    {photoPreview ? (
                                        <img
                                            src={photoPreview}
                                            alt="Aperçu"
                                            className="w-32 h-32 rounded-full object-cover border-4 border-blue-500/30 shadow-lg"
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-slate-800/60 flex items-center justify-center border-4 border-white/10">
                                            <User className="w-16 h-16 text-gray-500" />
                                        </div>
                                    )}
                                </div>

                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                    <div className="px-6 py-3 bg-blue-600/20 border border-blue-500/30 rounded-lg hover:bg-blue-600/30 transition-colors flex items-center gap-2 text-blue-300 font-medium">
                                        <Upload className="w-4 h-4" />
                                        Choisir une photo
                                    </div>
                                </label>

                                {errors.photo && (
                                    <p className="text-sm text-red-400 font-medium">{errors.photo}</p>
                                )}
                                <p className="text-xs text-gray-400 text-center">
                                    JPG, PNG ou WebP • Max 2MB
                                </p>
                            </div>
                        </div>

                        {/* Informations personnelles */}
                        <div className="glass-panel rounded-2xl p-6 border border-white/10">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-blue-400" />
                                Informations personnelles
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Prénom */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Prénom <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.firstName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, firstName: e.target.value })
                                        }
                                        className="input-neo w-full"
                                        placeholder="Jean"
                                    />
                                    {errors.firstName && (
                                        <p className="mt-1 text-sm text-red-400">{errors.firstName}</p>
                                    )}
                                </div>

                                {/* Nom */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Nom <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.lastName}
                                        onChange={(e) =>
                                            setFormData({ ...formData, lastName: e.target.value })
                                        }
                                        className="input-neo w-full"
                                        placeholder="Dupont"
                                    />
                                    {errors.lastName && (
                                        <p className="mt-1 text-sm text-red-400">{errors.lastName}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="input-neo w-full bg-slate-900/60 text-gray-500 cursor-not-allowed"
                                    />
                                </div>

                                {/* Téléphone */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Numéro de téléphone <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="tel"
                                            value={formData.phoneNumber}
                                            onChange={(e) =>
                                                setFormData({ ...formData, phoneNumber: e.target.value })
                                            }
                                            className="input-neo w-full pl-11"
                                            placeholder="+229 XX XX XX XX"
                                        />
                                    </div>
                                    {errors.phoneNumber && (
                                        <p className="mt-1 text-sm text-red-400">{errors.phoneNumber}</p>
                                    )}
                                </div>

                                {/* Université */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Université de provenance <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="text"
                                            value={formData.university}
                                            onChange={(e) =>
                                                setFormData({ ...formData, university: e.target.value })
                                            }
                                            className="input-neo w-full pl-11"
                                            placeholder="Ex: Université d'Abomey-Calavi"
                                        />
                                    </div>
                                    {errors.university && (
                                        <p className="mt-1 text-sm text-red-400">{errors.university}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Réseau social */}
                        <div className="glass-panel rounded-2xl p-6 border border-white/10">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-blue-400" />
                                Réseau social pour les publications
                            </h2>

                            <p className="text-sm text-gray-300 mb-4">
                                Choisissez le réseau social principal sur lequel vous publierez vos contenus
                            </p>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-600' },
                                    { value: 'facebook', label: 'Facebook', color: 'bg-blue-500' },
                                    { value: 'twitter', label: 'Twitter', color: 'bg-sky-500' },
                                    { value: 'instagram', label: 'Instagram', color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500' },
                                ].map((platform) => (
                                    <button
                                        key={platform.value}
                                        type="button"
                                        onClick={() =>
                                            setFormData({ ...formData, preferredPlatform: platform.value })
                                        }
                                        className={`relative p-4 rounded-xl border-2 transition-all ${formData.preferredPlatform === platform.value
                                                ? 'border-blue-500 bg-blue-500/10 shadow-lg ring-2 ring-blue-500/30'
                                                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                                            }`}
                                    >
                                        {formData.preferredPlatform === platform.value && (
                                            <div className="absolute top-2 right-2">
                                                <Check className="w-5 h-5 text-blue-400" />
                                            </div>
                                        )}
                                        <div className={`w-12 h-12 ${platform.color} rounded-lg mx-auto mb-2 shadow-md`}></div>
                                        <p className="text-sm font-medium text-white">
                                            {platform.label}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {errors.preferredPlatform && (
                                <p className="mt-4 text-sm text-red-400">{errors.preferredPlatform}</p>
                            )}
                        </div>

                        {/* Bio */}
                        <div className="glass-panel rounded-2xl p-6 border border-white/10">
                            <h2 className="text-lg font-semibold text-white mb-4">
                                Infos + <span className="text-sm font-normal text-gray-400">(Optionnel)</span>
                            </h2>

                            <textarea
                                value={formData.bio}
                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                rows={4}
                                className="input-neo w-full resize-none"
                                placeholder="Parlez-nous de vous, de vos passions, de vos objectifs..."
                            />
                            <p className="mt-2 text-xs text-gray-400">
                                Cette section sera visible sur votre profil public
                            </p>
                        </div>

                        {/* Bouton de soumission */}
                        <div className="flex justify-center pt-4">
                            <Button
                                type="submit"
                                size="lg"
                                isLoading={loading}
                                className="px-12 py-4 text-lg btn-primary-neo"
                            >
                                Commencer le Challenge 🚀
                            </Button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default Onboarding;
