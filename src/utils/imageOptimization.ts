/**
 * Utilitaires pour l'optimisation des images
 */

// Génère un placeholder SVG blur pour une meilleure UX pendant le chargement
export const generateBlurPlaceholder = (width: number = 800, height: number = 600): string => {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:rgb(30,41,59);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgb(51,65,85);stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#grad)"/>
        </svg>
    `;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Optimise l'URL d'une image (version simplifiée)
export const getOptimizedImageUrl = (
    url: string | null,
    options: {
        width?: number;
        quality?: number;
        format?: 'webp' | 'jpeg' | 'png';
    } = {}
): string => {
    // Pour l'instant, on retourne simplement l'URL originale
    // Le lazy loading natif s'occupera de l'optimisation
    if (!url) return '';

    return url;
};

// Précharge une image pour améliorer les performances
export const preloadImage = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = src;
    });
};

// Détecte si le navigateur supporte WebP
export const supportsWebP = (): boolean => {
    if (typeof window === 'undefined') return false;

    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
};

// Calcule la taille optimale en fonction de la largeur de l'écran
export const getOptimalImageWidth = (): number => {
    if (typeof window === 'undefined') return 800;

    const screenWidth = window.innerWidth;

    // Mobile
    if (screenWidth < 768) return 400;
    // Tablette
    if (screenWidth < 1024) return 600;
    // Desktop
    return 800;
};

// Cache pour les images déjà chargées
const imageCache = new Map<string, string>();

export const getCachedImageUrl = (url: string): string | null => {
    return imageCache.get(url) || null;
};

export const setCachedImageUrl = (url: string, optimizedUrl: string): void => {
    imageCache.set(url, optimizedUrl);
};

// Compression d'image côté client (pour les uploads)
export const compressImage = async (
    file: File,
    maxWidth: number = 1920,
    quality: number = 0.8
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Redimensionner si nécessaire
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};

// Génère des tailles multiples pour responsive images
export const generateSrcSet = (url: string): string => {
    const sizes = [400, 600, 800, 1200];

    return sizes
        .map(size => {
            const optimizedUrl = getOptimizedImageUrl(url, { width: size });
            return `${optimizedUrl} ${size}w`;
        })
        .join(', ');
};
