export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'student' | 'ambassador';
    total_points: number;
    is_registered: boolean;
    avatar_url: string | null;
    unique_login_id?: string | null;
    phone_number?: string | null;
    university?: string | null;
    preferred_platform?: string | null;
    bio?: string | null;
    linkedin_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Submission {
    id: string;
    user_id: string;
    day_number: number;
    platform: 'linkedin' | 'facebook' | 'instagram';
    content_text: string | null;
    post_link: string;
    submission_url?: string; // Alias pour post_link
    proof_image_url: string | null;
    status: 'pending' | 'validated' | 'rejected';
    score_awarded: number | null;
    rejection_comment?: string;
    feedback?: string; // Alias pour rejection_comment
    missed_deadline?: boolean; // Indique si la deadline a été manquée
    submitted_at?: string; // Alias pour created_at
    created_at?: string;
    updated_at?: string;
    // Relations
    profile?: Profile;
}

export interface Announcement {
    id: string;
    ambassador_id: string;
    title: string;
    content: string;
    type: 'announcement' | 'motivation' | 'video' | 'link';
    url?: string | null;
    created_at?: string;
    updated_at?: string;
    // Relations
    profile?: Profile;
}

export interface ChallengeDay {
    day_number: number;
    theme_title: string;
    description: string;
    is_active: boolean;
    start_date?: string; // Date de début du jour
    deadline?: string;   // Date limite de soumission (start_date + 29h)
    is_expired?: boolean; // Indique si la deadline est passée
    created_at?: string;
}

export interface LeaderboardEntry extends Profile {
    rank: number;
    validated_days: number;
}

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    sender?: Profile;
    receiver?: Profile;
}
