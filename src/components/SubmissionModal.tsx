import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Upload, Link as LinkIcon } from 'lucide-react';

interface SubmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    dayNumber: number;
    onSuccess: () => void;
}

const SubmissionModal: React.FC<SubmissionModalProps> = ({
    isOpen,
    onClose,
    dayNumber,
    onSuccess,
}) => {
    const { user } = useAuth();
    const [platform, setPlatform] = useState<'linkedin' | 'facebook' | 'instagram'>('linkedin');
    const [postLink, setPostLink] = useState('');
    const [contentText, setContentText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setError('');
        setIsLoading(true);

        try {
            let proofImageUrl = null;

            // Upload image if provided
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${user.id}/jour_${dayNumber}/${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('proofs')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data } = supabase.storage.from('proofs').getPublicUrl(fileName);
                proofImageUrl = data.publicUrl;
            }

            // Insert submission
            const { error: insertError } = await supabase.from('submissions').insert({
                user_id: user.id,
                day_number: dayNumber,
                platform,
                content_text: contentText || null,
                post_link: postLink,
                proof_image_url: proofImageUrl,
                status: 'pending',
            });

            if (insertError) throw insertError;

            // Success - Show confirmation
            alert('✅ Soumission envoyée avec succès !\n\nVotre publication sera évaluée par un ambassadeur.');

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message || 'Une erreur est survenue lors de la soumission');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Soumettre le Jour ${dayNumber}`} size="lg">
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg p-4">
                        <p className="text-sm text-error-700 dark:text-error-300">{error}</p>
                    </div>
                )}

                {/* Platform Selection */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Plateforme
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                        {(['linkedin', 'facebook', 'instagram'] as const).map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => setPlatform(p)}
                                className={`px-4 py-3 rounded-lg border-2 font-medium capitalize transition-all ${platform === p
                                    ? 'border-primary bg-primary-50 dark:bg-primary-900/30 text-primary'
                                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Post Link */}
                <div>
                    <label
                        htmlFor="postLink"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    >
                        Lien du post <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="url"
                            id="postLink"
                            value={postLink}
                            onChange={(e) => setPostLink(e.target.value)}
                            required
                            placeholder="https://..."
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Content Text */}
                <div>
                    <label
                        htmlFor="contentText"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                    >
                        Description (optionnel)
                    </label>
                    <textarea
                        id="contentText"
                        value={contentText}
                        onChange={(e) => setContentText(e.target.value)}
                        rows={3}
                        placeholder="Décrivez brièvement votre publication..."
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Preuve (capture d'écran)
                    </label>
                    <div className="relative">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                            id="imageUpload"
                        />
                        <label
                            htmlFor="imageUpload"
                            className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-primary transition-colors bg-slate-50 dark:bg-slate-800/50"
                        >
                            <div className="text-center">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    {imageFile ? imageFile.name : 'Cliquez pour uploader une image'}
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
                        Annuler
                    </Button>
                    <Button type="submit" isLoading={isLoading} className="flex-1">
                        Soumettre
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default SubmissionModal;
