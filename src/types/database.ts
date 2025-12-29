export interface Profile {
    id: string;
    email: string;
    full_name: string | null;
    role: 'student' | 'ambassador';
    total_points: number;
    is_registered: boolean;
    avatar_url: string | null;
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
    proof_image_url: string | null;
    status: 'pending' | 'validated' | 'rejected';
    score_awarded: number | null;
    rejection_comment?: string;
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
    created_at?: string;
}

export interface LeaderboardEntry extends Profile {
    rank: number;
    validated_days: number;
}
