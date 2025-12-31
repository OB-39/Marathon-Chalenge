import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Upload, User, Phone, Building2, Info } from 'lucide-react';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { user, profile, session, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>(profile?.avatar_url || '');

    const [formData, setFormData] = useState({
        phoneNumber: profile?.phone_number || '',
        university: profile?.university || '',
        bio: profile?.bio || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    // Vérifier si l'utilisateur a une vraie session Supabase
    const hasValidSession = !!session;

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setErrors({ ...errors, photo: 'La photo ne doit pas dépasser 2MB' });
                return;
            }

            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                setErrors({ ...errors, photo: 'Format accepté: JPG, PNG, WebP' });
                return;
            }

            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
            setErrors({ ...errors, photo: '' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Vérifier la session avant de soumettre
        if (!hasValidSession) {
            alert('Vous devez vous connecter avec Google pour modifier votre profil.');
            return;
        }

        setLoading(true);

        try {
            let avatarUrl = profile?.avatar_url || '';

            // Upload de la nouvelle photo si changée
            if (photoFile && user) {
                const fileExt = photoFile.name.split('.').pop();
                const fileName = `${user.id}/avatar.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(fileName, photoFile, { upsert: true });

                if (uploadError) {
                    console.error('Storage error:', uploadError);
                    throw new Error(`Erreur de téléchargement: ${uploadError.message}`);
                }

                const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
                avatarUrl = data.publicUrl;
            }

            // Mettre à jour le profil
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    phone_number: formData.phoneNumber,
                    university: formData.university,
                    bio: formData.bio || null,
                    avatar_url: avatarUrl,
                })
                .eq('id', user?.id);

            if (updateError) {
                console.error('Update error:', updateError);
                if (updateError.message.includes('row-level security')) {
                    throw new Error('Erreur de sécurité: Veuillez vous reconnecter avec Google.');
                }
                throw new Error(`Erreur de mise à jour: ${updateError.message}`);
            }

            await refreshProfile();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue. Veuillez réessayer.';
            alert(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Modifier mon profil" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avertissement pour les utilisateurs sans session valide */}
                {!hasValidSession && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                    Connexion requise
                                </h3>
                                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                                    Pour modifier votre profil et télécharger une photo, vous devez vous connecter avec Google.
                                    La connexion rapide ne permet pas ces modifications pour des raisons de sécurité.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo de profil */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                        Photo de profil
                    </label>
                    <div className="flex items-center gap-4">
                        {photoPreview ? (
                            <img
                                src={photoPreview}
                                alt="Aperçu"
                                className="w-20 h-20 rounded-full object-cover border-2 border-primary"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center border-2 border-slate-200 dark:border-slate-600">
                                <User className="w-10 h-10 text-slate-400" />
                            </div>
                        )}

                        <label className={hasValidSession ? "cursor-pointer" : "cursor-not-allowed opacity-50"}>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoChange}
                                className="hidden"
                                disabled={!hasValidSession}
                            />
                            <div className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-2 text-slate-700 dark:text-slate-200 text-sm font-medium">
                                <Upload className="w-4 h-4" />
                                Changer la photo
                            </div>
                        </label>
                    </div>
                    {errors.photo && <p className="mt-2 text-sm text-error">{errors.photo}</p>}
                </div>

                {/* Téléphone */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Numéro de téléphone
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="+229 XX XX XX XX"
                            disabled={!hasValidSession}
                        />
                    </div>
                </div>

                {/* Université */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Université
                    </label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={formData.university}
                            onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                            className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            placeholder="Ex: Université d'Abomey-Calavi"
                            disabled={!hasValidSession}
                        />
                    </div>
                </div>

                {/* Bio */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        <Info className="w-4 h-4 inline mr-1" />
                        Infos +
                    </label>
                    <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Parlez-nous de vous..."
                        disabled={!hasValidSession}
                    />
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button type="submit" isLoading={loading} disabled={!hasValidSession}>
                        Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditProfileModal;
