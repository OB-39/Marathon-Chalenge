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
    const { user, profile, refreshProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string>(profile?.avatar_url || '');

    const [formData, setFormData] = useState({
        phoneNumber: profile?.phone_number || '',
        university: profile?.university || '',
        bio: profile?.bio || '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

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

                if (uploadError) throw uploadError;

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

            if (updateError) throw updateError;

            await refreshProfile();
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            alert('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Modifier mon profil" size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
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

                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handlePhotoChange}
                                className="hidden"
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
                            className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="+229 XX XX XX XX"
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
                            className="w-full pl-11 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            placeholder="Ex: Université d'Abomey-Calavi"
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
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                        placeholder="Parlez-nous de vous..."
                    />
                </div>

                {/* Boutons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Annuler
                    </Button>
                    <Button type="submit" isLoading={loading}>
                        Enregistrer les modifications
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default EditProfileModal;
